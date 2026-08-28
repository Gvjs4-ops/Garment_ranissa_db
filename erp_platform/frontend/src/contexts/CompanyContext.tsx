import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] =
    useState<Company | null>(null);

  const [loadingCompanies, setLoadingCompanies] =
    useState(true);


  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await fetchCompanies();

        setCompanies(data);

        if (data.length > 0) {
          setActiveCompany(data[0]);
        }
      } catch (error) {
        console.error(
          "Failed to load companies:",
          error
        );
      } finally {
        setLoadingCompanies(false);
      }
    }

    loadCompanies();
  }, []);


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
