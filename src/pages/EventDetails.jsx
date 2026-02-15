import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppData";
import { useAuth } from "../context/AuthContext";
import { getEventById } from "../services/eventsService";
import { Calendar, Clock, MapPin, IndianRupee, Share2, X, Copy, Check, LogIn } from "lucide-react";
import "./Events.css";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, participants, useApi } = useAppData();
  const [event, setEvent] = useState(null);
  const [eventLoaded, setEventLoaded] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/events/${id}` : "";
  const isRegistered = user?.role === "student" && event && (participants?.[event.id] || []).some((p) => p.studentId === user.id);

  useEffect(() => {
    const fromContext = (events || []).find((e) => e.id === id);
    if (fromContext) {
      setEvent(fromContext);
      setEventLoaded(true);
      return;
    }
    if (useApi && id) {
      setEventLoaded(false);
      getEventById(id)
        .then((ev) => { setEvent(ev); setEventLoaded(true); })
        .catch(() => { setEvent(null); setEventLoaded(true); });
    } else {
      setEvent(null);
      setEventLoaded(true);
    }
  }, [id, events, useApi]);

  const handleRegister = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/events/${id}`)}`, { replace: false });
      return;
    }
    if (user.role !== "student") return;
    setShowQR(true);
    setShowShare(false);
  };

  const handleShareClick = () => {
    setShowShare(true);
    setShowQR(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!event || !navigator.share) return;
    try {
      await navigator.share({
        title: event.title,
        text: event.description,
        url: shareUrl,
      });
      setShowShare(false);
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  if (!eventLoaded) return <div className="loading">Loading...</div>;
  if (!event) return <div className="event-details-page"><p className="event-not-found">Event not found.</p><button type="button" className="back-btn" onClick={() => navigate("/events")}>← Back to Events</button></div>;

  return (
    <div className="event-details-page">
      <button className="back-btn" onClick={() => navigate("/events")}>
        ← Back to Events
      </button>

      <h1>{event.title}</h1>
      <p className="event-full-desc">{event.description}</p>

      <div className="details-grid">
        <div className="detail-card">
          <Calendar size={20} />
          <div>
            <span>Date</span>
            <p>{event.date}</p>
          </div>
        </div>

        <div className="detail-card">
          <Clock size={20} />
          <div>
            <span>Time</span>
            <p>{event.time}</p>
          </div>
        </div>

        <div className="detail-card">
          <MapPin size={20} />
          <div>
            <span>Venue</span>
            <p>{event.venue}</p>
          </div>
        </div>
      </div>

      <div className="registration-box card-effect">
        <div className="price-big">
          <IndianRupee size={28} /> {event.cost ?? 10}
          <p>Registration Fee (₹)</p>
        </div>

        {!user ? (
          <button type="button" className="register-btn login-to-register-btn" onClick={handleRegister}>
            <LogIn size={18} /> Login to register
          </button>
        ) : user.role === "student" ? (
          isRegistered ? (
            <p className="already-registered-msg">You are registered for this event. Manage from <button type="button" className="link-btn" onClick={() => navigate("/student")}>Student Dashboard</button>.</p>
          ) : (
            <button type="button" className="register-btn btn-visibility" onClick={handleRegister}>
              Register Now
            </button>
          )
        ) : null}

        <button type="button" className="share-btn btn-visibility" onClick={handleShareClick}>
          <Share2 size={16} /> Share Event
        </button>
      </div>

      {/* QR Modal - shown when Register Now is clicked */}
      {showQR && (
        <div className="event-modal-overlay" onClick={() => setShowQR(false)}>
          <div className="event-modal qr-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowQR(false)} aria-label="Close">
              <X size={24} />
            </button>
            <div className="qr-modal-content">
              <img
                src={`/qr/${event.id}.png`}
                alt={`QR code for ${event.title}`}
                className="qr-image"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling?.classList.add("visible");
                }}
              />
              <p className="qr-image-fallback">No QR image for this event.</p>
              <div className="qr-link-box neon-border-box">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="qr-link">
                  {shareUrl}
                </a>
              </div>
              <p className="scan-now-text">Scan now!</p>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal - shown when Share Event is clicked */}
      {showShare && (
        <div className="event-modal-overlay" onClick={() => setShowShare(false)}>
          <div className="event-modal share-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowShare(false)} aria-label="Close">
              <X size={24} />
            </button>
            <div className="share-modal-content">
              <h3 className="share-modal-title">Share this event</h3>
              <div className="share-link-box neon-border-box">
                <span className="share-url-text">{shareUrl}</span>
              </div>
              <div className="share-actions">
                <button type="button" className="share-copy-btn" onClick={handleCopyLink}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? " Copied!" : " Copy link"}
                </button>
                {canNativeShare && (
                  <button type="button" className="share-native-btn" onClick={handleNativeShare}>
                    <Share2 size={18} /> Share via app
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
