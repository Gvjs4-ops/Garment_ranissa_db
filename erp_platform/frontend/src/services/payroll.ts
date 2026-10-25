
import { API_BASE_URL } from "../config/api";
import { apiFetch } from "../api/apiClient";

export interface EmployeeEarning {
  employee_id: string;
  employee_name: string;
  approved_work_records: number;
  total_approved_pieces: number | string;
  total_earnings: number | string;
}

export interface EmployeeEarningsResponse {
  start_date: string | null;
  end_date: string | null;
  employees: EmployeeEarning[];
}

export interface PayrollWorkRecord {
  work_id: string;
  employee_id: string;
  employee_name: string;
  work_date: string;
  operation_id: string;
  operation_name: string | null;
  quantity_completed: number | string;
  quantity_accepted: number | string;
  rate_per_piece: number | string;
  calculated_earnings: number | string;
  verified_at: string | null;
}

export interface PayrollDetailsResponse {
  start_date: string | null;
  end_date: string | null;
  records: PayrollWorkRecord[];
}

function buildQuery(
  startDate: string,
  endDate: string,
  employeeId?: string,
): string {
  const params = new URLSearchParams();

  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  if (employeeId) params.set("employee_id", employeeId);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchEmployeeEarnings(
  startDate: string,
  endDate: string,
) {
  return apiFetch<EmployeeEarningsResponse>(
    `${API_BASE_URL}/payroll/employee-earnings${buildQuery(
      startDate,
      endDate,
    )}`,
  );
}

export function fetchPayrollDetails(
  startDate: string,
  endDate: string,
  employeeId?: string,
) {
  return apiFetch<PayrollDetailsResponse>(
    `${API_BASE_URL}/payroll/period-details${buildQuery(
      startDate,
      endDate,
      employeeId,
    )}`,
  );
}

