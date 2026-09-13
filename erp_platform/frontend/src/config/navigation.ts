import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import BusinessIcon from "@mui/icons-material/Business";

import type { SvgIconComponent } from "@mui/icons-material";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon: SvgIconComponent;
  roles?: string[];
}

export interface NavigationGroup {
  id: string;
  title: string;
  items: NavigationItem[];
}

export const navigation: NavigationGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    items: [
      {
        id: "dashboard-home",
        title: "Dashboard",
        path: "/",
        icon: DashboardIcon,
      },
    ],
  },
  {
    id: "masters",
    title: "Masters",
    items: [
      {
        id: "company",
        title: "Company",
        path: "/company",
        icon: BusinessIcon,
        roles: ["ADMIN"],
      },
      {
        id: "users",
        title: "Users",
        path: "/users",
        icon: ManageAccountsOutlinedIcon,
        roles: ["ADMIN"],
      },
      {
        id: "customers",
        title: "Customers",
        path: "/customers",
        icon: PeopleIcon,
      },
      {
        id: "products",
        title: "Products",
        path: "/products",
        icon: Inventory2Icon,
      },
    ],
  },
  {
    id: "sales",
    title: "Sales",
    items: [
      {
        id: "sales-orders",
        title: "Sales Orders",
        path: "/sales",
        icon: ShoppingCartIcon,
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    items: [
      {
        id: "inventory-home",
        title: "Inventory",
        path: "/inventory",
        icon: WarehouseIcon,
      },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    items: [
      {
        id: "reports-home",
        title: "Reports",
        path: "/reports",
        icon: AssessmentIcon,
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    items: [
      {
        id: "settings-home",
        title: "Settings",
        path: "/settings",
        icon: SettingsIcon,
      },
    ],
  },
];
