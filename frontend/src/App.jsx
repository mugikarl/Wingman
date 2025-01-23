import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/navigations/Sidebar";
import Inventory from "./pages/Inventory";
import StaffProfile from "./pages/StaffProfile";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import StockIn from "./components/popups/StockIn";
import Order from "./pages/Order";

const App = () => {
  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-grow p-6">
          <Routes>
            {/* Default route is Dashboard */}
            <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/order" element={<Order />} />
            <Route path="/staffprofile" element={<StaffProfile />} />
            {/* Stockout routes */}
            <Route path="/menu" element={<Menu />} />
            <Route path="/stockin" element={<StockIn />} />      
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
