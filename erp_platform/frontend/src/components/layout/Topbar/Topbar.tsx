import {
  AppBar,
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useAuth } from "../../../contexts/AuthContext";
import NotificationsNoneOutlinedIcon from
  "@mui/icons-material/NotificationsNoneOutlined";

import LogoutOutlinedIcon from
  "@mui/icons-material/LogoutOutlined";

import SettingsOutlinedIcon from
  "@mui/icons-material/SettingsOutlined";

import PersonOutlineOutlinedIcon from
  "@mui/icons-material/PersonOutlineOutlined";

import { useCompany } from "../../../contexts/CompanyContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
interface RecentOrder {
  id: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  status: string;
  total_amount: number;
}

interface LowStockItem {
  inventory_id: string;
  sku: string | null;
  product_name: string;
  warehouse_name: string;
  quantity_available: number;
  reorder_level: number;
}

interface NotificationItem {
  id: string;
  type: "LOW_STOCK" | "SALES_ORDER";
  title: string;
  message: string;
  detail: string;
  time: string;
  unread: boolean;
}

export default function Topbar() {
  const TOPBAR_HEIGHT = 72;
const {
  user,
  role,
} = useAuth();

const {
  companies,
  activeCompany,
  setActiveCompany,
  loadingCompanies,
} = useCompany();

const navigate = useNavigate();

  const [
    notificationAnchor,
    setNotificationAnchor,
  ] = useState<null | HTMLElement>(null);

  const [
    userAnchor,
    setUserAnchor,
  ] = useState<null | HTMLElement>(null);

const [
  notifications,
  setNotifications,
] = useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

const handleOpenNotifications = async (
  event: React.MouseEvent<HTMLElement>
) => {
  setNotificationAnchor(
    event.currentTarget
  );

  await loadNotifications();
};

  const handleCloseNotifications = () => {
    setNotificationAnchor(null);
  };

  const handleOpenUserMenu = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setUserAnchor(
      event.currentTarget
    );
  };

  const handleCloseUserMenu = () => {
    setUserAnchor(null);
  };

const handleLogout = async () => {
  try {
    const { error } =
      await supabase.auth.signOut({
        scope: "local",
      });

    if (error) {
      throw error;
    }

    setUserAnchor(null);

    window.location.href = "/login";
  } catch (error) {
    console.error(
      "Failed to logout:",
      error
    );
  }
};

const loadNotifications = async () => {
  try {
    const response = await fetch(
      "/api/reports/summary"
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load notifications: ${response.status}`
      );
    }

    const data = await response.json();

    const notificationList: NotificationItem[] =
      [];

    /*
     * LOW STOCK NOTIFICATIONS
     */
    data.low_stock_items?.forEach(
      (item: LowStockItem) => {
        notificationList.push({
          id: `low-stock-${item.inventory_id}`,
          type: "LOW_STOCK",

          title:
            Number(item.quantity_available) <= 0
              ? "Out of Stock"
              : "Low Stock",

          message:
            `${item.product_name} has only ` +
            `${Number(
              item.quantity_available
            ).toLocaleString("en-IN")} available.`,

          detail:
            item.warehouse_name,

          time: "Inventory Alert",

          unread: true,
        });
      }
    );

    /*
     * SALES ORDER NOTIFICATIONS
     */
    data.recent_orders
      ?.slice(0, 5)
      .forEach(
        (order: RecentOrder) => {
          notificationList.push({
            id: `order-${order.id}`,

            type: "SALES_ORDER",

            title: "Sales Order",

            message:
              `${order.order_number} • ` +
              `${order.customer_name}`,

            detail:
              new Intl.NumberFormat(
                "en-IN",
                {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }
              ).format(
                Number(
                  order.total_amount || 0
                )
              ),

            time:
              new Date(
                order.order_date
              ).toLocaleDateString(
                "en-IN"
              ),

            unread: false,
          });
        }
      );

    setNotifications(
      notificationList.slice(0, 10)
    );
  } catch (error) {
    console.error(
      "Failed to load notifications:",
      error
    );

    setNotifications([]);
  }
};

useEffect(() => {
  loadNotifications();
}, []);

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={1}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${TOPBAR_HEIGHT}px !important`,
        }}
      >
        {/* LEFT */}

        <Typography
          variant="h6"
          color="primary"
          sx={{ fontWeight: 700 }}
        >
          Garment ERP
        </Typography>


        <Box sx={{ flexGrow: 1 }} />

        {/* RIGHT */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* NOTIFICATION BUTTON */}

          <IconButton
            onClick={
              handleOpenNotifications
            }
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
            >
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>


          {/* NOTIFICATION MENU */}

          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(
              notificationAnchor
            )}
            onClose={
              handleCloseNotifications
            }
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                width: 380,
                maxHeight: 460,
              },
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
              }}
            >
              <Typography
                fontWeight={700}
              >
                Notifications
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Recent ERP activity
              </Typography>
            </Box>

            <Divider />

            <List disablePadding>
              {notifications.map(
                (notification) => (
                  <ListItem
                    key={
                      notification.id
                    }
                    divider
                    sx={{
                      py: 1.5,
                      px: 2,
                      alignItems:
                        "flex-start",
                      backgroundColor:
                        notification.unread
                          ? "action.hover"
                          : "transparent",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius:
                          "50%",
                        bgcolor:
                          notification.unread
                            ? "primary.main"
                            : "transparent",
                        mt: 1,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />

                    <Box
                      sx={{
                        flex: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={
                          notification.unread
                            ? 700
                            : 500
                        }
                      >
                        {
                          notification.title
                        }
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.3,
                        }}
                      >
                        {
                          notification.message
                        }
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          mt: 0.8,
                          gap: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {
                            notification.detail
                          }
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            notification.time
                          }
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                )
              )}
            </List>

            <Box
              sx={{
                px: 2,
                py: 1.25,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                color="primary"
                fontWeight={600}
                sx={{
                  cursor: "pointer",
                }}
              >
                View all notifications
              </Typography>
            </Box>
          </Menu>


          {/* COMPANY */}

          <Autocomplete
            size="small"
            options={companies}
            value={activeCompany}
            loading={loadingCompanies}
            onChange={(_, value) => {
              setActiveCompany(value);
            }}
            getOptionLabel={(company) => company.name}
            isOptionEqualToValue={(option, value) =>
              option.id === value.id
            }
            isOptionEqualToValue={(
              option,
              value
            ) =>
              option.id === value.id
            }
            sx={{
              width: 250,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Company"
              />
            )}
          />


          {/* USER BUTTON */}

          <Box
            onClick={
              handleOpenUserMenu
            }
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              borderRadius: 2,
              px: 1,
              py: 0.5,

              "&:hover": {
                backgroundColor:
                  "action.hover",
              },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
              }}
            >
              A
            </Avatar>

            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {user?.user_metadata?.full_name ||
	  user?.email?.split("@")[0] ||
	  "Administrator"}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {role
  	? role.replaceAll("_", " ")
	  : "No Role"}
              </Typography>
            </Box>
          </Box>

          {/* USER MENU */}

<Menu
  anchorEl={userAnchor}
  open={Boolean(userAnchor)}
  onClose={handleCloseUserMenu}
  anchorOrigin={{
    vertical: "bottom",
    horizontal: "right",
  }}
  transformOrigin={{
    vertical: "top",
    horizontal: "right",
  }}
  slotProps={{
    paper: {
      sx: {
        mt: 1,
        minWidth: 320,
        borderRadius: 2,
      },
    },
  }}
>
  {/* USER DETAILS */}

  <Box
    sx={{
      px: 2.5,
      py: 2,
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
      }}
    >
      <Avatar
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
        }}
      >
        {(
          user?.user_metadata?.full_name ||
          user?.email ||
          "U"
        )
          .charAt(0)
          .toUpperCase()}
      </Avatar>

      <Box
        sx={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={600}
          noWrap
        >
          {user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "User"}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.25,
          }}
        >
          {role
            ? role.replaceAll("_", " ")
            : "No Role"}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            wordBreak: "break-word",
            mb: 0.5,
          }}
        >
          {user?.email || "No email"}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
          }}
        >
          Active Company:{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            {activeCompany?.name ||
              "No Company"}
          </Box>
        </Typography>
      </Box>
    </Box>
  </Box>

  <Divider />

<MenuItem
  onClick={() => {
    handleCloseUserMenu();
    navigate("/profile");
  }}
>
  <PersonOutlineOutlinedIcon
    fontSize="small"
    sx={{
      mr: 1.5,
    }}
  />

  Profile
</MenuItem>

<MenuItem
  onClick={() => {
    handleCloseUserMenu();
    navigate("/settings");
  }}
>
  <SettingsOutlinedIcon
    fontSize="small"
    sx={{
      mr: 1.5,
    }}
  />

  Settings
</MenuItem>

  <Divider />

  <MenuItem onClick={handleLogout}>
    <LogoutOutlinedIcon
      fontSize="small"
      sx={{
        mr: 1.5,
      }}
    />

    Logout
  </MenuItem>
</Menu>
       
        </Box>
      </Toolbar>
    </AppBar>
  );
}
