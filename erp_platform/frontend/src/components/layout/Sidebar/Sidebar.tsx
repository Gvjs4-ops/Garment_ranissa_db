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
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

const DRAWER_WIDTH = 240;
const TOPBAR_HEIGHT = 72;


interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}


const menuItems: MenuItem[] = [
  {
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
    label: "Company",
    path: "/company",
    icon: <BusinessOutlinedIcon />,
    roles: [
      "ADMIN",
    ],
  },

{
  label: "Users",
  path: "/users",
  icon: <ManageAccountsOutlinedIcon />,
  roles: [
    "ADMIN",
  ],
},

  {
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
    role,
    loadingAuth,
  } = useAuth();


  const visibleMenuItems =
    menuItems.filter((item) => {
      if (!role) {
        return false;
      }

      return item.roles.includes(role);
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
            visibleMenuItems.map(
              (item) => {
                const selected =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(
                        item.path
                      );

                return (
                  <ListItemButton
                    key={item.path}
                    selected={selected}
                    onClick={() =>
                      navigate(item.path)
                    }
                    sx={{
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.label}
                    />
                  </ListItemButton>
                );
              }
            )}
        </List>
      </Box>
    </Drawer>
  );
}