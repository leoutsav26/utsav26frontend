# Backend API Contract – Leo Club Event Portal

This document defines the API the frontend expects from the backend (Railway Postgres). All base paths are relative to `VITE_API_URL` (e.g. `https://your-app.railway.app/api`).

**Auth:** Protected routes expect `Authorization: Bearer <token>`.

---

## 1. Auth (Users table)

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|--------|
| POST | `/auth/login` | `{ role, email, password?, profile? }` | `{ token?, user?, needsProfile? }` | For student, if not registered return `{ needsProfile: true }`. Else return `{ token, user }`. |
| POST | `/auth/register` | `{ email, name, rollNo, phone }` | `{ token, user }` | Student registration; backend generates LEO ID. |
| GET | `/auth/me` | — | `{ user }` or user object | Requires Bearer token. |

**User object (min):** `id`, `email`, `role` (`student`|`coordinator`|`admin`), `name?`, `leoId?`, `rollNo?`, `phone?`, `status?` (for coord: `pending`|`approved`|`rejected`).

---

## 2. Events (Events table)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/events` | — | Array of event objects |
| GET | `/events/:id` | — | Single event object |
| POST | `/events` | Event payload (title, description, date, time, venue, category, status, cost, rules, teamSize) | Created event (admin) |
| PUT | `/events/:id` | Same as POST | Updated event (admin) |
| PATCH | `/events/:id/status` | `{ status }` (`open`\|`ongoing`\|`closed`\|`completed`) | Updated event (admin) |

**Event object:** `id`, `title`, `description`, `date`, `time`, `venue`, `category`, `status`, `cost`, `rules`, `teamSize`, `createdAt?`.

---

## 3. Participations (Participations table)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/events/:eventId/participations` | — | Array of participation objects (for that event) |
| GET | `/participations` | — | Array of all participations (admin); each has `eventId` |
| POST | `/participations` | `{ eventId, userId?, paymentType?, transactionId?, screenshot? }` | Created participation (student registers) |
| DELETE | `/participations/:id` | — | 204 or success (student undo registration) |
| PATCH | `/participations/:id` | `{ arrived?, paymentStatus? }` | Updated participation (coordinator) |

**Participation object:** `id`, `eventId`, `userId` (or `studentId`), `name`, `leoId`, `rollNo?`, `paymentType`, `paymentStatus?`, `arrived?`, `screenshot?`, `transactionId?`, `registeredAt?`.

---

## 4. Payments (Payments table)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/payments` | `{ participationId, transactionId, screenshot? }` | Created payment record |
| GET | `/payments/summary` | — | `{ total, byEvent: { [eventId]: { count, amount, title? } } }` (admin revenue) |

---

## 5. Event Coordinators (EventCoordinators table)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/events/:eventId/coordinators` | — | Array of coordinator assignments (include user name, phone) |
| GET | `/event-coordinators/me` | — | Array of event IDs or `{ eventIds: [] }` (events current user coordinates) |
| POST | `/event-coordinators` | `{ eventId }` | Created assignment (coordinator joins event) |
| DELETE | `/event-coordinators/:id` | — | Removed assignment |
| DELETE | `/event-coordinators?eventId=:eventId` | — | **Suggested:** remove current user’s assignment for that event (avoids extra GET) |

**Admin – coordinator approval (Users with role coordinator):**

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/users/coordinators` | — | Array of coordinator users (pending + approved) |
| PATCH | `/users/coordinators/:id/status` | `{ status: "approved" \| "rejected" }` | Updated user |

---

## 6. Leaderboard & Winners

Frontend uses leaderboard per event and winners per event. If your DB has no Leaderboard/Winners tables, add them or derive from Participations/Events.

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/events/:eventId/leaderboard` | — | Array of `{ participantId, name, leoId, rollNo?, score }` sorted by score desc |
| PATCH | `/events/:eventId/leaderboard` | `{ participantId, score }` or upsert entry | Updated leaderboard entry |
| GET | `/events/:eventId/winners` | — | Array of participant IDs (or user IDs) – top 3 |
| PATCH | `/events/:eventId/complete` | `{ winnerParticipantIds: [] }` (top 3) | Marks event completed and stores winners |

---

## 7. EventPasses (optional)

If EventPasses table exists for multiple pass types per event, frontend currently uses a single `cost` per event. You can either map one default pass per event or add:

- GET `/events/:eventId/passes` → list passes; frontend can show first or default.

---

## Summary – endpoints to implement (if missing)

1. **Auth:** `POST /auth/login`, `POST /auth/register`, `GET /auth/me`
2. **Events:** `GET/POST/PUT /events`, `GET /events/:id`, `PATCH /events/:id/status`
3. **Participations:** `GET /events/:eventId/participations`, `GET /participations`, `POST /participations`, `DELETE /participations/:id`, `PATCH /participations/:id`
4. **Payments:** `POST /payments`, `GET /payments/summary`
5. **Event coordinators:** `GET /events/:eventId/coordinators`, `GET /event-coordinators/me`, `POST /event-coordinators`, `DELETE /event-coordinators/:id` or `?eventId=`
6. **Users (admin):** `GET /users/coordinators`, `PATCH /users/coordinators/:id/status`
7. **Leaderboard/Winners:** `GET/PATCH /events/:eventId/leaderboard`, `GET /events/:eventId/winners`, `PATCH /events/:eventId/complete`

---

## Frontend usage

- **Config:** Set `VITE_API_URL` in `.env` to your backend base URL (e.g. `https://yourapp.railway.app/api`). If unset, the app uses **localStorage + sample data** (no backend calls).
- **Token:** Stored in `localStorage` under `leo_auth_token`; sent as `Authorization: Bearer <token>` on every request.
- **Errors:** Non-2xx responses throw `ApiError` with `message`, `status`, `body`. UI shows messages and loading states where implemented.
