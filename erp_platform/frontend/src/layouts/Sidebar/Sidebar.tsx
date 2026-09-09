import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import { navigation } from "../../config/navigation";
import { DRAWER_WIDTH } from "../../constants/layout";

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,

        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          top: "72px",
          height: "calc(100% - 72px)",
        },
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          color="primary"
          sx={{ fontWeight: 700 }}
        >
          Ranissa ERP
        </Typography>
      </Toolbar>

      <Divider />

      <Box sx={{ overflow: "auto" }}>
        {navigation.map((group) => (
          <Box key={group.id}>
            <Typography
              variant="caption"
              sx={{
                px: 2,
                pt: 2,
                pb: 1,
                color: "text.secondary",
                fontWeight: 700,
              }}
            >
              {group.title.toUpperCase()}
            </Typography>

            <List disablePadding>
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <ListItemButton
                    key={item.id}
                    href={item.path}
                    sx={{
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 2,
                    }}
                  >
                    <ListItemIcon>
                      <Icon />
                    </ListItemIcon>

                    <ListItemText primary={item.title} />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
