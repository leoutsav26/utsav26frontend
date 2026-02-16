import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppData";
import { getLeaderboard } from "../services/leaderboardService";
import { LogOut, Plus, Edit2, Users, DollarSign, FileText, X, LayoutDashboard, Calendar, UserCheck, Trash2, UserPlus } from "lucide-react";
import { createUser as createUserApi } from "../services/usersService";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const section = location.pathname.replace(/^\/admin\/?/, "") || "home";
  const tab = section === "home" ? "events" : section;
  const {
    events,
    setEvents,
    users,
    setUsers,
    coordActive,
    participants,
    leaderboards,
    setLeaderboards,
    winners,
    setWinners,
    useApi,
    createEvent,
    updateEvent,
    updateEventStatus,
    updateCoordinatorStatus,
    completeEventWithWinners,
    deleteEvent,
    refreshDataForUser,
  } = useAppData();

  const [eventForm, setEventForm] = useState(null);
  const [reportEventId, setReportEventId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addUserSuccess, setAddUserSuccess] = useState(null);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState(null);

  const coordinators = users?.coordinators || [];
  const pendingCoords = coordinators.filter((c) => c.status === "pending");
  const approvedCoords = coordinators.filter((c) => c.status === "approved");

  const handleApproveCoord = async (coordId) => {
    if (useApi) {
      try {
        await updateCoordinatorStatus(coordId, "approved");
      } catch (err) {
        alert(err?.message || "Failed to approve");
      }
      return;
    }
    const next = coordinators.map((c) => (c.id === coordId ? { ...c, status: "approved" } : c));
    setUsers({ ...users, coordinators: next });
  };

  const handleRejectCoord = async (coordId) => {
    if (useApi) {
      try {
        await updateCoordinatorStatus(coordId, "rejected");
      } catch (err) {
        alert(err?.message || "Failed to reject");
      }
      return;
    }
    const next = coordinators.map((c) => (c.id === coordId ? { ...c, status: "rejected" } : c));
    setUsers({ ...users, coordinators: next });
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      id: form.eventId?.value || "ev-" + Date.now(),
      title: form.title.value,
      description: form.description.value,
      date: form.date.value,
      time: form.time.value,
      venue: form.venue.value,
      category: form.category.value || "General",
      status: form.status.value,
      cost: Number(form.cost.value) || 0,
      rules: form.rules.value,
      teamSize: form.teamSize.value,
      createdAt: eventForm?.createdAt || new Date().toISOString(),
    };
    if (useApi) {
      try {
        if (eventForm?.id) await updateEvent(eventForm.id, payload);
        else await createEvent(payload);
        setEventForm(null);
      } catch (err) {
        alert(err?.message || "Failed to save event");
      }
      return;
    }
    if (eventForm?.id) {
      setEvents(events.map((ev) => (ev.id === eventForm.id ? payload : ev)));
    } else {
      setEvents([...events, payload]);
    }
    setEventForm(null);
  };

  const handleCloseEvent = async (eventId) => {
    if (useApi) {
      try {
        await updateEventStatus(eventId, "closed");
      } catch (err) {
        alert(err?.message || "Failed to close event");
      }
      return;
    }
    setEvents(events.map((e) => (e.id === eventId ? { ...e, status: "closed" } : e)));
  };

  const handleCompleteEvent = async (eventId) => {
    const lb = (leaderboards[eventId] || []).slice(0, 3).map((e) => e.participantId);
    if (useApi) {
      try {
        await completeEventWithWinners(eventId, lb);
        setReportEventId(null);
      } catch (err) {
        alert(err?.message || "Failed to complete event");
      }
      return;
    }
    setEvents(events.map((e) => (e.id === eventId ? { ...e, status: "completed" } : e)));
    setWinners({ ...winners, [eventId]: lb });
    setReportEventId(null);
  };

  const handleDeleteEvent = async () => {
    if (!deleteConfirm?.eventId) return;
    setDeleteLoading(true);
    try {
      if (useApi) await deleteEvent(deleteConfirm.eventId);
      else setEvents((events || []).filter((e) => e.id !== deleteConfirm.eventId));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err?.message || "Failed to delete event");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserError(null);
    setAddUserSuccess(null);
    const form = e.target;
    const email = (form.email?.value || "").trim();
    const name = (form.name?.value || "").trim();
    const rollNo = (form.rollNo?.value || "").trim();
    const phone = (form.phone?.value || "").trim();
    const role = form.role?.value || "coordinator";
    if (!email || !name) {
      setAddUserError("Email and name are required.");
      return;
    }
    if (!useApi) {
      setAddUserError("Add user is available when connected to the backend.");
      return;
    }
    setAddUserLoading(true);
    try {
      const res = await createUserApi({ email, name, rollNo: rollNo || undefined, phone: phone || undefined, role });
      const tempPass = res?.temporaryPassword ?? "leo" + name.slice(0, 4);
      setAddUserSuccess(tempPass);
      setAddUserError(null);
      form.reset();
      if (user) refreshDataForUser(user);
      setTimeout(() => setAddUserSuccess(null), 12000);
    } catch (err) {
      setAddUserError(err?.message || "Failed to create user");
      setAddUserSuccess(null);
    } finally {
      setAddUserLoading(false);
    }
  };

  const revenueSummary = useMemo(() => {
    let total = 0;
    const byEvent = {};
    (events || []).forEach((ev) => {
      const count = (participants[ev.id] || []).length;
      const amount = count * (ev.cost ?? 10);
      byEvent[ev.id] = { count, amount, title: ev.title };
      total += amount;
    });
    return { total, byEvent };
  }, [events, participants]);

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
    <div className="admin-dashboard">
      <header className="admin-header card-effect">
        <h1>Admin Dashboard</h1>
        <button className="admin-logout btn-visibility" onClick={handleLogout}><LogOut size={18} /> Logout</button>
      </header>

      <nav className="admin-tabs">
        <Link to="/admin" className={`admin-tab-link ${section === "home" ? "active" : ""}`}><LayoutDashboard size={18} /> Home</Link>
        <Link to="/admin/events" className={`admin-tab-link ${tab === "events" ? "active" : ""}`}>Events</Link>
        <Link to="/admin/coordinators" className={`admin-tab-link ${tab === "coordinators" ? "active" : ""}`}>Coordinators</Link>
        <Link to="/admin/adduser" className={`admin-tab-link ${tab === "adduser" ? "active" : ""}`}><UserPlus size={18} /> Add user</Link>
        <Link to="/admin/revenue" className={`admin-tab-link ${tab === "revenue" ? "active" : ""}`}>Revenue</Link>
      </nav>

      {section === "home" && (
        <section className="admin-home card-effect">
          <h2>Welcome — Choose a section</h2>
          <div className="admin-home-cards">
            <Link to="/admin/events" className="admin-home-card card-effect btn-visibility">
              <Calendar size={32} />
              <span>Events</span>
            </Link>
            <Link to="/admin/coordinators" className="admin-home-card card-effect btn-visibility">
              <UserCheck size={32} />
              <span>Coordinators</span>
            </Link>
            <Link to="/admin/adduser" className="admin-home-card card-effect btn-visibility">
              <UserPlus size={32} />
              <span>Add user</span>
            </Link>
            <Link to="/admin/revenue" className="admin-home-card card-effect btn-visibility">
              <DollarSign size={32} />
              <span>Revenue</span>
            </Link>
          </div>
        </section>
      )}

      {tab === "adduser" && (
        <section className="admin-section">
          <h2>Add admin or coordinator</h2>
          <p className="admin-adduser-hint">New user&apos;s password will be <strong>&quot;leo&quot;</strong> + first 4 letters of their name (e.g. John → leoJohn).</p>
          {addUserError && <p className="admin-action-error">{addUserError}</p>}
          {addUserSuccess && (
            <div className="admin-action-success" role="alert">
              <strong>User created successfully.</strong> Share this temporary password with them: <strong className="admin-temp-password">{addUserSuccess}</strong>
              <br /><span className="admin-success-note">Form has been reset. You can add another user. This message will disappear in a moment.</span>
            </div>
          )}
          <form onSubmit={handleAddUser} className="admin-adduser-form">
            <label>Email *</label>
            <input name="email" type="email" required placeholder="e.g. admin@leoclub.com" />
            <label>Name *</label>
            <input name="name" type="text" required placeholder="Full name" />
            <label>Roll no</label>
            <input name="rollNo" type="text" placeholder="Optional" />
            <label>Phone</label>
            <input name="phone" type="text" placeholder="Optional" />
            <label>Role *</label>
            <select name="role" required>
              <option value="coordinator">Coordinator</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="admin-save-btn" disabled={addUserLoading}>{addUserLoading ? "Creating…" : "Create user"}</button>
          </form>
        </section>
      )}

      {tab === "events" && (
        <section className="admin-section">
          <div className="admin-section-head">
            <h2>Events</h2>
            <button className="admin-add-btn" onClick={() => setEventForm({})}><Plus size={18} /> Add event</button>
          </div>
          <div className="admin-events-grid">
            {(events || []).map((ev) => (
              <div key={ev.id} className="admin-event-card">
                <h3>{ev.title}</h3>
                <p>{ev.date} · {ev.venue} · ₹{ev.cost ?? 10}</p>
                <p className="admin-status">{ev.status}</p>
                <div className="admin-event-actions">
                  <button onClick={() => setEventForm(ev)}><Edit2 size={14} /> Edit</button>
                  {(ev.status === "open" || ev.status === "ongoing") && (
                    <>
                      <button onClick={() => handleCloseEvent(ev.id)}>Close</button>
                      <button onClick={() => handleCompleteEvent(ev.id)}>Complete</button>
                    </>
                  )}
                  <button onClick={() => setReportEventId(ev.id)}><FileText size={14} /> Report</button>
                  <button className="admin-delete-btn" onClick={() => setDeleteConfirm({ eventId: ev.id, title: ev.title })} title="Delete event"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "coordinators" && (
        <section className="admin-section">
          <h2>Approve / Reject coordinators</h2>
          <div className="admin-coord-list">
            {pendingCoords.length === 0 && approvedCoords.length === 0 && (
              <p className="admin-empty">No coordinators in list. Sample: coord@test.com (approved).</p>
            )}
            {pendingCoords.map((c) => (
              <div key={c.id} className="admin-coord-row">
                <span>{c.name} — {c.email}</span>
                <div>
                  <button className="admin-approve" onClick={() => handleApproveCoord(c.id)}>Approve</button>
                  <button className="admin-reject" onClick={() => handleRejectCoord(c.id)}>Reject</button>
                </div>
              </div>
            ))}
            {approvedCoords.map((c) => (
              <div key={c.id} className="admin-coord-row approved">
                <span>{c.name} — {c.email}</span>
                <span className="admin-badge">Approved</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "revenue" && (
        <section className="admin-section">
          <h2>Mock revenue summary</h2>
          <div className="admin-revenue-total">
            <DollarSign size={28} />
            <span>Total collected: ₹{revenueSummary.total}</span>
          </div>
          <ul className="admin-revenue-list">
            {Object.entries(revenueSummary.byEvent).map(([eid, { count, amount, title }]) => (
              <li key={eid}><strong>{title}</strong>: {count} participants · ₹{amount}</li>
            ))}
          </ul>
        </section>
      )}

      {eventForm && (
        <div className="admin-modal-overlay" onClick={() => setEventForm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setEventForm(null)}><X size={24} /></button>
            <h3>{eventForm.id ? "Edit event" : "New event"}</h3>
            <form onSubmit={handleSaveEvent}>
              {eventForm.id && <input type="hidden" name="eventId" value={eventForm.id} />}
              <label>Title</label>
              <input name="title" defaultValue={eventForm.title} required />
              <label>Description</label>
              <textarea name="description" defaultValue={eventForm.description} rows={3} />
              <label>Date</label>
              <input name="date" type="text" defaultValue={eventForm.date} placeholder="e.g. 15 Feb 2026" />
              <label>Time</label>
              <input name="time" defaultValue={eventForm.time} placeholder="e.g. 6:00 PM" />
              <label>Venue</label>
              <input name="venue" defaultValue={eventForm.venue} />
              <label>Category</label>
              <input name="category" defaultValue={eventForm.category} placeholder="Music, Technical, etc." />
              <label>Cost (₹)</label>
              <input name="cost" type="number" defaultValue={eventForm.cost ?? 10} />
              <label>Team size</label>
              <input name="teamSize" defaultValue={eventForm.teamSize} placeholder="e.g. 1 or 3-8" />
              <label>Rules</label>
              <textarea name="rules" defaultValue={eventForm.rules} rows={2} />
              <label>Status</label>
              <select name="status" defaultValue={eventForm.status || "open"}>
                <option value="open">Open</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
              <button type="submit" className="admin-save-btn">Save</button>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => !deleteLoading && setDeleteConfirm(null)}>
          <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete event?</h3>
            <p className="admin-confirm-text">Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? The event will be removed from the list. <strong>Registration and participation data will be preserved.</strong></p>
            <div className="admin-confirm-actions">
              <button type="button" className="admin-confirm-cancel" onClick={() => setDeleteConfirm(null)} disabled={deleteLoading}>Cancel</button>
              <button type="button" className="admin-confirm-delete" onClick={handleDeleteEvent} disabled={deleteLoading}>{deleteLoading ? "Deleting…" : "Delete event"}</button>
            </div>
          </div>
        </div>
      )}

      {reportEventId && (
        <div className="admin-modal-overlay" onClick={() => setReportEventId(null)}>
          <div className="admin-report-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setReportEventId(null)}><X size={24} /></button>
            <EventReportPreview
              eventId={reportEventId}
              event={(events || []).find((e) => e.id === reportEventId)}
              participants={participants}
              leaderboards={leaderboards}
              coordinators={getCoordsForEvent(reportEventId)}
              revenueSummary={revenueSummary}
              winners={winners}
              users={users}
              useApi={useApi}
              onComplete={() => handleCompleteEvent(reportEventId)}
              onClose={() => setReportEventId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EventReportPreview({ eventId, event, participants, leaderboards, coordinators, revenueSummary, winners, users, useApi, onComplete, onClose }) {
  const [reportLeaderboard, setReportLeaderboard] = React.useState(null);
  const partList = (participants || {})[eventId] || [];
  const amount = (revenueSummary?.byEvent || {})[eventId]?.amount ?? partList.length * (event?.cost ?? 10);
  const winnerIds = (winners || {})[eventId] || [];
  const lbFromContext = (leaderboards || {})[eventId] || [];
  const lbList = reportLeaderboard !== null ? reportLeaderboard : lbFromContext;
  const leaderboardWithRank = (lbList || []).map((e, i) => ({ ...e, rank: i + 1 }));
  const timestamp = new Date().toLocaleString("en-IN");
  const organiser = "Leo Club of CEG";

  useEffect(() => {
    if (!useApi || !eventId) return;
    getLeaderboard(eventId)
      .then((list) => setReportLeaderboard(Array.isArray(list) ? list : []))
      .catch(() => setReportLeaderboard([]));
  }, [useApi, eventId]);

  const handleDownload = () => {
    window.print();
  };

  if (!event) return null;

  return (
    <div className="report-preview card-effect">
      <div className="report-watermark">Leo Club of CEG</div>
      <header className="report-header">
        <h2 className="report-title">{event.title}</h2>
        <p className="report-subtitle">Event Report</p>
      </header>
      <div className="report-meta report-meta-grid">
        <div className="report-meta-item report-event-name">
          <span className="report-meta-label">Event name</span>
          <span className="report-meta-value">{event.title}</span>
        </div>
        <div className="report-meta-item">
          <span className="report-meta-label">Participants</span>
          <span className="report-meta-value">{partList.length}</span>
        </div>
        <div className="report-meta-item">
          <span className="report-meta-label">Amount collected</span>
          <span className="report-meta-value">₹{amount}</span>
        </div>
        <div className="report-meta-item">
          <span className="report-meta-label">Status</span>
          <span className="report-meta-value report-status-badge">{event.status}</span>
        </div>
        <div className="report-meta-item">
          <span className="report-meta-label">Generated</span>
          <span className="report-meta-value report-meta-date">{timestamp}</span>
        </div>
      </div>

      <div className="report-section report-section-card report-leaderboard-block">
        <h4 className="report-section-title">
          <span className="report-section-icon">🏆</span> Current Leaderboard
        </h4>
        {leaderboardWithRank.length > 0 ? (
          <table className="report-table report-table-leaderboard">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Roll No</th>
                <th>Name</th>
                <th>LEO ID</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardWithRank.map((e) => (
                <tr key={e.participantId}>
                  <td className="report-rank">{e.rank}</td>
                  <td>{e.rollNo ?? "—"}</td>
                  <td>{e.name}</td>
                  <td>{e.leoId}</td>
                  <td className="report-score">{e.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="report-empty-leaderboard">No scores recorded yet for this event.</p>
        )}
      </div>

      <div className="report-section report-section-card">
        <h4 className="report-section-title">Student details & registration</h4>
        <table className="report-table">
          <thead>
            <tr><th>Name</th><th>LEO ID</th><th>Payment</th><th>Registered at</th></tr>
          </thead>
          <tbody>
            {partList.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td>{p.leoId}</td>
                <td>{p.paymentStatus || p.paymentType || "-"}</td>
                <td>{p.registeredAt ? new Date(p.registeredAt).toLocaleString("en-IN") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {winnerIds.length > 0 && (
        <div className="report-section report-section-card">
          <h4 className="report-section-title">Winners</h4>
          <ol className="report-winners-list">
            {winnerIds.map((sid, i) => {
              const p = partList.find((x) => x.studentId === sid);
              return <li key={sid}>{p ? `${p.name} (${p.leoId})` : `Winner ${i + 1}`}</li>;
            })}
          </ol>
        </div>
      )}
      <div className="report-section report-section-card">
        <h4 className="report-section-title">Coordinators</h4>
        <ul className="report-list">
          {(coordinators || []).map((c) => (
            <li key={c.id}>{c.name} — {c.email}</li>
          ))}
          {(coordinators || []).length === 0 && <li className="report-list-empty">None assigned</li>}
        </ul>
      </div>
      <div className="report-section report-section-card report-organiser">
        <h4 className="report-section-title">Organiser</h4>
        <p>{organiser}</p>
      </div>
      <div className="report-actions">
        <button className="admin-download-btn btn-visibility" onClick={handleDownload}>Download report / Print</button>
        {event.status !== "completed" && (
          <button className="admin-complete-btn btn-visibility" onClick={onComplete}>Mark event completed</button>
        )}
        <button type="button" className="btn-visibility" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
