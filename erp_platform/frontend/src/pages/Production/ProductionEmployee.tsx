
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { apiFetch } from "../../api/apiClient";
import { API_BASE_URL } from "../../config/api";

interface ProductionEmployeeRecord {
  id: string;
  employee_code: string;
  full_name: string;
  department_id: string | null;
  department_name: string | null;
  designation: string | null;
  salary_type: string;
  daily_rate: number | null;
  is_tailor: boolean;
  is_active: boolean;
}

interface Props {
  refreshKey?: number;
}

function formatRate(value: number | null | undefined) {
  if (value == null) return "—";

  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ProductionEmployee({
  refreshKey = 0,
}: Props) {
  const [employees, setEmployees] = useState<
    ProductionEmployeeRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiFetch<ProductionEmployeeRecord[]>(
        `${API_BASE_URL}/production/employees`
      );

      setEmployees(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load production employees."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees, refreshKey]);

  return (
    <Card variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Production Employees
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {employees.length} active employee
              {employees.length === 1 ? "" : "s"} available for assignments
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadEmployees()}
            disabled={loading}
          >
            Refresh Employees
          </Button>
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void loadEmployees()}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : employees.length === 0 ? (
          <Alert severity="info">
            No active production employees were returned by the API.
            Use Add Employee above to register an employee.
          </Alert>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee Code</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Payment Type</TableCell>
                  <TableCell align="right">Daily Rate</TableCell>
                  <TableCell>Tailor</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{fontWeight:600}}>
                        {employee.employee_code}
                      </Typography>
                    </TableCell>

                    <TableCell>{employee.full_name}</TableCell>

                    <TableCell>
                      {employee.department_name || "—"}
                    </TableCell>

                    <TableCell>
                      {employee.designation || "—"}
                    </TableCell>

                    <TableCell>
                      {employee.salary_type === "daily"
                        ? "Daily wage"
                        : "Piece rate"}
                    </TableCell>

                    <TableCell align="right">
                      {employee.salary_type === "daily"
                        ? formatRate(employee.daily_rate)
                        : "—"}
                    </TableCell>

                    <TableCell>
                      {employee.is_tailor ? "Yes" : "No"}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={employee.is_active ? "Active" : "Inactive"}
                        color={employee.is_active ? "success" : "default"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
