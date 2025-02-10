import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Sidebar = ({ isAdmin, setIsAdmin }) => {
  const navigate = useNavigate();

  // Handler for logging out
  const handleLogout = () => {
    // Remove tokens from storage and clear default headers
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    delete axios.defaults.headers.common["Authorization"];

    // Update admin state and redirect to the non-admin dashboard (or login page)
    setIsAdmin(false);
    navigate("/dashboard");
  };

  return (
    <div className="w-1/8 bg-[#FFCF03] flex flex-col justify-between items-center py-4">
      {/* Top Section: Logo */}
      <Link to={isAdmin ? "/dashboard-admin" : "/dashboard"}>
        <button className="flex items-center justify-center bg-[#FFCF03] p-2 rounded-lg w-full">
          <img src="/images/logo.png" alt="Logo" className="w-20 h-20" />
        </button>
      </Link>

      {/* Middle Section: Navigation Buttons */}
      <div className="flex-grow flex flex-col justify-around w-full px-4 gap-4">
        {isAdmin ? (
          // Admin navigation buttons
          <>
            <Link to="/dashboard-admin/ordertable">
              <button className="flex flex-col items-center justify-center text-[#FFCF03] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img src="/images/order.png" alt="Order" className="mb-2" />
                <span className="text-center text-white">Order</span>
              </button>
            </Link>
            <Link to="/dashboard-admin/inventory">
              <button className="flex flex-col items-center justify-center text-[#FFCF03] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img
                  src="/images/inventory.png"
                  alt="Inventory"
                  className="mb-2"
                />
                <span className="text-center text-white">Inventory</span>
              </button>
            </Link>
            <Link to="/dashboard-admin/staffprofile">
              <button className="flex flex-col items-center justify-center text-[#FFCF03] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img
                  src="/images/staff.png"
                  alt="Staff Profile"
                  className="mb-2"
                />
                <span className="text-center text-white">Staff Profiling</span>
              </button>
            </Link>
            <Link to="/dashboard-admin/sales">
              <button className="flex flex-col items-center justify-center text-[#FFCF03] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img src="/images/sales.png" alt="Sales" className="mb-2" />
                <span className="text-center text-white">Sales</span>
              </button>
            </Link>
          </>
        ) : (
          // Employee (non-admin) navigation buttons
          <>
            <Link to="/ordertable">
              <button className="flex flex-col items-center justify-center text-[#FFCF03] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img src="/images/order.png" alt="Order" className="mb-2" />
                <span className="text-center text-white">Order</span>
              </button>
            </Link>
            <Link to="/inventory">
              <button className="flex flex-col items-center justify-center text-[#FFCF03] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img
                  src="/images/inventory.png"
                  alt="Inventory"
                  className="mb-2"
                />
                <span className="text-center text-white">Inventory</span>
              </button>
            </Link>
            <Link to="/attendance">
              <button className="flex flex-col items-center justify-center text-[#FFCF03] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img
                  src="/images/attendance.png"
                  alt="Attendance"
                  className="mb-2"
                />
                <span className="text-center text-white">Attendance</span>
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Bottom Section: Login/Logout Button */}
      <div className="w-full px-4">
        {isAdmin ? (
          // When logged in as admin, show Logout
          <button
            onClick={handleLogout}
            className="flex items-center justify-center bg-white text-[#FFCF03] p-2 rounded-lg shadow hover:shadow-lg w-full"
          >
            <span>Logout</span>
          </button>
        ) : (
          // When not logged in, show a Login button that redirects to the Login page
          <Link to="/login">
            <button className="flex items-center justify-center bg-white text-[#FFCF03] p-2 rounded-lg shadow hover:shadow-lg w-full">
              <span>Login</span>
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
