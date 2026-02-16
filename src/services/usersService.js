import { api } from "./apiClient";

/**
 * Users API – admin create user (admin/coordinator).
 * POST /users with auth → { user, temporaryPassword }
 */

export async function createUser(body) {
  return api.post("/users", body);
}
