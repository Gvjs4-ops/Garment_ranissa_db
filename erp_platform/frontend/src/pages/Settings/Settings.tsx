import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useState } from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";


export default function Settings() {
  const { user } = useAuth();

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");


  const handleChangePassword = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!newPassword) {
      setErrorMessage(
        "Please enter a new password."
      );

      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );

      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setErrorMessage(
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "Password updated successfully."
      );

      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(
        "Failed to update password:",
        error
      );

      if (error instanceof Error) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Unable to update password."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight={700}
        mb={0.5}
      >
        Settings
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        mb={3}
      >
        Manage your ERP account settings.
      </Typography>


      <Card
        sx={{
          maxWidth: 700,
          borderRadius: 3,
        }}
      >
        <CardContent
          sx={{
            p: 3,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
          >
            Account
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
          >
            Your login and account information.
          </Typography>

          <Divider
            sx={{
              my: 2.5,
            }}
          />


          <Stack spacing={2}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Email
              </Typography>

              <Typography>
                {user?.email ||
                  "Not available"}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>


      <Card
        sx={{
          maxWidth: 700,
          borderRadius: 3,
          mt: 3,
        }}
      >
        <CardContent
          sx={{
            p: 3,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
          >
            Security
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
          >
            Change your account password.
          </Typography>

          <Divider
            sx={{
              my: 2.5,
            }}
          />


          {successMessage && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
              }}
            >
              {successMessage}
            </Alert>
          )}


          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
              }}
            >
              {errorMessage}
            </Alert>
          )}


          <Stack spacing={2}>
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value
                )
              }
              fullWidth
            />

            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              fullWidth
            />

            <Box>
              <Button
                variant="contained"
                onClick={
                  handleChangePassword
                }
                disabled={loading}
              >
                {loading
                  ? "Updating..."
                  : "Update Password"}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}