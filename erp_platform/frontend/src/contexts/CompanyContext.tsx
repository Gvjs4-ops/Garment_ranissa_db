import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  fetchCompanies,
  type Company,
} from "../services/sales";


type CompanyContextValue = {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company | null) => void;
  loadingCompanies: boolean;
};


const CompanyContext =
  createContext<CompanyContextValue | undefined>(
    undefined
  );


export function CompanyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loadingAuth } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] =
    useState<Company | null>(null);

  const [loadingCompanies, setLoadingCompanies] =
    useState(true);

useEffect(() => {
  if (loadingAuth) {
    return;
  }

  if (!user) {
    setLoadingCompanies(false);
    setCompanies([]);
    setActiveCompany(null);
    return;
  }

  async function loadCompanies() {
    try {
      setLoadingCompanies(true);

      const data = await fetchCompanies();

      setCompanies(data);
      setActiveCompany(data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error(
        "Failed to load companies:",
        error
      );

      setCompanies([]);
      setActiveCompany(null);
     // if (data.length > 0) {
	//  console.log("COMPANY LOADED:", data[0]);
	//  setActiveCompany(data[0]);
//	}
    } finally {
      setLoadingCompanies(false);
    }
  }

  loadCompanies();
}, [loadingAuth, user]);
//console.log("COMPANY CONTEXT:", {
//  companies,
//  activeCompany,
//  loadingCompanies,
//});
  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompany,
        loadingCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}


export function useCompany() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error(
      "useCompany must be used inside CompanyProvider"
    );
  }

  return context;
}
