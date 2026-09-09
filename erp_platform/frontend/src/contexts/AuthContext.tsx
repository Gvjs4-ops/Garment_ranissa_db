import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

type AuthContextValue = {
  user: User | null;
  role: string | null;
  companyId: string | null;
  loadingAuth: boolean;
  accessError: string | null;
};

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [role, setRole] =
    useState<string | null>(null);

  const [companyId, setCompanyId] =
    useState<string | null>(null);

  const [loadingAuth, setLoadingAuth] =
    useState(true);

  const [accessError, setAccessError] =
    useState<string | null>(null);

  const clearAccess = () => {
    setUser(null);
    setRole(null);
    setCompanyId(null);
  };

  const loadUserAccess = async (
    authUser: User
  ): Promise<boolean> => {
    const {
      data,
      error,
    } = await supabase
      .from("company_users")
      .select(
        `
          company_id,
          role,
          is_active
        `
      )
      .eq(
        "user_id",
        authUser.id
      )
      .eq(
        "is_active",
        true
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Failed to load user access:",
        error
      );

      setRole(null);
      setCompanyId(null);

      setAccessError(
        "Unable to verify your ERP access."
      );

      return false;
    }

    if (!data) {
      setRole(null);
      setCompanyId(null);

      setAccessError(
        "Your ERP access is inactive. Contact your administrator."
      );

      return false;
    }

    setRole(data.role);
    setCompanyId(data.company_id);
    setAccessError(null);

    return true;
  };



    /*
      Sign out only this browser session.

      The Supabase Auth account still exists.
      The administrator can reactivate the
      company_users membership later.
    */
const denyAccess = async () => {
  clearAccess();

  await supabase.auth.signOut({
    scope: "local",
  });

  window.location.href =
    "/login?reason=inactive";
};

  useEffect(() => {
    let mounted = true;

    const initializeAuth =
      async () => {
        try {
	const {
	  data: { session },
	} =
	  await supabase.auth.getSession();
	
	if (!session) {
	  clearAccess();
	  return;
	}
          const {
            data: {
              user: authUser,
            },
            error,
          } =
            await supabase.auth.getUser();

          if (!mounted) {
            return;
          }

          if (error) {
            console.error(
              "Failed to get authenticated user:",
              error
            );

            clearAccess();
            return;
          }

          if (!authUser) {
            clearAccess();
            return;
          }

          setUser(authUser);

          const hasAccess =
            await loadUserAccess(
              authUser
            );

          if (
            mounted &&
            !hasAccess
          ) {
            await denyAccess();
          }
        } catch (error) {
          console.error(
            "Failed to initialize auth:",
            error
          );

          if (mounted) {
            clearAccess();
          }
        } finally {
          if (mounted) {
            setLoadingAuth(false);
          }
        }
      };

    initializeAuth();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {
          if (!mounted) {
            return;
          }

          /*
            SIGNED_OUT will also fire after
            denyAccess() calls signOut().
          */
          if (
            event === "SIGNED_OUT" ||
            !session?.user
          ) {
            clearAccess();
            setLoadingAuth(false);
            return;
          }

          const authUser =
            session.user;

          setUser(authUser);

          const hasAccess =
            await loadUserAccess(
              authUser
            );

          if (!hasAccess) {
            await denyAccess();
          }

          if (mounted) {
            setLoadingAuth(false);
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        companyId,
        loadingAuth,
        accessError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}