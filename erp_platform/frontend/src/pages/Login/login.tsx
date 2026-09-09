import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
const [searchParams] =
  useSearchParams();

const inactiveReason =
  searchParams.get("reason") ===
  "inactive";
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

const [accessMessage, setAccessMessage] =
  useState(
    inactiveReason
      ? "Your ERP access has been deactivated. Please contact your administrator."
      : ""
  );

  const handleLogin = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");
      setAccessMessage("");

      // 1. Authenticate with Supabase
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      if (
        !data.session ||
        !data.user
      ) {
        throw new Error(
          "Login session was not created."
        );
      }

      // 2. Check ERP membership
      const {
        data: membership,
        error: membershipError,
      } =
        await supabase
          .from("company_users")
          .select(`
            company_id,
            role,
            is_active
          `)
          .eq(
            "user_id",
            data.user.id
          )
          .maybeSingle();

      if (membershipError) {
        console.error(
          "Failed to check ERP access:",
          membershipError
        );

        await supabase.auth.signOut({
          scope: "local",
        });

        setAccessMessage(
          "Unable to verify your ERP access. Please contact your administrator."
        );

        return;
      }

      // 3. No company membership
      if (!membership) {
        await supabase.auth.signOut({
          scope: "local",
        });

        setAccessMessage(
          "You do not have access to this ERP. Please contact your administrator."
        );

        return;
      }

      // 4. Membership exists but is inactive
      if (!membership.is_active) {
        await supabase.auth.signOut({
          scope: "local",
        });

        setAccessMessage(
          "Your ERP access has been deactivated. Please contact your administrator."
        );

        return;
      }

      // 5. No role assigned
      if (!membership.role) {
        await supabase.auth.signOut({
          scope: "local",
        });

        setAccessMessage(
          "No ERP role has been assigned to your account. Please contact your administrator."
        );

        return;
      }

      // 6. Valid ERP user
      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      if (error instanceof Error) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Unable to login."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
        }}
      >
        <CardContent
          sx={{
            p: 4,
          }}
        >
          <Stack
            spacing={1}
            mb={3}
          >
            <Typography
              variant="h4"
              fontWeight={700}
              color="primary"
            >
              Garment ERP
            </Typography>

            <Typography
              variant="h6"
              fontWeight={600}
            >
              Sign in
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sign in to access your ERP workspace.
            </Typography>
          </Stack>

          {accessMessage && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
              }}
            >
              {accessMessage}
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

          <Box
            component="form"
            onSubmit={handleLogin}
          >
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
              />

              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                fullWidth
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}