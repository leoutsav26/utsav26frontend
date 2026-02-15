# API Contract Audit & Refactor Summary

## What Was Wrong (Before)

1. **No real API usage** – Only three `fetch("/events.json")` calls (static file). All business data came from **localStorage** and **sampleData.js** (mock).
2. **No central API layer** – No shared client, no auth token attachment, no error handling.
3. **Auth was fully local** – Login/register used in-memory `users` from AppData; no backend auth or tokens.
4. **Duplicate / fallback logic** – Events and Home used context first, then fell back to `/events.json`.
5. **No loading or error handling** – No loading states or user-visible API errors.
6. **Mutations were local only** – setEvents, setParticipants, etc. only updated context/localStorage; nothing hit the backend.

---

## What Was Fixed

### 1. API config and client (`src/config/api.js`, `src/services/apiClient.js`)

- **Config:** `VITE_API_URL` from env; `AUTH_TOKEN_KEY` for token storage.
- **Client:** `request(method, path, body)` with:
  - `Authorization: Bearer <token>` when token exists
  - JSON request/response
  - Throws `ApiError(message, status, body)` on non-2xx
- **Helpers:** `getAuthToken()`, `setAuthToken()`, `api.get/post/put/patch/delete`.

### 2. Centralized services (`src/services/*.js`)

- **authService** – `login`, `registerStudent`, `getMe`, `logout` (token clear).
- **eventsService** – `getAllEvents`, `getEventById`, `createEvent`, `updateEvent`, `updateEventStatus`.
- **participationsService** – `getParticipationsByEvent`, `getAllParticipations`, `createParticipation`, `deleteParticipation`, `updateParticipation`.
- **paymentsService** – `createPayment`, `getRevenueSummary`.
- **eventCoordinatorsService** – `getCoordinatorsByEvent`, `getMyCoordinatorEventIds`, `joinEvent`, `leaveEvent`, `listCoordinators`, `updateCoordinatorStatus`.
- **leaderboardService** – `getLeaderboard`, `setLeaderboardEntry`, `getWinners`, `completeEvent`.
- **index.js** – Re-exports all services and client.

### 3. AppData refactor (`src/context/AppData.jsx`)

- **Dual mode:** If `VITE_API_URL` is set → use API; else → keep existing localStorage + sampleData (no breaking change).
- **When API on:** Initial load fetches events; `refreshDataForUser(user)` loads participations, coordActive, coordinators by role.
- **Async actions on context:** `createEvent`, `updateEvent`, `updateEventStatus`, `createParticipation`, `deleteParticipation`, `updateParticipationStatus`, `createPayment`, `joinEventAsCoordinator`, `leaveEventAsCoordinator`, `updateCoordinatorStatus`, `completeEventWithWinners`. Each calls the service then updates state (or refetches).
- **Normalization:** API responses (e.g. participations list) normalized to frontend shape (e.g. `participants` by `eventId`).
- **Loading/error:** `loading`, `apiError` on context; used in Events and elsewhere.

### 4. AuthContext refactor (`src/context/AuthContext.jsx`)

- **When API on:** `login()` and `registerStudent()` call auth service; token stored; `getMe()` used on init when token exists. `logout()` clears token.
- **When API off:** Unchanged: login/register against AppData `users` and localStorage.
- **Response handling:** Handles `needsProfile` and API errors; no persist when `needsProfile`.

### 5. DataHydrator (`src/components/DataHydrator.jsx`)

- Runs inside AuthProvider + AppDataProvider.
- When `useApi` and `user` exist, calls `refreshDataForUser(user)` so participations, coordActive, coordinators load after login.

### 6. Pages wired to API (when `useApi`)

- **Login** – All submit handlers async; call `login()` (which may call API); loading state and disabled buttons.
- **Events** – Uses only context; shows `apiError` and loading when list empty.
- **Home** – Uses only context for featured list; no `/events.json` fallback.
- **EventDetails** – Gets event from context or `getEventById(id)` when API on; shows “Event not found” when loaded and no event.
- **StudentDashboard** – Register: `createParticipation` (+ `createPayment` for pay_now); Undo: `deleteParticipation`. Loading and error state.
- **CoordinatorDashboard** – Join/leave: `joinEventAsCoordinator` / `leaveEventAsCoordinator`; arrived/payment: `updateParticipationStatus`.
- **AdminDashboard** – Save event: `createEvent` / `updateEvent`; close: `updateEventStatus`; complete: `completeEventWithWinners`; approve/reject: `updateCoordinatorStatus`.

### 7. Mock and static data

- **Removed** all `fetch("/events.json")` usage; data comes from context (API or localStorage).
- **sampleData.js** – Still used only when `VITE_API_URL` is not set; comment updated to say it’s fallback only.

### 8. Documentation

- **docs/API_CONTRACT.md** – Full backend contract: methods, paths, bodies, responses, and summary of endpoints to implement.
- **.env.example** – `VITE_API_URL=` documented.

---

## Modified Files (List)

| File | Change |
|------|--------|
| `src/config/api.js` | **New** – API base URL and token key. |
| `src/services/apiClient.js` | **New** – Request helper, auth token, `ApiError`. |
| `src/services/authService.js` | **New** – Login, register, getMe, logout. |
| `src/services/eventsService.js` | **New** – CRUD events. |
| `src/services/participationsService.js` | **New** – Participations + getAll. |
| `src/services/paymentsService.js` | **New** – Create payment, revenue summary. |
| `src/services/eventCoordinatorsService.js` | **New** – Join/leave, list, approve/reject. |
| `src/services/leaderboardService.js` | **New** – Leaderboard and complete event. |
| `src/services/index.js` | **New** – Re-export services. |
| `src/context/AppData.jsx` | **Refactor** – API mode, fetch on load, refreshDataForUser, async actions, normalizers. |
| `src/context/AuthContext.jsx` | **Refactor** – API login/register/getMe when useApi; token; needsProfile fix. |
| `src/components/DataHydrator.jsx` | **New** – Refreshes app data when user changes (API mode). |
| `src/App.jsx` | **Change** – Import and render `DataHydrator`. |
| `src/pages/Login.jsx` | **Change** – Async submit handlers, loading state, disabled buttons. |
| `src/pages/Events.jsx` | **Change** – Use only context; remove fetch; show loading/error. |
| `src/pages/home.jsx` | **Change** – Use only context; remove fetch fallback. |
| `src/pages/EventDetails.jsx` | **Change** – getEventById when API; eventLoaded; “Event not found”. |
| `src/pages/StudentDashboard.jsx` | **Change** – useApi, createParticipation, deleteParticipation, createPayment; loading/error. |
| `src/pages/CoordinatorDashboard.jsx` | **Change** – useApi, join/leave/updateParticipationStatus. |
| `src/pages/AdminDashboard.jsx` | **Change** – useApi, createEvent, updateEvent, updateEventStatus, updateCoordinatorStatus, completeEventWithWinners. |
| `src/pages/StudentDashboard.css` | **Change** – .sd-action-error. |
| `src/data/sampleData.js` | **Change** – Comment: fallback when no API URL. |
| `docs/API_CONTRACT.md` | **New** – Backend API contract. |
| `docs/AUDIT_AND_REFACTOR_SUMMARY.md` | **New** – This file. |
| `.env.example` | **New** – VITE_API_URL. |

---

## Backend Endpoints to Implement (from API_CONTRACT.md)

If any are missing, implement as in `docs/API_CONTRACT.md`:

1. **Auth:** `POST /auth/login`, `POST /auth/register`, `GET /auth/me`
2. **Events:** `GET/POST/PUT /events`, `GET /events/:id`, `PATCH /events/:id/status`
3. **Participations:** `GET /events/:eventId/participations`, `GET /participations`, `POST /participations`, `DELETE /participations/:id`, `PATCH /participations/:id`
4. **Payments:** `POST /payments`, `GET /payments/summary`
5. **Event coordinators:** `GET /events/:eventId/coordinators`, `GET /event-coordinators/me`, `POST /event-coordinators`, `DELETE /event-coordinators/:id` or `?eventId=`
6. **Users (admin):** `GET /users/coordinators`, `PATCH /users/coordinators/:id/status`
7. **Leaderboard/Winners:** `GET/PATCH /events/:eventId/leaderboard`, `GET /events/:eventId/winners`, `PATCH /events/:eventId/complete`

---

## Zero Breaking Changes to UI

- When **VITE_API_URL is not set**, behaviour is unchanged: localStorage + sampleData, same screens and flows.
- When **VITE_API_URL is set**, same UI; data comes from API and mutations go through the new async actions with loading/error handling where added.

---

## How to Run With Backend

1. Set in `.env`: `VITE_API_URL=https://your-backend.railway.app/api`
2. Ensure backend implements the contract in `docs/API_CONTRACT.md`.
3. Run frontend: `npm run dev`. Login and all flows use the API; token is stored and sent on requests.
