import { api } from "./apiClient";

/**
 * EventCoordinators API – matches backend EventCoordinators + Users (coordinators).
 * GET /events/:eventId/coordinators, POST /event-coordinators, DELETE /event-coordinators/:id
 * Admin: GET /users/coordinators, PATCH /users/coordinators/:id/status
 */

export async function getCoordinatorsByEvent(eventId) {
  const data = await api.get(`/events/${eventId}/coordinators`);
  return Array.isArray(data) ? data : data?.coordinators ?? [];
}

export async function joinEvent(eventId) {
  return api.post("/event-coordinators", { eventId });
}

export async function leaveEvent(eventId) {
  const data = await api.get(`/events/${eventId}/coordinators`);
  const list = Array.isArray(data) ? data : data?.coordinators ?? [];
  const me = list.find((c) => c.userId || c.id);
  if (me?.id) await api.delete(`/event-coordinators/${me.id}`);
  else await api.delete(`/event-coordinators?eventId=${eventId}`);
}

export async function getMyCoordinatorEventIds() {
  const data = await api.get("/event-coordinators/me");
  const list = Array.isArray(data) ? data : data?.eventIds ?? data?.events ?? [];
  return list.map((e) => (typeof e === "object" ? e.eventId ?? e.id : e));
}

export async function listCoordinators() {
  const data = await api.get("/users/coordinators");
  return Array.isArray(data) ? data : data?.coordinators ?? [];
}

export async function updateCoordinatorStatus(coordinatorId, status) {
  return api.patch(`/users/coordinators/${coordinatorId}/status`, { status });
}
