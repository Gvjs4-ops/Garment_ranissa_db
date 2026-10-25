
import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { apiFetch } from "../../api/apiClient";
import { API_BASE_URL } from "../../config/api";

interface Assignment {
  id: string;
  employee_name: string;
  operation_name: string;
  target_quantity: number;
  pay_type: string;
  status: string;
  order_number?: string;
}

interface WorkSubmissionProps {
  onSubmitted?: () => void;
}

export default function WorkSubmission({
  onSubmitted,
}: WorkSubmissionProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentId, setAssignmentId] = useState("");
  const [workDate, setWorkDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [quantity, setQuantity] = useState("");
  const [payableDays, setPayableDays] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAssignments() {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<Assignment[]>(
        `${API_BASE_URL}/production/assignments`,
      );

      const activeAssignments = data.filter(
        (assignment) =>
          !["completed", "cancelled", "rejected"].includes(
            assignment.status.toLowerCase(),
          ),
      );

      setAssignments(activeAssignments);

      if (
        assignmentId &&
        !activeAssignments.some((item) => item.id === assignmentId)
      ) {
        setAssignmentId("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load production assignments.",
      );
    } finally {
      setLoading(false);
    }
  }
const selectedAssignment = assignments.find(
  (assignment) => assignment.id === assignmentId,
);

const isDailyWage = selectedAssignment?.pay_type === "daily";
  useEffect(() => {
    void loadAssignments();
    // Load the assignment list when this component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    setError("");
    setSuccess("");

    const completedQuantity = Number(quantity);
    const days = Number(payableDays);

if (
  isDailyWage &&
  (!payableDays.trim() || !Number.isFinite(days) || days <= 0)
) {
  setError("Enter payable days for daily-wage work.");
  return;
}
    if (!assignmentId) {
      setError("Please select an assigned task.");
      return;
    }

    if (!workDate) {
      setError("Please select the work date.");
      return;
    }

    if (!Number.isFinite(completedQuantity) || completedQuantity <= 0) {
      setError("Completed quantity must be greater than zero.");
      return;
    }

    setSubmitting(true);

    try {
      await apiFetch(
        `${API_BASE_URL}/production/assignments/${assignmentId}/work`,
        {
          method: "POST",
body: JSON.stringify({
  work_date: workDate,
  quantity_completed: completedQuantity,
  payable_units: isDailyWage ? days : completedQuantity,
  supervisor_notes: notes.trim() || null,
}),
        },
      );

      setQuantity("");
      setNotes("");
      setSuccess(
        "Work submitted successfully. It is awaiting supervisor review.",
      );

      await loadAssignments();
      onSubmitted?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit completed work.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Record Completed Work
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Record the quantity completed against an employee's production
          assignment. Submitted work will require review.
        </Typography>

        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          {success && <Alert severity="success">{success}</Alert>}

          {loading ? (
            <CircularProgress size={28} />
          ) : (
            <TextField
              select
              fullWidth
              label="Employee assignment"
              value={assignmentId}
              onChange={(event) =>{
              setAssignmentId(event.target.value)
              setPayableDays("")
              }}
              helperText="Select the task for which work was completed."
            >
              {assignments.map((assignment) => (
                <MenuItem key={assignment.id} value={assignment.id}>
                  {assignment.employee_name} — {assignment.operation_name}
                  {assignment.order_number
                    ? ` — ${assignment.order_number}`
                    : ""}
                  {" (Target: "}
                  {Number(assignment.target_quantity).toLocaleString()}
                  {")"}
                </MenuItem>
              ))}
            </TextField>
          )}

          {!loading && assignments.length === 0 && (
            <Alert severity="info">
              No active assignments are available. Create an assignment first.
            </Alert>
          )}

          <TextField
            label="Work date"
            type="date"
            value={workDate}
            onChange={(event) => setWorkDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />

          <TextField
            label="Quantity completed"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            slotProps={{ htmlInput: { min: 0.01, step: "any" } }}
            helperText="Enter the quantity completed during this work entry."
            fullWidth
          />
{isDailyWage && (
  <TextField
    fullWidth
    type="number"
    label="Payable days"
    value={payableDays}
    onChange={(event) => setPayableDays(event.target.value)}
    required
    helperText="Enter the number of payable days for this work."
    slotProps={{
      htmlInput: {
        min: 0.01,
        step: "any",
      },
    }}
  />
)}
          <TextField
            label="Supervisor notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            multiline
            minRows={2}
            fullWidth
          />

          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={
              loading ||
              submitting ||
              assignments.length === 0
            }
          >
            {submitting ? "Submitting..." : "Submit Work for Review"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
