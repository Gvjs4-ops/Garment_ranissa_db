import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { apiFetch } from "../../api/apiClient";
import { API_BASE_URL } from "../../config/api";

interface Requirement {
  id: string;
  order_number: string;
  product_name: string;
  required_quantity: number;
  produced_quantity: number;
  status: string;
}

interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  designation: string | null;
  phone: string | null;
  email: string | null;
  joining_date: string | null;
  salary_type: string;
  daily_rate: number | null;
  is_tailor: boolean;
}

interface Operation {
  id: string;
  operation_code: string;
  operation_name: string;
  default_piece_rate: number | null;
}

type ActionType = "employee" | "operation" | "assignment";

const initialEmployee = {
  employee_code: "",
  full_name: "",
  designation: "",
  phone: "",
  email: "",
  joining_date: "",
  salary_type: "piece_rate",
  daily_rate: "",
  is_tailor: false,
};

const initialOperation = {
  operation_code: "",
  operation_name: "",
  default_piece_rate: "",
};

const initialAssignment = {
  production_requirement_id: "",
  employee_id: "",
  operation_id: "",
  target_quantity: "",
  due_date: "",
  pay_type: "piece_rate",
  agreed_rate: "",
};

interface Props {
  onCreated: () => void;
}

export default function ProductionActions({ onCreated }: Props) {
  const [activeDialog, setActiveDialog] = useState<ActionType | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState(initialEmployee);
  const [operationForm, setOperationForm] = useState(initialOperation);
  const [assignmentForm, setAssignmentForm] = useState(initialAssignment);

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setError("");

    try {
      const [requirementData, employeeData, operationData] =
        await Promise.all([
          apiFetch<Requirement[]>(`${API_BASE_URL}/production/requirements`),
          apiFetch<Employee[]>(`${API_BASE_URL}/production/employees`),
          apiFetch<Operation[]>(`${API_BASE_URL}/production/operations`),
        ]);

      setRequirements(Array.isArray(requirementData) ? requirementData : []);
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
      setOperations(Array.isArray(operationData) ? operationData : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load production form options."
      );
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const closeDialog = () => {
    if (saving) return;

    setActiveDialog(null);
    setEditingEmployeeId(null);
    setEmployeeForm(initialEmployee);
    setError("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeDialog || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (activeDialog === "employee") {
        if (
          employeeForm.salary_type === "daily" &&
          employeeForm.daily_rate.trim() === ""
        ) {
          throw new Error("Enter a daily rate for a daily-wage employee.");
        }

        const isEditing = editingEmployeeId !== null;

        await apiFetch(
          isEditing
            ? `${API_BASE_URL}/production/employees/${editingEmployeeId}`
            : `${API_BASE_URL}/production/employees`,
          {
            method: isEditing ? "PUT" : "POST",
            body: JSON.stringify({
              employee_code: employeeForm.employee_code.trim(),
              full_name: employeeForm.full_name.trim(),
              designation: employeeForm.designation.trim() || null,
              phone: employeeForm.phone.trim() || null,
              email: employeeForm.email.trim() || null,
              joining_date: employeeForm.joining_date || null,
              salary_type: employeeForm.salary_type,
              daily_rate:
                employeeForm.salary_type === "daily"
                  ? Number(employeeForm.daily_rate)
                  : null,
              is_tailor: employeeForm.is_tailor,
            }),
          }
        );

        setEmployeeForm(initialEmployee);
        setEditingEmployeeId(null);
        setSuccess(
          isEditing
            ? "Employee updated successfully."
            : "Employee created successfully."
        );
      }

      if (activeDialog === "operation") {
        await apiFetch(`${API_BASE_URL}/production/operations`, {
          method: "POST",
          body: JSON.stringify({
            operation_code: operationForm.operation_code.trim(),
            operation_name: operationForm.operation_name.trim(),
            default_piece_rate:
              operationForm.default_piece_rate.trim() === ""
                ? null
                : Number(operationForm.default_piece_rate),
          }),
        });

        setOperationForm(initialOperation);
        setSuccess("Production operation created successfully.");
      }

      if (activeDialog === "assignment") {
        if (
          !assignmentForm.production_requirement_id ||
          !assignmentForm.employee_id ||
          !assignmentForm.operation_id
        ) {
          throw new Error(
            "Select a production requirement, employee, and operation."
          );
        }

        await apiFetch(`${API_BASE_URL}/production/assignments`, {
          method: "POST",
          body: JSON.stringify({
            production_requirement_id:
              assignmentForm.production_requirement_id,
            employee_id: assignmentForm.employee_id,
            operation_id: assignmentForm.operation_id,
            target_quantity: Number(assignmentForm.target_quantity),
            due_date: assignmentForm.due_date || null,
            pay_type: assignmentForm.pay_type,
            agreed_rate: Number(assignmentForm.agreed_rate),
          }),
        });

        setAssignmentForm(initialAssignment);
        setSuccess("Production assignment created successfully.");
      }

      setActiveDialog(null);
      await loadOptions();
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The production action could not be completed."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedOperation = operations.find(
    (operation) => operation.id === assignmentForm.operation_id
  );

  const selectedEmployee = employees.find(
    (employee) => employee.id === assignmentForm.employee_id
  );

  const openDialog = (type: ActionType) => {
    setError("");
    setSuccess("");

    if (type === "employee") {
      setEditingEmployeeId(null);
      setEmployeeForm(initialEmployee);
    }

    setActiveDialog(type);

    if (type === "assignment") {
      void loadOptions();
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openDialog("assignment")}
        >
          New Assignment
        </Button>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => openDialog("employee")}
        >
          Add Employee
        </Button>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => openDialog("operation")}
        >
          Add Operation
        </Button>
      </Stack>

      {success && (
        <Alert
          severity="success"
          sx={{ mt: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      <Dialog
        open={activeDialog !== null}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={submit}>
          <DialogTitle>
            {activeDialog === "employee" &&
              (editingEmployeeId
                ? "Edit Production Employee"
                : "Add Production Employee")}
            {activeDialog === "operation" && "Add Production Operation"}
            {activeDialog === "assignment" && "Create Production Assignment"}
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              {activeDialog === "employee" && (
                <>
                  <TextField
                    label="Employee Code"
                    required
                    slotProps={{
                      htmlInput: { maxLength: 50 },
                    }}
                    value={employeeForm.employee_code}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        employee_code: e.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Full Name"
                    required
                    slotProps={{
                      htmlInput: { maxLength: 150 },
                    }}
                    value={employeeForm.full_name}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        full_name: e.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Designation"
                    value={employeeForm.designation}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        designation: e.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Phone"
                    value={employeeForm.phone}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        phone: e.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Email"
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        email: e.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Joining Date"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={employeeForm.joining_date}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        joining_date: e.target.value,
                      })
                    }
                  />

                  <TextField
                    select
                    label="Salary Type"
                    value={employeeForm.salary_type}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        salary_type: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="piece_rate">Piece rate</MenuItem>
                    <MenuItem value="daily">Daily wage</MenuItem>
                  </TextField>

                  {employeeForm.salary_type === "daily" && (
                    <TextField
                      label="Daily Rate"
                      type="number"
                      required
                      slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                      value={employeeForm.daily_rate}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          daily_rate: e.target.value,
                        })
                      }
                    />
                  )}

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={employeeForm.is_tailor}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            is_tailor: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Employee is a tailor"
                  />
                </>
              )}

              {activeDialog === "operation" && (
                <>
                  <TextField
                    label="Operation Code"
                    required
                    value={operationForm.operation_code}
                    onChange={(e) =>
                      setOperationForm({
                        ...operationForm,
                        operation_code: e.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Operation Name"
                    required
                    value={operationForm.operation_name}
                    onChange={(e) =>
                      setOperationForm({
                        ...operationForm,
                        operation_name: e.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Default Piece Rate"
                    type="number"
                    slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                    value={operationForm.default_piece_rate}
                    onChange={(e) =>
                      setOperationForm({
                        ...operationForm,
                        default_piece_rate: e.target.value,
                      })
                    }
                  />
                </>
              )}

              {activeDialog === "assignment" && (
                <>
                  {loadingOptions && (
                    <Alert severity="info">
                      Loading employees, operations, and requirements…
                    </Alert>
                  )}

                  <TextField
                    select
                    label="Production Requirement"
                    required
                    value={assignmentForm.production_requirement_id}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        production_requirement_id: e.target.value,
                      })
                    }
                  >
                    {requirements
                      .filter(
                        (item) =>
                          !["COMPLETED", "CANCELLED"].includes(
                            item.status.toUpperCase()
                          )
                      )
                      .map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.order_number} — {item.product_name} (
                          {Math.max(
                            0,
                            Number(item.required_quantity) -
                              Number(item.produced_quantity)
                          )}{" "}
                          remaining)
                        </MenuItem>
                      ))}
                  </TextField>

                  <TextField
                    select
                    label="Employee"
                    required
                    value={assignmentForm.employee_id}
                    onChange={(e) => {
                      const employee = employees.find(
                        (item) => item.id === e.target.value
                      );

                      setAssignmentForm({
                        ...assignmentForm,
                        employee_id: e.target.value,
                        ...(employee?.salary_type === "daily"
                          ? {
                              pay_type: "daily",
                              agreed_rate: String(employee.daily_rate ?? ""),
                            }
                          : {}),
                      });
                    }}
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.employee_code} — {employee.full_name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Operation"
                    required
                    value={assignmentForm.operation_id}
                    onChange={(e) => {
                      const operation = operations.find(
                        (item) => item.id === e.target.value
                      );

                      setAssignmentForm({
                        ...assignmentForm,
                        operation_id: e.target.value,
                        agreed_rate:
                          operation?.default_piece_rate == null
                            ? ""
                            : String(operation.default_piece_rate),
                      });
                    }}
                  >
                    {operations.map((operation) => (
                      <MenuItem key={operation.id} value={operation.id}>
                        {operation.operation_code} — {operation.operation_name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Target Quantity"
                    type="number"
                    required
                    slotProps={{ htmlInput: { min: 0.01, step: "any" } }}
                    value={assignmentForm.target_quantity}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        target_quantity: e.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Due Date"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={assignmentForm.due_date}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        due_date: e.target.value,
                      })
                    }
                  />

                  <TextField
                    select
                    label="Payment Type"
                    value={assignmentForm.pay_type}
                    onChange={(e) => {
                      const payType = e.target.value;

                      setAssignmentForm({
                        ...assignmentForm,
                        pay_type: payType,
                        agreed_rate:
                          payType === "daily" && selectedEmployee?.daily_rate != null
                            ? String(selectedEmployee.daily_rate)
                            : payType === "piece_rate" &&
                                selectedOperation?.default_piece_rate != null
                              ? String(selectedOperation.default_piece_rate)
                              : "",
                      });
                    }}
                  >
                    <MenuItem value="piece_rate">Piece rate</MenuItem>
                    <MenuItem
                      value="daily"
                      disabled={selectedEmployee?.daily_rate == null}
                    >
                      Daily wage
                    </MenuItem>
                  </TextField>

                  <TextField
                    label={
                      assignmentForm.pay_type === "daily"
                        ? "Agreed Daily Rate"
                        : "Agreed Rate Per Piece"
                    }
                    type="number"
                    required
                    slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                    value={assignmentForm.agreed_rate}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        agreed_rate: e.target.value,
                      })
                    }
                  />
                </>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                saving ||
                (activeDialog === "assignment" &&
                  (loadingOptions ||
                    requirements.length === 0 ||
                    employees.length === 0 ||
                    operations.length === 0))
              }
            >
              {saving
                ? "Saving…"
                : activeDialog === "employee"
                  ? editingEmployeeId
                    ? "Save Changes"
                    : "Create Employee"
                  : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}