export interface CompanyBranding {
  name: string;
  logoUrl?: string;
  faviconUrl?: string;
  loginLogoUrl?: string;
}

export interface ThemeConfig {
  preset: string;
  mode: "light" | "dark";
  primaryColor?: string;
  secondaryColor?: string;
  borderRadius: number;
  density: "compact" | "comfortable" | "spacious";
  fontFamily?: string;
}

export interface ModuleConfig {
  dashboard: boolean;
  company: boolean;
  users: boolean;
  customers: boolean;
  products: boolean;
  sales: boolean;
  inventory: boolean;
  reports: boolean;
  production: boolean;
  finance: boolean;
  payroll: boolean;
}

export interface SidebarItemConfig {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
}

export interface CustomSidebarSection {
  id: string;
  label: string;
  enabled: boolean;
  items: SidebarItemConfig[];
}

export interface SidebarConfig {
  items: SidebarItemConfig[];
  customSections: CustomSidebarSection[];
}

export interface DashboardConfig {
  kpis: string[];
  widgets: string[];
}

export interface LabelConfig {
  dashboard?: string;
  customers?: string;
  products?: string;
  sales?: string;
  inventory?: string;
  reports?: string;
  users?: string;
  company?: string;
}

export interface CustomerConfig {
  company: CompanyBranding;
  theme: ThemeConfig;
  modules: ModuleConfig;
  sidebar: SidebarConfig;
  dashboard: DashboardConfig;
  labels: LabelConfig;
}
