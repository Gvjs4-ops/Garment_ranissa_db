import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard/Dashboard";
import SalesOrder from "../pages/SalesOrder/SalesOrder";
import SalesOrderDetail from "../pages/SalesOrder/SalesOrderDetail";
import Customers from "../pages/Customers/Customers";
import Products from "../pages/Products/Products";
import Inventory from "../pages/Inventory/Inventory";
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
    <Routes>
      <Route element={<MainLayout><div /></MainLayout>}>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/company"
          element={<PlaceholderPage title="Company" />}
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
          element={<PlaceholderPage title="Reports" />}
        />

        <Route
          path="/settings"
          element={<PlaceholderPage title="Settings" />}
        />
      </Route>
    </Routes>
  );
}
