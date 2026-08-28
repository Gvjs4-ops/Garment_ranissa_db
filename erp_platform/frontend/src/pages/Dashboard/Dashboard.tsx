import {
  Box,
  Grid,
  Typography,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FactoryIcon from "@mui/icons-material/Factory";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

import KpiCard from "../../components/dashboard/KpiCard";
import SalesTrendChart from "../../components/dashboard/SalesTrendChart";
import ProductionStatus from "../../components/dashboard/ProductionStatus";
import RecentSalesOrders from "../../components/dashboard/RecentSalesOrders";
import { useEffect, useState } from "react";

import {
  fetchSalesOrders,
  type SalesOrder,
} from "../../services/sales";

export default function Dashboard() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const pendingOrders = salesOrders.filter(
  (order) => order.status?.toLowerCase() === "pending"
  ).length;

  useEffect(() => {
  async function loadSalesOrders() {
    try {
      const data = await fetchSalesOrders();
      setSalesOrders(data);
    } catch (error) {
      console.error("Failed to load sales orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  }
  loadSalesOrders();
  }, []);
  return (
    <Box>
      {/* Dashboard Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Executive Dashboard
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          mt={0.5}
        >
          Overview of your garment business
        </Typography>
      </Box>

      {/* KPI Cards */}
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
	    path ="/sales"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Production"
            value="72%"
            subtitle="Overall production progress"
            icon={FactoryIcon}
          />
        </Grid>
	<Grid container spacing={3} sx={{ mt: 0 }}>
  	  <Grid size={{ xs: 12 }}>
    	  <RecentSalesOrders />
  	  </Grid>
	</Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Receivables"
            value="₹8.4 L"
            subtitle="12 invoices pending"
            icon={AccountBalanceWalletIcon}
          />
        </Grid>
	<Grid container spacing={3} sx={{ mt: 0 }}>
  	  <Grid size={{ xs: 12, md: 6 }}>
    	    <ProductionStatus />
  	  </Grid>

  	  <Grid size={{ xs: 12, md: 6 }}>
    	    <SalesTrendChart />
  	  </Grid>
        </Grid>
	</Grid>
    </Box>
  );
}
