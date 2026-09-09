import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard/Dashboard";
import SalesOrder from "../pages/SalesOrder/SalesOrder";
import SalesOrderDetail from "../pages/SalesOrder/SalesOrderDetail";
import Customers from "../pages/Customers/Customers";
import Products from "../pages/Products/Products";
import Inventory from "../pages/Inventory/Inventory";
import Company from "../pages/Company/Company";
import Reports from "../pages/Reports/Reports";
import Login from "../pages/Login/Login";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";
import Users from "../pages/Users/Users";
import AdminRoute from "./AdminRoute";
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>This module is under development.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
<<<<<<< HEAD
    <Routes>
      <Route element={<MainLayout />}>
=======
    <Routes> 
    <Route
       path="/login"
       element={<Login />}
    />
      <Route
         element={
         <ProtectedRoute>
           <MainLayout />
         </ProtectedRoute>
         }
>
>>>>>>> 9bef274 (Notification changes added in this commit)
        <Route
          path="/profile"
          element={<Profile />}
        />
<Route
  path="/users"
  element={
    <AdminRoute>
      <Users />
    </AdminRoute>
  }
/>
        <Route
           path="/"
           element={<Dashboard />}
        />

         <Route
            path="/settings"
            element={<Settings />}
           />

        <Route path="/company" 
        element={<Company />} 
         />

        <Route
          path="/products"
	  element={<Products />}
        />

        <Route
          path="/sales"
	  element={<SalesOrder />}
        />
	
	<Route
  	  path="/sales/orders/:orderId"
	  element={<SalesOrderDetail />}
	/>

	<Route
  	  path="/customers"
	  element={<Customers />}
	/>

        <Route
          path="/inventory"
	  element={<Inventory />}
        />

        <Route
          path="/reports"
         element={<Reports />}
        />

        <Route
          path="/settings"
          element={<PlaceholderPage title="Settings" />}
        />
      </Route>
    </Routes>
  );
}
