import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import {
  fetchSalesOrders,
  type SalesOrder,
} from "../../services/sales";
import { useNavigate } from "react-router-dom";

function formatCurrency(value?: number) {
  if (value === undefined || value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusColor(
  status?: string
):
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error" {
  switch (status?.toLowerCase()) {
    case "completed":
    case "confirmed":
      return "success";

    case "pending":
    case "draft":
      return "warning";

    case "cancelled":
      return "error";

    default:
      return "default";
  }
}

export default function RecentSalesOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);

        const data = await fetchSalesOrders();

        // Take the latest five for the dashboard.
        setOrders(data.slice(0, 5));
      } catch (err) {
        console.error("Failed to load recent sales orders:", err);

        setError("Unable to load sales orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);
const navigate = useNavigate();
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Recent Sales Orders
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Latest orders recorded in the ERP
          </Typography>
        </Box>

        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            py={4}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {!loading && !error && orders.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            No sales orders available.
          </Typography>
        )}

        {!loading &&
          !error &&
          orders.map((order, index) => (
            <Box key={order.id ?? order.order_no}>
              <Box
                py={1.5}
		px={1}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={2}
		  onClick={() => navigate(`/sales/orders/${order.id}`)}
  		sx={{
    		  cursor: "pointer",
    		  borderRadius: 2,
    		  transition: "background-color 0.2s ease",

    		  "&:hover": {
      		    bgcolor: "action.hover",
    		  },
  		}}
              >
                <Box>
                  <Typography fontWeight={600}>
                    {order.order_no}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {order.customer_name || "Customer"}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                  >
                    {formatCurrency(order.total_amount)}
                  </Typography>

                  <Chip
                    label={order.status || "Unknown"}
                    color={getStatusColor(order.status)}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Box>

              {index < orders.length - 1 && <Divider />}
            </Box>
          ))}
      </CardContent>
    </Card>
  );
}
