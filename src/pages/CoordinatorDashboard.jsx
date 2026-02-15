import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppData";
import { ORGANISER } from "../data/sampleData";
import { LogOut, UserCheck, Users, Trophy, X, LayoutDashboard } from "lucide-react";
import "./CoordinatorDashboard.css";

const MAX_ACTIVE = 2;

const SECTIONS = [
  { path: "join", label: "Events I Can Join", icon: UserCheck },
  { path: "active", label: "My Active Work", icon: Users },
  { path: "participants", label: "Participants", icon: Users },
  { path: "leaderboard", label: "Live Leaderboard", icon: Trophy },
];

export default function CoordinatorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const section = location.pathname.replace(/^\/coordinator\/?/, "") || "home";
  const activeTab = section === "home" ? "join" : section;
  const {
    events,
    users,
    coordActive,
    setCoordActive,
    participants,
    setParticipants,
    leaderboards,
    setLeaderboards,
    useApi,
    joinEventAsCoordinator,
    leaveEventAsCoordinator,
    updateParticipationStatus,
  } = useAppData();

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [editScore, setEditScore] = useState(null); // { eventId, participantId, currentScore }
  const [paymentModal, setPaymentModal] = useState(null); // { eventId, participant }

  const myActiveIds = (coordActive[user?.id] || []);

  useEffect(() => {
    if (!user?.id) return;
    const current = coordActive[user.id] || [];
    const list = current.filter((eventId) => {
      const ev = (events || []).find((e) => e.id === eventId);
      return ev && ev.status !== "completed";
    });
    if (list.length < current.length) {
      setCoordActive({ ...coordActive, [user.id]: list });
    }
  }, [events, user?.id, coordActive, setCoordActive]);

  const myActiveEvents = useMemo(() => {
    return (events || []).filter((e) => myActiveIds.includes(e.id) && e.status !== "completed");
  }, [events, myActiveIds]);

  const eventsICanJoin = useMemo(() => {
    const openOrOngoing = (events || []).filter((e) => e.status === "open" || e.status === "ongoing");
    return openOrOngoing.filter((e) => !myActiveIds.includes(e.id));
  }, [events, myActiveIds]);

  const handleIAmIn = async (eventId) => {
    const list = coordActive[user.id] || [];
    if (list.length >= MAX_ACTIVE) {
      alert("You cannot coordinate more than 2 events. Please exit one event first to join another.");
      return;
    }
    if (useApi) {
      try {
        await joinEventAsCoordinator(eventId, user.id);
      } catch (err) {
        alert(err?.message || "Failed to join event");
      }
      return;
    }
    setCoordActive({ ...coordActive, [user.id]: [...list, eventId] });
  };

  const handleUndo = async (eventId) => {
    if (useApi) {
      try {
        await leaveEventAsCoordinator(eventId, user.id);
        setSelectedEventId(null);
      } catch (err) {
        alert(err?.message || "Failed to leave event");
      }
      return;
    }
    const list = (coordActive[user.id] || []).filter((id) => id !== eventId);
    setCoordActive({ ...coordActive, [user.id]: list });
    setSelectedEventId(null);
  };

  const handleMarkArrived = async (eventId, participant) => {
    if (useApi && participant.id) {
      try {
        await updateParticipationStatus(participant.id, eventId, { arrived: !participant.arrived });
      } catch (err) {
        alert(err?.message || "Failed to update");
      }
      return;
    }
    const list = (participants[eventId] || []).map((p) =>
      p.studentId === participant.studentId ? { ...p, arrived: !p.arrived } : p
    );
    setParticipants({ ...participants, [eventId]: list });
  };

  const handlePaymentStatus = async (eventId, participant, status) => {
    if (useApi && participant.id) {
      try {
        await updateParticipationStatus(participant.id, eventId, { paymentStatus: status });
        setPaymentModal(null);
      } catch (err) {
        alert(err?.message || "Failed to update");
      }
      return;
    }
    const list = (participants[eventId] || []).map((p) =>
      p.studentId === participant.studentId ? { ...p, paymentStatus: status } : p
    );
    setParticipants({ ...participants, [eventId]: list });
    setPaymentModal(null);
  };

  const handleAddScore = (eventId, participantId, name, leoId, rollNo, scoreStr) => {
    const score = parseFloat(scoreStr);
    if (isNaN(score)) return;
    const key = eventId;
    const list = (leaderboards[key] || []).filter((e) => e.participantId !== participantId);
    setLeaderboards({
      ...leaderboards,
      [key]: [...list, { participantId, name, leoId, rollNo: rollNo ?? null, score }].sort((a, b) => (b.score || 0) - (a.score || 0)),
    });
    setEditScore(null);
  };

  const handleUpdateScore = (eventId, participantId, scoreStr) => {
    const score = parseFloat(scoreStr);
    if (isNaN(score)) return;
    const key = eventId;
    const list = (leaderboards[key] || []).map((e) =>
      e.participantId === participantId ? { ...e, score } : e
    ).sort((a, b) => (b.score || 0) - (a.score || 0));
    setLeaderboards({ ...leaderboards, [key]: list });
    setEditScore(null);
  };

  const leaderboardForEvent = (eventId) => (leaderboards[eventId] || []).map((e, i) => ({ ...e, rank: i + 1 }));

  const getCoordsForEvent = (eventId) => {
    const ids = Object.entries(coordActive || {}).filter(([, list]) => list.includes(eventId)).map(([id]) => id);
    return (users?.coordinators || []).filter((c) => ids.includes(c.id));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="coord-dashboard">
      <header className="coord-header card-effect">
        <h1>Coordinator Dashboard</h1>
        <button className="coord-logout btn-visibility" onClick={handleLogout}><LogOut size={18} /> Logout</button>
      </header>

      <nav className="coord-tabs">
        <Link to="/coordinator" className={`coord-tab-link ${section === "home" ? "active" : ""}`}>
          <LayoutDashboard size={18} /> Home
        </Link>
        {SECTIONS.map((s) => (
          <Link key={s.path} to={`/coordinator/${s.path}`} className={`coord-tab-link ${activeTab === s.path ? "active" : ""}`}>
            {s.label}
          </Link>
        ))}
      </nav>

      {section === "home" && (
        <section className="coord-home card-effect">
          <h2>Welcome — Choose a section</h2>
          <div className="coord-home-cards">
            <Link to="/coordinator/join" className="coord-home-card card-effect btn-visibility">
              <UserCheck size={32} />
              <span>Events I Can Join</span>
            </Link>
            <Link to="/coordinator/active" className="coord-home-card card-effect btn-visibility">
              <Users size={32} />
              <span>My Active Work</span>
            </Link>
            <Link to="/coordinator/participants" className="coord-home-card card-effect btn-visibility">
              <Users size={32} />
              <span>Participants</span>
            </Link>
            <Link to="/coordinator/leaderboard" className="coord-home-card card-effect btn-visibility">
              <Trophy size={32} />
              <span>Live Leaderboard</span>
            </Link>
          </div>
        </section>
      )}

      {section !== "home" && activeTab === "join" && (
        <section className="coord-section">
          <h2>Events I Can Join</h2>
          {eventsICanJoin.length === 0 ? (
            <p className="coord-empty">No events available to join, or you’re already in 2.</p>
          ) : (
            <ul className="coord-event-list">
              {eventsICanJoin.map((ev) => (
                <li key={ev.id}>
                  <div>
                    <strong>{ev.title}</strong>
                    <span className="coord-meta">{ev.date} · {ev.venue}</span>
                  </div>
                  <button className="coord-i-am-in" onClick={() => handleIAmIn(ev.id)}>I Am In</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {section !== "home" && activeTab === "active" && (
        <section className="coord-section">
          <h2>My Active Work</h2>
          {myActiveEvents.length === 0 ? (
            <p className="coord-empty">You have no active events. Join from “Events I Can Join”.</p>
          ) : (
            <ul className="coord-event-list">
              {myActiveEvents.map((ev) => (
                <li key={ev.id}>
                  <div>
                    <strong>{ev.title}</strong>
                    <span className="coord-meta">{ev.date} · {ev.venue}</span>
                  </div>
                  <button className="coord-undo" onClick={() => handleUndo(ev.id)}>Exit / Undo</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {section !== "home" && activeTab === "participants" && (
        <section className="coord-section">
          <h2>Participant Tracking</h2>
          <p className="coord-hint">Select an event from your active work.</p>
          <select
            className="coord-select-event"
            value={selectedEventId || ""}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
          >
            <option value="">Select event</option>
            {myActiveEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          {selectedEventId && (
            <div className="coord-participant-table-wrap">
              {((participants || {})[selectedEventId] || []).length === 0 ? (
                <p className="coord-no-registrations">No registrations till now.</p>
              ) : (
              <table className="coord-table">
                <thead>
                  <tr>
                    <th>Name / LEO ID</th>
                    <th>Arrived</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {((participants || {})[selectedEventId] || []).map((p) => (
                    <tr key={p.studentId}>
                      <td>{p.name} ({p.leoId})</td>
                      <td>
                        <button
                          className={`coord-arrived-btn ${p.arrived ? "arrived" : ""}`}
                          onClick={() => handleMarkArrived(selectedEventId, p)}
                        >
                          {p.arrived ? "Arrived ✓" : "Not arrived"}
                        </button>
                      </td>
                      <td>
                        <button
                          className="coord-payment-btn"
                          onClick={() => setPaymentModal({ eventId: selectedEventId, participant: p })}
                        >
                          {p.paymentStatus || "Set payment"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}
        </section>
      )}

      {section !== "home" && activeTab === "leaderboard" && (
        <section className="coord-section">
          <h2>Live Leaderboard</h2>
          <select
            className="coord-select-event"
            value={selectedEventId || ""}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
          >
            <option value="">Filter by event</option>
            {myActiveEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          {selectedEventId && (
            <>
              {(() => {
                const eventCoords = getCoordsForEvent(selectedEventId);
                const coord1 = eventCoords[0];
                const coord2 = eventCoords[1];
                return (
                  <div className="coord-event-contacts">
                    <h4>Event contacts</h4>
                    <div className="coord-contact-row">
                      <span className="coord-contact-label">Organiser</span>
                      <span>{ORGANISER.name} — {ORGANISER.phone}</span>
                    </div>
                    {coord1 && (
                      <div className="coord-contact-row">
                        <span className="coord-contact-label">Coordinator 1</span>
                        <span>{coord1.name} — {coord1.phone || "—"}</span>
                      </div>
                    )}
                    {coord2 && (
                      <div className="coord-contact-row">
                        <span className="coord-contact-label">Coordinator 2</span>
                        <span>{coord2.name} — {coord2.phone || "—"}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="coord-leaderboard">
                <table className="coord-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Roll No</th>
                      <th>Name / LEO ID</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardForEvent(selectedEventId).map((e) => (
                      <tr key={e.participantId}>
                        <td>{e.rank}</td>
                        <td>{e.rollNo ?? "—"}</td>
                        <td>{e.name} ({e.leoId})</td>
                        <td>{e.score}</td>
                        <td>
                          <button className="coord-edit-score" onClick={() => setEditScore({ eventId: selectedEventId, participantId: e.participantId, currentScore: e.score })}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="coord-add-score">
                <h4>Add / Modify score</h4>
                {((participants || {})[selectedEventId] || []).map((p) => {
                  const existing = (leaderboards[selectedEventId] || []).find((e) => e.participantId === p.studentId);
                  const isEditing = editScore?.participantId === p.studentId;
                  return (
                    <div key={p.studentId} className="coord-score-row">
                      <span>{p.rollNo ? `${p.rollNo} · ` : ""}{p.name} ({p.leoId})</span>
                      {isEditing ? (
                        <form onSubmit={(ev) => { ev.preventDefault(); handleUpdateScore(selectedEventId, p.studentId, ev.target.score.value); }} style={{ display: "flex", gap: 8 }}>
                          <input name="score" type="number" step="any" defaultValue={editScore?.currentScore} />
                          <button type="submit">Update</button>
                          <button type="button" onClick={() => setEditScore(null)}>Cancel</button>
                        </form>
                      ) : existing ? (
                        <button onClick={() => setEditScore({ eventId: selectedEventId, participantId: p.studentId, currentScore: existing.score })}>Modify score</button>
                      ) : (
                        <form onSubmit={(ev) => { ev.preventDefault(); handleAddScore(selectedEventId, p.studentId, p.name, p.leoId, p.rollNo, ev.target.score.value); }} style={{ display: "flex", gap: 8 }}>
                          <input name="score" type="number" step="any" placeholder="Score" required />
                          <button type="submit">Add score</button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {paymentModal && (
        <div className="coord-modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="coord-modal" onClick={(e) => e.stopPropagation()}>
            <button className="coord-modal-close" onClick={() => setPaymentModal(null)}><X size={20} /></button>
            <h4>Payment status</h4>
            <p>{paymentModal.participant.name}</p>
            <div className="coord-payment-options">
              <button onClick={() => handlePaymentStatus(paymentModal.eventId, paymentModal.participant, "Paid before event")}>Paid before event</button>
              <button onClick={() => handlePaymentStatus(paymentModal.eventId, paymentModal.participant, "Paid on arrival")}>Paid on arrival</button>
              <button onClick={() => handlePaymentStatus(paymentModal.eventId, paymentModal.participant, "Paid via cash")}>Paid via cash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
