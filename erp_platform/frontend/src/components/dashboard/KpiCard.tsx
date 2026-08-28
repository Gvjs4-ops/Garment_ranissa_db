import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import type { SvgIconComponent } from "@mui/icons-material";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: SvgIconComponent;
  path?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  path,
}: KpiCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => {
        if (path) {
          navigate(path);
        }
      }}
      sx={{
        height: "100%",
        cursor: path ? "pointer" : "default",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",

        "&:hover": path
          ? {
              transform: "translateY(-2px)",
              boxShadow: 4,
            }
          : {},
      }}
    >
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={500}
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ mt: 1 }}
            >
              {value}
            </Typography>

            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "primary.main",
              color: "white",
            }}
          >
            <Icon />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
