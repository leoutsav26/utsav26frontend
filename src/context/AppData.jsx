import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import { API_BASE } from "../config/api";
import * as eventsApi from "../services/eventsService";
import * as participationsApi from "../services/participationsService";
import * as paymentsApi from "../services/paymentsService";
import * as coordinatorsApi from "../services/eventCoordinatorsService";
import * as leaderboardApi from "../services/leaderboardService";
import {
  getInitialEvents,
  getInitialUsers,
  getInitialCoordActive,
  getInitialParticipants,
  getInitialLeaderboards,
  getInitialCoordRequests,
  getInitialWinners,
  saveEvents,
  saveUsers,
  saveCoordActive,
  saveParticipants,
  saveLeaderboards,
  saveCoordRequests,
  saveWinners,
} from "../data/sampleData";

const AppDataContext = createContext(null);

const useApi = Boolean(API_BASE);

const initialState = {
  events: [],
  users: { students: [], coordinators: [], admins: [] },
  coordActive: {},
  participants: {},
  leaderboards: {},
  coordRequests: [],
  winners: {},
  loading: false,
  apiError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_EVENTS":
      return { ...state, events: typeof action.payload === "function" ? action.payload(state.events) : action.payload };
    case "SET_USERS":
      return { ...state, users: typeof action.payload === "function" ? action.payload(state.users) : action.payload };
    case "SET_COORD_ACTIVE":
      return { ...state, coordActive: typeof action.payload === "function" ? action.payload(state.coordActive) : action.payload };
    case "SET_PARTICIPANTS":
      return { ...state, participants: typeof action.payload === "function" ? action.payload(state.participants) : action.payload };
    case "SET_LEADERBOARDS":
      return { ...state, leaderboards: action.payload };
    case "SET_COORD_REQUESTS":
      return { ...state, coordRequests: action.payload };
    case "SET_WINNERS":
      return { ...state, winners: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_API_ERROR":
      return { ...state, apiError: action.payload };
    case "PATCH_PARTICIPANTS_FOR_EVENT":
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.eventId]: action.payload,
        },
      };
    case "PATCH_LEADERBOARD_FOR_EVENT":
      return {
        ...state,
        leaderboards: {
          ...state.leaderboards,
          [action.eventId]: action.payload,
        },
      };
    case "PATCH_COORD_ACTIVE":
      return {
        ...state,
        coordActive: { ...state.coordActive, [action.userId]: action.payload },
      };
    default:
      return state;
  }
}

function normalizeParticipations(list) {
  const byEvent = {};
  (list || []).forEach((p) => {
    const eid = p.eventId ?? p.event_id;
    if (!eid) return;
    if (!byEvent[eid]) byEvent[eid] = [];
    byEvent[eid].push({
      id: p.id,
      studentId: p.userId ?? p.studentId ?? p.user_id,
      name: p.name,
      leoId: p.leoId ?? p.leo_id,
      rollNo: p.rollNo ?? p.roll_no,
      paymentType: p.paymentType ?? p.payment_type,
      paymentStatus: p.paymentStatus ?? p.payment_status,
      arrived: p.arrived ?? false,
      screenshot: p.screenshot,
      transactionId: p.transactionId ?? p.transaction_id,
      registeredAt: p.registeredAt ?? p.registered_at,
    });
  });
  return byEvent;
}

export function AppDataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setEvents = useCallback((events) => dispatch({ type: "SET_EVENTS", payload: events }), []);
  const setUsers = useCallback((users) => dispatch({ type: "SET_USERS", payload: users }), []);
  const setCoordActive = useCallback((v) => dispatch({ type: "SET_COORD_ACTIVE", payload: v }), []);
  const setParticipants = useCallback((v) => dispatch({ type: "SET_PARTICIPANTS", payload: v }), []);
  const setLeaderboards = useCallback((v) => dispatch({ type: "SET_LEADERBOARDS", payload: v }), []);
  const setCoordRequests = useCallback((v) => dispatch({ type: "SET_COORD_REQUESTS", payload: v }), []);
  const setWinners = useCallback((v) => dispatch({ type: "SET_WINNERS", payload: v }), []);
  const setLoading = useCallback((v) => dispatch({ type: "SET_LOADING", payload: v }), []);
  const setApiError = useCallback((v) => dispatch({ type: "SET_API_ERROR", payload: v }), []);

  // —— When API is disabled: use localStorage + sampleData (existing behaviour)
  useEffect(() => {
    if (useApi) return;
    setEvents(getInitialEvents());
    setUsers(getInitialUsers());
    setCoordActive(getInitialCoordActive());
    setParticipants(getInitialParticipants());
    setLeaderboards(getInitialLeaderboards());
    setCoordRequests(getInitialCoordRequests());
    setWinners(getInitialWinners());
  }, [setEvents, setUsers, setCoordActive, setParticipants, setLeaderboards, setCoordRequests, setWinners]);

  useEffect(() => {
    if (!useApi) {
      saveEvents(state.events);
      saveUsers(state.users);
      saveCoordActive(state.coordActive);
      saveParticipants(state.participants);
      saveLeaderboards(state.leaderboards);
      saveCoordRequests(state.coordRequests);
      saveWinners(state.winners);
    }
  }, [state.events, state.users, state.coordActive, state.participants, state.leaderboards, state.coordRequests, state.winners]);

  // —— When API is enabled: fetch events on mount
  useEffect(() => {
    if (!useApi) return;
    let cancelled = false;
    setLoading(true);
    setApiError(null);
    eventsApi
      .getAllEvents()
      .then((list) => {
        if (!cancelled) setEvents(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) setApiError(err?.message || "Failed to load events");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const refreshDataForUser = useCallback(
    async (user) => {
      if (!useApi || !user) return;
      setApiError(null);
      try {
        if (user.role === "admin") {
          const [partList, coordList] = await Promise.all([
            participationsApi.getAllParticipations().catch(() => []),
            coordinatorsApi.listCoordinators().catch(() => []),
          ]);
          setParticipants(normalizeParticipations(partList));
          setUsers((u) => ({ ...(u || {}), coordinators: coordList }));
        }
        if (user.role === "coordinator") {
          const eventIds = await coordinatorsApi.getMyCoordinatorEventIds().catch(() => []);
          setCoordActive((c) => ({ ...(c || {}), [user.id]: eventIds }));
          const partsByEvent = {};
          for (const eid of eventIds) {
            const list = await participationsApi.getParticipationsByEvent(eid).catch(() => []);
            partsByEvent[eid] = (list || []).map((p) => ({
              id: p.id,
              studentId: p.userId ?? p.studentId,
              name: p.name,
              leoId: p.leoId,
              rollNo: p.rollNo,
              paymentType: p.paymentType,
              paymentStatus: p.paymentStatus,
              arrived: p.arrived,
              screenshot: p.screenshot,
              transactionId: p.transactionId,
              registeredAt: p.registeredAt,
            }));
          }
          setParticipants((p) => ({ ...(p || {}), ...partsByEvent }));
        }
        if (user.role === "student") {
          const partList = await participationsApi.getAllParticipations().catch(() => []);
          const mine = (partList || []).filter((x) => (x.userId ?? x.studentId) === user.id);
          setParticipants(normalizeParticipations(mine));
        }
      } catch (err) {
        setApiError(err?.message || "Failed to refresh data");
      }
    },
    []
  );

  const value = {
    ...state,
    setEvents,
    setUsers,
    setCoordActive,
    setParticipants,
    setLeaderboards,
    setCoordRequests,
    setWinners,
    setLoading,
    setApiError,
    useApi,
    refreshDataForUser,
    // Async API actions (no-op when !useApi; otherwise call API then update state)
    async createEvent(payload) {
      if (!useApi) return null;
      const created = await eventsApi.createEvent(payload);
      setEvents((prev) => [...(prev || []), created]);
      return created;
    },
    async updateEvent(id, payload) {
      if (!useApi) return null;
      const updated = await eventsApi.updateEvent(id, payload);
      setEvents((prev) => (prev || []).map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    async updateEventStatus(id, status) {
      if (!useApi) return null;
      await eventsApi.updateEventStatus(id, status);
      setEvents((prev) => (prev || []).map((e) => (e.id === id ? { ...e, status } : e)));
    },
    async createParticipation(body) {
      if (!useApi) return null;
      const created = await participationsApi.createParticipation(body);
      const eid = created.eventId ?? body.eventId;
      if (eid) {
        const list = await participationsApi.getParticipationsByEvent(eid);
        dispatch({ type: "PATCH_PARTICIPANTS_FOR_EVENT", eventId: eid, payload: list });
      }
      return created;
    },
    async deleteParticipation(id, eventId) {
      if (!useApi) return null;
      await participationsApi.deleteParticipation(id);
      const list = await participationsApi.getParticipationsByEvent(eventId).catch(() => []);
      dispatch({ type: "PATCH_PARTICIPANTS_FOR_EVENT", eventId, payload: list });
    },
    async updateParticipationStatus(id, eventId, payload) {
      if (!useApi) return null;
      await participationsApi.updateParticipation(id, payload);
      const list = await participationsApi.getParticipationsByEvent(eventId);
      dispatch({ type: "PATCH_PARTICIPANTS_FOR_EVENT", eventId, payload: list });
    },
    async createPayment(body) {
      if (!useApi) return null;
      return paymentsApi.createPayment(body);
    },
    async joinEventAsCoordinator(eventId, userId) {
      if (!useApi) return null;
      await coordinatorsApi.joinEvent(eventId);
      const eventIds = await coordinatorsApi.getMyCoordinatorEventIds();
      dispatch({ type: "PATCH_COORD_ACTIVE", userId, payload: eventIds });
    },
    async leaveEventAsCoordinator(eventId, userId) {
      if (!useApi) return null;
      await coordinatorsApi.leaveEvent(eventId);
      const eventIds = await coordinatorsApi.getMyCoordinatorEventIds();
      dispatch({ type: "PATCH_COORD_ACTIVE", userId, payload: eventIds });
    },
    async updateCoordinatorStatus(coordinatorId, status) {
      if (!useApi) return null;
      await coordinatorsApi.updateCoordinatorStatus(coordinatorId, status);
      const list = await coordinatorsApi.listCoordinators();
      setUsers((u) => ({ ...(u || {}), coordinators: list }));
    },
    async completeEventWithWinners(eventId, winnerParticipantIds) {
      if (!useApi) return null;
      await leaderboardApi.completeEvent(eventId, winnerParticipantIds);
      setEvents((prev) => (prev || []).map((e) => (e.id === eventId ? { ...e, status: "completed" } : e)));
      setWinners((w) => ({ ...(w || {}), [eventId]: winnerParticipantIds }));
    },
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
