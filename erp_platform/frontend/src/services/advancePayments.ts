
import { API_BASE_URL } from "../config/api";
import { apiFetch } from "../api/apiClient";

export type AdvanceStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED"
  | "CLOSED";

export interface AdvanceEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  department_id: string | null;
  designation: string | null;
  salary_type: string | null;
}

export interface SalaryAdvance {
  id: string;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  requested_amount: number | string;
  approved_amount: number | string | null;
  disbursed_amount: number | string;
  reason: string;
  status: AdvanceStatus;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  disbursed_by: string | null;
  disbursed_at: string | null;
  created_at: string;
  total_repaid: number | string;
  outstanding_balance: number | string;
}

export interface AdvanceRepayment {
  id: string;
  company_id: string;
  advance_id: string;
  amount: number | string;
  repayment_date: string;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export interface CreateAdvancePayload {
  employee_id: string;
  requested_amount: number;
  reason: string;
}

export interface ApproveAdvancePayload {
  approved_amount?: number;
}

export interface RejectAdvancePayload {
  rejection_reason: string;
}

export interface DisburseAdvancePayload {
  amount: number;
}

export interface RecordRepaymentPayload {
  amount: number;
  repayment_date?: string;
  notes?: string;
}

function post<T>(
  path: string,
  payload: unknown,
): Promise<T> {
  return apiFetch<T>(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAdvanceEmployees() {
  return apiFetch<AdvanceEmployee[]>(
    `${API_BASE_URL}/advance-payments/employees`,
  );
}

export function fetchAdvances() {
  return apiFetch<SalaryAdvance[]>(
    `${API_BASE_URL}/advance-payments`,
  );
}

export function createAdvance(payload: CreateAdvancePayload) {
  return post<SalaryAdvance>("/advance-payments", payload);
}

export function approveAdvance(
  advanceId: string,
  payload: ApproveAdvancePayload = {},
) {
  return post<SalaryAdvance>(
    `/advance-payments/${encodeURIComponent(advanceId)}/approve`,
    payload,
  );
}

export function rejectAdvance(
  advanceId: string,
  payload: RejectAdvancePayload,
) {
  return post<SalaryAdvance>(
    `/advance-payments/${encodeURIComponent(advanceId)}/reject`,
    payload,
  );
}

export function disburseAdvance(
  advanceId: string,
  payload: DisburseAdvancePayload,
) {
  return post<SalaryAdvance>(
    `/advance-payments/${encodeURIComponent(advanceId)}/disburse`,
    payload,
  );
}

export function recordAdvanceRepayment(
  advanceId: string,
  payload: RecordRepaymentPayload,
) {
  return post<AdvanceRepayment>(
    `/advance-payments/${encodeURIComponent(advanceId)}/repayments`,
    payload,
  );
}

export function fetchAdvanceRepayments(advanceId: string) {
  return apiFetch<AdvanceRepayment[]>(
    `${API_BASE_URL}/advance-payments/${encodeURIComponent(
      advanceId,
    )}/repayments`,
  );
}
