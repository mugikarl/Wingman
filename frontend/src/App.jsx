import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/navigations/Sidebar";
import SidebarEmployee from "./components/navigations/SidebarEmployee";
import Inventory from "./pages/Inventory";
import DisposedItems from "./pages/Inventory/DisposedItems";
import StaffProfile from "./pages/StaffProfile";
import Schedule from "./pages/Staff Profile/Schedule";
import LegendModal from "./components/popups/LegendModal";
import EmployeeLeave from "./components/popups/EmployeeLeave";
import Holidays from "./components/popups/Holidays";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Inventory/Menu";
import StockIn from "./pages/Inventory/StockIn";
import Order from "./pages/Order/Order";
import Ordertable from "./pages/Ordertable";
import ChooseOrder from "./components/popups/ChooseOrder";
import Sales from "./pages/Sales"
import SalesCalendar from "./pages/Sales/SalesCalendar"
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
            <Route path="/ordertable" element={<Ordertable />} />
            <Route path="/staffprofile" element={<StaffProfile />} />
            <Route path="/sales" element={<Sales />} />
            {/* Order routes */}
            <Route path="/order" element={<Order />} />
            <Route path="/chooseorder" element={<ChooseOrder />} />
            {/* Inventory routes */}
            <Route path="/menu" element={<Menu />} />
            <Route path="/stockin" element={<StockIn />} />
            <Route path="/disposeditems" element={<DisposedItems />} />
            {/* Staff Profile routes */}
            <Route path="/schedule" element={<Schedule />}/>
            <Route path="/legendmodal" element={<LegendModal />}/>
            <Route path="/employeeleave" element={<EmployeeLeave />}/>
            <Route path="/holidays" element={<Holidays />}/>
            {/* Sales routes */}
            <Route path="/salescalendar" element={<SalesCalendar />} />

          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;