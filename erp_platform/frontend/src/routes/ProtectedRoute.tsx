import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Box,
  CircularProgress,
} from "@mui/material";

import { Navigate } from "react-router-dom";

import { supabase } from "../lib/supabase";


interface ProtectedRouteProps {
  children: ReactNode;
}


export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const [loading, setLoading] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);


  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setAuthenticated(
          Boolean(session)
        );

        setLoading(false);
      }
    };

    checkSession();


    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setAuthenticated(
            Boolean(session)
          );

          setLoading(false);
        }
      }
    );


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }


  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return <>{children}</>;
}