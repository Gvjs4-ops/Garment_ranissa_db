import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { useAuth } from "../../contexts/AuthContext";
import { useCompany } from "../../contexts/CompanyContext";


export default function Profile() {
  const {
    user,
    role,
  } = useAuth();

  const {
    activeCompany,
  } = useCompany();


  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";


  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight={700}
        mb={0.5}
      >
        My Profile
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        mb={3}
      >
        View your ERP account information.
      </Typography>


      <Card
        sx={{
          maxWidth: 700,
          borderRadius: 3,
        }}
      >
        <CardContent
          sx={{
            p: 3,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            mb={3}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontSize: 26,
              }}
            >
              {displayName
                .charAt(0)
                .toUpperCase()}
            </Avatar>

            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                {displayName}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {role
                  ? role.replaceAll("_", " ")
                  : "No Role"}
              </Typography>
            </Box>
          </Stack>


          <Divider sx={{ mb: 3 }} />


          <Stack spacing={2.5}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Email
              </Typography>

              <Typography
                variant="body1"
              >
                {user?.email || "Not available"}
              </Typography>
            </Box>


            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Role
              </Typography>

              <Typography
                variant="body1"
              >
                {role
                  ? role.replaceAll("_", " ")
                  : "No Role assigned"}
              </Typography>
            </Box>


            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Active Company
              </Typography>

              <Typography
                variant="body1"
              >
                {activeCompany?.name ||
                  "No company selected"}
              </Typography>
            </Box>


            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                User ID
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  wordBreak: "break-all",
                }}
              >
                {user?.id || "Not available"}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}