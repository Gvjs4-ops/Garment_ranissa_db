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
import Notifications from "../pages/Notifications/Notifications";
import Production from "../pages/Production/Production";
import Payroll from "../pages/Payroll/Payroll";
import EmployeePayrollStatement from "../pages/Payroll/EmployeePayrollStatement";
//function PlaceholderPage({ title }: { title: string }) {
//  return (
//    <div>
//      <h1>{title}</h1>
//      <p>This module is under development.</p>
//    </div>
//  );
//}

export default function AppRoutes() {
  return (
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
       <Route path="/production" element={<Production />} />
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
  path="/payroll"
  element={<Payroll />}
/>
<Route
  path="/payroll/employees/:employeeId/statement"
  element={<EmployeePayrollStatement />}
/>
	<Route
	  path="/notifications"
	  element={<Notifications />}
	/>
      </Route>
    </Routes>
  );
}
