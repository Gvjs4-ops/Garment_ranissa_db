import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import SaveIcon from "@mui/icons-material/Save";
import { useEffect, useState } from "react";
import { useCompany } from "../../contexts/CompanyContext";
import { updateCompany, type Company } from "../../services/sales";

interface CompanyForm {
  company_code: string;
  name: string;
  legal_name: string;
  trade_name: string;
  business_type: string;
  industry: string;
  tax_id: string;
  registration_number: string;
  email: string;
  phone: string;
  website: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  currency_code: string;
  timezone: string;
  fiscal_year_start_month: string;
}

const initialForm: CompanyForm = {
  company_code: "",
  name: "",
  legal_name: "",
  trade_name: "",
  business_type: "",
  industry: "",
  tax_id: "",
  registration_number: "",
  email: "",
  phone: "",
  website: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  country: "India",
  postal_code: "",
  currency_code: "INR",
  timezone: "Asia/Kolkata",
  fiscal_year_start_month: "4",
};

function companyToForm(company: Company): CompanyForm {
  return {
    company_code: company.company_code || "",
    name: company.name || "",
    legal_name: company.legal_name || "",
    trade_name: company.trade_name || "",
    business_type: company.business_type || "",
    industry: company.industry || "",
    tax_id: company.tax_id || "",
    registration_number: company.registration_number || "",
    email: company.email || "",
    phone: company.phone || "",
    website: company.website || "",
    address_line_1: company.address_line_1 || "",
    address_line_2: company.address_line_2 || "",
    city: company.city || "",
    state: company.state || "",
    country: company.country || "India",
    postal_code: company.postal_code || "",
    currency_code: company.currency_code || "INR",
    timezone: company.timezone || "Asia/Kolkata",
    fiscal_year_start_month: String(
      company.fiscal_year_start_month || 4
    ),
  };
}

export default function Company() {
  const { activeCompany, setActiveCompany, loadingCompanies } =
    useCompany();

  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (activeCompany) {
      setForm(companyToForm(activeCompany));
      setMessage("");
    }
  }, [activeCompany]);

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
    if (!activeCompany) {
      setMessage("No active company selected.");
      return;
    }

    if (!form.name.trim()) {
      setMessage("Company name is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const updatedCompany = await updateCompany(
        activeCompany.id,
        {
          display_name: form.name.trim(),
          legal_name: form.legal_name.trim() || null,
          trade_name: form.trade_name.trim() || null,
          business_type: form.business_type.trim() || null,
          industry: form.industry.trim() || null,
          tax_id: form.tax_id.trim() || null,
          registration_number:
            form.registration_number.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          address_line_1:
            form.address_line_1.trim() || null,
          address_line_2:
            form.address_line_2.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          country: form.country.trim() || null,
          postal_code: form.postal_code.trim() || null,
          currency_code:
            form.currency_code.trim() || null,
          timezone: form.timezone.trim() || null,
          fiscal_year_start_month:
            Number(form.fiscal_year_start_month) || 4,
        }
      );

      setActiveCompany(updatedCompany);
      setMessage(
        "Company information updated successfully."
      );
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

  if (loadingCompanies) {
    return (
      <Box>
        <Typography color="text.secondary">
          Loading company information...
        </Typography>
      </Box>
    );
  }

  if (!activeCompany) {
    return (
      <Box>
        <Alert severity="warning">
          No active company is available.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          mb: 3,
        }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <BusinessIcon />

            <Typography
              variant="h4"
              sx={{ fontWeight: 700 }}
            >
              Company
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
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
            message.includes("successfully")
              ? "success"
              : "error"
          }
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Basic Information
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Core identification and business information.
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
                label="Company Code"
                value={form.company_code}
                fullWidth
                disabled
                helperText="Company code cannot be changed here."
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Legal Name"
                value={form.legal_name}
                onChange={(e) =>
                  handleChange(
                    "legal_name",
                    e.target.value
                  )
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Trade Name"
                value={form.trade_name}
                onChange={(e) =>
                  handleChange(
                    "trade_name",
                    e.target.value
                  )
                }
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Business & Legal
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Business classification and registration details.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Business Type"
                value={form.business_type}
                onChange={(e) =>
                  handleChange(
                    "business_type",
                    e.target.value
                  )
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Industry"
                value={form.industry}
                onChange={(e) =>
                  handleChange(
                    "industry",
                    e.target.value
                  )
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="GST / Tax ID"
                value={form.tax_id}
                onChange={(e) =>
                  handleChange("tax_id", e.target.value)
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Registration Number"
                value={form.registration_number}
                onChange={(e) =>
                  handleChange(
                    "registration_number",
                    e.target.value
                  )
                }
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Contact Information
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Primary business contact details.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
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

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Website"
                value={form.website}
                onChange={(e) =>
                  handleChange("website", e.target.value)
                }
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Business Address
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Registered or primary business address.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address Line 1"
                value={form.address_line_1}
                onChange={(e) =>
                  handleChange(
                    "address_line_1",
                    e.target.value
                  )
                }
                fullWidth
                multiline
                minRows={2}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address Line 2"
                value={form.address_line_2}
                onChange={(e) =>
                  handleChange(
                    "address_line_2",
                    e.target.value
                  )
                }
                fullWidth
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
                  handleChange(
                    "postal_code",
                    e.target.value
                  )
                }
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Regional & Financial Settings
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Currency, timezone and financial year settings.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Currency"
                value={form.currency_code}
                onChange={(e) =>
                  handleChange(
                    "currency_code",
                    e.target.value
                  )
                }
                fullWidth
              >
                <MenuItem value="INR">
                  INR - Indian Rupee
                </MenuItem>
                <MenuItem value="USD">
                  USD - US Dollar
                </MenuItem>
                <MenuItem value="EUR">
                  EUR - Euro
                </MenuItem>
                <MenuItem value="GBP">
                  GBP - British Pound
                </MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Timezone"
                value={form.timezone}
                onChange={(e) =>
                  handleChange(
                    "timezone",
                    e.target.value
                  )
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Fiscal Year Starts"
                value={form.fiscal_year_start_month}
                onChange={(e) =>
                  handleChange(
                    "fiscal_year_start_month",
                    e.target.value
                  )
                }
                fullWidth
              >
                <MenuItem value="1">
                  January
                </MenuItem>
                <MenuItem value="4">
                  April
                </MenuItem>
                <MenuItem value="7">
                  July
                </MenuItem>
                <MenuItem value="10">
                  October
                </MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
