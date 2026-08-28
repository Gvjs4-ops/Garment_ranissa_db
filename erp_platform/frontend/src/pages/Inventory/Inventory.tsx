import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

import ReceiveStockDialog from "./ReceiveStockDialog";
import type {
  ReceiveStockInput,
  StockProduct,
  Warehouse,
} from "./ReceiveStockDialog";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";

import EditStockDialog from "./EditStockDialog";
import type {
  EditableInventoryItem,
  EditStockInput,
} from "./EditStockDialog";
import { fetchProducts } from "../../api/products";
interface InventoryItem {
  id: string;
  product_id: string;
  sku: string | null;
  style_code: string | null;
  product_name: string;
  color: string | null;
  size: string | null;
  unit: string;

  warehouse_id: string;
  warehouse_name: string;

  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_level: number;

  stock_status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] =
  useState<EditableInventoryItem | null>(null);

const loadInventory = async () => {
  try {
    const response = await fetch("/api/inventory");

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.status}`);
    }

    const data = await response.json();
    setInventory(data);
  } catch (error) {
    console.error("Failed to load inventory:", error);
  }
};

const loadProducts = async () => {
  try {
    const data = await fetchProducts();

    setProducts(
      data.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        color: product.color,
        size: product.size,
      }))
    );
  } catch (error) {
    console.error("Failed to load products:", error);
  }
};

const loadWarehouses = async () => {
  try {
    const response = await fetch("/api/inventory/warehouses");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch warehouses: ${response.status}`
      );
    }

    const data = await response.json();
    setWarehouses(data);
  } catch (error) {
    console.error("Failed to load warehouses:", error);
  }
};

useEffect(() => {
  loadInventory();
  loadProducts();
  loadWarehouses();
}, []);

  const filteredInventory = inventory.filter((item) => {
    const value = search.toLowerCase();

    return (
      item.product_name.toLowerCase().includes(value) ||
      item.sku?.toLowerCase().includes(value) ||
      item.style_code?.toLowerCase().includes(value) ||
      item.warehouse_name.toLowerCase().includes(value)
    );
  });

  const getStatusColor = (
    status: InventoryItem["stock_status"]
  ): "success" | "warning" | "error" => {
    if (status === "OUT_OF_STOCK") {
      return "error";
    }

    if (status === "LOW_STOCK") {
      return "warning";
    }

    return "success";
  };

  const getStatusLabel = (status: InventoryItem["stock_status"]) => {
    if (status === "OUT_OF_STOCK") {
      return "Out of Stock";
    }

    if (status === "LOW_STOCK") {
      return "Low Stock";
    }

    return "In Stock";
  };

  const handleReceiveStock = async (
  receipt: ReceiveStockInput) => {
  const response = await fetch("/api/inventory/receive", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(receipt),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Failed to receive stock: ${response.status}`
    );
  }

  await loadInventory();
};

const handleEditStock = (item: InventoryItem) => {
  setSelectedInventoryItem({
    id: item.id,
    product_name: item.product_name,
    warehouse_name: item.warehouse_name,
    quantity_on_hand: Number(item.quantity_on_hand),
    reorder_level: Number(item.reorder_level),
    unit: item.unit,
  });

  setEditDialogOpen(true);
};

const handleUpdateStock = async (
  inventoryId: string,
  update: EditStockInput
) => {
  const response = await fetch(`/api/inventory/${inventoryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Failed to update stock: ${response.status}`
    );
  }

  await loadInventory();
};

  return (
    <Box>
      <Stack
	direction={{ xs: "column", sm: "row" }}
	justifyContent="space-between"
	alignItems={{ xs: "flex-start", sm: "center" }}
	spacing={2}
	mb={3}
      >
      <Box>
	<Typography variant="h4" fontWeight={700}>
          Inventory
        </Typography>

    	<Typography variant="body2" color="text.secondary">
	  View current stock levels across products and warehouses.
	</Typography>
      </Box>

	<Button
	  variant="contained"
	  startIcon={<AddIcon />}
	  onClick={() => setReceiveDialogOpen(true)}
	>
	  Receive Stock
	</Button>
      </Stack>
      
      <Card>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by product, SKU, style code or warehouse"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ mb: 3 }}
          />

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Style Code</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell align="right">On Hand</TableCell>
                <TableCell align="right">Reserved</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Reorder Level</TableCell>
                <TableCell>Status</TableCell>
		<TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.sku || "—"}</TableCell>

                    <TableCell>{item.style_code || "—"}</TableCell>

                    <TableCell>
                      <Typography fontWeight={600}>
                        {item.product_name}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {[item.color, item.size]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>{item.warehouse_name}</TableCell>

                    <TableCell align="right">
                      {Number(item.quantity_on_hand).toLocaleString("en-IN")}{" "}
                      {item.unit}
                    </TableCell>

                    <TableCell align="right">
                      {Number(item.quantity_reserved).toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell align="right">
                      <Typography fontWeight={700}>
                        {Number(item.quantity_available).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      {Number(item.reorder_level).toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={getStatusLabel(item.stock_status)}
                        color={getStatusColor(item.stock_status)}
                      />
                    </TableCell>
		    <TableCell align="center">
		      <IconButton
			size="small"
			onClick={() => handleEditStock(item)}
	              >
		        <EditIcon fontSize="small" />
 		      </IconButton>
		    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No inventory records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ReceiveStockDialog
	open={receiveDialogOpen}
	products={products}
	warehouses={warehouses}
	onClose={() => setReceiveDialogOpen(false)}
	onSave={handleReceiveStock}
      />
      <EditStockDialog
	  open={editDialogOpen}
	  item={selectedInventoryItem}
	  onClose={() => {
	    setEditDialogOpen(false);
	    setSelectedInventoryItem(null);
	  }}
	  onSave={handleUpdateStock}
	/>
    </Box>
  );
}
