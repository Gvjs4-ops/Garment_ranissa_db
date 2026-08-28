import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const salesData = [
  { month: "Jan", sales: 820000 },
  { month: "Feb", sales: 950000 },
  { month: "Mar", sales: 1100000 },
  { month: "Apr", sales: 980000 },
  { month: "May", sales: 1250000 },
  { month: "Jun", sales: 1380000 },
];

function formatCurrency(value: number) {
  return `₹${(value / 100000).toFixed(1)}L`;
}

export default function SalesTrendChart() {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Sales Trend
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Monthly sales performance
          </Typography>
        </Box>

        <Box sx={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis
                tickFormatter={formatCurrency}
              />

              <Tooltip
                formatter={(value) =>
                  typeof value === "number"
                    ? [`₹${value.toLocaleString("en-IN")}`, "Sales"]
                    : [value, "Sales"]
                }
              />

              <Line
                type="monotone"
                dataKey="sales"
                stroke="#1976D2"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
