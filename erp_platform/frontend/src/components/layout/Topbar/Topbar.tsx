import {
  Alert,
  AppBar,
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";

import { useAuth } from "../../../contexts/AuthContext";
import { useViewMode } from "../../../contexts/ViewModeContext";
import type { SupportAccessLevel } from "../../../contexts/ViewModeContext";
import { useCompany } from "../../../contexts/CompanyContext";
import { useCustomerConfig } from "../../../config/customers/CustomerConfigContext";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { API_BASE_URL } from "../../../config/api";
import { apiFetch } from "../../../api/apiClient";

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

interface ReportsSummaryResponse {
  low_stock_items?: LowStockItem[];
  recent_orders?: RecentOrder[];
}

interface SupportPermissions {
  can_read_support: boolean;
  can_full_support: boolean;
}

export default function Topbar() {
  const TOPBAR_HEIGHT = 72;

  const { user, role } = useAuth();
  const { config: customerConfig } = useCustomerConfig();

  const {
    mode,
    isPlatformAdmin,
    isDeveloperMode,
    isCustomerPreview,
    previewCompanyId,
    previewRole,
    setMode,
    setPreviewCompanyId,
    setPreviewRole,

    supportSessionId,
    supportCompanyId,
    supportAccessLevel,
    supportExpiresAt,
    isSupportAccessActive,
    startingSupportSession,
    endingSupportSession,
    startSupportSession,
    endSupportSession,
  } = useViewMode();

  const {
    companies,
    activeCompany,
    setActiveCompany,
    loadingCompanies,
  } = useCompany();

  const navigate = useNavigate();

  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);

  const [userAnchor, setUserAnchor] =
    useState<null | HTMLElement>(null);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  // Support Access dialog state.
  const [supportDialogOpen, setSupportDialogOpen] =
    useState(false);

  const [supportCompanyChoice, setSupportCompanyChoice] =
    useState<string | null>(null);

  const [supportLevelChoice, setSupportLevelChoice] =
    useState<SupportAccessLevel>("READ_ONLY");

  const [supportReason, setSupportReason] =
    useState("");

  const [supportPermissions, setSupportPermissions] =
    useState<SupportPermissions | null>(null);

  const [supportPermissionLoading, setSupportPermissionLoading] =
    useState(false);

  const [supportPermissionError, setSupportPermissionError] =
    useState<string | null>(null);

  const [supportActionError, setSupportActionError] =
    useState<string | null>(null);

  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  const activeSupportCompany = companies.find(
    (company) => company.id === supportCompanyId,
  );

  useEffect(() => {
    let cancelled = false;

    const loadSupportPermissions = async () => {
      if (!isPlatformAdmin) {
        setSupportPermissions(null);
        setSupportPermissionError(null);
        return;
      }

      setSupportPermissionLoading(true);
      setSupportPermissionError(null);

      try {
        const { data, error } = await supabase
          .from("platform_admin_support_permissions")
          .select("can_read_support, can_full_support")
          .eq("user_id", user?.id ?? "")
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        setSupportPermissions(data ?? null);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load support permissions:",
          error,
        );

        setSupportPermissions(null);
        setSupportPermissionError(
          "Could not verify your Support Access permissions. Please check your database policies and try again.",
        );
      } finally {
        if (!cancelled) {
          setSupportPermissionLoading(false);
        }
      }
    };

    void loadSupportPermissions();

    return () => {
      cancelled = true;
    };
  }, [isPlatformAdmin, user?.id]);

  // If READ_ONLY is not permitted, prefer FULL only when it is permitted.
  useEffect(() => {
    if (!supportPermissions) return;

    if (
      supportLevelChoice === "READ_ONLY" &&
      !supportPermissions.can_read_support &&
      supportPermissions.can_full_support
    ) {
      setSupportLevelChoice("FULL");
    } else if (
      supportLevelChoice === "FULL" &&
      !supportPermissions.can_full_support &&
      supportPermissions.can_read_support
    ) {
      setSupportLevelChoice("READ_ONLY");
    }
  }, [supportPermissions, supportLevelChoice]);

  const loadNotifications = async () => {
    try {
      const data = await apiFetch<ReportsSummaryResponse>(
        `${API_BASE_URL}/reports/summary`,
      );

      const notificationList: NotificationItem[] = [];

      data.low_stock_items?.forEach((item: LowStockItem) => {
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
              item.quantity_available,
            ).toLocaleString("en-IN")} available.`,
          detail: item.warehouse_name,
          time: "Inventory Alert",
          unread: true,
        });
      });

      data.recent_orders?.slice(0, 5).forEach(
        (order: RecentOrder) => {
          notificationList.push({
            id: `order-${order.id}`,
            type: "SALES_ORDER",
            title: "Sales Order",
            message:
              `${order.order_number} • ` +
              `${order.customer_name}`,
            detail: new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(Number(order.total_amount || 0)),
            time: new Date(order.order_date).toLocaleDateString(
              "en-IN",
            ),
            unread: false,
          });
        },
      );

      setNotifications(notificationList.slice(0, 10));
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleOpenNotifications = async (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    setNotificationAnchor(event.currentTarget);
    await loadNotifications();
  };

  const handleCloseNotifications = () => {
    setNotificationAnchor(null);
  };

  const handleOpenUserMenu = (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    setUserAnchor(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setUserAnchor(null);
  };

  const handleLogout = async () => {
    try {
      // End support first so the action is audited when possible.
      if (supportSessionId) {
        try {
          await endSupportSession();
        } catch (error) {
          console.error(
            "Could not end support session before logout:",
            error,
          );
        }
      }

      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) throw error;

      setUserAnchor(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const openSupportDialog = () => {
    setSupportActionError(null);
    setSupportReason("");
    setSupportCompanyChoice(null);
    setSupportLevelChoice(
      supportPermissions?.can_read_support
        ? "READ_ONLY"
        : "FULL",
    );
    setSupportDialogOpen(true);
  };

  const closeSupportDialog = () => {
    if (startingSupportSession) return;
    setSupportDialogOpen(false);
    setSupportActionError(null);
  };

  const handleStartSupport = async () => {
    setSupportActionError(null);

    if (!supportCompanyChoice) {
      setSupportActionError("Select a company.");
      return;
    }

    if (!supportPermissions) {
      setSupportActionError(
        "Your Support Access permissions could not be verified.",
      );
      return;
    }

    if (
      supportLevelChoice === "READ_ONLY" &&
      !supportPermissions.can_read_support
    ) {
      setSupportActionError(
        "You are not permitted to start READ_ONLY support sessions.",
      );
      return;
    }

    if (
      supportLevelChoice === "FULL" &&
      !supportPermissions.can_full_support
    ) {
      setSupportActionError(
        "You are not permitted to start FULL support sessions.",
      );
      return;
    }

    if (supportReason.trim().length < 10) {
      setSupportActionError(
        "Enter a reason with at least 10 characters.",
      );
      return;
    }

    try {
      await startSupportSession(
        supportCompanyChoice,
        supportLevelChoice,
        supportReason.trim(),
      );

      setSupportDialogOpen(false);
      setSupportReason("");
      setSupportCompanyChoice(null);
    } catch (error) {
      console.error("Failed to start support session:", error);
      setSupportActionError(
        error instanceof Error
          ? error.message
          : "Could not start the support session.",
      );
    }
  };

  const handleEndSupport = async () => {
    setSupportActionError(null);

    try {
      await endSupportSession();
    } catch (error) {
      console.error("Failed to end support session:", error);
      setSupportActionError(
        error instanceof Error
          ? error.message
          : "Could not end the support session.",
      );
    }
  };

  return (
    <>
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
            gap: 1,
          }}
        >
          {/* LEFT */}
          <Typography
            variant="h6"
            color="primary"
            sx={{ fontWeight: 700 }}
          >
            {customerConfig.company.name}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* RIGHT */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {/* ACTIVE SUPPORT SESSION INDICATOR */}
            {isSupportAccessActive && (
              <>
                <Tooltip
                  title={
                    supportExpiresAt
                      ? `Session expires at ${new Date(
                          supportExpiresAt,
                        ).toLocaleString("en-IN")}`
                      : "Support session active"
                  }
                >
                  <Chip
                    icon={<SupportAgentOutlinedIcon />}
                    label={`Support: ${
                      supportAccessLevel === "FULL"
                        ? "FULL"
                        : "READ_ONLY"
                    }`}
                    color={
                      supportAccessLevel === "FULL"
                        ? "error"
                        : "warning"
                    }
                    size="small"
                  />
                </Tooltip>

                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={handleEndSupport}
                  disabled={endingSupportSession}
                >
                  {endingSupportSession
                    ? "Ending…"
                    : "End Support"}
                </Button>
              </>
            )}

            {/* NOTIFICATION BUTTON */}
            <IconButton onClick={handleOpenNotifications}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>

            {isCustomerPreview && (
              <Chip
                label={`Preview: ${
                  companies.find(
                    (company) =>
                      company.id === previewCompanyId,
                  )?.name ?? "Select company"
                }`}
                color="warning"
                size="small"
                sx={{ ml: 1 }}
              />
            )}

            {/* MODE SWITCH */}
            {isPlatformAdmin && (
              <FormControlLabel
                label={
                  isDeveloperMode
                    ? "Developer Mode"
                    : "Customer Preview"
                }
                control={
                  <Switch
                    checked={mode === "DEVELOPER"}
                    disabled={isSupportAccessActive}
                    onChange={(event) =>
                      setMode(
                        event.target.checked
                          ? "DEVELOPER"
                          : "CUSTOMER",
                      )
                    }
                  />
                }
              />
            )}

            {/* PREVIEW CONTROLS */}
            {isPlatformAdmin && isCustomerPreview && (
              <>
                <Autocomplete
                  size="small"
                  options={companies}
                  value={
                    companies.find(
                      (company) =>
                        company.id === previewCompanyId,
                    ) ?? null
                  }
                  loading={loadingCompanies}
                  onChange={(_, company) =>
                    setPreviewCompanyId(company?.id ?? null)
                  }
                  getOptionLabel={(company) => company.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  sx={{ width: 220 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Preview company"
                    />
                  )}
                />

                <FormControl size="small" sx={{ minWidth: 145 }}>
                  <Select
                    native
                    value={previewRole ?? ""}
                    onChange={(event) =>
                      setPreviewRole(
                        event.target.value || null,
                      )
                    }
                    inputProps={{
                      "aria-label": "Preview role",
                    }}
                  >
                    <option value="">Select role</option>
                    <option value="ADMIN">Admin</option>
                    <option value="USER">User</option>
                  </Select>
                </FormControl>

                <Chip
                  size="small"
                  label="Preview only"
                  color="warning"
                  variant="outlined"
                />
              </>
            )}

            {/* NORMAL COMPANY SELECTOR — DEVELOPER MODE ONLY */}
            {!isPlatformAdmin && isDeveloperMode && (
              <Autocomplete
                size="small"
                options={companies}
                value={activeCompany}
                loading={loadingCompanies}
                onChange={(_, company) => setActiveCompany(company)}
                getOptionLabel={(company) => company.name}
                isOptionEqualToValue={(option, value) =>
                  option.id === value.id
                }
                sx={{ width: 220 }}
                renderInput={(params) => (
                  <TextField {...params} label="Company" />
                )}
              />
            )}

            {/* SUPPORT ACCESS ENTRY POINT */}
            {isPlatformAdmin && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<SupportAgentOutlinedIcon />}
                onClick={openSupportDialog}
                disabled={
                  isSupportAccessActive ||
                  supportPermissionLoading ||
                  (!supportPermissions &&
                    !supportPermissionError)
                }
              >
                Support Access
              </Button>
            )}

            {/* NOTIFICATION MENU */}
            <Menu
              anchorEl={notificationAnchor}
              open={Boolean(notificationAnchor)}
              onClose={handleCloseNotifications}
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
                    width: 380,
                    maxHeight: 460,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>
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
                {notifications.map((notification) => (
                  <ListItem
                    key={notification.id}
                    divider
                    sx={{
                      py: 1.5,
                      px: 2,
                      alignItems: "flex-start",
                      backgroundColor: notification.unread
                        ? "action.hover"
                        : "transparent",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: notification.unread
                          ? "primary.main"
                          : "transparent",
                        mt: 1,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notification.unread
                            ? 700
                            : 500,
                        }}
                      >
                        {notification.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.3 }}
                      >
                        {notification.message}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 0.8,
                          gap: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {notification.detail}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {notification.time}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
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
                  onClick={() => {
                    handleCloseNotifications();
                    navigate("/notifications");
                  }}
                  sx={{
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  View all notifications
                </Typography>
              </Box>
            </Menu>

            {/* USER BUTTON */}
            <Box
              onClick={handleOpenUserMenu}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                borderRadius: 2,
                px: 1,
                py: 0.5,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Avatar sx={{ width: 36, height: 36 }}>
                {(
                  user?.user_metadata?.full_name ||
                  user?.email ||
                  "A"
                )
                  .charAt(0)
                  .toUpperCase()}
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
              <Box sx={{ px: 2.5, py: 2 }}>
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

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600 }}
                      noWrap
                    >
                      {user?.user_metadata?.full_name ||
                        user?.email?.split("@")[0] ||
                        "User"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.25 }}
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
                      sx={{ display: "block" }}
                    >
                      Active Company:{" "}
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                        }}
                      >
                        {activeCompany?.name || "No Company"}
                      </Box>
                    </Typography>

                    {isSupportAccessActive && (
                      <Typography
                        variant="caption"
                        color="warning.main"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        Support company:{" "}
                        {activeSupportCompany?.name ??
                          "Loading company"}
                        {" — "}
                        {supportAccessLevel}
                      </Typography>
                    )}
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
                  sx={{ mr: 1.5 }}
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
                  sx={{ mr: 1.5 }}
                />
                Settings
              </MenuItem>

              <Divider />

              <MenuItem onClick={handleLogout}>
                <LogoutOutlinedIcon
                  fontSize="small"
                  sx={{ mr: 1.5 }}
                />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* SUPPORT ACCESS DIALOG */}
      <Dialog
        open={supportDialogOpen}
        onClose={closeSupportDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Start Support Access</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              This starts a time-limited, audited support session.
              Your normal operational company selection will not be
              changed.
            </Alert>

            {supportPermissionError && (
              <Alert severity="error">
                {supportPermissionError}
              </Alert>
            )}

            {supportActionError && (
              <Alert severity="error">
                {supportActionError}
              </Alert>
            )}

            {supportPermissionLoading ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CircularProgress size={20} />
                <Typography variant="body2">
                  Verifying Support Access permissions…
                </Typography>
              </Box>
            ) : (
              <>
                <Autocomplete
                  options={companies}
                  value={
                    companies.find(
                      (company) =>
                        company.id === supportCompanyChoice,
                    ) ?? null
                  }
                  loading={loadingCompanies}
                  onChange={(_, company) =>
                    setSupportCompanyChoice(
                      company?.id ?? null,
                    )
                  }
                  getOptionLabel={(company) => company.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Company to support"
                      required
                    />
                  )}
                />

                <FormControl fullWidth>
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.75, fontWeight: 600 }}
                  >
                    Support permission level
                  </Typography>

                  <Select
                    value={supportLevelChoice}
                    onChange={(event) =>
                      setSupportLevelChoice(
                        event.target.value as SupportAccessLevel,
                      )
                    }
                  >
                    <MenuItem
                      value="READ_ONLY"
                      disabled={
                        !supportPermissions?.can_read_support
                      }
                    >
                      READ_ONLY — view-only support
                    </MenuItem>

                    <MenuItem
                      value="FULL"
                      disabled={
                        !supportPermissions?.can_full_support
                      }
                    >
                      FULL — authorized troubleshooting
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Reason for access"
                  value={supportReason}
                  onChange={(event) =>
                    setSupportReason(event.target.value)
                  }
                  required
                  multiline
                  minRows={3}
                  slotProps={{
                    htmlInput: { maxLength: 1000 },
                  }}
                  helperText="At least 10 characters. This reason is recorded in the support audit log."
                />

                <Alert severity="warning">
                  FULL access should only be used when necessary.
                  Sensitive actions still require their own server-side
                  authorization rules.
                </Alert>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeSupportDialog}
            disabled={startingSupportSession}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleStartSupport}
            disabled={
              startingSupportSession ||
              supportPermissionLoading ||
              !supportPermissions ||
              (!supportPermissions.can_read_support &&
                !supportPermissions.can_full_support)
            }
          >
            {startingSupportSession
              ? "Starting…"
              : "Start Support Session"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}