import {
  Box,
  Typography,
  Paper,
} from "@mui/material";

export default function Notifications() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Notifications
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Your notifications will appear here.
        </Typography>
      </Paper>
    </Box>
  );
}
