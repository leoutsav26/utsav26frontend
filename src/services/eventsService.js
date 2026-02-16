import { api } from "./apiClient";

/**
 * Events API – matches backend Events table.
 * GET /events, GET /events/:id, POST /events, PUT /events/:id, PATCH /events/:id/status
 */

export async function getAllEvents() {
  const data = await api.get("/events");
  return Array.isArray(data) ? data : data?.events ?? [];
}

export async function getEventById(id) {
  return api.get(`/events/${id}`);
}

export async function createEvent(payload) {
  return api.post("/events", payload);
}

export async function updateEvent(id, payload) {
  return api.put(`/events/${id}`, payload);
}

export async function updateEventStatus(id, status) {
  return api.patch(`/events/${id}/status`, { status });
}

/** Soft-delete event (participations/data preserved). */
export async function deleteEvent(id) {
  return api.delete(`/events/${id}`);
}
