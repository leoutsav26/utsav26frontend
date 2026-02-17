import React, { useMemo, useState } from "react";
import { useAppData } from "../context/AppData";
import EventCard from "../components/EventCard";
import { Search } from "lucide-react";
import "./Events.css";

const Events = () => {
  const { events, loading, apiError } = useAppData();
  const [search, setSearch] = useState("");
  const joinable = (events || []).filter((e) => !e.status || e.status === "open" || e.status === "ongoing");

  const list = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return joinable;
    return joinable.filter(
      (e) =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.description || "").toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q) ||
        (e.venue || "").toLowerCase().includes(q)
    );
  }, [joinable, search]);

  return (
    <div className="events-page">
      <h1 className="events-title">All Events</h1>
      <div className="events-search-wrap">
        <Search size={20} className="events-search-icon" aria-hidden />
        <input
          type="search"
          className="events-search-input"
          placeholder="Search by title, category, venue…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search events"
        />
      </div>
      {apiError && <p className="events-error">{apiError}</p>}
      {loading && joinable.length === 0 && <p className="events-loading">Loading events…</p>}
      {!loading && joinable.length > 0 && list.length === 0 && (
        <p className="events-no-results">No events match your search.</p>
      )}
      <div className="events-grid">
        {list.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default Events;
