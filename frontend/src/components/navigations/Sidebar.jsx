import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Sidebar = ({ isAdmin, setIsAdmin }) => {
  const navigate = useNavigate();
  const [isInventoryDropdownOpen, setIsInventoryDropdownOpen] = useState(false);
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    delete axios.defaults.headers.common["Authorization"];

    setIsAdmin(false);
    navigate("/dashboard");
  };

  const toggleInventoryDropdown = () => {
    setIsInventoryDropdownOpen((prev) => !prev); // Toggle the state
  };

  return (
    <div className="w-44 bg-[#FFCF03] flex flex-col justify-between items-center py-4 gap-5">
      {/* Logo */}
      <Link to={isAdmin ? "/dashboard-admin" : "/dashboard"}>
        <button className="flex items-center justify-center bg-[#FFCF03] p-2 rounded-lg w-full">
          <img src="/images/logo.png" alt="Logo" className="w-16 h-16" />
        </button>
      </Link>

      {/* Navigation Buttons */}
      <div className="flex-grow flex flex-col w-full px-4 gap-4">
        {isAdmin ? (
          <>
            <Link to="/dashboard-admin/ordertable">
              <button className="flex items-center bg-[#FFCF03] text-white rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden">
                <div className="flex items-center justify-center bg-[#E6B800] p-2">
                  <img src="/images/order.png" alt="Order" className="w-5 h-5" />
                </div>
                <span className="flex-1 text-left pl-3">Order</span>
              </button>
            </Link>

            {/* Inventory Button with Dropdown */}
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleInventoryDropdown}
                className="flex items-center bg-[#FFCF03] text-white rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden"
              >
                <div className="flex items-center justify-center bg-[#E6B800] p-2">
                  <img
                    src="/images/inventory.png"
                    alt="Inventory"
                    className="w-5 h-5"
                  />
                </div>
                <span className="flex-1 text-left pl-3">Inventory</span>
              </button>

              {/* Dropdown Menu */}
              {isInventoryDropdownOpen && (
                <div className="flex flex-col gap-2 pl-6">
                  <Link to="/inventory">
                    <button className="text-white">
                      <span className="flex-1 text-left pl-3">Inventory</span>
                    </button>
                  </Link>
                  {role === "Admin" && (
                    <>
                      <Link to="/dashboard-admin/items">
                        <button className="text-white">
                          
                          <span className="flex-1 text-left pl-3">Items</span>
                        </button>
                      </Link>
                      <Link to="/dashboard-admin/menu">
                        <button className="text-white">
                          <span className="flex-1 text-left pl-3">Menu</span>
                        </button>
                      </Link>
                    </>
                  )}
                  <Link to="/stockin">
                    <button className="text-white">
                      
                      <span className="flex-1 text-left pl-3">Stock In</span>
                    </button>
                  </Link>
                  <Link to="/stockout">
                    <button className="text-white">
                      
                      <span className="flex-1 text-left pl-3">Disposed</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Staff Profiling and Sales Buttons */}
            <Link to="/dashboard-admin/staffprofile">
              <button className="flex items-center bg-[#FFCF03] text-white rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden">
                <div className="flex items-center justify-center bg-[#E6B800] p-2">
                  <img src="/images/staff.png" alt="Staff" className="w-5 h-5" />
                </div>
                <span className="flex-1 text-left pl-3">Staff Profile</span>
              </button>
            </Link>
            <Link to="/dashboard-admin/sales">
              <button className="flex items-center bg-[#FFCF03] text-white rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden">
                <div className="flex items-center justify-center bg-[#E6B800] p-2">
                  <img src="/images/sales.png" alt="Sales" className="w-5 h-5" />
                </div>
                <span className="flex-1 text-left pl-3">Sales</span>
              </button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/ordertable">
              <button className="flex items-center bg-[#FFCF03] text-white rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden">
                <div className="flex items-center justify-center bg-[#E6B800] p-2">
                  <img src="/images/order.png" alt="Order" className="w-5 h-5" />
                </div>
                <span className="flex-1 text-left pl-3">Order</span>
              </button>
            </Link>

            {/* Inventory Button with Dropdown */}
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleInventoryDropdown}
                className="flex items-center bg-[#FFCF03] text-white rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden"
              >
                <div className="flex items-center justify-center bg-[#E6B800] p-2">
                  <img
                    src="/images/inventory.png"
                    alt="Inventory"
                    className="w-5 h-5"
                  />
                </div>
                <span className="flex-1 text-left pl-3">Inventory</span>
              </button>

              {/* Dropdown Menu */}
              {isInventoryDropdownOpen && (
                <div className="flex flex-col gap-2 pl-6">
                  <Link to="/inventory">
                    <button className="text-white">
                      <span className="flex-1 text-left pl-3">Inventory</span>
                    </button>
                  </Link>
                  <Link to="/stockin">
                    <button className="text-white">
                      <span className="flex-1 text-left pl-3">Stock In</span>
                    </button>
                  </Link>
                  <Link to="/stockout">
                    <button className="text-white">
                      
                      <span className="flex-1 text-left pl-3">Disposed</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Attendance Button */}
            <Link to="/attendance">
              <button className="flex items-center bg-[#FFCF03] text-white rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden">
                <div className="flex items-center justify-center bg-[#E6B800] p-2">
                  <img
                    src="/images/attendance.png"
                    alt="Attendance"
                    className="w-5 h-5"
                  />
                </div>
                <span className="flex-1 text-left pl-3">Attendance</span>
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