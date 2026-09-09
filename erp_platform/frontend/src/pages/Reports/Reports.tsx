import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface RecentOrder {
  id: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  status: string;
  total_amount: number;
}

interface TopProduct {
  product_id: string;
  sku: string | null;
  product_name: string;
  quantity_sold: number;
  sales_amount: number;
}

interface LowStockItem {
  inventory_id: string;
  sku: string | null;
  product_name: string;
  warehouse_name: string;
  quantity_available: number;
  reorder_level: number;
}

interface ReportsSummary {
  total_sales: number;
  total_orders: number;
  total_products: number;
  total_inventory: number;
  low_stock_count: number;
  recent_orders: RecentOrder[];
  top_products: TopProduct[];
  low_stock_items: LowStockItem[];
}

const emptySummary: ReportsSummary = {
  total_sales: 0,
  total_orders: 0,
  total_products: 0,
  total_inventory: 0,
  low_stock_count: 0,
  recent_orders: [],
  top_products: [],
  low_stock_items: [],
};

export default function Reports() {
  const [summary, setSummary] = useState<ReportsSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/reports/summary");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch reports: ${response.status}`
        );
      }

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatNumber = (value: number) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  const getOrderStatusColor = (
    status: string
  ):
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "error"
    | "info" => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
      case "DELIVERED":
        return "success";

      case "CONFIRMED":
      case "APPROVED":
        return "primary";

      case "CANCELLED":
      case "REJECTED":
        return "error";

      case "DRAFT":
        return "default";

      default:
        return "warning";
    }
  };

  return (
    <Box>
      <Stack spacing={0.5} mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Reports
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Business overview across sales, products and inventory.
        </Typography>
      </Stack>

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Sales
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                mt={1}
              >
                {loading
                  ? "..."
                  : formatCurrency(summary.total_sales)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Orders
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                mt={1}
              >
                {loading
                  ? "..."
                  : formatNumber(summary.total_orders)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Products
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                mt={1}
              >
                {loading
                  ? "..."
                  : formatNumber(summary.total_products)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Inventory
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                mt={1}
              >
                {loading
                  ? "..."
                  : formatNumber(summary.total_inventory)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Low Stock
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                mt={1}
              >
                {loading
                  ? "..."
                  : formatNumber(summary.low_stock_count)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Recent Orders
              </Typography>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {summary.recent_orders.length > 0 ? (
                    summary.recent_orders.map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          {order.order_number}
                        </TableCell>

                        <TableCell>
                          {new Date(
                            order.order_date
                          ).toLocaleDateString("en-IN")}
                        </TableCell>

                        <TableCell>
                          {order.customer_name || "—"}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={order.status}
                            color={getOrderStatusColor(
                              order.status
                            )}
                          />
                        </TableCell>

                        <TableCell align="right">
                          {formatCurrency(
                            order.total_amount
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                      >
                        No recent orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Top Products
              </Typography>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Sales</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {summary.top_products.length > 0 ? (
                    summary.top_products.map((product) => (
                      <TableRow
                        key={product.product_id}
                        hover
                      >
                        <TableCell>
                          <Typography fontWeight={600}>
                            {product.product_name}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {product.sku || "No SKU"}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(
                            product.quantity_sold
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {formatCurrency(
                            product.sales_amount
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align="center"
                      >
                        No sales data found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Low Stock Items
              </Typography>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell align="right">
                      Available
                    </TableCell>
                    <TableCell align="right">
                      Reorder Level
                    </TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {summary.low_stock_items.length > 0 ? (
                    summary.low_stock_items.map((item) => (
                      <TableRow
                        key={item.inventory_id}
                        hover
                      >
                        <TableCell>
                          {item.sku || "—"}
                        </TableCell>

                        <TableCell>
                          {item.product_name}
                        </TableCell>

                        <TableCell>
                          {item.warehouse_name}
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(
                            item.quantity_available
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(
                            item.reorder_level
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              Number(
                                item.quantity_available
                              ) <= 0
                                ? "Out of Stock"
                                : "Low Stock"
                            }
                            color={
                              Number(
                                item.quantity_available
                              ) <= 0
                                ? "error"
                                : "warning"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                      >
                        No low stock items.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
