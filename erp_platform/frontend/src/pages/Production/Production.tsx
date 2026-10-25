import { apiFetch } from "../../api/apiClient";
import { API_BASE_URL } from "../../config/api";
import ProductionActions from "./ProductionActions";
import WorkSubmission from "./WorkSubmission";
import WorkVerification from "./WorkVerification";
import ProductionEmployee from "./ProductionEmployee";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

interface Requirement {
  id: string;
  order_number: string;
  sku: string | null;
  product_name: string;
  required_quantity: number;
  produced_quantity: number;
  status: string;
}

interface Assignment {
  id: string;
  production_requirement_id: string;
  employee_id: string;
  operation_id: string;
  employee_name: string;
  operation_name: string;
  target_quantity: number;
  due_date: string | null;
  pay_type: string;
  agreed_rate: number;
  status: string;
  order_number?: string;
}

const ACTIVE_ASSIGNMENT_STATUSES = [
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
];

function statusColor(
  status: string
): "success" | "warning" | "error" | "default" | "primary" {
  switch (status.toUpperCase()) {
    case "COMPLETED":
    case "APPROVED":
    case "ACCEPTED":
      return "success";
    case "PENDING":
    case "SUBMITTED":
    case "IN_PROGRESS":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
    case "OVERDUE":
      return "error";
    case "ASSIGNED":
      return "primary";
    default:
      return "default";
  }
}

function formatNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || ["COMPLETED", "CANCELLED"].includes(status.toUpperCase())) {
    return false;
  }

  const due = new Date(`${dueDate.slice(0, 10)}T23:59:59`);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}

function SummaryCard({ title, value, subtitle, icon }: SummaryCardProps) {
  return (
    <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between" }} spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "action.hover",
              color: "primary.main",
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Production() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [requirementStatus, setRequirementStatus] = useState("ALL");
  const [assignmentStatus, setAssignmentStatus] = useState("ALL");
  
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");
  const [deletingRequirement, setDeletingRequirement] = useState<Requirement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
const [editingAssignment, setEditingAssignment] =
  useState<Assignment | null>(null);
const [deletingAssignment, setDeletingAssignment] =
  useState<Assignment | null>(null);
const [deletingAssignmentBusy, setDeletingAssignmentBusy] =
  useState(false);
const [deleteAssignmentError, setDeleteAssignmentError] = useState("");
const [assignmentEditForm, setAssignmentEditForm] = useState({
  target_quantity: "",
  due_date: "",
  pay_type: "piece_rate",
  agreed_rate: "",
});
const openEditAssignment = (item: Assignment) => {
  setEditingAssignment(item);
  setAssignmentEditForm({
    target_quantity: String(item.target_quantity),
    due_date: item.due_date?.slice(0, 10) ?? "",
    pay_type: item.pay_type,
    agreed_rate: String(item.agreed_rate),
  });
  setAssignmentEditError("");
};

const closeEditAssignment = () => {
  if (savingAssignmentEdit) return;
  setEditingAssignment(null);
  setAssignmentEditError("");
};

const saveAssignmentChanges = async () => {
  if (!editingAssignment) return;

  const quantity = Number(assignmentEditForm.target_quantity);
  const rate = Number(assignmentEditForm.agreed_rate);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    setAssignmentEditError("Target quantity must be greater than zero.");
    return;
  }

  if (!Number.isFinite(rate) || rate < 0) {
    setAssignmentEditError("Agreed rate cannot be negative.");
    return;
  }

  if (!["piece_rate", "daily"].includes(assignmentEditForm.pay_type)) {
    setAssignmentEditError("Select a valid payment type.");
    return;
  }

  setSavingAssignmentEdit(true);
  setAssignmentEditError("");

  try {
    await apiFetch(
      `${API_BASE_URL}/production/assignments/${editingAssignment.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_quantity: quantity,
          due_date: assignmentEditForm.due_date || null,
          pay_type: assignmentEditForm.pay_type,
          agreed_rate: rate,
        }),
      }
    );

    setEditingAssignment(null);
    await loadProduction();
  } catch (err) {
    setAssignmentEditError(
      err instanceof Error
        ? err.message
        : "Failed to update assignment."
    );
  } finally {
    setSavingAssignmentEdit(false);
  }
};
const deleteAssignment = async () => {
  if (!deletingAssignment || deletingAssignmentBusy) return;

  if (deletingAssignment.status.toUpperCase() !== "ASSIGNED") {
    setDeleteAssignmentError(
      "Only unused assignments with ASSIGNED status can be deleted."
    );
    return;
  }

  setDeletingAssignmentBusy(true);
  setDeleteAssignmentError("");

  try {
    await apiFetch(
      `${API_BASE_URL}/production/assignments/${deletingAssignment.id}`,
      { method: "DELETE" }
    );

    setDeletingAssignment(null);
    setDeleteAssignmentError("");
    await loadProduction();
  } catch (err) {
    setDeleteAssignmentError(
      err instanceof Error
        ? err.message
        : "Failed to delete production assignment."
    );
  } finally {
    setDeletingAssignmentBusy(false);
  }
};

const closeDeleteAssignmentDialog = () => {
  if (deletingAssignmentBusy) return;

  setDeletingAssignment(null);
  setDeleteAssignmentError("");
};
const [savingAssignmentEdit, setSavingAssignmentEdit] = useState(false);
const [assignmentEditError, setAssignmentEditError] = useState("");
  const loadProduction = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        requirementData,
        assignmentData,
      ] = await Promise.all([
        apiFetch<Requirement[]>(`${API_BASE_URL}/production/requirements`),
        apiFetch<Assignment[]>(`${API_BASE_URL}/production/assignments`),
      ]);

      setRequirements(Array.isArray(requirementData) ? requirementData : []);
      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load production data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProduction();
  }, [loadProduction]);

  const openEditRequirement = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    setEditQuantity(String(requirement.required_quantity));
    setEditError("");
  };

  const closeEditRequirement = () => {
    if (savingEdit) return;
    setEditingRequirement(null);
    setEditQuantity("");
    setEditError("");
  };

  const saveRequirementChanges = async () => {
    if (!editingRequirement) return;

    const quantity = Number(editQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setEditError("Enter a positive whole-number quantity.");
      return;
    }

    if (quantity < editingRequirement.produced_quantity) {
      setEditError(
        "Required quantity cannot be less than the quantity already produced."
      );
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      await apiFetch(
        `${API_BASE_URL}/production/requirements/${editingRequirement.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            required_quantity: quantity,
          }),
        }
      );

      setEditingRequirement(null);
      setEditQuantity("");
      await loadProduction();
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : "Failed to update production requirement."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteRequirement = async () => {
    if (!deletingRequirement || deleting) return;

    if (deletingRequirement.status.toUpperCase() !== "COMPLETED") {
      setDeleteError("Only completed production requirements can be deleted.");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      await apiFetch(
        `${API_BASE_URL}/production/requirements/${deletingRequirement.id}`,
        { method: "DELETE" }
      );

      setDeletingRequirement(null);
      setDeleteError("");
      await loadProduction();
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to delete production requirement."
      );
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeletingRequirement(null);
    setDeleteError("");
  };

  const employeeOptions = useMemo(() => {
  const names = assignments
    .map((item) => item.employee_name?.trim())
    .filter((name): name is string => Boolean(name));

  return [...new Set(names)].sort((a, b) =>
    a.localeCompare(b)
  );
}, [assignments]);

  const summary = useMemo(() => {
    const openRequirements = requirements.filter(
      (item) => !["COMPLETED", "CANCELLED"].includes(item.status.toUpperCase())
    ).length;

    const activeAssignments = assignments.filter((item) =>
      ACTIVE_ASSIGNMENT_STATUSES.includes(item.status.toUpperCase())
    ).length;

    const completedUnits = requirements.reduce(
      (sum, item) => sum + Number(item.produced_quantity || 0),
      0
    );

    const overdueAssignments = assignments.filter((item) =>
      isOverdue(item.due_date, item.status)
    ).length;

    return {
      openRequirements,
      activeAssignments,
      completedUnits,
      overdueAssignments,
    };
  }, [requirements, assignments]);

  const filteredRequirements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requirements.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.order_number,
          item.product_name,
          item.sku || "",
          item.status,
        ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        requirementStatus === "ALL" ||
        item.status.toUpperCase() === requirementStatus;

      return matchesSearch && matchesStatus;
    });
  }, [requirements, search, requirementStatus]);

const filteredAssignments = useMemo(() => {
  const query = search.trim().toLowerCase();

  return assignments.filter((item) => {
    const matchesSearch =
      !query ||
      [
        item.employee_name,
        item.operation_name,
        item.order_number || "",
        item.status,
      ].some((value) => value.toLowerCase().includes(query));

    const matchesStatus =
      assignmentStatus === "ALL" ||
      item.status.toUpperCase() === assignmentStatus;

    const matchesEmployee =
      selectedEmployee === "ALL" ||
      item.employee_name === selectedEmployee;

    return matchesSearch && matchesStatus && matchesEmployee;
  });
}, [assignments, search, assignmentStatus, selectedEmployee]);

  return (
    <Box sx={{ pb: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Production
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor requirements, employee assignments and production progress.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => void loadProduction()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <Box sx={{ mb: 3, width: "100%", minWidth: 0 }}>
        <ProductionActions onCreated={() => void loadProduction()} />
      </Box>
     
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => void loadProduction()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <SummaryCard
          title="Open Requirements"
          value={formatNumber(summary.openRequirements)}
          subtitle="Awaiting completion"
          icon={<Inventory2OutlinedIcon />}
        />
        <SummaryCard
          title="Active Assignments"
          value={formatNumber(summary.activeAssignments)}
          subtitle="Assigned or in progress"
          icon={<PrecisionManufacturingOutlinedIcon />}
        />
        <SummaryCard
          title="Units Produced"
          value={formatNumber(summary.completedUnits)}
          subtitle="Reported across requirements"
          icon={<TaskAltIcon />}
        />
        <SummaryCard
          title="Overdue Assignments"
          value={formatNumber(summary.overdueAssignments)}
          subtitle="Past their due date"
          icon={<EventBusyOutlinedIcon />}
        />
      </Box>
      <ProductionEmployee />
      <TextField
        fullWidth
        size="small"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by sales order, product, SKU, employee or operation"
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                  mb: 2,
                }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Production Requirements
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredRequirements.length} of {requirements.length} requirements
                  </Typography>
                </Box>
                <TextField
                  select
                  size="small"
                  label="Requirement status"
                  value={requirementStatus}
                  onChange={(event) => setRequirementStatus(event.target.value)}
                  sx={{ minWidth: { sm: 190 } }}
                >
                  <MenuItem value="ALL">All statuses</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="IN_PROGRESS">In progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </TextField>
              </Stack>

              {filteredRequirements.length === 0 ? (
                <Alert severity="info">
                  {requirements.length === 0
                    ? "No production requirements were returned by the API."
                    : "No requirements match the current search and filters."}
                </Alert>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sales Order</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Required</TableCell>
                        <TableCell align="right">Produced</TableCell>
                        <TableCell align="right">Remaining</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Progress</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRequirements.map((item) => {
                        const required = Number(item.required_quantity || 0);
                        const produced = Number(item.produced_quantity || 0);
                        const remaining = Math.max(0, required - produced);
                        const progress =
                          required > 0
                            ? Math.min(100, Math.max(0, (produced / required) * 100))
                            : 0;

                        return (
                          <TableRow key={item.id} hover>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.order_number}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.product_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.sku || "No SKU"}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {formatNumber(required)}
                            </TableCell>
                            <TableCell align="right">
                              {formatNumber(produced)}
                            </TableCell>
                            <TableCell align="right">
                              {formatNumber(remaining)}
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <LinearProgress
                                  variant="determinate"
                                  value={progress}
                                  color={progress >= 100 ? "success" : "primary"}
                                  sx={{ height: 7, borderRadius: 5 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {progress.toFixed(0)}%
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={formatStatus(item.status)}
                                color={statusColor(item.status)}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <Button
                                  size="small"
                                  onClick={() => openEditRequirement(item)}
                                  disabled={savingEdit || deleting}
                                >
                                  Edit
                                </Button>

                                <Tooltip
                                  title={
                                    item.status.toUpperCase() === "COMPLETED"
                                      ? "Delete completed requirement"
                                      : "Only completed requirements can be deleted"
                                  }
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      aria-label={`Delete requirement ${item.order_number}`}
                                      disabled={
                                        deleting ||
                                        item.status.toUpperCase() !== "COMPLETED"
                                      }
                                      onClick={() => {
                                        setDeleteError("");
                                        setDeletingRequirement(item);
                                      }}
                                    >
                                      <DeleteOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={editingRequirement !== null}
            onClose={closeEditRequirement}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Edit Production Requirement</DialogTitle>

            <DialogContent>
              {editingRequirement && (
                <Box sx={{ pt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Sales Order: {editingRequirement.order_number}
                  </Typography>

                  <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                    Product: {editingRequirement.product_name}
                  </Typography>

                  <TextField
                    label="Required Quantity"
                    type="number"
                    fullWidth
                    required
                    value={editQuantity}
                    onChange={(event) => setEditQuantity(event.target.value)}
                    slotProps={{
                      htmlInput: {
                        min: Math.max(1, editingRequirement.produced_quantity),
                        step: 1,
                      },
                    }}
                    helperText={`Already produced: ${editingRequirement.produced_quantity}`}
                    disabled={savingEdit}
                  />

                  {editError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {editError}
                    </Alert>
                  )}
                </Box>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={closeEditRequirement} disabled={savingEdit}>
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={saveRequirementChanges}
                disabled={savingEdit || !editQuantity.trim()}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={deletingRequirement !== null}
            onClose={closeDeleteDialog}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>Delete Production Requirement?</DialogTitle>

            <DialogContent>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Are you sure you want to delete this completed requirement?
              </Typography>

              {deletingRequirement && (
                <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
                  <Typography variant="subtitle2">
                    Order: {deletingRequirement.order_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Product: {deletingRequirement.product_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Required quantity: {deletingRequirement.required_quantity}
                  </Typography>
                </Box>
              )}

              <Alert severity="warning" sx={{ mt: 2 }}>
                Deletion may affect related production records. Confirm that this
                requirement is safe to remove before proceeding.
              </Alert>

              {deleteError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {deleteError}
                </Alert>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={closeDeleteDialog} disabled={deleting}>
                Cancel
              </Button>

              <Button
                variant="contained"
                color="error"
                onClick={() => void deleteRequirement()}
                disabled={deleting || !deletingRequirement}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </DialogActions>
          </Dialog>
<Dialog
  open={editingAssignment !== null}
  onClose={closeEditAssignment}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Edit Employee Work Assignment</DialogTitle>

  <DialogContent>
    {editingAssignment && (
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Employee: {editingAssignment.employee_name}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Operation: {editingAssignment.operation_name}
        </Typography>

        <TextField
          label="Target Quantity"
          type="number"
          required
          fullWidth
          value={assignmentEditForm.target_quantity}
          onChange={(event) =>
            setAssignmentEditForm({
              ...assignmentEditForm,
              target_quantity: event.target.value,
            })
          }
          slotProps={{
            htmlInput: { min: 0.01, step: "any" },
          }}
          disabled={savingAssignmentEdit}
        />

        <TextField
          label="Due Date"
          type="date"
          fullWidth
          value={assignmentEditForm.due_date}
          onChange={(event) =>
            setAssignmentEditForm({
              ...assignmentEditForm,
              due_date: event.target.value,
            })
          }
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={savingAssignmentEdit}
        />

        <TextField
          select
          label="Payment Type"
          fullWidth
          value={assignmentEditForm.pay_type}
          onChange={(event) =>
            setAssignmentEditForm({
              ...assignmentEditForm,
              pay_type: event.target.value,
            })
          }
          disabled={savingAssignmentEdit}
        >
          <MenuItem value="piece_rate">Piece rate</MenuItem>
          <MenuItem value="daily">Daily wage</MenuItem>
        </TextField>

        <TextField
          label="Agreed Rate"
          type="number"
          required
          fullWidth
          value={assignmentEditForm.agreed_rate}
          onChange={(event) =>
            setAssignmentEditForm({
              ...assignmentEditForm,
              agreed_rate: event.target.value,
            })
          }
          slotProps={{
            htmlInput: { min: 0, step: "0.01" },
          }}
          disabled={savingAssignmentEdit}
        />

        {assignmentEditError && (
          <Alert severity="error">{assignmentEditError}</Alert>
        )}

        {editingAssignment.status.toUpperCase() !== "ASSIGNED" && (
          <Alert severity="warning">
            Only assignments with ASSIGNED status can be edited.
          </Alert>
        )}
      </Stack>
    )}
  </DialogContent>

  <DialogActions>
    <Button
      onClick={closeEditAssignment}
      disabled={savingAssignmentEdit}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={() => void saveAssignmentChanges()}
      disabled={
        savingAssignmentEdit ||
        !assignmentEditForm.target_quantity.trim() ||
        !assignmentEditForm.agreed_rate.trim() ||
        editingAssignment?.status.toUpperCase() !== "ASSIGNED"
      }
    >
      {savingAssignmentEdit ? "Saving..." : "Save Changes"}
    </Button>
  </DialogActions>
</Dialog>
<Dialog
  open={deletingAssignment !== null}
  onClose={closeDeleteAssignmentDialog}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Delete Employee Work Assignment?</DialogTitle>

  <DialogContent>
    {deletingAssignment && (
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography>
          Are you sure you want to delete this assignment?
        </Typography>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Employee
          </Typography>
          <Typography sx={{fontWeight:600}}>
            {deletingAssignment.employee_name}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Operation
          </Typography>
          <Typography sx={{fontWeight:600}}>
            {deletingAssignment.operation_name}
          </Typography>
        </Box>

        <Alert severity="warning">
          Only unused assignments can be deleted. Assignments with submitted
          work or other production history must be preserved.
        </Alert>

        {deleteAssignmentError && (
          <Alert severity="error">
            {deleteAssignmentError}
          </Alert>
        )}
      </Stack>
    )}
  </DialogContent>

  <DialogActions>
    <Button
      onClick={closeDeleteAssignmentDialog}
      disabled={deletingAssignmentBusy}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      color="error"
      onClick={() => void deleteAssignment()}
      disabled={
        deletingAssignmentBusy ||
        !deletingAssignment ||
        deletingAssignment.status.toUpperCase() !== "ASSIGNED"
      }
    >
      {deletingAssignmentBusy ? "Deleting..." : "Confirm Delete"}
    </Button>
  </DialogActions>
</Dialog>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                  mb: 2,
                }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Employee Work Assignments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredAssignments.length} of {assignments.length} assignments
                  </Typography>
                </Box>

                <TextField
                  select
                  size="small"
                  label="Assignment status"
                  value={assignmentStatus}
                  onChange={(event) => setAssignmentStatus(event.target.value)}
                  sx={{ minWidth: { sm: 190 } }}
                >
                  <MenuItem value="ALL">All statuses</MenuItem>
                  <MenuItem value="ASSIGNED">Assigned</MenuItem>
                  <MenuItem value="IN_PROGRESS">In progress</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </TextField>
              </Stack>
	<TextField
  select
  size="small"
  label="Production Employee"
  value={selectedEmployee}
  onChange={(event) => setSelectedEmployee(event.target.value)}
  sx={{ minWidth: { sm: 220 } }}
>
  <MenuItem value="ALL">All employees</MenuItem>

  {employeeOptions.map((employee) => (
    <MenuItem key={employee} value={employee}>
      {employee}
    </MenuItem>
  ))}
</TextField>

              {filteredAssignments.length === 0 ? (
                <Alert severity="info">
                  {assignments.length === 0
                    ? "No employee assignments were returned. Create an assignment to begin tracking production work."
                    : "No assignments match the current search and filters."}
                </Alert>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Operation</TableCell>
                        <TableCell>Sales Order</TableCell>
                        <TableCell align="right">Target</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Pay Type</TableCell>
                        <TableCell align="right">Agreed Rate</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAssignments.map((item) => {
                        const overdue = isOverdue(item.due_date, item.status);

                        return (
                          <TableRow key={item.id} hover>
                            <TableCell>{item.employee_name}</TableCell>
                            <TableCell>{item.operation_name}</TableCell>
                            <TableCell>{item.order_number || "—"}</TableCell>
                            <TableCell align="right">
                              {formatNumber(item.target_quantity)}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color={overdue ? "error.main" : "text.primary"}
                                sx={{ fontWeight: overdue ? 600 : 400 }}
                              >
                                {formatDate(item.due_date)}
                              </Typography>
                              {overdue && (
                                <Typography variant="caption" color="error.main">
                                  Overdue
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{formatStatus(item.pay_type)}</TableCell>
                            <TableCell align="right">
                              ₹{formatNumber(item.agreed_rate)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={formatStatus(item.status)}
                                color={statusColor(item.status)}
                              />
                            </TableCell>
                            <TableCell align="right">
  <Tooltip title="Edit assignment">
    <span>
      <IconButton
        color="primary"
        size="small"
        onClick={() => openEditAssignment(item)}
        disabled={item.status.toUpperCase() !== "ASSIGNED"}
        aria-label={`Edit assignment for ${item.employee_name}`}
      >
        <EditOutlinedIcon fontSize="small" />
      </IconButton>
    </span>
  </Tooltip>

  <Tooltip
    title={
      item.status.toUpperCase() === "ASSIGNED"
        ? "Delete unused assignment"
        : "Only unused assignments can be deleted"
    }
  >
    <span>
      <IconButton
        color="error"
        size="small"
        onClick={() => {
          setDeletingAssignment(item);
          setDeleteAssignmentError("");
        }}
        disabled={item.status.toUpperCase() !== "ASSIGNED"}
        aria-label={`Delete assignment for ${item.employee_name}`}
      >
        <DeleteOutlinedIcon fontSize="small" />
      </IconButton>
    </span>
  </Tooltip>
</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
	              <Stack spacing={2} sx={{ mb: 3 }}>
                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    "&:before": { display: "none" },
                    overflow: "hidden",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="work-submission-content"
                    id="work-submission-header"
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Record Completed Work
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Submit completed quantities against employee assignments.
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                    <WorkSubmission onSubmitted={() => void loadProduction()} />
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    "&:before": { display: "none" },
                    overflow: "hidden",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="work-verification-content"
                    id="work-verification-header"
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Supervisor Work Verification
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Review submitted quantities and verify accepted work.
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                    <WorkVerification />
                  </AccordionDetails>
                </Accordion>
              </Stack>
        </>
      )}
    </Box>
  );
}