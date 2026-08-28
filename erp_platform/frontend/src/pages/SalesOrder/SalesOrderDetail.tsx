import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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

import { fetchSalesOrder ,
	createSalesOrderItem,
 	deleteSalesOrderItem,
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


export default function SalesOrderDetail() {
  const { orderId } = useParams();

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

    loadOrder();
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

    loadProducts();
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

  loadCustomers();
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
  setEditStatus(order.status);
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
      status: editStatus,
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

      {/* STATUS */}
      <TextField
        select
        label="Status"
        value={editStatus}
        onChange={(e) =>
          setEditStatus(e.target.value)
        }
        fullWidth
        sx={{ mb: 2 }}
        slotProps={{
          select: {
            native: true,
          },
        }}
      >
        <option value="DRAFT">
          DRAFT
        </option>

        <option value="CONFIRMED">
          CONFIRMED
        </option>

        <option value="APPROVED">
          APPROVED
        </option>

        <option value="CANCELLED">
          CANCELLED
        </option>
      </TextField>

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

      <Button
        variant="outlined"
        onClick={handleEditHeader}
      >
        Edit Header
      </Button>
    </>
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
      {order.items.length === 0 ? (
        <TableRow>
          <TableCell colSpan={8} align="center">
            No order items found.
          </TableCell>
        </TableRow>
      ) : (
        order.items.map((item) => (
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
                    onClick={() =>
                      handleSaveItem(item.id)
                    }
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
                  <Button
                    size="small"
                    onClick={() =>
                      handleEditItem(item)
                    }
                  >
                    Edit
                  </Button>

                  <Button
                    color="error"
                    size="small"
                    onClick={() =>
                      handleDeleteItem(item.id)
                    }
                  >
                    Delete
                  </Button>
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
