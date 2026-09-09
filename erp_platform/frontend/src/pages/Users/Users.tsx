import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { useEffect, useState } from "react";

import {
  fetchUsers,
  type CompanyUser,
} from "../../api/users";

import AddUserDialog from "./AddUserDialog";
import EditUserDialog from "./EditUserDialog";
import RemoveUserDialog from "./RemoveUserDialog";
import { useAuth } from "../../contexts/AuthContext";

export default function Users() {
  const [users, setUsers] =
    useState<CompanyUser[]>([]);
const { user: currentUser } = useAuth();
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [addUserOpen, setAddUserOpen] =
    useState(false);

  const [editUserOpen, setEditUserOpen] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<CompanyUser | null>(null);

  const [removeUserOpen, setRemoveUserOpen] =
    useState(false);

  const [userToRemove, setUserToRemove] =
    useState<CompanyUser | null>(null);


  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchUsers();

      setUsers(data);
    } catch (err) {
      console.error(
        "Failed to load users:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Box>
      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
          >
            User Management
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
          >
            Manage ERP users, roles and access.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={
            <PersonAddOutlinedIcon />
          }
          onClick={() =>
            setAddUserOpen(true)
          }
        >
          Add User
        </Button>
      </Box>


      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}


      {/* USERS TABLE */}

      <Card>
        {loading ? (
          <Box
            sx={{
              minHeight: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    Name
                  </TableCell>

                  <TableCell>
                    Email
                  </TableCell>

                  <TableCell>
                    Company
                  </TableCell>

                  <TableCell>
                    Role
                  </TableCell>

                  <TableCell>
                    Status
                  </TableCell>

                  <TableCell align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{
                        py: 6,
                        color:
                          "text.secondary",
                      }}
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
users.map((user) => {
  const isCurrentUser =
    user.user_id === currentUser?.id;

  return (
    <TableRow
      key={user.id}
      hover
    >
      {/* NAME */}

      <TableCell>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            variant="body2"
            fontWeight={600}
          >
            {user.full_name || "—"}
          </Typography>

          {isCurrentUser && (
            <Chip
              label="You"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </TableCell>

      {/* EMAIL */}

      <TableCell>
        <Typography variant="body2">
          {user.email || "No email"}
        </Typography>
      </TableCell>

      {/* COMPANY */}

      <TableCell>
        {user.company_name || "—"}
      </TableCell>

      {/* ROLE */}

      <TableCell>
        <Chip
          label={user.role.replaceAll(
            "_",
            " "
          )}
          size="small"
          variant="outlined"
        />
      </TableCell>

      {/* STATUS */}

      <TableCell>
        <Chip
          label={
            user.is_active
              ? "Active"
              : "Inactive"
          }
          size="small"
          color={
            user.is_active
              ? "success"
              : "default"
          }
        />
      </TableCell>

      {/* ACTIONS */}

      <TableCell align="right">
        <Button
          size="small"
          startIcon={
            <EditOutlinedIcon />
          }
          onClick={() => {
            setSelectedUser(user);
            setEditUserOpen(true);
          }}
        >
          Edit
        </Button>

        {!isCurrentUser && (
          <Button
            size="small"
            color="error"
            onClick={() => {
              setUserToRemove(user);
              setRemoveUserOpen(true);
            }}
          >
            Remove
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
})
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>


      {/* ADD USER */}

      <AddUserDialog
        open={addUserOpen}
        onClose={() =>
          setAddUserOpen(false)
        }
        onUserCreated={(newUser) => {
          setUsers((currentUsers) => [
            newUser,
            ...currentUsers,
          ]);
        }}
      />


      {/* EDIT USER */}

      <EditUserDialog
        open={editUserOpen}
        user={selectedUser}
        onClose={() => {
          setEditUserOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdated={(updatedUser) => {
          setUsers((currentUsers) =>
            currentUsers.map(
              (existingUser) =>
                existingUser.id ===
                updatedUser.id
                  ? updatedUser
                  : existingUser
            )
          );

          setEditUserOpen(false);
          setSelectedUser(null);
        }}
      />


      {/* REMOVE USER */}

      <RemoveUserDialog
        open={removeUserOpen}
        user={userToRemove}
        onClose={() => {
          setRemoveUserOpen(false);
          setUserToRemove(null);
        }}
        onUserRemoved={(
          companyUserId
        ) => {
          setUsers((currentUsers) =>
            currentUsers.map(
              (existingUser) =>
                existingUser.id ===
                companyUserId
                  ? {
                      ...existingUser,
                      is_active: false,
                    }
                  : existingUser
            )
          );

          setRemoveUserOpen(false);
          setUserToRemove(null);
        }}
      />
    </Box>
  );

}