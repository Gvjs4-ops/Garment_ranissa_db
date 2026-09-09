import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

import { useState } from "react";

import {
  deactivateUser,
  type CompanyUser,
} from "../../api/users";

interface RemoveUserDialogProps {
  open: boolean;
  user: CompanyUser | null;
  onClose: () => void;
  onUserRemoved: (
    companyUserId: string
  ) => void;
}

export default function RemoveUserDialog({
  open,
  user,
  onClose,
  onUserRemoved,
}: RemoveUserDialogProps) {
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const handleClose = () => {
    if (submitting) {
      return;
    }

    setError(null);
    onClose();
  };

  const handleRemove = async () => {
    if (!user) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await deactivateUser(user.id);

      onUserRemoved(user.id);
      onClose();
    } catch (err) {
      console.error(
        "Failed to remove user access:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove user access."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Remove User Access?
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        <DialogContentText>
          You are about to remove ERP access
          for{" "}
          <strong>
            {user?.email || "this user"}
          </strong>
          .
        </DialogContentText>

        <DialogContentText sx={{ mt: 2 }}>
          Their login account will not be
          permanently deleted. Their company
          membership will be marked inactive,
          so access can be restored later.
        </DialogContentText>
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
          color="error"
          variant="contained"
          onClick={handleRemove}
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
            ? "Removing..."
            : "Remove Access"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}