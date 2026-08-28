import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

export interface StockProduct {
  id: string;
  sku: string | null;
  name: string;
  color: string | null;
  size: string | null;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface ReceiveStockInput {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reorder_level: number;
  notes: string;
}

interface ReceiveStockDialogProps {
  open: boolean;
  products: StockProduct[];
  warehouses: Warehouse[];
  onClose: () => void;
  onSave: (receipt: ReceiveStockInput) => Promise<void>;
}

const initialForm: ReceiveStockInput = {
  product_id: "",
  warehouse_id: "",
  quantity: 1,
  reorder_level: 0,
  notes: "",
};

export default function ReceiveStockDialog({
  open,
  products,
  warehouses,
  onClose,
  onSave,
}: ReceiveStockDialogProps) {
  const [form, setForm] = useState<ReceiveStockInput>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError("");
    }
  }, [open]);

  const handleChange = (
    field: keyof ReceiveStockInput,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setError("");

    if (!form.product_id) {
      setError("Please select a product.");
      return;
    }

    if (!form.warehouse_id) {
      setError("Please select a warehouse.");
      return;
    }

    if (form.quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (form.reorder_level < 0) {
      setError("Reorder level cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      await onSave(form);

      setForm(initialForm);
      onClose();
    } catch (error) {
      console.error("Failed to receive stock:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to receive stock."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Receive Stock</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Product"
            value={form.product_id}
            onChange={(e) =>
              handleChange("product_id", e.target.value)
            }
            fullWidth
            required
          >
            {products.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.sku || "No SKU"} — {product.name}
                {product.color ? ` / ${product.color}` : ""}
                {product.size ? ` / ${product.size}` : ""}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Warehouse"
            value={form.warehouse_id}
            onChange={(e) =>
              handleChange("warehouse_id", e.target.value)
            }
            fullWidth
            required
          >
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </MenuItem>
            ))}
          </TextField>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <TextField
              label="Quantity Received"
              type="number"
              value={form.quantity}
              onChange={(e) =>
                handleChange("quantity", Number(e.target.value))
              }
              inputProps={{ min: 1 }}
              fullWidth
              required
            />

            <TextField
              label="Reorder Level"
              type="number"
              value={form.reorder_level}
              onChange={(e) =>
                handleChange(
                  "reorder_level",
                  Number(e.target.value)
                )
              }
              inputProps={{ min: 0 }}
              fullWidth
            />
          </Stack>

          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) =>
              handleChange("notes", e.target.value)
            }
            placeholder="Example: Opening stock / Supplier delivery"
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            saving ||
            !form.product_id ||
            !form.warehouse_id ||
            form.quantity <= 0
          }
        >
          {saving ? "Receiving..." : "Receive Stock"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
