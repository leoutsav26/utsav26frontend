import { api } from "./apiClient";

/**
 * Leaderboard & winners – backend may have separate tables or store on Event.
 * GET /events/:eventId/leaderboard, PUT or PATCH /events/:eventId/leaderboard
 * PATCH /events/:eventId/complete (sets top 3 as winners), GET /events/:eventId/winners
 */

export async function getLeaderboard(eventId) {
  const data = await api.get(`/events/${eventId}/leaderboard`);
  return Array.isArray(data) ? data : data?.leaderboard ?? [];
}

export async function setLeaderboardEntry(eventId, participantId, payload) {
  return api.post(`/leaderboard/${eventId}`, {
    participantId,
    ...payload
  });
}

export async function getWinners(eventId) {
  const data = await api.get(`/events/${eventId}/winners`);
  return Array.isArray(data) ? data : data?.winners ?? [];
}

/** Coordinators who entered scores for this event (for report). */
export async function getScoreEnteredBy(eventId) {
  const data = await api.get(`/events/${eventId}/score-entered-by`);
  return Array.isArray(data) ? data : [];
}

export async function completeEvent(eventId, winnerParticipantIds = []) {
  return api.patch(`/events/${eventId}/complete`, { winnerParticipantIds });
}
