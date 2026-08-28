import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCompany } from "../../contexts/CompanyContext";
import { useNavigate } from "react-router-dom";
import {
  createSalesOrder,
  fetchCustomers,
  fetchSalesOrders,
  type Company,
  type Customer,
} from "../../services/sales";

type SalesOrder = {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  total_amount: number;
  customer_name: string | null;
};

export default function SalesOrders() {
  const { activeCompany } = useCompany();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

const [customers, setCustomers] = useState<Customer[]>([]);
const [showCreateForm, setShowCreateForm] = useState(false);

const [selectedCustomer, setSelectedCustomer] =
  useState<Customer | null>(null);

const [orderDate, setOrderDate] = useState(
  new Date().toISOString().split("T")[0]
);

const [creating, setCreating] = useState(false);
  useState<Company | null>(null);

  useEffect(() => {
  async function loadCompanies() {
    try {
      const data = await fetchCompanies();

      setCompanies(data);

      if (data.length > 0) {
        setActiveCompany(data[0]);
      }
    } catch (error) {
      console.error(
        "Failed to load companies:",
        error
      );
    }
  }

  loadCompanies();
}, []);

  useEffect(() => {
  async function loadCustomers() {
    try {
      const data = await fetchCustomers();

      setCustomers(
        data.filter((customer) => customer.is_active)
      );
    } catch (error) {
      console.error(
        "Failed to load customers:",
        error
      );
    }
  }

  loadCustomers();
}, []);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await fetchSalesOrders();
        setOrders(data);
      } catch (error) {
        console.error("Failed to load sales orders:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const handleCreateOrder = async () => {
  if (!activeCompany || !selectedCustomer || !orderDate) {
    return;
  }

  try {
    setCreating(true);

    const newOrder = await createSalesOrder({
      company_id: string,
      customer_id: selectedCustomer.id,
      order_date: orderDate,
    });

    setSelectedCustomer(null);
    setShowCreateForm(false);

    navigate(`/sales/orders/${newOrder.id}`);
  } catch (error) {
    console.error(
      "Failed to create sales order:",
      error
    );
  } finally {
    setCreating(false);
  }
};

  return (
    <Box>

    <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 3,
  }}
>
  <Typography variant="h4">
    Sales Orders
  </Typography>

  <Button
    variant="contained"
    onClick={() =>
      setShowCreateForm((current) => !current)
    }
  >
    {showCreateForm ? "Cancel" : "New Sales Order"}
  </Button>
</Box>

{showCreateForm && (
  <Paper sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      New Sales Order
    </Typography>

    <Box
      sx={{
        display: "flex",
        gap: 2,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <Autocomplete
        sx={{ minWidth: 350 }}
        options={customers}
        value={selectedCustomer}
        onChange={(_, value) =>
          setSelectedCustomer(value)
        }
        getOptionLabel={(customer) => {
          const details = [
            customer.name,
            customer.phone,
            customer.gst_number,
          ].filter(Boolean);

          return details.join(" | ");
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Customer"
          />
        )}
      />

      <TextField
        label="Order Date"
        type="date"
        value={orderDate}
        onChange={(e) =>
          setOrderDate(e.target.value)
        }
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
      />

      <Button
        variant="contained"
        onClick={handleCreateOrder}
        disabled={
	  !activeCompany ||
          !selectedCustomer ||
          !orderDate ||
          creating
        }
      >
        {creating ? "Creating..." : "Create Order"}
      </Button>
    </Box>
  </Paper>
)}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order No.</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  Loading sales orders...
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
		    <Link to={`/sales/orders/${order.id}`}>
    		      {order.order_number}
		    </Link>
		  </TableCell>

                  <TableCell>
                    {order.customer_name ?? "-"}
                  </TableCell>

                  <TableCell>{order.order_date}</TableCell>

                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                    />
                  </TableCell>

                  <TableCell align="right">
                    ₹{Number(order.total_amount).toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
