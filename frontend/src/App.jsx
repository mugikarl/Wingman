import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/navigations/Sidebar"; // Combined Sidebar component
import Dashboard from "./pages/Dashboard";
import OrderTable from "./pages/Order/Ordertable";
import Inventory from "./pages/Inventory";
import StaffProfile from "./pages/Staff Profile/StaffProfile";
import Sales from "./pages/Sales/Sales";
import Login from "./pages/Login";
import Attendance from "./pages/Attendance/Attendance";
import TestConnection from "./pages/TestConnection";
import StockOut from "./pages/Inventory/StockOut";
import Schedule from "./pages/Staff Profile/Schedule";
import LegendModal from "./components/popups/LegendModal";
import Menu from "./pages/Inventory/Menu";
import StockIn from "./pages/Inventory/StockIn";
import Order from "./pages/Order/Order";
import ChooseOrder from "./components/popups/ChooseOrder";
import SalesCalendar from "./pages/Sales/SalesCalendar";
import AdminRoute from "./components/admin/AdminRoute";
import AttendanceReview from "./pages/Attendance/AttendanceReview";
import Items from "./pages/Inventory/Items";
import EditItem from "./components/popups/EditItem";
// import EditInventory from "./components/popups/EditInventory";
import NewCategory from "./components/popups/NewCategory";
import NewMenuForm from "./components/popups/NewMenuForm";
import NewMenuModal from "./components/popups/NewMenuModal";
import EditMenuModal from "./components/popups/EditMenuModal";
import AdminRedirect from "./components/admin/AdminRedirect";
import ExportSales from "./components/popups/ExportSales";
import AddExpense from "./components/popups/AddExpense";
import DailySales from "./components/popups/DailySales";

const EmployeeDashboard = Dashboard;

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  // On initial load, check localStorage for a stored role (set during login)
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "Admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

  return (
    <Router>
      <div className="flex h-screen">
        {/* Overall Sidebar is always rendered */}
        <Sidebar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
        <div className="flex-grow">
          <Routes>
            {/* Login Page */}
            <Route path="/login" element={<Login setIsAdmin={setIsAdmin} />} />

            {/* Admin Dashboard Routes (protected by AdminRoute) */}
            {/** ORDER */}
            <Route
              path="/admin/ordertable"
              element={
                <AdminRoute>
                  <OrderTable />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/order"
              element={
                <AdminRoute>
                  <Order />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/order/:transactionId"
              element={
                <AdminRoute>
                  <Order />
                </AdminRoute>
              }
            />

            {/** INVENTORY */}
            <Route
              path="/admin/inventory"
              element={
                <AdminRoute>
                  <Inventory />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/newmenuform"
              element={
                <AdminRoute>
                  <NewMenuForm />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/items"
              element={
                <AdminRoute>
                  <Items />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/stockin"
              element={
                <AdminRoute>
                  <StockIn />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <AdminRoute>
                  <Menu />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/stockout"
              element={
                <AdminRoute>
                  <StockOut />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/staffprofile"
              element={
                <AdminRoute>
                  <StaffProfile />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/sales"
              element={
                <AdminRoute>
                  <Sales />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/salescalendar"
              element={
                <AdminRoute>
                  <SalesCalendar />
                </AdminRoute>
              }
            />
            <Route path="/admin/daily-sales/:date" element={<DailySales />} />
            <Route
              path="/admin/exportsales"
              element={
                <AdminRoute>
                  <ExportSales />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/addexpense"
              element={
                <AdminRoute>
                  <AddExpense />
                </AdminRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Dashboard isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
                </AdminRoute>
              }
            />

            {/* Employee (non-admin) Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                <EmployeeDashboard isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
              }
            />

            {/* Other non-admin routes */}
            {/* INVENTORY */}
            <Route
              path="/inventory"
              element={
                localStorage.getItem("role") === "Admin" ? (
                  <Navigate to="/admin/inventory" replace />
                ) : (
                  <Inventory />
                )
              }
            />
            <Route
              path="/items"
              element={
                localStorage.getItem("role") === "Admin" ? (
                  <Navigate to="/admin/items" replace />
                ) : (
                  <Items />
                )
              }
            />
            <Route
              path="/stockin"
              element={
                localStorage.getItem("role") === "Admin" ? (
                  <Navigate to="/admin/stockin" replace />
                ) : (
                  <StockIn />
                )
              }
            />
            <Route
              path="/menu"
              element={
                localStorage.getItem("role") === "Admin" ? (
                  <Navigate to="/admin/menu" replace />
                ) : (
                  <Menu />
                )
              }
            />
            <Route
              path="/stockout"
              element={
                localStorage.getItem("role") === "Admin" ? (
                  <Navigate to="/admin/stockout" replace />
                ) : (
                  <StockOut />
                )
              }
            />
            <Route
              path="/ordertable"
              element={
                localStorage.getItem("role") === "Admin" ? (
                  <Navigate to="/admin/ordertable" replace />
                ) : (
                  <OrderTable />
                )
              }
            />
            {/* For non-admin order routes */}
            <Route
              path="/order"
              element={
                localStorage.getItem("role") === "Admin" ? (
                  <Navigate to="/admin/order" replace />
                ) : (
                  <Order />
                )
              }
            />
            <Route
              path="/order/:transactionId"
              element={
                localStorage.getItem("role") === "Admin" ? (
                  <AdminRedirect to="/admin/order/:transactionId" />
                ) : (
                  <Order />
                )
              }
            />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/legendmodal" element={<LegendModal />} />
            <Route path="/salescalendar" element={<SalesCalendar />} />
            <Route path="/chooseorder" element={<ChooseOrder />} />
            <Route path="/testconnection" element={<TestConnection />} />
            <Route path="/attendancereview" element={<AttendanceReview />} />

            {/* Fallback Route */}
            <Route
              path="*"
              element={
                <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
