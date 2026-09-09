import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import SaveIcon from "@mui/icons-material/Save";
import { useEffect, useState } from "react";

interface CompanyForm {
  name: string;
  legal_name: string;
  email: string;
  phone: string;
  tax_number: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

const initialForm: CompanyForm = {
  name: "",
  legal_name: "",
  email: "",
  phone: "",
  tax_number: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  postal_code: "",
};

export default function Company() {
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

const loadCompany = async () => {
  try {
    const response = await fetch("/api/company");

    if (!response.ok) {
      throw new Error(`Failed to fetch company: ${response.status}`);
    }

    const data = await response.json();

    console.log("Company loaded:", data);

    setForm({
      name: data.name || "",
      legal_name: data.legal_name || "",
      email: data.email || "",
      phone: data.phone || "",
      tax_number: data.tax_number || "",
      address: data.address || "",
      city: data.city || "",
      state: data.state || "",
      country: data.country || "India",
      postal_code: data.postal_code || "",
    });
  } catch (error) {
    console.error("Failed to load company:", error);
    setMessage("Failed to load company information.");
  }
};

useEffect(() => {
  loadCompany();
}, []);

  const handleChange = (
    field: keyof CompanyForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setMessage("");
  };

const handleSave = async () => {
  if (!form.name.trim()) {
    setMessage("Company name is required.");
    return;
  }

  try {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/company", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(
        errorData?.detail ||
          `Failed to update company: ${response.status}`
      );
    }

    await loadCompany();

    setMessage("Company information updated successfully.");
  } catch (error) {
    console.error("Failed to save company:", error);

    setMessage(
      error instanceof Error
        ? error.message
        : "Failed to save company information."
    );
  } finally {
    setSaving(false);
  }
};

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <BusinessIcon />

            <Typography variant="h4" fontWeight={700}>
              Company
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
          >
            Manage company information and business details.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Stack>

      {message && (
        <Alert
          severity={
            message.startsWith("Failed") ||
            message.includes("required")
              ? "error"
              : "success"
          }
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>
            Company Information
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={2}
          >
            Basic information about your business.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Company Name"
                value={form.name}
                onChange={(e) =>
                  handleChange("name", e.target.value)
                }
                fullWidth
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Legal Name"
                value={form.legal_name}
                onChange={(e) =>
                  handleChange("legal_name", e.target.value)
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  handleChange("email", e.target.value)
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(e) =>
                  handleChange("phone", e.target.value)
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="GST / Tax Number"
                value={form.tax_number}
                onChange={(e) =>
                  handleChange("tax_number", e.target.value)
                }
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>
            Address
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={2}
          >
            Registered or primary business address.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address"
                value={form.address}
                onChange={(e) =>
                  handleChange("address", e.target.value)
                }
                fullWidth
                multiline
                minRows={2}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="City"
                value={form.city}
                onChange={(e) =>
                  handleChange("city", e.target.value)
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="State"
                value={form.state}
                onChange={(e) =>
                  handleChange("state", e.target.value)
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Country"
                value={form.country}
                onChange={(e) =>
                  handleChange("country", e.target.value)
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Postal Code"
                value={form.postal_code}
                onChange={(e) =>
                  handleChange("postal_code", e.target.value)
                }
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
