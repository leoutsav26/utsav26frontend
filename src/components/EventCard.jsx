import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, IndianRupee, Ticket } from "lucide-react";

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  const formatDate = (date) => {
    if (date == null) return "—";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (time) => {
    if (time == null || typeof time !== "string") return "—";
    const parts = time.split(":");
    const h = parts[0];
    const m = parts[1] ?? "00";
    const hour = parseInt(h, 10);
    if (Number.isNaN(hour)) return "—";
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="event-card">
      <div className="event-image">
        <span className="category-badge">{event.category ?? "Event"}</span>
      </div>

      <div className="event-content">
        <h3>{event.title}</h3>
        <p className="event-desc">{event.description ?? ""}</p>

        <div className="event-meta">
          <div>
            <Calendar size={16} /> {formatDate(event.date)} •{" "}
            {formatTime(event.time)}
          </div>
          <div>
            <MapPin size={16} /> {event.venue ?? "—"}
          </div>
        </div>

        <div className="event-footer">
          <div className="price">
            <IndianRupee size={16} /> {event.cost ?? 10}
          </div>

          <button
            className="view-btn"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <Ticket size={16} /> View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
