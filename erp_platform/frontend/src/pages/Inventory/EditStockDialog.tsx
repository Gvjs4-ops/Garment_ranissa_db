import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export interface EditableInventoryItem {
  id: string;
  product_name: string;
  warehouse_name: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit: string;
}

export interface EditStockInput {
  quantity_on_hand: number;
  reorder_level: number;
  notes: string;
}

interface EditStockDialogProps {
  open: boolean;
  item: EditableInventoryItem | null;
  onClose: () => void;
  onSave: (
    inventoryId: string,
    update: EditStockInput
  ) => Promise<void>;
}

const initialForm: EditStockInput = {
  quantity_on_hand: 0,
  reorder_level: 0,
  notes: "",
};

export default function EditStockDialog({
  open,
  item,
  onClose,
  onSave,
}: EditStockDialogProps) {
  const [form, setForm] = useState<EditStockInput>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && item) {
      setForm({
        quantity_on_hand: Number(item.quantity_on_hand),
        reorder_level: Number(item.reorder_level),
        notes: "",
      });

      setError("");
    }
  }, [open, item]);

  const handleSave = async () => {
    if (!item) {
      return;
    }

    setError("");

    if (form.quantity_on_hand < 0) {
      setError("Stock quantity cannot be negative.");
      return;
    }

    if (form.reorder_level < 0) {
      setError("Reorder level cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      await onSave(item.id, form);

      onClose();
    } catch (error) {
      console.error("Failed to update stock:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update stock."
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
      <DialogTitle>Edit Stock</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {item && (
            <>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Product
                </Typography>

                <Typography fontWeight={600}>
                  {item.product_name}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Warehouse
                </Typography>

                <Typography fontWeight={600}>
                  {item.warehouse_name}
                </Typography>
              </Stack>
            </>
          )}

          <TextField
            label="Stock On Hand"
            type="number"
            value={form.quantity_on_hand}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                quantity_on_hand: Number(e.target.value),
              }))
            }
            inputProps={{ min: 0 }}
            fullWidth
          />

          <TextField
            label="Reorder Level"
            type="number"
            value={form.reorder_level}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                reorder_level: Number(e.target.value),
              }))
            }
            inputProps={{ min: 0 }}
            fullWidth
          />

          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            placeholder="Example: Physical stock correction"
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
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
