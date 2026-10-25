import { API_BASE_URL } from "../config/api";
import { apiFetch } from "../api/apiClient";

export interface CurrentUser {
  id: string;
  email: string | null;
  company_user_id: string;
  company_id: string;
  company_name: string;
  role: string;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return apiFetch(`${API_BASE_URL}/users/me`);
}
