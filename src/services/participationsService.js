import { api } from "./apiClient";

/**
 * Participations API – matches backend Participations table.
 * GET /events/:eventId/participations, POST /participations, DELETE /participations/:id, PATCH /participations/:id
 */

export async function getParticipationsByEvent(eventId) {
  const data = await api.get(`/events/${eventId}/participations`);
  return Array.isArray(data) ? data : data?.participations ?? [];
}

/** All participations (for admin revenue/reports). Returns list with eventId on each. */
export async function getAllParticipations() {
  const data = await api.get("/participations");
  return Array.isArray(data) ? data : data?.participations ?? [];
}

export async function createParticipation(body) {
  return api.post("/participations", body);
}

export async function deleteParticipation(id) {
  return api.delete(`/participations/${id}`);
}

export async function updateParticipation(id, payload) {
  return api.patch(`/participations/${id}`, payload);
}
