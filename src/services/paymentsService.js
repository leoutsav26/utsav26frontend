import { api } from "./apiClient";

/**
 * Payments API – matches backend Payments table.
 * POST /payments, GET /payments/summary (admin revenue)
 */

export async function createPayment(body) {
  return api.post("/payments", body);
}

export async function getRevenueSummary() {
  const data = await api.get("/payments/summary");
  return data ?? { total: 0, byEvent: {} };
}
