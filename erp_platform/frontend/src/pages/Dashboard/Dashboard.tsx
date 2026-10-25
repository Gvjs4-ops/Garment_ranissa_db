
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FactoryIcon from "@mui/icons-material/Factory";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

import KpiCard from "../../components/dashboard/KpiCard";
import SalesTrendChart from "../../components/dashboard/SalesTrendChart";
import RecentSalesOrders from "../../components/dashboard/RecentSalesOrders";

import {
  fetchSalesOrders,
  type SalesOrder,
} from "../../services/sales";

import { apiFetch } from "../../api/apiClient";
import { API_BASE_URL } from "../../config/api";

interface Requirement {
  id: string;
  order_number: string;
  sku: string | null;
  product_name: string;
  required_quantity: number;
  produced_quantity: number;
  status: string;
}

interface Assignment {
  id: string;
  employee_name: string;
  operation_name: string;
  target_quantity: number;
  due_date: string | null;
  pay_type: string;
  agreed_rate: number;
  status: string;
  order_number?: string;
}

export default function Dashboard() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProduction, setLoadingProduction] = useState(true);
  const [productionError, setProductionError] = useState("");

  const pendingOrders = salesOrders.filter(
    (order) => order.status?.toLowerCase() === "pending",
  ).length;

  const requiredQuantity = requirements.reduce(
    (total, item) => total + Number(item.required_quantity || 0),
    0,
  );

  const producedQuantity = requirements.reduce(
    (total, item) => total + Number(item.produced_quantity || 0),
    0,
  );

  const productionProgress =
    requiredQuantity > 0
      ? Math.min(
          100,
          Math.round((producedQuantity / requiredQuantity) * 100),
        )
      : 0;

  const activeAssignments = assignments.filter(
    (item) =>
      !["completed", "cancelled", "rejected"].includes(
        item.status?.toLowerCase(),
      ),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const salesPromise = fetchSalesOrders()
        .then((data) => {
          if (!cancelled) setSalesOrders(data);
        })
        .catch((error) => {
          console.error("Failed to load sales orders:", error);
        })
        .finally(() => {
          if (!cancelled) setLoadingOrders(false);
        });

      const productionPromise = Promise.all([
        apiFetch<Requirement[]>(
          `${API_BASE_URL}/production/requirements`,
        ),
        apiFetch<Assignment[]>(
          `${API_BASE_URL}/production/assignments`,
        ),
      ])
        .then(([requirementData, assignmentData]) => {
          if (cancelled) return;

          setRequirements(requirementData);
          setAssignments(assignmentData);
          setProductionError("");
        })
        .catch((error) => {
          console.error("Failed to load production dashboard:", error);

          if (!cancelled) {
            setProductionError(
              "Production information could not be loaded. Please refresh the dashboard.",
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingProduction(false);
        });

      await Promise.all([salesPromise, productionPromise]);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Executive Dashboard
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Overview of your garment business
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Total Sales"
            value="₹12.5 L"
            subtitle="↑ 12% from last month"
            icon={TrendingUpIcon}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Sales Orders"
            value={loadingOrders ? "..." : salesOrders.length.toString()}
            subtitle={`${pendingOrders} pending orders`}
            icon={ShoppingCartIcon}
            path="/sales"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Production"
            value={loadingProduction ? "..." : `${productionProgress}%`}
            subtitle={`${activeAssignments.length} active assignments`}
            icon={FactoryIcon}
            path="/production"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Receivables"
            value="₹8.4 L"
            subtitle="12 invoices pending"
            icon={AccountBalanceWalletIcon}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <RecentSalesOrders />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Production Overview
              </Typography>

              {productionError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {productionError}
                </Alert>
              )}

              {loadingProduction ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={3}
                    sx={{ mb: 3 }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Required quantity
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {requiredQuantity.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Produced quantity
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {producedQuantity.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Active assignments
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {activeAssignments.length}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    sx={{justifyContent:"space-between",
                     mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Overall production progress
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {productionProgress}%
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={productionProgress}
                    sx={{ height: 8, borderRadius: 4, mb: 3 }}
                  />

                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Recent Production Assignments
                  </Typography>

                  {assignments.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      No production assignments have been created yet.
                    </Typography>
                  ) : (
                    <Box sx={{ overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell>Operation</TableCell>
                            <TableCell>Order</TableCell>
                            <TableCell align="right">Target Qty</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {assignments.slice(0, 5).map((assignment) => (
                            <TableRow key={assignment.id} hover>
                              <TableCell>
                                {assignment.employee_name}
                              </TableCell>
                              <TableCell>
                                {assignment.operation_name}
                              </TableCell>
                              <TableCell>
                                {assignment.order_number || "—"}
                              </TableCell>
                              <TableCell align="right">
                                {Number(
                                  assignment.target_quantity,
                                ).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {assignment.due_date || "—"}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={assignment.status.replaceAll("_", " ")}
                                  color={
                                    assignment.status.toLowerCase() === "completed"
                                      ? "success"
                                      : assignment.status.toLowerCase() === "in_progress"
                                        ? "info"
                                        : "default"
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <SalesTrendChart />
        </Grid>
      </Grid>
    </Box>
  );
}
