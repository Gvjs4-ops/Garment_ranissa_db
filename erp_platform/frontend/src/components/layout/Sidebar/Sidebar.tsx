import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import { useAuth } from "../../../contexts/AuthContext";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";

import { useViewMode } from "../../../contexts/ViewModeContext";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  useCustomerConfig,
} from "../../../config/customers/CustomerConfigContext";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
const DRAWER_WIDTH = 240;
const TOPBAR_HEIGHT = 72;


interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}


const menuItems: MenuItem[] = [
  {
    id : "dashboard",
    label: "Dashboard",
    path: "/",
    icon: <DashboardOutlinedIcon />,
    roles: [
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EXECUTIVE",
      "INVENTORY_MANAGER",
      "PRODUCTION_MANAGER",
      "ACCOUNTANT",
      "USER",
    ],
  },

  {
    id : "company",
    label: "Company",
    path: "/company",
    icon: <BusinessOutlinedIcon />,
    roles: [
      "ADMIN",
    ],
  },

{
    id : "users",
  label: "Users",
  path: "/users",
  icon: <ManageAccountsOutlinedIcon />,
  roles: [
    "ADMIN",
  ],
},

  {
    id : "customers",
    label: "Customers",
    path: "/customers",
    icon: <PeopleAltOutlinedIcon />,
    roles: [
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EXECUTIVE",
      "ACCOUNTANT",
    ],
  },

  {
    id : "products",
    label: "Products",
    path: "/products",
    icon: <Inventory2OutlinedIcon />,
    roles: [
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EXECUTIVE",
      "INVENTORY_MANAGER",
      "PRODUCTION_MANAGER",
      "ACCOUNTANT",
    ],
  },

  {
    id : "sales",
    label: "Sales",
    path: "/sales",
    icon: <ShoppingCartOutlinedIcon />,
    roles: [
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EXECUTIVE",
      "ACCOUNTANT",
    ],
  },

  {
    id : "inventory",
    label: "Inventory",
    path: "/inventory",
    icon: <WarehouseOutlinedIcon />,
    roles: [
      "ADMIN",
      "INVENTORY_MANAGER",
      "PRODUCTION_MANAGER",
    ],
  },

{
  id: "production",
  label: "Production",
  path: "/production",
  icon: <FactoryOutlinedIcon />,
  roles: [
    "ADMIN",
    "PRODUCTION_MANAGER",
  ],
},
{
  id: "payroll",
  label: "Payroll",
  path: "/payroll",
  icon: <PaymentsOutlinedIcon />,
  roles: ["ADMIN", "ACCOUNTANT"],
},
  {
    id : "reports",
    label: "Reports",
    path: "/reports",
    icon: <AssessmentOutlinedIcon />,
    roles: [
      "ADMIN",
      "SALES_MANAGER",
      "ACCOUNTANT",
    ],
  },
];


export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isDeveloperMode,
    effectiveRole,
  } = useViewMode();

  const {
    role,
    loadingAuth,
  } = useAuth();

  const {
    config: customerConfig,
    loading: loadingConfig,
  } = useCustomerConfig();

  if (loadingAuth || loadingConfig) {
    return null;
  }

  const activeRole = String(effectiveRole || role || "")
    .toUpperCase();

  const visibleMenuItems = menuItems.filter((item) => {
    if (!activeRole) {
      return false;
    }

    // Platform-only menus must not appear in customer preview.
    if (
      ["company", "platform-companies", "users"].includes(item.id)
    ) {
      if (!isDeveloperMode) {
        return false;
      }
    }

    const moduleEnabled =
      customerConfig.modules[
        item.id as keyof typeof customerConfig.modules
      ];

    const roleAllowed = item.roles.includes(activeRole);

    const sidebarItem = customerConfig.sidebar.items.find(
      (configuredItem) => configuredItem.id === item.id
    );

    const sidebarEnabled = sidebarItem?.enabled ?? true;

    return (
      moduleEnabled &&
      roleAllowed &&
      sidebarEnabled
    );
  });


  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,

        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          top: `${TOPBAR_HEIGHT}px`,
          height: `calc(100% - ${TOPBAR_HEIGHT}px)`,
          borderRight: 1,
          borderColor: "divider",
        },
      }}
    >
      <Box
        sx={{
          overflow: "auto",
        }}
      >
       

<List>
  {!loadingAuth &&
    visibleMenuItems.map((item) => {
      const selected =
        item.path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.path);

      return (
        <ListItemButton
          key={item.path}
          selected={selected}
          onClick={() => navigate(item.path)}
          sx={{ mx: 1, mb: 0.5, borderRadius: 1 }}
        >
<ListItemIcon
  sx={{
    minWidth: 40,
    color: "primary.main",
  }}
>
  {item.icon}
</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      );
    })}

  {!loadingConfig &&
    customerConfig.sidebar.customSections
      .filter((section) => section.enabled)
      .map((section) => (
        
<Box key={section.id}>

          {section.items
            .filter((item) => item.enabled)
            .map((item) => (
              
<ListItemButton
  key={item.id}
  selected={
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.path)
  }
  onClick={() => navigate(item.path)}
  sx={{
    mx: 1,
    mb: 0.5,
    borderRadius: 1,
  }}
>
  <ListItemIcon sx={{ minWidth: 40 }}>
    <FactoryOutlinedIcon />
  </ListItemIcon>

  <ListItemText primary={item.label} />
</ListItemButton>
            ))}
        </Box>
      ))}
</List>
 </Box>
  </Drawer>
);
}
