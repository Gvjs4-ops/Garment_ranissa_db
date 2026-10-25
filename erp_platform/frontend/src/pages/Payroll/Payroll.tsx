import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

import {
  fetchEmployeeEarnings,
  fetchPayrollDetails,
  type EmployeeEarning,
  type PayrollWorkRecord,
} from "../../services/payroll";

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card sx={{ height: "100%", borderRadius: 2 }}>
      <CardContent>
<Stack
  direction="row"
  spacing={2}
sx={{
  justifyContent:"space-between",
  alignItems:"flex-start"}}
>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>

            <Typography variant="h5" sx={{fontWeight:700, mt: 1 }}>
              {value}
            </Typography>

            <Typography
              color="text.secondary"
              variant="caption"
              sx={{ display: "block", mt: 1 }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              color: "primary.main",
              bgcolor: "action.hover",
              borderRadius: 2,
              p: 1.25,
              display: "flex",
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Payroll() {
const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  );

  const [startDate, setStartDate] = useState(
    localDateString(monthStart),
  );
  const [endDate, setEndDate] = useState(localDateString(today));

  const [employees, setEmployees] = useState<EmployeeEarning[]>([]);
  const [records, setRecords] = useState<PayrollWorkRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayroll = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [earningsResponse, detailsResponse] = await Promise.all([
        fetchEmployeeEarnings(startDate, endDate),
        fetchPayrollDetails(
          startDate,
          endDate,
          selectedEmployee || undefined,
        ),
      ]);

      setEmployees(earningsResponse.employees);
      setRecords(detailsResponse.records);
    } catch (err) {
      setEmployees([]);
      setRecords([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payroll data.",
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedEmployee]);

  useEffect(() => {
    void loadPayroll();
  }, [loadPayroll]);

  const totalEarnings = employees.reduce(
    (total, employee) =>
      total + (Number(employee.total_earnings) || 0),
    0,
  );

  const totalPieces = employees.reduce(
    (total, employee) =>
      total + (Number(employee.total_approved_pieces) || 0),
    0,
  );

  const totalRecords = employees.reduce(
    (total, employee) =>
      total + (Number(employee.approved_work_records) || 0),
    0,
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
   <Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
sx={{  
justifyContent:"space-between",
  alignItems:{ xs: "flex-start", sm: "center" },
   mb: 3 }}
>
        <Box>
          <Typography variant="h4" sx={{fontWeight:700}}>
            Payroll
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Approved piece-rate earnings and work records
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshOutlinedIcon />}
          onClick={() => void loadPayroll()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 3, borderRadius: 2 }}
      >
<Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
sx={{
  alignItems:{ xs: "stretch", sm: "center" } }}
>
          <TextField
            label="Start date"
            type="date"
            size="small"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="End date"
            type="date"
            size="small"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Button
            variant="contained"
            onClick={() => void loadPayroll()}
            disabled={loading}
          >
            Apply filters
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography sx={{fontWeight:600}}>
            Could not load payroll
          </Typography>
          {error}
          {error.includes("403") ||
          error.toLowerCase().includes("forbidden") ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Your backend is denying this request. Check the
              authentication dependency, user role, and company access
              before using live payroll data.
            </Typography>
          ) : null}
        </Alert>
      )}

      {loading && (
  <Stack
    direction="row"
    spacing={1.5}
    sx={{ alignItems:"center",
    mb: 3 }}
  >
          <CircularProgress size={22} />
          <Typography color="text.secondary">
            Loading payroll data...
          </Typography>
        </Stack>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Total piece-rate earnings"
            value={formatMoney(totalEarnings)}
            subtitle="Approved work only"
            icon={<PaymentsOutlinedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Approved pieces"
            value={formatQuantity(totalPieces)}
            subtitle="Accepted quantities"
            icon={<PrecisionManufacturingOutlinedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Employees with earnings"
            value={String(employees.length)}
            subtitle="In the selected period"
            icon={<GroupsOutlinedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Approved work records"
            value={String(totalRecords)}
            subtitle="Piece-rate submissions"
            icon={<FactCheckOutlinedIcon />}
          />
        </Grid>
      </Grid>

      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 3, borderRadius: 2 }}
      >
        <Typography variant="h6" sx={{fontWeight:700, mb: 2 }}>
          Employee earnings
        </Typography>

        <TableContainer sx={{ maxWidth: "100%", overflowX: "auto" }}>
          <Table size="small" stickyHeader sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell align="right">Approved records</TableCell>
                <TableCell align="right">Approved pieces</TableCell>
                <TableCell align="right">Total earnings</TableCell>
                <TableCell align="right">Details</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!loading && employees.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No approved piece-rate earnings found for this period.
                  </TableCell>
                </TableRow>
              )}

              {employees.map((employee) => (
                <TableRow key={employee.employee_id} hover>
                  <TableCell>{employee.employee_name}</TableCell>
                  <TableCell align="right">
                    {employee.approved_work_records}
                  </TableCell>
                  <TableCell align="right">
                    {formatQuantity(employee.total_approved_pieces)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{fontWeight:600}}>
                      {formatMoney(employee.total_earnings)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                     onClick={() => {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  navigate(
    `/payroll/employees/${encodeURIComponent(
      employee.employee_id,
    )}/statement?${params.toString()}`,
  );
}}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && employees.length > 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography sx={{fontWeight:700}}>Total</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{fontWeight:700}}>
                      {formatMoney(totalEarnings)}
                    </Typography>
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper
        variant="outlined"
        sx={{ p: 2, borderRadius: 2 }}
      >
<Stack
  direction="row"
  spacing={1}
  sx={{alignItems:"center"}}
>
  <TextField
    select
    size="small"
    label="Filter employee"
    value={selectedEmployee}
    onChange={(event) => setSelectedEmployee(event.target.value)}
    sx={{ minWidth: 220 }}
  >
    <MenuItem value="">All employees</MenuItem>

    {employees.map((employee) => (
      <MenuItem
        key={employee.employee_id}
        value={employee.employee_id}
      >
        {employee.employee_name}
      </MenuItem>
    ))}
  </TextField>

  {selectedEmployee && (
    <Button
      variant="text"
      onClick={() => setSelectedEmployee("")}
    >
      Clear filter
    </Button>
  )}
</Stack>

        <TableContainer sx={{ maxWidth: "100%", overflowX: "auto" }}>
          <Table size="small" stickyHeader sx={{ minWidth: 950 }}>
            <TableHead>
              <TableRow>
                <TableCell>Work date</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Operation</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell align="right">Accepted</TableCell>
                <TableCell align="right">Rate / piece</TableCell>
                <TableCell align="right">Earnings</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!loading && records.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No work details to display.
                  </TableCell>
                </TableRow>
              )}

              {records.map((record) => (
                <TableRow key={record.work_id} hover>
                  <TableCell>{record.work_date}</TableCell>
                  <TableCell>{record.employee_name}</TableCell>
                  <TableCell>
                    {record.operation_name || "—"}
                  </TableCell>
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
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
