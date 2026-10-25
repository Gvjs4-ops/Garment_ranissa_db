
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

import {
  fetchEmployeeEarnings,
  fetchPayrollDetails,
  type EmployeeEarning,
  type PayrollWorkRecord,
} from "../../services/payroll";

function formatMoney(value: number | string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatQuantity(value: number | string): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(
  employee: EmployeeEarning,
  records: PayrollWorkRecord[],
  startDate: string,
  endDate: string,
) {
  const rows: unknown[][] = [
    ["Employee Payroll Statement"],
    ["Employee", employee.employee_name],
    ["Employee ID", employee.employee_id],
    ["Period start", startDate],
    ["Period end", endDate],
    ["Statement type", "Approved piece-rate earnings"],
    [],
    ["Work date", "Operation", "Completed pieces", "Accepted pieces", "Rate per piece (INR)", "Approved earnings (INR)"],
    ...records.map((record) => [
      record.work_date,
      record.operation_name || "—",
      record.quantity_completed,
      record.quantity_accepted,
      record.rate_per_piece,
      record.calculated_earnings,
    ]),
    [],
    ["Total approved pieces", employee.total_approved_pieces],
    ["Total approved earnings (INR)", employee.total_earnings],
    ["Approved work records", employee.approved_work_records],
  ];

  const csv = "\uFEFF" + rows
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `payroll-${employee.employee_id}-${startDate}-to-${endDate}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function EmployeePayrollStatement() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const startDate = searchParams.get("start_date") || "";
  const endDate = searchParams.get("end_date") || "";

  const [employee, setEmployee] = useState<EmployeeEarning | null>(null);
  const [records, setRecords] = useState<PayrollWorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatement = useCallback(async () => {
    if (!employeeId) {
      setError("Employee ID is missing.");
      setLoading(false);
      return;
    }

    if (!startDate || !endDate || startDate > endDate) {
      setError("A valid start and end date are required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [earningsResponse, detailsResponse] = await Promise.all([
        fetchEmployeeEarnings(startDate, endDate),
        fetchPayrollDetails(startDate, endDate, employeeId),
      ]);

      const matchingEmployee =
        earningsResponse.employees.find(
          (item) => item.employee_id === employeeId,
        ) ?? null;

      setEmployee(matchingEmployee);
      setRecords(
        detailsResponse.records.filter(
          (record) => record.employee_id === employeeId,
        ),
      );

      if (!matchingEmployee) {
        setError("No approved earnings were found for this employee in the selected period.");
      }
    } catch (err) {
      setEmployee(null);
      setRecords([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the employee statement.",
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId, startDate, endDate]);

  useEffect(() => {
    void loadStatement();
  }, [loadStatement]);

  const operationTotals = useMemo(() => {
    const totals = new Map<
      string,
      { pieces: number; earnings: number; records: number }
    >();

    records.forEach((record) => {
      const operation = record.operation_name || "Unspecified operation";
      const current = totals.get(operation) ?? {
        pieces: 0,
        earnings: 0,
        records: 0,
      };

      current.pieces += Number(record.quantity_accepted) || 0;
      current.earnings += Number(record.calculated_earnings) || 0;
      current.records += 1;
      totals.set(operation, current);
    });

    return Array.from(totals.entries()).map(([operation, total]) => ({
      operation,
      ...total,
    }));
  }, [records]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        className="statement-actions"
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ 
        justifyContent:"space-between",
        alignItems:{ xs: "stretch", sm: "center" },
        mb: 3 }}
      >
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate("/payroll")}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Payroll
        </Button>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            disabled={!employee || loading || records.length === 0}
            onClick={() =>
              employee &&
              downloadCsv(employee, records, startDate, endDate)
            }
          >
            Export CSV / Excel
          </Button>

          <Button
            variant="contained"
            startIcon={<PrintOutlinedIcon />}
            disabled={!employee || loading}
            onClick={() => window.print()}
          >
            Print statement
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity={employee ? "warning" : "error"} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems:"center",  mb: 3 }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">
            Loading employee statement...
          </Typography>
        </Stack>
      )}

      {employee && !loading && (
        <Box id="employee-payroll-statement">
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ 
              justifyContent:"space-between",
              mb: 3 }}
            >
              <Box>
                <Typography variant="h4" sx={{fontWeight:700}}>
                  Employee Payroll Statement
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Approved piece-rate earnings
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pay period
                </Typography>
                <Typography sx={{fontWeight:600}}>
                  {startDate} to {endDate}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Statement status: Approved earnings summary
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" sx={{fontWeight:700}}>
              Employee information
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={4}
              sx={{ mt: 1, mb: 3 }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Employee name
                </Typography>
                <Typography sx={{fontWeight:600}}>
                  {employee.employee_name}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Employee ID
                </Typography>
                <Typography sx={{fontWeight:600}}>
                  {employee.employee_id}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" sx={{fontWeight:700,  mb: 2 }}>
              Earnings summary
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 4 }}
            >
              <Card variant="outlined" sx={{ flex: 1 }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Accepted pieces
                  </Typography>
                  <Typography variant="h5" sx={{fontWeight:700}}>
                    {formatQuantity(employee.total_approved_pieces)}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ flex: 1 }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Approved work records
                  </Typography>
                  <Typography variant="h5" sx={{fontWeight:700}}>
                    {employee.approved_work_records}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ flex: 1 }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Total approved earnings
                  </Typography>
                  <Typography variant="h5" sx={{fontWeight:700}} color="primary.main">
                    {formatMoney(employee.total_earnings)}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>

            <Typography variant="h6" sx={{ fontWeight:700, mb: 2 }}>
              Operation-wise summary
            </Typography>

            <TableContainer sx={{ mb: 4, overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Operation</TableCell>
                    <TableCell align="right">Accepted pieces</TableCell>
                    <TableCell align="right">Work records</TableCell>
                    <TableCell align="right">Earnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {operationTotals.map((item) => (
                    <TableRow key={item.operation}>
                      <TableCell>{item.operation}</TableCell>
                      <TableCell align="right">
                        {formatQuantity(item.pieces)}
                      </TableCell>
                      <TableCell align="right">{item.records}</TableCell>
                      <TableCell align="right">
                        {formatMoney(item.earnings)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography sx={{fontWeight:700}}>Total approved earnings</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{fontWeight:700}}>
                        {formatMoney(employee.total_earnings)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" sx={{fontWeight:700, mb: 2 }}>
              Approved work records
            </Typography>

            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Work date</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell align="right">Completed</TableCell>
                    <TableCell align="right">Accepted</TableCell>
                    <TableCell align="right">Rate per piece</TableCell>
                    <TableCell align="right">Earnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.work_id}>
                      <TableCell>{record.work_date}</TableCell>
                      <TableCell>{record.operation_name || "—"}</TableCell>
                      <TableCell align="right">
                        {formatQuantity(record.quantity_completed)}
                      </TableCell>
                      <TableCell align="right">
                        {formatQuantity(record.quantity_accepted)}
                      </TableCell>
                      <TableCell align="right">
                        {formatMoney(record.rate_per_piece)}
                      </TableCell>
                      <TableCell align="right">
                        {formatMoney(record.calculated_earnings)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No approved work records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 4 }}
            >
              This statement summarizes approved piece-rate earnings for the
              selected period. It does not confirm that payment has been made.
            </Typography>
          </Paper>
        </Box>
      )}

      <style>
        {`
          @media print {
            @page { size: auto; margin: 12mm; }
            body { background: #fff !important; }
            body * { visibility: hidden; }
            #employee-payroll-statement,
            #employee-payroll-statement * {
              visibility: visible;
            }
            #employee-payroll-statement {
              position: absolute;
              inset: 0 auto auto 0;
              width: 100%;
              max-width: none;
            }
            .statement-actions {
              display: none !important;
            }
            #employee-payroll-statement .MuiPaper-root {
              border: none !important;
              box-shadow: none !important;
            }
            #employee-payroll-statement .MuiTableContainer-root {
              overflow: visible !important;
            }
            #employee-payroll-statement table {
              min-width: 0 !important;
              width: 100%;
            }
            #employee-payroll-statement tr {
              break-inside: avoid;
            }
          }
        `}
      </style>
    </Box>
  );
}
