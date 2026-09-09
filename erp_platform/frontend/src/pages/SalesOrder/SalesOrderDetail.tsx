import { useEffect, useState } from "react";
import {useNavigate, useParams } from "react-router-dom";

import {
  Autocomplete,
  Box,
  Chip,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

<<<<<<< HEAD
import {
  fetchSalesOrder,
  createSalesOrderItem,
  deleteSalesOrderItem,
  fetchSalesProducts,
  updateSalesOrderItem,
  updateSalesOrder,
  fetchSalesCustomers,
  type SalesOrder,
  type SalesOrderItem,
  type SalesProduct,
  type SalesCustomer,
} from "../../services/sales";

=======
import { fetchSalesOrder ,
	createSalesOrderItem,
	deleteSalesOrder,
 	deleteSalesOrderItem,
	approveSalesOrder,
  	fetchSalesProducts,
	updateSalesOrderItem,
	updateSalesOrder,
	type SalesProduct,
	fetchSalesCustomers,
	type SalesCustomer,
} from "../../services/sales";

type SalesOrderItem = {
  id: string;
  product_id: string | null;

  sku: string | null;
  style_code: string | null;
  product_name: string | null;
  color: string | null;
  size: string | null;

  quantity: number;
  unit_price: number;
  line_total: number;
};


type SalesOrder = {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  total_amount: number;

  customer_id: string;
  customer_name: string | null;

  items: SalesOrderItem[];
};

>>>>>>> 9bef274 (Notification changes added in this commit)
export default function SalesOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [selectedProduct, setSelectedProduct] =
  useState<SalesProduct | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editUnitPrice, setEditUnitPrice] = useState(0);
  const [editingHeader, setEditingHeader] = useState(false);

  const [editCustomerId, setEditCustomerId] = useState("");
  const [editOrderDate, setEditOrderDate] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [customers, setCustomers] = useState<SalesCustomer[]>([]);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        return;
      }

      try {
        setLoading(true);

        const data = await fetchSalesOrder(orderId);

        setOrder(data);
      } catch (error) {
        console.error(
          "Failed to load sales order:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [orderId]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchSalesProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    }

    void loadProducts();
  }, []);

  useEffect(() => {
  async function loadCustomers() {
    try {
      const data = await fetchSalesCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  }

  void loadCustomers();
}, []);

  if (loading) {
    return (
      <Typography>
        Loading sales order...
      </Typography>
    );
  }

  if (!order) {
    return (
      <Typography>
        Sales order not found.
      </Typography>
    );
  }

const handleApproveOrder = async () => {
  if (!orderId || !order) {
    return;
  }

  if (order.status !== "CONFIRMED") {
    return;
  }

  const confirmed = window.confirm(
    `Approve sales order ${order.order_number}?\n\n` +
      "Available stock will be reserved and shortages will be sent to production."
  );

  if (!confirmed) {
    return;
  }

  try {
    await approveSalesOrder(orderId);

    const refreshedOrder =
      await fetchSalesOrder(orderId);

    setOrder(refreshedOrder);

    const refreshedAvailability =
      await fetchSalesOrderAvailability(orderId);

    setAvailability(refreshedAvailability);
  } catch (error) {
    console.error(
      "Failed to approve sales order:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to approve sales order."
    );
  }
};

const handleAddItem = async () => {
  if (!orderId || !selectedProduct) {
    return;
  }

  try {
    await createSalesOrderItem(orderId, {
      product_id: selectedProduct.id,
      quantity,
      unit_price: unitPrice,
    });

    const refreshedOrder = await fetchSalesOrder(orderId);
    setOrder(refreshedOrder);

    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
  } catch (error) {
    console.error("Failed to create sales order item:", error);
  }
};

const handleEditHeader = () => {
  if (!order) {
    return;
  }

  setEditCustomerId(order.customer_id);
  setEditOrderDate(order.order_date);
//  setEditStatus(order.status);
  setEditingHeader(true);
};

const handleCancelHeaderEdit = () => {
  setEditingHeader(false);
};

const handleSaveHeader = async () => {
  if (!orderId) {
    return;
  }

  try {
    await updateSalesOrder(orderId, {
      customer_id: editCustomerId,
      order_date: editOrderDate,
      //status: editStatus,
    });

    const refreshedOrder = await fetchSalesOrder(orderId);
    setOrder(refreshedOrder);

    setEditingHeader(false);
  } catch (error) {
    console.error("Failed to update sales order:", error);
  }
};

const handleDeleteItem = async (itemId: string) => {
  if (!orderId) {
    return;
  }

  try {
    await deleteSalesOrderItem(
      orderId,
      itemId
    );

    // Reload from backend so we get the
    // database-calculated total_amount.
    const refreshedOrder =
      await fetchSalesOrder(orderId);

    setOrder(refreshedOrder);
  } catch (error) {
    console.error(
      "Failed to delete sales order item:",
      error
    );
  }
};

const handleConfirmOrder = async () => {
  if (!orderId || !order) {
    return;
  }

  if (order.items.length === 0) {
    alert("Add at least one item before confirming the order.");
    return;
  }

  try {
    await updateSalesOrder(orderId, {
      status: "CONFIRMED",
    });

    const refreshedOrder =
      await fetchSalesOrder(orderId);

    setOrder(refreshedOrder);
  } catch (error) {
    console.error(
      "Failed to confirm sales order:",
      error
    );
  }
};

const handleCancelOrder = async () => {
  if (!orderId || !order) {
    return;
  }

  if (order.status !== "CONFIRMED") {
    return;
  }

  const confirmed = window.confirm(
    `Cancel sales order ${order.order_number}?`
  );

  if (!confirmed) {
    return;
  }

  try {
    await updateSalesOrder(orderId, {
      status: "CANCELLED",
    });

    const refreshedOrder =
      await fetchSalesOrder(orderId);

    setOrder(refreshedOrder);
  } catch (error) {
    console.error(
      "Failed to cancel sales order:",
      error
    );
  }
};

const handleDeleteOrder = async () => {
  if (!orderId || !order) {
    return;
  }

  if (order.status !== "DRAFT") {
    return;
  }

  const confirmed = window.confirm(
    `Delete sales order ${order.order_number}?\n\n` +
      "This will permanently delete this draft and its items."
  );

  if (!confirmed) {
    return;
  }

  try {
    await deleteSalesOrder(orderId);

    navigate("/sales");
  } catch (error) {
    console.error(
      "Failed to delete sales order:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to delete sales order."
    );
  }
};

const handleEditItem = (item: SalesOrderItem) => {
  setEditingItemId(item.id);
  setEditQuantity(Number(item.quantity));
  setEditUnitPrice(Number(item.unit_price));
};

const handleCancelEdit = () => {
  setEditingItemId(null);
};

const handleSaveItem = async (itemId: string) => {
  if (!orderId) {
    return;
  }

  try {
    await updateSalesOrderItem(
      orderId,
      itemId,
      {
        quantity: editQuantity,
        unit_price: editUnitPrice,
      }
    );

    const refreshedOrder = await fetchSalesOrder(orderId);
    setOrder(refreshedOrder);

    setEditingItemId(null);
  } catch (error) {
    console.error("Failed to update sales order item:", error);
  }
};


  return (
    <Box>
      {/* ORDER HEADER */}

      <Typography variant="h4" sx={{ mb: 3 }}>
        Sales Order {order.order_number}
      </Typography>
{order.status === "DRAFT" && (
      <Paper sx={{ p: 3, mb: 3 }}>
  <Typography variant="h6" sx={{ mb: 2 }}>
    Add Item
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
      options={products}
      value={selectedProduct}
      onChange={(_, value) => {
        setSelectedProduct(value);

        if (value) {
          setUnitPrice(Number(value.selling_price ?? 0));
        }
      }}
      getOptionLabel={(product) =>
        [
          product.sku,
          product.product_name,
          product.color,
          product.size,
        ]
          .filter(Boolean)
          .join(" | ")
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Product"
        />
      )}
    />

    <TextField
      label="Quantity"
      type="number"
      value={quantity}
      onChange={(e) =>
        setQuantity(Number(e.target.value))
      }
      slotProps={{
        htmlInput: {
          min: 1,
        },
      }}
    />

    <TextField
      label="Unit Price"
      type="number"
      value={unitPrice}
      onChange={(e) =>
        setUnitPrice(Number(e.target.value))
      }
      slotProps={{
        htmlInput: {
          min: 0,
        },
      }}
    />

    <Button
      variant="contained"
      onClick={handleAddItem}
      disabled={
        !selectedProduct ||
        quantity <= 0 ||
        unitPrice < 0
      }
    >
      Add Item
    </Button>
  </Box>
</Paper>
)}
<Paper sx={{ p: 3, mb: 3 }}>
  {editingHeader ? (
    <>
      {/* CUSTOMER */}
      <Autocomplete
        options={customers}
        value={
          customers.find(
            (customer) =>
              customer.id === editCustomerId
          ) ?? null
        }
        onChange={(_, value) => {
          setEditCustomerId(value?.id ?? "");
        }}
        getOptionLabel={(customer) => {
          const details = [
            customer.name,
            customer.phone,
            customer.email,
          ].filter(Boolean);

          return details.join(" | ");
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Customer"
          />
        )}
        sx={{ mb: 2 }}
      />

      {/* ORDER DATE */}
      <TextField
        label="Order Date"
        type="date"
        value={editOrderDate}
        onChange={(e) =>
          setEditOrderDate(e.target.value)
        }
        fullWidth
        sx={{ mb: 2 }}
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
      />   

      <Button
        variant="contained"
        onClick={handleSaveHeader}
        disabled={!editCustomerId}
        sx={{ mr: 1 }}
      >
        Save
      </Button>

      <Button
        onClick={handleCancelHeaderEdit}
      >
        Cancel
      </Button>
    </>
  ) : (
    <>
      <Typography>
        <strong>Customer:</strong>{" "}
        {order.customer_name ?? "-"}
      </Typography>

      <Typography>
        <strong>Date:</strong>{" "}
        {order.order_date}
      </Typography>

      <Box sx={{ mt: 1, mb: 2 }}>
        <strong>Status:</strong>{" "}

        <Chip
          label={order.status}
          size="small"
        />
      </Box>
{order.status === "DRAFT" && (
      <Button
        variant="outlined"
        onClick={handleEditHeader}
      >
        Edit Header
      </Button>
)}
    </>
  )}
{order.status === "DRAFT" && (
  <Button
    variant="contained"
    onClick={handleConfirmOrder}
    disabled={order.items.length === 0}
    sx={{ ml: 1 }}
  >
    Confirm Order
  </Button>
)}
{order.status === "DRAFT" && (
  <Button
    variant="outlined"
    color="error"
    onClick={handleDeleteOrder}
    sx={{ ml: 1 }}
  >
    Delete Draft
  </Button>
)}
{order.status === "CONFIRMED" && (
  <Button
    variant="outlined"
    color="error"
    onClick={handleCancelOrder}
    sx={{ ml: 1 }}
  >
    Cancel Order
  </Button>
)}

{order.status === "CONFIRMED" && (
  <Button
    variant="contained"
    onClick={handleApproveOrder}
    sx={{ ml: 1 }}
  >
    Approve Order
  </Button>
)}
</Paper>

      {/* ORDER ITEMS */}

      <Typography variant="h6" sx={{ mb: 2 }}>
        Order Items
      </Typography>
      <TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>SKU</TableCell>
        <TableCell>Product</TableCell>
        <TableCell>Color</TableCell>
        <TableCell>Size</TableCell>

        <TableCell align="right">
          Quantity
        </TableCell>

        <TableCell align="right">
          Unit Price
        </TableCell>

        <TableCell align="right">
          Line Total
        </TableCell>

        <TableCell align="right">
          Actions
        </TableCell>
      </TableRow>
    </TableHead>

    <TableBody>
      {
	      //order.items.length === 0 ? (
	(order.items ?? []).length === 0 ? (
        <TableRow>
          <TableCell colSpan={8} align="center">
            No order items found.
          </TableCell>
        </TableRow>
      ) : (
        (order.items ?? []).map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              {item.sku ?? "-"}
            </TableCell>

            <TableCell>
              {item.product_name ?? "-"}
            </TableCell>

            <TableCell>
              {item.color ?? "-"}
            </TableCell>

            <TableCell>
              {item.size ?? "-"}
            </TableCell>

            {/* QUANTITY */}
            <TableCell align="right">
              {editingItemId === item.id ? (
                <TextField
                  size="small"
                  type="number"
                  value={editQuantity}
                  onChange={(e) =>
                    setEditQuantity(
                      Number(e.target.value)
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 1,
                    },
                  }}
                  sx={{ width: 90 }}
                />
              ) : (
                item.quantity
              )}
            </TableCell>

            {/* UNIT PRICE */}
            <TableCell align="right">
              {editingItemId === item.id ? (
                <TextField
                  size="small"
                  type="number"
                  value={editUnitPrice}
                  onChange={(e) =>
                    setEditUnitPrice(
                      Number(e.target.value)
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                    },
                  }}
                  sx={{ width: 120 }}
                />
              ) : (
                `₹${Number(
                  item.unit_price
                ).toLocaleString("en-IN")}`
              )}
            </TableCell>

            {/* LINE TOTAL */}
            <TableCell align="right">
              ₹
              {Number(
                item.line_total
              ).toLocaleString("en-IN")}
            </TableCell>

            {/* ACTIONS */}
<TableCell align="right">
  {editingItemId === item.id ? (
    <>
      <Button
        size="small"
        onClick={() => handleSaveItem(item.id)}
      >
        Save
      </Button>

      <Button
        size="small"
        onClick={handleCancelEdit}
      >
        Cancel
      </Button>
    </>
  ) : (
    <>
      {order.status === "DRAFT" ? (
        <>
          <Button
            size="small"
            onClick={() => handleEditItem(item)}
          >
            Edit
          </Button>

          <Button
            color="error"
            size="small"
            onClick={() => handleDeleteItem(item.id)}
          >
            Delete
          </Button>
        </>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Locked
        </Typography>
      )}
    </>
  )}
</TableCell>
          </TableRow>
        ))
      )}
      {/* DATABASE CALCULATED TOTAL */}
      <TableRow>
        <TableCell
          colSpan={6}
          align="right"
        >
          <strong>Order Total</strong>
        </TableCell>

        <TableCell align="right">
          <strong>
            ₹
            {Number(
              order.total_amount
            ).toLocaleString("en-IN")}
          </strong>
        </TableCell>

        <TableCell />
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>

    </Box>
  );
}
