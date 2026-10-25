
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

export type ViewMode = "DEVELOPER" | "CUSTOMER";
export type SupportAccessLevel = "READ_ONLY" | "FULL";

interface ActiveSupportSession {
  id: string;
  company_id: string;
  access_level: SupportAccessLevel;
  expires_at: string;
}

interface ViewModeContextValue {
  mode: ViewMode;
  isPlatformAdmin: boolean;
  isPlatformDeveloper: boolean;
  isDeveloperMode: boolean;
  isCustomerPreview: boolean;

  previewCompanyId: string | null;
  previewRole: string | null;
  effectiveRole: string | null;

  supportSessionId: string | null;
  supportCompanyId: string | null;
  supportAccessLevel: SupportAccessLevel | null;
  supportExpiresAt: string | null;
  isSupportAccessActive: boolean;
  startingSupportSession: boolean;
  endingSupportSession: boolean;

  setMode: (mode: ViewMode) => void;
  setPreviewCompanyId: (id: string | null) => void;
  setPreviewRole: (role: string | null) => void;

  startSupportSession: (
    companyId: string,
    accessLevel: SupportAccessLevel,
    reason: string,
  ) => Promise<void>;

  endSupportSession: () => Promise<void>;
}

const ViewModeContext =
  createContext<ViewModeContextValue | undefined>(undefined);

export function ViewModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    role,
    loadingAuth,
    isPlatformAdmin: authIsPlatformAdmin,
  } = useAuth();

  const isPlatformAdmin =
    !loadingAuth && authIsPlatformAdmin === true;

  // Retained for compatibility with existing components.
  const isPlatformDeveloper = isPlatformAdmin;

  const [requestedMode, setRequestedMode] =
    useState<ViewMode>("DEVELOPER");

  const [previewCompanyId, setPreviewCompanyIdState] =
    useState<string | null>(null);

  const [previewRole, setPreviewRoleState] =
    useState<string | null>(null);

  const [supportSessionId, setSupportSessionId] =
    useState<string | null>(null);

  const [supportCompanyId, setSupportCompanyId] =
    useState<string | null>(null);

  const [supportAccessLevel, setSupportAccessLevel] =
    useState<SupportAccessLevel | null>(null);

  const [supportExpiresAt, setSupportExpiresAt] =
    useState<string | null>(null);

  const [startingSupportSession, setStartingSupportSession] =
    useState(false);

  const [endingSupportSession, setEndingSupportSession] =
    useState(false);

  const clearSupportSession = useCallback(() => {
    setSupportSessionId(null);
    setSupportCompanyId(null);
    setSupportAccessLevel(null);
    setSupportExpiresAt(null);
  }, []);

  // Restore an active support session after a page refresh.
  useEffect(() => {
    let cancelled = false;

    const restoreSupportSession = async () => {
      if (loadingAuth || !isPlatformAdmin) {
        if (!loadingAuth) {
          clearSupportSession();
        }
        return;
      }

      const { data, error } = await supabase
        .from("company_support_sessions")
        .select("id, company_id, access_level, expires_at")
        .is("ended_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error(
          "Could not restore support session:",
          error,
        );
        return;
      }

      if (!data) {
        clearSupportSession();
        return;
      }

      const session = data as ActiveSupportSession;

      setSupportSessionId(session.id);
      setSupportCompanyId(session.company_id);
      setSupportAccessLevel(session.access_level);
      setSupportExpiresAt(session.expires_at);
    };

    void restoreSupportSession();

    return () => {
      cancelled = true;
    };
  }, [
    loadingAuth,
    isPlatformAdmin,
    clearSupportSession,
  ]);

  // Non-platform-admins can never enter platform modes or support access.
  useEffect(() => {
    if (!loadingAuth && !isPlatformAdmin) {
      setRequestedMode("CUSTOMER");
      setPreviewCompanyIdState(null);
      setPreviewRoleState(null);
      clearSupportSession();
    }
  }, [loadingAuth, isPlatformAdmin, clearSupportSession]);

  const mode: ViewMode = isPlatformAdmin
    ? requestedMode
    : "CUSTOMER";

  const isDeveloperMode =
    isPlatformAdmin && mode === "DEVELOPER";

  const isCustomerPreview =
    isPlatformAdmin && mode === "CUSTOMER";

  const isSupportAccessActive =
    Boolean(supportSessionId && supportCompanyId && supportAccessLevel);

  const setMode = useCallback(
    (nextMode: ViewMode) => {
      if (!isPlatformAdmin) return;

      // Require the active support session to end before switching modes.
      if (supportSessionId) return;

      setRequestedMode(nextMode);
    },
    [isPlatformAdmin, supportSessionId],
  );

  const setCompanyId = useCallback(
    (id: string | null) => {
      if (!isPlatformAdmin) return;
      setPreviewCompanyIdState(id);
    },
    [isPlatformAdmin],
  );

  const setRole = useCallback(
    (nextRole: string | null) => {
      if (!isPlatformAdmin) return;
      setPreviewRoleState(nextRole);
    },
    [isPlatformAdmin],
  );

  const startSupportSession = useCallback(
    async (
      companyId: string,
      accessLevel: SupportAccessLevel,
      reason: string,
    ) => {
      if (!isPlatformAdmin) {
        throw new Error(
          "Only platform administrators can start support access.",
        );
      }

      if (supportSessionId) {
        throw new Error(
          "End the current support session before starting another.",
        );
      }

      if (!companyId) {
        throw new Error("Select a company.");
      }

      if (
        accessLevel !== "READ_ONLY" &&
        accessLevel !== "FULL"
      ) {
        throw new Error("Select a valid support access level.");
      }

      if (reason.trim().length < 10) {
        throw new Error(
          "Enter a support reason of at least 10 characters.",
        );
      }

      setStartingSupportSession(true);

      try {
        const { data, error } = await supabase.rpc(
          "start_company_support_session",
          {
            p_company_id: companyId,
            p_access_level: accessLevel,
            p_reason: reason.trim(),
          },
        );

        if (error) throw error;

        if (typeof data !== "string" || !data) {
          throw new Error(
            "The server did not return a support session ID.",
          );
        }

        // Fetch the server-confirmed session details.
        const { data: session, error: sessionError } =
          await supabase
            .from("company_support_sessions")
            .select("id, company_id, access_level, expires_at")
            .eq("id", data)
            .maybeSingle();

        if (sessionError) throw sessionError;

        if (!session) {
          throw new Error(
            "The support session started, but its details could not be loaded. Refresh and check your active session.",
          );
        }

        const activeSession = session as ActiveSupportSession;

        setSupportSessionId(activeSession.id);
        setSupportCompanyId(activeSession.company_id);
        setSupportAccessLevel(activeSession.access_level);
        setSupportExpiresAt(activeSession.expires_at);
      } finally {
        setStartingSupportSession(false);
      }
    },
    [isPlatformAdmin, supportSessionId],
  );

  const endSupportSession = useCallback(async () => {
    if (!isPlatformAdmin) {
      throw new Error(
        "Only platform administrators can end support access.",
      );
    }

    if (!supportSessionId) {
      clearSupportSession();
      return;
    }

    setEndingSupportSession(true);

    try {
      const { data, error } = await supabase.rpc(
        "end_company_support_session",
        {
          p_session_id: supportSessionId,
        },
      );

      if (error) throw error;

      if (data !== true) {
        throw new Error(
          "The server did not confirm that the support session ended.",
        );
      }

      clearSupportSession();
    } finally {
      setEndingSupportSession(false);
    }
  }, [
    isPlatformAdmin,
    supportSessionId,
    clearSupportSession,
  ]);

  const value = useMemo(
    () => ({
      mode,
      isPlatformAdmin,
      isPlatformDeveloper,
      isDeveloperMode,
      isCustomerPreview,

      previewCompanyId,
      previewRole,
      effectiveRole:
        isCustomerPreview && previewRole
          ? previewRole
          : role,

      supportSessionId,
      supportCompanyId,
      supportAccessLevel,
      supportExpiresAt,
      isSupportAccessActive,
      startingSupportSession,
      endingSupportSession,

      setMode,
      setPreviewCompanyId: setCompanyId,
      setPreviewRole: setRole,
      startSupportSession,
      endSupportSession,
    }),
    [
      mode,
      isPlatformAdmin,
      isPlatformDeveloper,
      isDeveloperMode,
      isCustomerPreview,
      previewCompanyId,
      previewRole,
      role,
      supportSessionId,
      supportCompanyId,
      supportAccessLevel,
      supportExpiresAt,
      isSupportAccessActive,
      startingSupportSession,
      endingSupportSession,
      setMode,
      setCompanyId,
      setRole,
      startSupportSession,
      endSupportSession,
    ],
  );

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);

  if (!context) {
    throw new Error(
      "useViewMode must be used inside ViewModeProvider",
    );
  }

  return context;
}
