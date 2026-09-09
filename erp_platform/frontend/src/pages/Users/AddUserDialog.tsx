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
  Typography,
} from "@mui/material";

import {
  createUser,
  USER_ROLES,
  type CompanyUser,
  type UserRole,
} from "../../api/users";

import { useCompany } from "../../contexts/CompanyContext";

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUserCreated: (user: CompanyUser) => void;
}

export default function AddUserDialog({
  open,
  onClose,
  onUserCreated,
}: AddUserDialogProps) {
  const { activeCompany } = useCompany();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState<UserRole>("USER");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFullName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);

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

    if (!password) {
      setError(
        "Temporary password is required."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (!activeCompany?.id) {
      setError(
        "Please select an active company first."
      );
      return;
    }

    try {
      setSubmitting(true);

      const newUser = await createUser({
        full_name: cleanName,
        email: cleanEmail,
        password,
        role,
        company_id: activeCompany.id,
      });

      onUserCreated(newUser);
      onClose();
    } catch (err) {
      console.error(
        "Failed to create user:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create user."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={
        submitting ? undefined : onClose
      }
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Add User
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
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Create a login account and give
            the user access to the selected
            company.
          </Typography>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            label="Company"
            value={
              activeCompany?.name ||
              "No company selected"
            }
            fullWidth
            disabled
          />

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
            label="Temporary Password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            fullWidth
            required
            disabled={submitting}
            helperText="Minimum 6 characters"
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
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
        }}
      >
        <Button
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
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
            ? "Creating..."
            : "Add User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}