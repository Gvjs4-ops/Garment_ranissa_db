import {
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

import type { Product } from "../../api/products";

export interface EditProductInput {
  sku: string;
  style_code: string;
  name: string;
  fabric: string;
  color: string;
  size: string;
  fit: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  is_active: boolean;
}

interface EditProductDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (productId: string, product: EditProductInput) => Promise<void>;
}

const emptyForm: EditProductInput = {
  sku: "",
  style_code: "",
  name: "",
  fabric: "",
  color: "",
  size: "",
  fit: "",
  unit: "pcs",
  purchase_price: 0,
  selling_price: 0,
  is_active: true,
};

export default function EditProductDialog({
  open,
  product,
  onClose,
  onSave,
}: EditProductDialogProps) {
  const [form, setForm] = useState<EditProductInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) {
      setForm(emptyForm);
      return;
    }

    setForm({
      sku: product.sku ?? "",
      style_code: product.style_code ?? "",
      name: product.name ?? "",
      fabric: product.fabric ?? "",
      color: product.color ?? "",
      size: product.size ?? "",
      fit: product.fit ?? "",
      unit: product.unit ?? "pcs",
      purchase_price: Number(product.purchase_price ?? 0),
      selling_price: Number(product.selling_price ?? 0),
      is_active: product.is_active ?? true,
    });
  }, [product]);

  const handleChange = (
    field: keyof EditProductInput,
    value: string | number | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!product || !form.name.trim()) {
      return;
    }

    try {
      setSaving(true);

      await onSave(product.id, form);

      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Product</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Product Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            fullWidth
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="SKU"
              value={form.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              fullWidth
            />

            <TextField
              label="Style Code"
              value={form.style_code}
              onChange={(e) => handleChange("style_code", e.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Fabric"
              value={form.fabric}
              onChange={(e) => handleChange("fabric", e.target.value)}
              fullWidth
            />

            <TextField
              label="Color"
              value={form.color}
              onChange={(e) => handleChange("color", e.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Size"
              value={form.size}
              onChange={(e) => handleChange("size", e.target.value)}
              fullWidth
            />

            <TextField
              label="Fit"
              value={form.fit}
              onChange={(e) => handleChange("fit", e.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Purchase Price"
              type="number"
              value={form.purchase_price}
              onChange={(e) =>
                handleChange("purchase_price", Number(e.target.value))
              }
              fullWidth
            />

            <TextField
              label="Selling Price"
              type="number"
              value={form.selling_price}
              onChange={(e) =>
                handleChange("selling_price", Number(e.target.value))
              }
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Unit"
              value={form.unit}
              onChange={(e) => handleChange("unit", e.target.value)}
              fullWidth
            >
              <MenuItem value="pcs">pcs</MenuItem>
              <MenuItem value="set">set</MenuItem>
              <MenuItem value="pair">pair</MenuItem>
            </TextField>

            <TextField
              select
              label="Status"
              value={form.is_active ? "active" : "inactive"}
              onChange={(e) =>
                handleChange("is_active", e.target.value === "active")
              }
              fullWidth
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !form.name.trim() || !product}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
