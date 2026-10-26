import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
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
import {
  approveAdvance,
  createAdvance,
  disburseAdvance,
  fetchAdvanceEmployees,
  fetchAdvanceRepayments,
  fetchAdvances,
  recordAdvanceRepayment,
  rejectAdvance,
  type AdvanceEmployee,
  type AdvanceRepayment,
  type SalaryAdvance,
} from "../../services/advancePayments";

type ActionType = "approve" | "reject" | "disburse" | "repay" | "history";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function money(value: number | string | null | undefined): string {
  return currency.format(Number(value ?? 0));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function AdvancePayments() {
  const navigate = useNavigate();
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [employees, setEmployees] = useState<AdvanceEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [reason, setReason] = useState("");

  const [action, setAction] = useState<ActionType | null>(null);
  const [selectedAdvance, setSelectedAdvance] =
    useState<SalaryAdvance | null>(null);

  const [approvedAmount, setApprovedAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionAmount, setActionAmount] = useState("");
  const [repaymentDate, setRepaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");

  const [repayments, setRepayments] = useState<AdvanceRepayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [advanceResult, employeeResult] = await Promise.allSettled([
        fetchAdvances(),
        fetchAdvanceEmployees(),
      ]);

      const errors: string[] = [];
      if (advanceResult.status === "fulfilled") {
        setAdvances(advanceResult.value);
      } else {
        errors.push(`Could not load advance requests: ${errorMessage(advanceResult.reason)}`);
      }

      if (employeeResult.status === "fulfilled") {
        setEmployees(employeeResult.value);
      } else {
        errors.push(`Could not load employees: ${errorMessage(employeeResult.reason)}`);
      }

      if (errors.length) setError(errors.join(" "));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const closeAction = () => {
    setAction(null);
    setSelectedAdvance(null);
    setApprovedAmount("");
    setRejectionReason("");
    setActionAmount("");
    setNotes("");
    setRepayments([]);
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");

    if (!employeeId || !requestedAmount.trim() || !reason.trim()) {
      setError("Select an employee and enter the amount and reason.");
      return;
    }

    const amount = Number(requestedAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Requested amount must be greater than zero.");
      return;
    }

    setSaving(true);
    try {
      await createAdvance({
        employee_id: employeeId,
        requested_amount: amount,
        reason: reason.trim(),
      });
      setEmployeeId("");
      setRequestedAmount("");
      setReason("");
      setSuccess("Advance request created.");
      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openAction = (type: ActionType, advance: SalaryAdvance) => {
    setSelectedAdvance(advance);
    setAction(type);
    setApprovedAmount("");
    setRejectionReason("");
    setActionAmount("");
    setNotes("");
    setRepaymentDate(new Date().toISOString().slice(0, 10));
    setRepayments([]);
    setError("");
    setSuccess("");
  };

  const handleActionSubmit = async () => {
    if (!selectedAdvance || !action) return;

    setError("");
    setSuccess("");

    const amount = Number(actionAmount);
    const approved = Number(approvedAmount);
    const requested = Number(selectedAdvance.requested_amount ?? 0);
    const approvedTotal = Number(selectedAdvance.approved_amount ?? 0);
    const alreadyDisbursed = Number(selectedAdvance.disbursed_amount ?? 0);
    const outstanding = Number(selectedAdvance.outstanding_balance ?? 0);
    const remainingToDisburse = Math.max(0, approvedTotal - alreadyDisbursed);

    if (action === "approve" && approvedAmount.trim()) {
      if (!Number.isFinite(approved) || approved <= 0) {
        setError("Approved amount must be greater than zero.");
        return;
      }
      if (approved > requested) {
        setError("Approved amount cannot exceed the requested amount.");
        return;
      }
    }

    if (action === "reject" && !rejectionReason.trim()) {
      setError("Enter a rejection reason.");
      return;
    }

    if (action === "disburse" || action === "repay") {
      if (!actionAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
        setError("Enter an amount greater than zero.");
        return;
      }
      if (action === "disburse" && amount > remainingToDisburse) {
        setError(`Disbursement cannot exceed the remaining amount of ${money(remainingToDisburse)}.`);
        return;
      }
      if (action === "repay" && amount > outstanding) {
        setError(`Repayment cannot exceed the outstanding balance of ${money(outstanding)}.`);
        return;
      }
    }

    if (action === "repay" && !repaymentDate) {
      setError("Select a repayment date.");
      return;
    }

    setSaving(true);
    try {
      switch (action) {
        case "approve": {
          const payload = approvedAmount.trim()
            ? { approved_amount: approved }
            : {};
          await approveAdvance(selectedAdvance.id, payload);
          setSuccess("Advance approved.");
          break;
        }
        case "reject":
          await rejectAdvance(selectedAdvance.id, {
            rejection_reason: rejectionReason.trim(),
          });
          setSuccess("Advance rejected.");
          break;
        case "disburse":
          await disburseAdvance(selectedAdvance.id, { amount });
          setSuccess("Disbursement recorded.");
          break;
        case "repay":
          await recordAdvanceRepayment(selectedAdvance.id, {
            amount,
            repayment_date: repaymentDate,
            notes: notes.trim() || undefined,
          });
          setSuccess("Repayment recorded.");
          break;
        default:
          return;
      }

      closeAction();
      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (advance: SalaryAdvance) => {
    setSelectedAdvance(advance);
    setAction("history");
    setHistoryLoading(true);
    setRepayments([]);
    setError("");

    try {
      const rows = await fetchAdvanceRepayments(advance.id);
      setRepayments(rows);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  const summary = {
    pending: advances.filter((item) => String(item.status).toUpperCase() === "PENDING").length,
    approved: advances.filter((item) =>
      ["APPROVED", "PARTIALLY_DISBURSED", "PARTIALLY DISBURSED"].includes(
        String(item.status).toUpperCase(),
      ),
    ).length,
    outstanding: advances.reduce(
      (total, item) => total + Number(item.outstanding_balance ?? 0),
      0,
    ),
  };

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "clip",
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
         alignItems:{ xs: "flex-start", sm: "center" },
         mb: 3, minWidth: 0 }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/payroll")}
        >
          Back to Payroll
        </Button>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Advance Payments
          </Typography>
          <Typography color="text.secondary">
            Manage employee advances, approvals, disbursements, and repayments.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            flex: "1 1 0",
            minWidth: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <Typography color="text.secondary" variant="body2">
            Pending requests
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {summary.pending}
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            flex: "1 1 0",
            minWidth: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <Typography color="text.secondary" variant="body2">
            Approved / partially disbursed
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {summary.approved}
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            flex: "1 1 0",
            minWidth: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <Typography color="text.secondary" variant="body2">
            Total outstanding
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {money(summary.outstanding)}
          </Typography>
        </Paper>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          minWidth: 0,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Create advance request
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
            alignItems: "start",
            minWidth: 0,
            "& > *": { minWidth: 0 },
          }}
        >
          <TextField
            select
            fullWidth
            label="Employee"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            disabled={saving || loading || employees.length === 0}
            helperText={employees.length === 0 && !loading ? "No employees available. Check employee API access and company assignment." : " "}
          >
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.employee_code} — {employee.full_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Requested amount (₹)"
            type="number"
            value={requestedAmount}
            onChange={(event) => setRequestedAmount(event.target.value)}
            slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
            disabled={saving}
          />

          <TextField
            fullWidth
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
            disabled={saving}
          />
        </Box>

        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          sx={{
          justifyContent:"flex-end",
          alignItems:{ xs: "stretch", sm: "center" },
           mt: 2 }}
        >
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving || loading || employees.length === 0}
          >
            {saving ? "Saving..." : "Create request"}
          </Button>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2.5 },
          minWidth: 0,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 2 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Advance requests
          </Typography>
          <Button onClick={() => void loadData()} disabled={loading}>
            Refresh
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            sx={{
              width: "100%",
              maxWidth: "100%",
              overflowX: "auto",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Table size="small" sx={{ minWidth: 1050 }}>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell>Approved</TableCell>
                  <TableCell>Disbursed</TableCell>
                  <TableCell>Repaid</TableCell>
                  <TableCell>Outstanding</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {advances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No advance requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  advances.map((advance) => (
                    <TableRow key={advance.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {advance.employee_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {advance.employee_code}
                        </Typography>
                      </TableCell>
                      <TableCell>{money(advance.requested_amount)}</TableCell>
                      <TableCell>{money(advance.approved_amount)}</TableCell>
                      <TableCell>{money(advance.disbursed_amount)}</TableCell>
                      <TableCell>{money(advance.total_repaid)}</TableCell>
                      <TableCell>
                        {money(advance.outstanding_balance)}
                      </TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 1,
                            py: 0.4,
                            borderRadius: 1,
                            bgcolor: "action.hover",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {String(advance.status).replaceAll("_", " ")}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 160, maxWidth: 240 }}>
                        {advance.reason}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                          {String(advance.status).toUpperCase() === "PENDING" && (
                            <>
                              <Button
                                size="small"
                                onClick={() => openAction("approve", advance)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => openAction("reject", advance)}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {["APPROVED", "PARTIALLY_DISBURSED", "PARTIALLY DISBURSED"].includes(String(advance.status).toUpperCase()) && (
                            <Button
                              size="small"
                              onClick={() => openAction("disburse", advance)}
                            >
                              Disburse
                            </Button>
                          )}

                          {["DISBURSED", "PARTIALLY_DISBURSED", "PARTIALLY DISBURSED"].includes(String(advance.status).toUpperCase()) && Number(advance.outstanding_balance ?? 0) > 0 && (
                            <Button
                              size="small"
                              onClick={() => openAction("repay", advance)}
                            >
                              Record repayment
                            </Button>
                          )}

                          {["DISBURSED", "PARTIALLY_DISBURSED", "PARTIALLY DISBURSED", "CLOSED"].includes(String(advance.status).toUpperCase()) && (
                            <Button
                              size="small"
                              onClick={() => void openHistory(advance)}
                            >
                              History
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={action !== null}
        onClose={closeAction}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {action === "approve" && "Approve advance"}
          {action === "reject" && "Reject advance"}
          {action === "disburse" && "Record disbursement"}
          {action === "repay" && "Record repayment"}
          {action === "history" && "Repayment history"}
        </DialogTitle>

        <DialogContent>
          {selectedAdvance && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedAdvance.employee_name} · Requested{" "}
                {money(selectedAdvance.requested_amount)} · Status:{" "}
                {selectedAdvance.status}
              </Typography>

              {action === "approve" && (
                <TextField
                  fullWidth
                  label="Approved amount (₹)"
                  type="number"
                  helperText={`Leave blank to approve the full requested amount (${money(
                    selectedAdvance.requested_amount,
                  )}).`}
                  value={approvedAmount}
                  onChange={(event) => setApprovedAmount(event.target.value)}
                  slotProps={{
                    htmlInput: {
                      min: 0.01,
                      max: Number(selectedAdvance.requested_amount),
                      step: 0.01,
                    },
                  }}
                />
              )}

              {action === "reject" && (
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={3}
                  label="Rejection reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                />
              )}

              {action === "disburse" && (
                <>
                  <Typography sx={{ mb: 2 }}>
                    Remaining to disburse:{" "}
                    {money(
                      Number(selectedAdvance.approved_amount ?? 0) -
                        Number(selectedAdvance.disbursed_amount ?? 0),
                    )}
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    label="Disbursement amount (₹)"
                    type="number"
                    value={actionAmount}
                    onChange={(event) => setActionAmount(event.target.value)}
                    slotProps={{
                      htmlInput: { min: 0.01, step: 0.01 },
                    }}
                  />
                </>
              )}

              {action === "repay" && (
                <Stack spacing={2}>
                  <Typography>
                    Outstanding balance:{" "}
                    {money(selectedAdvance.outstanding_balance)}
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    label="Repayment amount (₹)"
                    type="number"
                    value={actionAmount}
                    onChange={(event) => setActionAmount(event.target.value)}
                    slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                  />
                  <TextField
                    fullWidth
                    required
                    label="Repayment date"
                    type="date"
                    value={repaymentDate}
                    onChange={(event) => setRepaymentDate(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    fullWidth
                    label="Notes (optional)"
                    multiline
                    minRows={2}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </Stack>
              )}

              {action === "history" &&
                (historyLoading ? (
                  <CircularProgress />
                ) : repayments.length === 0 ? (
                  <Typography>No repayments recorded.</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {repayments.map((repayment) => (
                          <TableRow key={repayment.id}>
                            <TableCell>{repayment.repayment_date}</TableCell>
                            <TableCell>{money(repayment.amount)}</TableCell>
                            <TableCell>{repayment.notes || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeAction} disabled={saving}>
            Close
          </Button>
          {action !== "history" && (
            <Button
              variant="contained"
              onClick={handleActionSubmit}
              disabled={saving}
            >
              {saving ? "Saving..." : "Confirm"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}