import { api } from "./apiClient";

export async function getVisits() {
  const data = await api.get("/analytics");
  return {
    total: data?.total ?? 0,
    byDate: Array.isArray(data?.byDate) ? data.byDate : [],
  };
}
