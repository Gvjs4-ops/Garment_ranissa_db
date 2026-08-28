import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  createCustomer,
  deactivateCustomer,
  fetchCustomers,
  updateCustomer,
  type Customer,
} from "../../services/sales";


export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [creditLimit, setCreditLimit] = useState(0);


  async function loadCustomers() {
    try {
      setLoading(true);

      const data = await fetchCustomers();

      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadCustomers();
  }, []);


  function resetForm() {
    setEditingId(null);

    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setTaxNumber("");
    setGstNumber("");
    setCreditLimit(0);
  }


  function handleEdit(customer: Customer) {
    setEditingId(customer.id);

    setName(customer.name);
    setPhone(customer.phone ?? "");
    setEmail(customer.email ?? "");
    setAddress(customer.address ?? "");
    setTaxNumber(customer.tax_number ?? "");
    setGstNumber(customer.gst_number ?? "");
    setCreditLimit(Number(customer.credit_limit ?? 0));
  }


  async function handleSave() {
    if (!name.trim()) {
      return;
    }

    try {
      if (editingId) {
        await updateCustomer(editingId, {
          name,
          phone,
          email,
          address,
          tax_number: taxNumber,
          gst_number: gstNumber,
          credit_limit: creditLimit,
        });
      } else {
        await createCustomer({
          name,
          phone,
          email,
          address,
          tax_number: taxNumber,
          gst_number: gstNumber,
          credit_limit: creditLimit,
        });
      }

      resetForm();

      await loadCustomers();
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  }


  async function handleDeactivate(customerId: string) {
    try {
      await deactivateCustomer(customerId);

      await loadCustomers();
    } catch (error) {
      console.error("Failed to deactivate customer:", error);
    }
  }


  async function handleActivate(customerId: string) {
    try {
      await updateCustomer(customerId, {
        is_active: true,
      });

      await loadCustomers();
    } catch (error) {
      console.error("Failed to activate customer:", error);
    }
  }


  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Customers
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {editingId ? "Edit Customer" : "Add Customer"}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: 2,
          }}
        >
          <TextField
            label="Customer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Tax Number"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
          />

          <TextField
            label="GST Number"
            value={gstNumber}
            onChange={(e) =>
              setGstNumber(e.target.value.toUpperCase())
            }
            slotProps={{
              htmlInput: {
                maxLength: 15,
              },
            }}
          />

          <TextField
            label="Credit Limit"
            type="number"
            value={creditLimit}
            onChange={(e) =>
              setCreditLimit(Number(e.target.value))
            }
            slotProps={{
              htmlInput: {
                min: 0,
              },
            }}
          />

          <TextField
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            multiline
            minRows={2}
            sx={{
              gridColumn: {
                md: "1 / -1",
              },
            }}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!name.trim()}
            sx={{ mr: 1 }}
          >
            {editingId ? "Save Changes" : "Add Customer"}
          </Button>

          {editingId && (
            <Button onClick={resetForm}>
              Cancel
            </Button>
          )}
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>GST Number</TableCell>
              <TableCell align="right">
                Credit Limit
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    {customer.name}
                  </TableCell>

                  <TableCell>
                    {customer.phone ?? "-"}
                  </TableCell>

                  <TableCell>
                    {customer.email ?? "-"}
                  </TableCell>

                  <TableCell>
                    {customer.gst_number ?? "-"}
                  </TableCell>

                  <TableCell align="right">
                    ₹
                    {Number(
                      customer.credit_limit
                    ).toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        customer.is_active
                          ? "Active"
                          : "Inactive"
                      }
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() =>
                        handleEdit(customer)
                      }
                    >
                      Edit
                    </Button>

                    {customer.is_active ? (
                      <Button
                        size="small"
                        color="error"
                        onClick={() =>
                          handleDeactivate(customer.id)
                        }
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        onClick={() =>
                          handleActivate(customer.id)
                        }
                      >
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
