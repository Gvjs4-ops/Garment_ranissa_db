
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { apiFetch } from "../../api/apiClient";
import { API_BASE_URL } from "../../config/api";

interface PendingWork {
  id: string;
  employee_name: string;
  operation_name: string;
  work_date: string;
  quantity_completed: number;
  quantity_accepted: number;
  rate_per_piece: number;
  pay_type: string;
  payable_units: number;
  supervisor_notes: string | null;
}

export default function WorkVerification() {
  const [rows, setRows] = useState<PendingWork[]>([]);
  const [accepted, setAccepted] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [payableUnits, setPayableUnits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<PendingWork[]>(
        `${API_BASE_URL}/production/work/pending`,
      );

      setRows(data);
      setAccepted((previous) => {
        const next = { ...previous };
        data.forEach((row) => {
          if (next[row.id] === undefined) {
            next[row.id] = String(row.quantity_completed);
          }
        });
        return next;
      });
      setPayableUnits((previous) => {
        const next = { ...previous };
        data.forEach((row) => {
          if (next[row.id] === undefined) {
            next[row.id] = String(row.payable_units || "");
          }
        });
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load pending work.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  async function reviewWork(row: PendingWork, decision: "verify" | "reject") {
    setError("");
    setMessage("");

    const quantity = Number(accepted[row.id]);

    if (decision === "verify") {
      if (
        !Number.isFinite(quantity) ||
        quantity < 0 ||
        quantity > Number(row.quantity_completed)
      ) {
        setError(
          `Accepted quantity for ${row.employee_name} must be between 0 and ${row.quantity_completed}.`,
        );
        return;
      }

      if (
        row.pay_type === "daily" &&
        (!Number.isFinite(Number(payableUnits[row.id])) ||
          Number(payableUnits[row.id]) <= 0)
      ) {
        setError("Enter payable days or units greater than zero.");
        return;
      }
    }

    setBusyId(row.id);

    try {
      await apiFetch(
        `${API_BASE_URL}/production/work/${row.id}/${decision}`,
        {
          method: "POST",
          body: JSON.stringify({
            quantity_accepted: decision === "verify" ? quantity : 0,
            payable_units:
              decision === "verify"
                ? row.pay_type === "piece_rate"
                  ? quantity
                  : Number(payableUnits[row.id])
                : null,
            supervisor_notes: notes[row.id]?.trim() || null,
          }),
        },
      );

      setMessage(
        decision === "verify"
          ? "Work verified successfully."
          : "Work rejected successfully.",
      );

      await loadPending();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${decision} work.`,
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Stack
          direction="row"
          sx={{
          justifyContent:"space-between",
          alignItems:"center",
          spacing:2,
          mb: 2 }}
        >
          <div>
            <Typography variant="h6" sx={{fontWeight:700}}>
              Supervisor Work Verification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review submitted quantities before they become accepted work.
            </Typography>
          </div>

          <Button
            variant="outlined"
            onClick={() => void loadPending()}
            disabled={loading || Boolean(busyId)}
          >
            Refresh
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        {loading ? (
          <CircularProgress size={28} />
        ) : rows.length === 0 ? (
          <Alert severity="info">No work is waiting for verification.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee / Operation</TableCell>
                  <TableCell>Work date</TableCell>
                  <TableCell align="right">Submitted</TableCell>
                  <TableCell>Accepted quantity</TableCell>
                  <TableCell>Payable units / days</TableCell>
                  <TableCell>Supervisor notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Typography sx={{fontWeight:600}}>
                        {row.employee_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.operation_name}
                      </Typography>
                    </TableCell>

                    <TableCell>{row.work_date?.slice(0, 10)}</TableCell>

                    <TableCell align="right">
                      {Number(row.quantity_completed).toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={accepted[row.id] ?? ""}
                        onChange={(event) =>
                          setAccepted((previous) => ({
                            ...previous,
                            [row.id]: event.target.value,
                          }))
                        }
                        slotProps={{
                          htmlInput: {
                            min: 0,
                            max: row.quantity_completed,
                            step: "any",
                          },
                        }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>

                    <TableCell>
                      {row.pay_type === "daily" ? (
                        <TextField
                          type="number"
                          size="small"
                          value={payableUnits[row.id] ?? ""}
                          onChange={(event) =>
                            setPayableUnits((previous) => ({
                              ...previous,
                              [row.id]: event.target.value,
                            }))
                          }
                          slotProps={{ htmlInput: { min: 0.01, step: "any" } }}
                          sx={{ width: 110 }}
                        />
                      ) : (
                        accepted[row.id] ?? row.quantity_completed
                      )}
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        multiline
                        minRows={1}
                        maxRows={3}
                        placeholder="Optional notes"
                        value={notes[row.id] ?? ""}
                        onChange={(event) =>
                          setNotes((previous) => ({
                            ...previous,
                            [row.id]: event.target.value,
                          }))
                        }
                        sx={{ minWidth: 160 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Stack spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={Boolean(busyId)}
                          onClick={() => void reviewWork(row, "verify")}
                        >
                          {busyId === row.id ? "Saving..." : "Verify"}
                        </Button>

                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          disabled={Boolean(busyId)}
                          onClick={() => void reviewWork(row, "reject")}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
