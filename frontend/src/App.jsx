import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/navigations/Sidebar";
import Inventory from "./pages/Inventory";
import StaffProfile from "./pages/StaffProfile";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import StockIn from "./components/popups/StockIn";
import Order from "./pages/Order";
import Sales from "./pages/Sales"
import SalesCalendar from "./pages/SalesCalendar"
import AdminRoute from "./components/AdminRoute";
import TestConnection from "./pages/TestConnection";

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "Admin") {
      setIsAdmin(true);
    }
  }, []);

  return (
    <Router>
      <div className="flex h-screen">
        {/* Render the Sidebar only once in the App component */}
        <Sidebar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
        <div className="flex-grow">
          <Routes>
            {/* Default route is Dashboard */}
            <Route path="/login" element={<Login setIsAdmin={setIsAdmin} />} />
            <Route
              path="/dashboard-admin/:adminId"
              element={
                <AdminRoute>
                  <Dashboard isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
                </AdminRoute>
              }
            />
            <Route path="/admin/dashboard" element={<Dashboard isAdmin={true} />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/order" element={<Order />} />
            <Route path="/staffprofile" element={<StaffProfile />} />
            <Route path="/sales" element={<Sales />} />
            {/* Stockout routes */}
            <Route path="/menu" element={<Menu />} />
            <Route path="/stockin" element={<StockIn />} />
            {/* Staff Profile routes */}
            {/* Sales routes */}
            <Route path="/salescalendar" element={<SalesCalendar />} />

          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;