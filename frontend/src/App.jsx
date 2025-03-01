import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import your components and pages
import Sidebar from "./components/navigations/Sidebar"; // Combined Sidebar component
import Dashboard from "./pages/Dashboard";
import Ordertable from "./pages/Ordertable";
import Inventory from "./pages/Inventory";
import StaffProfile from "./pages/Staff Profile/StaffProfile";
import Sales from "./pages/Sales";
import Login from "./pages/Login";
import Attendance from "./pages/Attendance/Attendance";
import TestConnection from "./pages/TestConnection";
import StockOutItems from "./pages/Inventory/StockOutItems";
import Schedule from "./pages/Staff Profile/Schedule";
import LegendModal from "./components/popups/LegendModal";
import EmployeeLeave from "./components/popups/EmployeeLeave";
import Holidays from "./components/popups/Holidays";
import Menu from "./pages/Inventory/Menu";
import StockIn from "./pages/Inventory/StockIn";
import Order from "./pages/Order/Order";
import ChooseOrder from "./components/popups/ChooseOrder";
import SalesCalendar from "./pages/Sales/SalesCalendar";
import AdminRoute from "./components/admin/AdminRoute";
import AttendanceReview from "./pages/Attendance/AttendanceReview";
import Items from "./pages/Inventory/Items";
import EditItem from "./components/popups/EditItem";
import EditInventory from "./components/popups/EditInventory";
import NewCategory from "./components/popups/NewCategory";
import FPMenu from "./pages/Inventory/FPMenu";
import GrabMenu from "./pages/Inventory/GrabMenu";
import NewMenuModal from "./components/popups/NewMenuModal";
import EditMenuModal from "./components/popups/EditMenuModal";

// You might have a separate dashboard for employees if needed.
const EmployeeDashboard = Dashboard; // For this example, we reuse Dashboard

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
            <Route
              path="/dashboard-admin/ordertable"
              element={
                <AdminRoute>
                  <Ordertable />
                </AdminRoute>
              }
            />
            <Route
  path="/dashboard-admin/menu"
  element={
    <AdminRoute>
      <Menu />
    </AdminRoute>
  }
/>
<Route
  path="/dashboard-admin/grabmenu"
  element={
    <AdminRoute>
      <GrabMenu />
    </AdminRoute>
  }
/>
<Route
  path="/dashboard-admin/fpmenu"
  element={
    <AdminRoute>
      <FPMenu />
    </AdminRoute>
  }
/>
<Route
  path="/dashboard-admin/newmenumodal"
  element={
    <AdminRoute>
      <NewMenuModal />
    </AdminRoute>
  }
/>
<Route
  path="/dashboard-admin/editmenumodal"
  element={
    <AdminRoute>
      <EditMenuModal />
    </AdminRoute>
  }
/>

            <Route
              path="/dashboard-admin/inventory"
              element={
                <AdminRoute>
                  <Inventory />
                </AdminRoute>
              }
            />
            <Route
              path="/dashboard-admin/staffprofile"
              element={
                <AdminRoute>
                  <StaffProfile />
                </AdminRoute>
              }
            />
            <Route
              path="/dashboard-admin/sales"
              element={
                <AdminRoute>
                  <Sales />
                </AdminRoute>
              }
            />
            
            <Route
              path="/dashboard-admin"
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
            <Route path="/ordertable" element={<Ordertable />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/stockoutitems" element={<StockOutItems />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/legendmodal" element={<LegendModal />} />
            <Route path="/employeeleave" element={<EmployeeLeave />} />
            <Route path="/holidays" element={<Holidays />} />

            <Route path="/salescalendar" element={<SalesCalendar />} />
        
            <Route path="/stockin" element={<StockIn />} />
            <Route path="/order" element={<Order />} />
            <Route path="/chooseorder" element={<ChooseOrder />} />
            <Route path="/testconnection" element={<TestConnection />} />
            <Route path="/attendancereview" element={<AttendanceReview />} />
            <Route path="/items" element={<Items />} />
            <Route path="/edititem" element={<EditItem />} />
            <Route path="/editinventory" element={<EditInventory />} />
            <Route path="/newcategory" element={<NewCategory />} />
    
            {/* Fallback Route */}
            <Route
              path="*"
              element={
                <Navigate
                  to={isAdmin ? "/dashboard-admin" : "/dashboard"}
                  replace
                />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
