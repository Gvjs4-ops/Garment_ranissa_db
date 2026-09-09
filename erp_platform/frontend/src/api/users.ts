import { apiFetch } from "./apiClient";

export type UserRole =
  | "ADMIN"
  | "SALES_MANAGER"
  | "SALES_EXECUTIVE"
  | "INVENTORY_MANAGER"
  | "PRODUCTION_MANAGER"
  | "ACCOUNTANT"
  | "USER";

export interface CompanyUser {
  id: string;
  user_id: string;

  full_name: string;
  email: string | null;

  company_id: string;
  company_name: string | null;

  role: UserRole;
  is_active: boolean;

  joined_at: string | null;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  company_id: string;
}

export interface UpdateUserPayload {
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export const USER_ROLES: {
  value: UserRole;
  label: string;
}[] = [
  {
    value: "ADMIN",
    label: "Administrator",
  },
  {
    value: "SALES_MANAGER",
    label: "Sales Manager",
  },
  {
    value: "SALES_EXECUTIVE",
    label: "Sales Executive",
  },
  {
    value: "INVENTORY_MANAGER",
    label: "Inventory Manager",
  },
  {
    value: "PRODUCTION_MANAGER",
    label: "Production Manager",
  },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
  },
  {
    value: "USER",
    label: "User",
  },
];


export async function fetchUsers():
  Promise<CompanyUser[]> {
  return apiFetch("/api/users");
}


export async function createUser(
  payload: CreateUserPayload
): Promise<CompanyUser> {
  return apiFetch("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function updateUser(
  companyUserId: string,
  payload: UpdateUserPayload
): Promise<CompanyUser> {
  return apiFetch(
    `/api/users/${companyUserId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}


export async function deactivateUser(
  companyUserId: string
) {
  return apiFetch(
    `/api/users/${companyUserId}`,
    {
      method: "DELETE",
    }
  );
}
