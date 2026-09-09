import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export interface StockMovement {
  id: string;
  transaction_type:
    | "RECEIPT"
    | "ISSUE"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT"
    | "RETURN";

  quantity: number;
  notes: string | null;
  created_at: string;
}

interface StockMovementHistoryDialogProps {
  open: boolean;
  productName: string;
  movements: StockMovement[];
  onClose: () => void;
}

export default function StockMovementHistoryDialog({
  open,
  productName,
  movements,
  onClose,
}: StockMovementHistoryDialogProps) {
  const getMovementLabel = (
    type: StockMovement["transaction_type"]
  ) => {
    switch (type) {
      case "RECEIPT":
        return "Received";

      case "ADJUSTMENT_IN":
        return "Stock Increased";

      case "ADJUSTMENT_OUT":
        return "Stock Reduced";

      case "ISSUE":
        return "Issued";

      case "RETURN":
        return "Returned";

      default:
        return type;
    }
  };

  const getMovementColor = (
    type: StockMovement["transaction_type"]
  ): "success" | "error" | "warning" | "info" | "default" => {
    if (
      type === "RECEIPT" ||
      type === "ADJUSTMENT_IN" ||
      type === "RETURN"
    ) {
      return "success";
    }

    if (
      type === "ADJUSTMENT_OUT" ||
      type === "ISSUE"
    ) {
      return "error";
    }

    return "default";
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("en-IN");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Typography variant="h6" fontWeight={700}>
            Stock Movement History
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {productName}
          </Typography>
        </div>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Movement</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {movements.length > 0 ? (
              movements.map((movement) => (
                <TableRow
                  key={movement.id}
                  hover
                >
                  <TableCell>
                    {formatDate(movement.created_at)}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={getMovementLabel(
                        movement.transaction_type
                      )}
                      color={getMovementColor(
                        movement.transaction_type
                      )}
                    />
                  </TableCell>

                  <TableCell align="right">
                    {Number(
                      movement.quantity
                    ).toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell>
                    {movement.notes || "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                >
                  No stock movements found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
