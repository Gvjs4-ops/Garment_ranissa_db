
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
  isPlatformAdmin: boolean;
};

const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const clearAccess = () => {
    setUser(null);
    setRole(null);
    setCompanyId(null);
    setIsPlatformAdmin(false);
    setAccessError(null);
  };

  const checkPlatformAdmin = async (
    userId: string,
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(
        "Unable to verify platform admin:",
        error.message,
      );
      return false;
    }

    return Boolean(data);
  };

  const loadUserAccess = async (
    authUser: User,
    platformAdmin: boolean,
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from("company_users")
      .select("company_id, role, is_active")
      .eq("user_id", authUser.id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Failed to load user access:", error);
      setRole(null);
      setCompanyId(null);
      setAccessError("Unable to verify your ERP access.");
      return false;
    }

    if (!data) {
      setRole(null);
      setCompanyId(null);

      if (platformAdmin) {
        setAccessError(null);
        return true;
      }

      setAccessError(
        "Your ERP access is inactive. Contact your administrator.",
      );
      return false;
    }

    setRole(data.role);
    setCompanyId(data.company_id);
    setAccessError(null);

    return true;
  };

  const denyAccess = async () => {
    clearAccess();

    await supabase.auth.signOut({ scope: "local" });

    window.location.href = "/login?reason=inactive";
  };

  useEffect(() => {
    let mounted = true;

    const processUser = async (authUser: User) => {
      setLoadingAuth(true);
      setUser(authUser);

      const platformAdmin = await checkPlatformAdmin(authUser.id);

      if (!mounted) return;

      setIsPlatformAdmin(platformAdmin);

      const hasAccess = await loadUserAccess(
        authUser,
        platformAdmin,
      );

      if (!mounted) return;

      if (!hasAccess) {
        await denyAccess();
        return;
      }

      setLoadingAuth(false);
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!mounted) return;

        if (!session?.user) {
          clearAccess();
          setLoadingAuth(false);
          return;
        }

        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        if (!mounted) return;

        if (!authUser) {
          clearAccess();
          setLoadingAuth(false);
          return;
        }

        await processUser(authUser);
      } catch (error) {
        console.error("Failed to initialize auth:", error);

        if (mounted) {
          clearAccess();
          setAccessError("Unable to verify your login.");
          setLoadingAuth(false);
        }
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "INITIAL_SESSION") {
          // Initial session is handled by initializeAuth().
          return;
        }

        if (event === "SIGNED_OUT" || !session?.user) {
          clearAccess();
          setLoadingAuth(false);
          return;
        }

        // Defer Supabase queries until after the auth callback.
        void Promise.resolve().then(() => {
          if (mounted) {
            return processUser(session.user);
          }
        });
      },
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
        isPlatformAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}
