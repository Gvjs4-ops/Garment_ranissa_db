import type { CustomerConfig } from "./types";

export const defaultCustomerConfig: CustomerConfig = {
  company: {
    name: "Garment ERP",
  },

  theme: {
    preset: "corporateBlue",
    mode: "light",
    borderRadius: 8,
    density: "comfortable",
  },

  modules: {
    dashboard: true,
    company: true,
    users: true,
    customers: true,
    products: true,
    sales: true,
    inventory: true,
    reports: true,
    production: true,
    finance: false,
    payroll: true,
  },

  sidebar: {
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/",
        enabled: true,
      },
      {
        id: "company",
        label: "Company",
        path: "/company",
        enabled: true,
      },
      {
        id: "users",
        label: "Users",
        path: "/users",
        enabled: true,
      },
      {
        id: "customers",
        label: "Customers",
        path: "/customers",
        enabled: true,
      },
      {
        id: "products",
        label: "Products",
        path: "/products",
        enabled: true,
      },
      {
        id: "sales",
        label: "Sales",
        path: "/sales",
        enabled: true,
      },
      {
        id: "inventory",
        label: "Inventory",
        path: "/inventory",
        enabled: true,
      },
      {
        id: "reports",
        label: "Reports",
        path: "/reports",
        enabled: true,
      },
      {
	id: "payroll",
	label: "Payroll",
	path: "/payroll",
	enabled: true,
      },
    ],

    customSections: [],
  },

  dashboard: {
    kpis: [
      "total_sales",
      "sales_orders",
      "production",
      "receivables",
    ],

    widgets: [
      "recent_sales_orders",
      "production_status",
      "sales_trend",
    ],
  },

  labels: {
    dashboard: "Executive Dashboard",
    customers: "Customers",
    products: "Products",
    sales: "Sales",
    inventory: "Inventory",
    reports: "Reports",
    users: "Users",
    company: "Company",
  },
};
