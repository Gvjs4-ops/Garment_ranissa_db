
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "../../lib/supabase";
import { useCompany } from "../../contexts/CompanyContext";
import { useViewMode } from "../../contexts/ViewModeContext";

import { defaultCustomerConfig } from "./defaultConfig";
import type { CustomerConfig } from "./types";

interface CustomerConfigContextValue {
  config: CustomerConfig;
  loading: boolean;
  reloadConfig: () => Promise<void>;
}

const CustomerConfigContext =
  createContext<CustomerConfigContextValue>({
    config: defaultCustomerConfig,
    loading: true,
    reloadConfig: async () => {},
  });

interface CustomerConfigProviderProps {
  children: ReactNode;
}

function mergeConfig(
  data: Partial<CustomerConfig> | null | undefined,
): CustomerConfig {
  return {
    ...defaultCustomerConfig,
    ...data,

    company: {
      ...defaultCustomerConfig.company,
      ...data?.company,
    },

    theme: {
      ...defaultCustomerConfig.theme,
      ...data?.theme,
    },

    modules: {
      ...defaultCustomerConfig.modules,
      ...data?.modules,
    },

    sidebar: {
      ...defaultCustomerConfig.sidebar,
      ...data?.sidebar,
      items:
        data?.sidebar?.items ??
        defaultCustomerConfig.sidebar.items,
      customSections:
        data?.sidebar?.customSections ??
        defaultCustomerConfig.sidebar.customSections,
    },

    dashboard: {
      ...defaultCustomerConfig.dashboard,
      ...data?.dashboard,
    },

    labels: {
      ...defaultCustomerConfig.labels,
      ...data?.labels,
    },
  };
}

export function CustomerConfigProvider({
  children,
}: CustomerConfigProviderProps) {
  const [config, setConfig] =
    useState<CustomerConfig>(defaultCustomerConfig);

  const [loading, setLoading] = useState(true);

  const { activeCompany } = useCompany();

  const {
    isPlatformAdmin,
    isDeveloperMode,
    isCustomerPreview,
    previewCompanyId,

    isSupportAccessActive,
    supportCompanyId,
    supportAccessLevel,
  } = useViewMode();

  // Support company selection is separate from CompanyContext.
  // Never replace activeCompany just to enter support mode.
  const companyId = isSupportAccessActive
    ? supportCompanyId
    : isPlatformAdmin && isCustomerPreview
      ? previewCompanyId
      : activeCompany?.id ?? null;

  const loadConfig = useCallback(async () => {
    if (!companyId) {
      setConfig(defaultCustomerConfig);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Support sessions must never load developer drafts.
      const table =
        !isSupportAccessActive &&
        isPlatformAdmin &&
        isDeveloperMode
          ? "company_config_drafts"
          : "company_config_published";

      const { data, error } = await supabase
        .from(table)
        .select("config")
        .eq("company_id", companyId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data?.config) {
        setConfig(mergeConfig(data.config));
      } else {
        // Preserve the existing externally configured company theme.
        const response = await fetch(
          `/config/company.json?v=${Date.now()}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Could not load company.json");
        }

        const jsonConfig: Partial<CustomerConfig> =
          await response.json();

        setConfig(mergeConfig(jsonConfig));
      }
    } catch (error) {
      console.error(
        "Failed to load company config:",
        error,
      );

      setConfig(defaultCustomerConfig);
    } finally {
      setLoading(false);
    }
  }, [
    companyId,
    isPlatformAdmin,
    isDeveloperMode,
    isSupportAccessActive,
    supportAccessLevel,
  ]);

  const reloadConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  return (
    <CustomerConfigContext.Provider
      value={{ config, loading, reloadConfig }}
    >
      {children}
    </CustomerConfigContext.Provider>
  );
}

export function useCustomerConfig() {
  return useContext(CustomerConfigContext);
}
