import {
  AppBar,
  Autocomplete,
  Avatar,
  Badge,
  Box,
  IconButton,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";

import NotificationsNoneOutlinedIcon from
  "@mui/icons-material/NotificationsNoneOutlined";

import { useCompany } from "../../../contexts/CompanyContext";


export default function Topbar() {
  const TOPBAR_HEIGHT = 72;

  const {
    companies,
    activeCompany,
    setActiveCompany,
    loadingCompanies,
  } = useCompany();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={1}
      sx={{
        zIndex: (theme) =>
          theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          minHeight:
            `${TOPBAR_HEIGHT}px !important`,
        }}
      >
        {/* LEFT */}

        <Typography
          variant="h6"
          fontWeight={700}
          color="primary"
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
          {/* NOTIFICATION */}

          <IconButton>
            <Badge
              badgeContent={3}
              color="error"
            >
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>


          {/* COMPANY */}

          <Autocomplete
            size="small"
            options={companies}
            value={activeCompany}
            loading={loadingCompanies}
            onChange={(_, value) => {
              setActiveCompany(value);
            }}
            getOptionLabel={(company) =>
              company.name
            }
            isOptionEqualToValue={(
              option,
              value
            ) => option.id === value.id}
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


          {/* USER */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
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
                fontWeight={600}
                lineHeight={1.2}
              >
                Administrator
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                System Admin
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
