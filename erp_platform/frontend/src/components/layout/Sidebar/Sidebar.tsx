import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useState, Fragment} from "react";
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
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import { useViewMode } from "../../../contexts/ViewModeContext";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  useCustomerConfig,
} from "../../../config/customers/CustomerConfigContext";

const DRAWER_WIDTH = 240;
const TOPBAR_HEIGHT = 72;

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  children?: {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
  }[];
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
  children: [
    {
      id: "cutting",
      label: "Cutting",
      path: "/REPLACE_WITH_EXISTING_CUTTING_ROUTE",
      icon: <ContentCutOutlinedIcon />,
    },
    {
      id: "stitching",
      label: "Stitching",
      path: "/REPLACE_WITH_EXISTING_STITCHING_ROUTE",
      icon: <CheckroomOutlinedIcon />,
    },
    {
      id: "finishing",
      label: "Finishing",
      path: "/REPLACE_WITH_EXISTING_FINISHING_ROUTE",
      icon: <TaskAltOutlinedIcon />,
    },
  ],
},
{
  id: "payroll",
  label: "Payroll",
  path: "/payroll",
  icon: <PaymentsOutlinedIcon />,
  roles: ["ADMIN", "ACCOUNTANT"],
  children: [
    {
      id: "advance-payments",
      label: "Advance Payments",
      path: "/payroll/advances",
      icon: <RequestQuoteOutlinedIcon />,
    },
  ],
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
const [expandedMenus, setExpandedMenus] = useState<
  Record<string, boolean>
>({
  payroll: location.pathname.startsWith("/payroll/"),
});

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
        : location.pathname === item.path;

    const hasChildren = Boolean(item.children?.length);

    const configuredParent = customerConfig.sidebar.items.find(
      (configuredItem) => configuredItem.id === item.id
    );

    const configuredChildren = configuredParent?.children ?? [];

    const visibleChildren = (item.children ?? []).filter((child) => {
      const configuredChild = configuredChildren.find(
        (configuredItem) => configuredItem.id === child.id
      );

      return configuredChild?.enabled ?? true;
    });

    const isExpanded = Boolean(expandedMenus[item.id]);

    return (
      <Fragment key={item.id}>
        <ListItemButton
          selected={selected}
          onClick={() => {
            if (hasChildren) {
              setExpandedMenus((previous) => ({
                ...previous,
                [item.id]: !previous[item.id],
              }));
            }

            navigate(item.path);
          }}
          sx={{ mx: 1, mb: 0.5, borderRadius: 1 }}
        >
          <ListItemIcon
            sx={{ minWidth: 40, color: "primary.main" }}
          >
            {item.icon}
          </ListItemIcon>

          <ListItemText primary={item.label} />

          {hasChildren &&
            (isExpanded ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {visibleChildren.map((child) => {
                const childSelected =
                  location.pathname === child.path;

                const configuredChild = configuredChildren.find(
                  (configuredItem) => configuredItem.id === child.id
                );

                return (
                  <ListItemButton
                    key={child.id}
                    selected={childSelected}
                    onClick={() => navigate(child.path)}
                    sx={{
                      pl: 5,
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 36, color: "primary.main" }}
                    >
                      {child.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={configuredChild?.label ?? child.label}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Collapse>
        )}
      </Fragment>
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
