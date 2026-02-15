import React from "react";
import { useAppData } from "../context/AppData";
import EventCard from "../components/EventCard";
import "./Events.css";

const Events = () => {
  const { events, loading, apiError } = useAppData();
  const list = (events || []).filter((e) => !e.status || e.status === "open" || e.status === "ongoing");

  return (
    <div className="events-page">
      <h1 className="events-title">All Events</h1>
      {apiError && <p className="events-error">{apiError}</p>}
      {loading && list.length === 0 && <p className="events-loading">Loading events…</p>}
      <div className="events-grid">
        {list.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default Events;
