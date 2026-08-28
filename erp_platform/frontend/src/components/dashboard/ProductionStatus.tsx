import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Typography,
} from "@mui/material";

const productionData = [
  {
    label: "Cutting",
    completed: 82,
    total: 100,
  },
  {
    label: "Stitching",
    completed: 68,
    total: 100,
  },
  {
    label: "Finishing",
    completed: 54,
    total: 100,
  },
  {
    label: "Quality Check",
    completed: 91,
    total: 100,
  },
];

export default function ProductionStatus() {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600}>
          Production Status
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Current production progress
        </Typography>

        {productionData.map((item) => (
          <Box key={item.label} sx={{ mb: 2.5 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              mb={0.75}
            >
              <Typography variant="body2" fontWeight={500}>
                {item.label}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {item.completed}%
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={item.completed}
              sx={{
                height: 8,
                borderRadius: 4,
              }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
