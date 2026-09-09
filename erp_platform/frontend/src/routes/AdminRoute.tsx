import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import { useAuth } from "../contexts/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({
  children,
}: AdminRouteProps) {
  const {
    role,
    loadingAuth,
  } = useAuth();

  const location = useLocation();

  if (loadingAuth) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress />

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Checking access...
        </Typography>
      </Box>
    );
  }

  if (role !== "ADMIN") {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <>{children}</>;
}