import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Inventory from "./components/Inventory";
import StaffProfile from "./components/StaffProfile";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Menu from "./components/Menu";
import StockIn from "./components/StockIn";
import Order from "./components/Order";
import Ordertable from "./components/Ordertable";
import Sales from "./components/Sales";
import SalesCalendar from "./components/SalesCalendar";

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
            <Route path="/ordertable" element={<Ordertable />} />
            <Route path="/staffprofile" element={<StaffProfile />} />
            <Route path="/sales" element={<Sales />} />
            {/* Stockout routes */}
            <Route path="/menu" element={<Menu />} />
            <Route path="/stockin" element={<StockIn />} />     
            {/* Order routes */}
            <Route path="/order" element={<Order />} /> 
             {/* Sales routes */}
            <Route path="/sales" element={<Sales />} />
            <Route path="/salescalendar" element={<SalesCalendar />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
