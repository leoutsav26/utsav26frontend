/**
 * Central API services – single entry for all backend calls.
 * Use these instead of ad-hoc fetch/axios. All methods return promises and throw ApiError on failure.
 */
export { api, request, getAuthToken, setAuthToken, ApiError } from "./apiClient";
export * from "./authService";
export * from "./eventsService";
export * from "./participationsService";
export * from "./paymentsService";
export * from "./eventCoordinatorsService";
export * from "./leaderboardService";
export * from "./usersService";
