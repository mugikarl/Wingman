import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/navigations/Sidebar";

const Dashboard = ({ isAdmin, setIsAdmin }) => {
  return (
    <div className="h-screen w-full flex-grow p-6 bg-[#fcf4dc] relative">
      {/* Dashboard content */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#CC5500] h-32 rounded-[15px] p-4">
          <span className="text-white text-lg">Orders Today</span>
        </div>
        <div className="bg-[#CC5500] h-32 rounded-[15px] p-4">
          <span className="text-white text-lg">Total Orders</span>
        </div>
        {isAdmin && (
          <>
            <div className="bg-[#CC5500] h-32 rounded-[15px] p-4">
              <span className="text-white text-lg">Sales Today</span>
            </div>
            <div className="bg-[#CC5500] h-32 rounded-[15px] p-4">
              <span className="text-white text-lg">Total Sales</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom Section */}
      <div className="flex gap-4">
        <div className="bg-white flex-grow h-64 rounded-[15px] shadow p-6">
          <span className="text-[#CC5500] font-bold text-lg">
            Sales Overview
          </span>
        </div>
        <div className="bg-white w-1/4 h-64 rounded-[15px] shadow p-6">
          <span className="text-[#CC5500] font-bold text-lg">
            Notifications
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
