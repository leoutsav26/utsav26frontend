import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppData";
import { LogOut, Ticket, Trophy, X, RotateCcw, User, Search } from "lucide-react";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { events, participants, winners, setParticipants, useApi, createParticipation, deleteParticipation, createPayment } = useAppData();
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [eventSearch, setEventSearch] = useState("");
  const winnerEventIds = useMemo(() => {
    const w = winners || {};
    return Object.keys(w).filter((eid) => (w[eid] || []).includes(user?.id));
  }, [winners, user?.id]);

  const eventsList = Array.isArray(events) ? events : [];
  const openEvents = eventsList.filter((e) => !e.status || e.status === "open" || e.status === "ongoing");
  const filteredOpenEvents = useMemo(() => {
    const q = (eventSearch || "").trim().toLowerCase();
    if (!q) return openEvents;
    return openEvents.filter(
      (e) =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.description || "").toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q) ||
        (e.venue || "").toLowerCase().includes(q)
    );
  }, [openEvents, eventSearch]);
  const myRegistrations = openEvents.filter((e) => {
    const list = (participants || {})[e.id] || [];
    return list.some((p) => p.studentId === user?.id);
  });

  const getMyRegistration = (eventId) => {
    const list = (participants || {})[eventId] || [];
    return list.find((p) => p.studentId === user?.id);
  };

  const handleRegisterClick = (event) => {
    setModal({ event, step: "choice" });
  };

  const handlePaymentChoice = (paymentType) => {
    if (useApi) {
      setActionError(null);
      setActionLoading(true);
      createParticipation({ eventId: modal.event.id, paymentType })
        .then(() => setModal(null))
        .catch((err) => setActionError(err?.message || "Registration failed"))
        .finally(() => setActionLoading(false));
    } else {
      addParticipant(modal.event, paymentType, null, null);
      setModal(null);
    }
  };

  const addParticipant = (event, paymentType, transactionId, screenshot) => {
    const prev = participants || {};
    const list = prev[event.id] || [];
    if (list.some((p) => p.studentId === user.id)) return;
    const next = {
      ...prev,
      [event.id]: [
        ...list,
        {
          studentId: user.id,
          name: user.name,
          leoId: user.leoId,
          rollNo: user.rollNo || null,
          paymentType: paymentType || "pay_via_cash",
          paymentStatus: null,
          arrived: false,
          screenshot: screenshot || null,
          transactionId: transactionId || null,
          registeredAt: new Date().toISOString(),
        },
      ],
    };
    setParticipants(next);
  };

  const handleUndoRegistration = async (eventId) => {
    const reg = getMyRegistration(eventId);
    if (useApi && reg?.id) {
      setActionError(null);
      setActionLoading(true);
      try {
        await deleteParticipation(reg.id, eventId);
      } catch (err) {
        setActionError(err?.message || "Failed to undo registration");
      } finally {
        setActionLoading(false);
      }
      return;
    }
    const prev = participants || {};
    const list = (prev[eventId] || []).filter((p) => p.studentId !== user.id);
    const next = { ...prev, [eventId]: list.length ? list : undefined };
    if (!list.length) delete next[eventId];
    setParticipants(next);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  }; 

  if (!user) return null;

  return (
    <div className="student-dashboard">
      {actionError && <p className="sd-action-error">{actionError}</p>}
      <header className="sd-header sd-card-dark">
        <h1>Student Dashboard</h1>
        <button className="sd-logout sd-btn-elegant" onClick={handleLogout} disabled={actionLoading}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <section className="sd-profile-section sd-card-dark">
        <h2><User size={20} /> Profile</h2>
        <div className="sd-profile-grid">
          <div className="sd-profile-item">
            <span className="sd-profile-label">LEO ID</span>
            <span className="sd-profile-value sd-leo-highlight">{user.leoId ?? "—"}</span>
          </div>
          <div className="sd-profile-item">
            <span className="sd-profile-label">Name</span>
            <span className="sd-profile-value">{user.name ?? "—"}</span>
          </div>
          <div className="sd-profile-item">
            <span className="sd-profile-label">Email</span>
            <span className="sd-profile-value">{user.email ?? "—"}</span>
          </div>
          <div className="sd-profile-item">
            <span className="sd-profile-label">Roll No</span>
            <span className="sd-profile-value">{user.rollNo ?? "—"}</span>
          </div>
          <div className="sd-profile-item">
            <span className="sd-profile-label">Phone</span>
            <span className="sd-profile-value">{user.phone ?? "—"}</span>
          </div>
        </div>
      </section>

      {winnerEventIds.length > 0 && (
        <section className="sd-winners sd-card-dark">
          <h2><Trophy size={20} /> You won!</h2>
          <p>Congratulations! You are a winner in: {winnerEventIds.map((eid) => {
            const ev = (events || []).find((e) => e.id === eid);
            return ev?.title;
          }).filter(Boolean).join(", ")}</p>
        </section>
      )}

      <section className="sd-section sd-card-dark">
        <h2>My Registrations</h2>
        {myRegistrations.length === 0 ? (
          <p className="sd-empty">You haven’t registered for any event yet.</p>
        ) : (
          <ul className="sd-event-list">
            {myRegistrations.map((ev) => {
              const reg = getMyRegistration(ev.id);
              return (
                <li key={ev.id} className="sd-reg-item">
                  <div>
                    <span className="sd-reg-title">{ev.title}</span>
                    <span className="sd-meta">{ev.date} · {ev.venue}</span>
                    <span className="sd-payment-mode">Payment: {reg?.paymentType === "pay_via_cash" ? "Pay via cash" : reg?.paymentType === "pay_via_upi" ? "Pay via UPI" :reg?.paymentType === "pay_via_band" ? "Pay via Band" : reg?.paymentType || "Pay via cash"}</span>
                  </div>
                  <button type="button" className="sd-undo-btn sd-btn-elegant" onClick={() => handleUndoRegistration(ev.id)} title="Undo registration" disabled={actionLoading}>
                    <RotateCcw size={16} /> Undo
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="sd-section sd-card-dark">
        <h2>Register for events</h2>
        <div className="sd-search-wrap">
          <Search size={18} className="sd-search-icon" aria-hidden />
          <input
            type="search"
            className="sd-search-input"
            placeholder="Search events by title, category, venue…"
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            aria-label="Search events"
          />
        </div>
        {filteredOpenEvents.length === 0 && (
          <p className="sd-empty">{openEvents.length === 0 ? "No events to join right now." : "No events match your search."}</p>
        )}
        <div className="sd-cards">
          {filteredOpenEvents.map((ev) => {
            const registered = (participants || {})[ev.id]?.some((p) => p.studentId === user.id);
            return (
              <div key={ev.id} className="sd-card sd-card-dark sd-card-elegant">
                <h3>{ev.title}</h3>
                <p>{ev.date} · {ev.time} · {ev.venue}</p>
                <p className="sd-cost">₹ {ev.cost ?? 10}</p>
                {registered ? (
                  <span className="sd-badge">Registered</span>
                ) : (
                  <button className="sd-register-btn sd-btn-elegant" onClick={() => handleRegisterClick(ev)}>
                    <Ticket size={16} /> Register
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {modal && (
        <div className="sd-modal-overlay" onClick={() => setModal(null)}>
          <div className="sd-modal sd-card-dark" onClick={(e) => e.stopPropagation()}>
            <button className="sd-modal-close" onClick={() => setModal(null)}><X size={24} /></button>
            <h3>{modal.event.title}</h3>

            {modal.step === "choice" && (
              <>
                <p>How do you want to pay?</p>
                <div className="sd-choice-btns">
                  <button type="button" className="sd-btn-elegant student-btn" onClick={() => handlePaymentChoice("pay_via_cash")}>Pay via cash</button>
                  <button type="button" className="sd-btn-elegant coord-btn" onClick={() => handlePaymentChoice("pay_via_upi")}>Pay via UPI</button>
                  <button type="button" className="sd-btn-elegant coord-btn" onClick={() => handlePaymentChoice("pay_via_band")}>Pay via Band</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
