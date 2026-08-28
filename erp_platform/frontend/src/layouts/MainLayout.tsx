import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar/Sidebar";
import Topbar from "../components/layout/Topbar/Topbar";

export default function MainLayout() {
  const TOPBAR_HEIGHT = 72;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Topbar />

      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: "100vh",
          bgcolor: "background.default",
          mt: `${TOPBAR_HEIGHT}px`,
        }}
      >
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
