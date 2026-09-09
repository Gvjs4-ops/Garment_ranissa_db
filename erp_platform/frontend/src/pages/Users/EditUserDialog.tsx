import { useEffect, useState } from "react";

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
  TextField,
} from "@mui/material";

import {
  updateUser,
  USER_ROLES,
  type CompanyUser,
  type UserRole,
} from "../../api/users";

interface EditUserDialogProps {
  open: boolean;
  user: CompanyUser | null;
  onClose: () => void;
  onUserUpdated: (user: CompanyUser) => void;
}

export default function EditUserDialog({
  open,
  user,
  onClose,
  onUserUpdated,
}: EditUserDialogProps) {
  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<UserRole>("USER");

  const [isActive, setIsActive] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    setFullName(user.full_name || "");
    setEmail(user.email || "");
    setRole(user.role);
    setIsActive(user.is_active);
    setError(null);
  }, [open, user]);

  const handleSubmit = async () => {
    if (!user) {
      return;
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError("Full name is required.");
      return;
    }

    if (!cleanEmail) {
      setError("Email is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const updatedUser =
        await updateUser(user.id, {
          full_name: cleanName,
          email: cleanEmail,
          role,
          is_active: isActive,
        });

      onUserUpdated(updatedUser);
      onClose();
    } catch (err) {
      console.error(
        "Failed to update user:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update user."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }

    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Edit User
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            pt: 1,
          }}
        >
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            label="Full Name"
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value
              )
            }
            fullWidth
            required
            autoFocus
            disabled={submitting}
          />

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            fullWidth
            required
            disabled={submitting}
          />

          <TextField
            label="Company"
            value={
              user?.company_name || ""
            }
            fullWidth
            disabled
          />

          <TextField
            select
            label="Role"
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value as UserRole
              )
            }
            fullWidth
            disabled={submitting}
          >
            {USER_ROLES.map((item) => (
              <MenuItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status"
            value={
              isActive
                ? "ACTIVE"
                : "INACTIVE"
            }
            onChange={(event) =>
              setIsActive(
                event.target.value ===
                  "ACTIVE"
              )
            }
            fullWidth
            disabled={submitting}
          >
            <MenuItem value="ACTIVE">
              Active
            </MenuItem>

            <MenuItem value="INACTIVE">
              Inactive
            </MenuItem>
          </TextField>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            submitting || !user
          }
          startIcon={
            submitting ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : undefined
          }
        >
          {submitting
            ? "Saving..."
            : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}