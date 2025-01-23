import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex-grow p-6">
      {/* Top Boxes */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#E88504] h-32 rounded-[15px] p-4">
          <span className="text-white text-lg">Orders Today</span>
        </div>
        <div className="bg-[#E88504] h-32 rounded-[15px] p-4">
          <span className="text-white text-lg">Total Orders</span>
        </div>
        <div className="bg-[#E88504] h-32 rounded-[15px] p-4">
          <span className="text-white text-lg">Sales Today</span>
        </div>
        <div className="bg-[#E88504] h-32 rounded-[15px] p-4">
          <span className="text-white text-lg">Total Sales</span>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex gap-4">
        {/* Dashboard */}
        <div className="bg-white flex-grow h-64 rounded-[15px] shadow p-6">
          <span className="text-[#E88504] font-bold text-lg">Sales Overview</span>
        </div>
        {/* Notifications Box */}
        <div className="bg-white w-1/4 h-64 rounded-[15px] shadow p-6">
          <span className="text-[#E88504] font-bold text-lg">Notifications</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
