import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppData";

/**
 * When API is enabled, refreshes app data (participations, coordActive, coordinators) when user changes.
 * Must be rendered inside both AuthProvider and AppDataProvider.
 */
export default function DataHydrator() {
  const { user } = useAuth();
  const { useApi, refreshDataForUser } = useAppData();

  useEffect(() => {
    if (useApi && user) refreshDataForUser(user);
  }, [useApi, user?.id, refreshDataForUser]);

  return null;
}
