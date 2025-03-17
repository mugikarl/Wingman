import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // Import icons
import {
  FaClipboard,
  FaBoxOpen, // Correct icon for Inventory
  FaUser,
  FaChartLine,
  FaClipboardList,
  FaCheck,
} from "react-icons/fa6"; // Import icons from react-icons/fa6

const Sidebar = ({ isAdmin, setIsAdmin }) => {
  const navigate = useNavigate();
  const [isInventoryDropdownOpen, setIsInventoryDropdownOpen] = useState(false);
  const [activeButton, setActiveButton] = useState(null); // Tracks the active main button
  const [activeDropdownButton, setActiveDropdownButton] = useState(null); // Tracks the active dropdown button
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
    setIsInventoryDropdownOpen((prev) => !prev);
    if (activeButton !== "inventory") {
      setActiveButton("inventory"); // Set Inventory as active when dropdown is toggled
      setActiveDropdownButton(null); // Reset dropdown button state
    }
  };

  const handleMainButtonClick = (buttonName) => {
    setActiveButton(buttonName); // Set the active main button
    setActiveDropdownButton(null); // Reset dropdown button state
    if (buttonName !== "inventory") {
      setIsInventoryDropdownOpen(false); // Close the inventory dropdown if another button is clicked
    }
  };

  const handleDropdownButtonClick = (buttonName) => {
    setActiveDropdownButton(buttonName); // Set the active dropdown button
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
            {/* Order Button */}
            <Link to="/dashboard-admin/ordertable">
              <button
                onClick={() => handleMainButtonClick("order")}
                className={`flex items-center ${
                  activeButton === "order" ? "bg-[#eaeaea]" : "bg-white"
                } text-[#E88504] rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden`}
              >
                <div className="flex items-center justify-center bg-[#eaeaea] p-2">
                  <FaClipboard className="w-5 h-5 text-[#E88504]" /> {/* Replaced with icon */}
                </div>
                <span className="flex-1 text-left pl-3">Order</span>
              </button>
            </Link>

            {/* Inventory Button with Dropdown */}
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleInventoryDropdown}
                className={`flex items-center ${
                  activeButton === "inventory" ? "bg-[#eaeaea]" : "bg-white"
                } text-[#E88504] rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden`}
              >
                <div className="flex items-center justify-center bg-[#eaeaea] p-2">
                  <FaBoxOpen className="w-5 h-5 text-[#E88504]" /> {/* Replaced with icon */}
                </div>
                <span className="flex-1 text-left pl-3">Inventory</span>
                {/* Dropdown Arrow */}
                <span className="pr-2">
                  {isInventoryDropdownOpen ? (
                    <FaChevronUp className="w-3 h-4" />
                  ) : (
                    <FaChevronDown className="w-3 h-4" />
                  )}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isInventoryDropdownOpen && (
                <div className="flex flex-col gap-2 pl-6 bg-[#ffffff] p-2 rounded-md">
                  <Link to="/inventory">
                    <button
                      onClick={() => handleDropdownButtonClick("inventory")}
                      className={`text-[#E88504] ${
                        activeDropdownButton === "inventory" ? "font-bold" : ""
                      }`}
                    >
                      <span className="flex-1 text-left pl-3">Inventory</span>
                    </button>
                  </Link>
                  {role === "Admin" && (
                    <>
                      <Link to="/dashboard-admin/items">
                        <button
                          onClick={() => handleDropdownButtonClick("items")}
                          className={`text-[#E88504] ${
                            activeDropdownButton === "items" ? "font-bold" : ""
                          }`}
                        >
                          <span className="flex-1 text-left pl-3">Items</span>
                        </button>
                      </Link>
                      <Link to="/dashboard-admin/menu">
                        <button
                          onClick={() => handleDropdownButtonClick("menu")}
                          className={`text-[#E88504] ${
                            activeDropdownButton === "menu" ? "font-bold" : ""
                          }`}
                        >
                          <span className="flex-1 text-left pl-3">Menu</span>
                        </button>
                      </Link>
                    </>
                  )}
                  <Link to="/stockin">
                    <button
                      onClick={() => handleDropdownButtonClick("stockin")}
                      className={`text-[#E88504] ${
                        activeDropdownButton === "stockin" ? "font-bold" : ""
                      }`}
                    >
                      <span className="flex-1 text-left pl-3">Stock In</span>
                    </button>
                  </Link>
                  <Link to="/stockout">
                    <button
                      onClick={() => handleDropdownButtonClick("stockout")}
                      className={`text-[#E88504] ${
                        activeDropdownButton === "stockout" ? "font-bold" : ""
                      }`}
                    >
                      <span className="flex-1 text-left pl-3">Disposed</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Staff Profile Button */}
            <Link to="/dashboard-admin/staffprofile">
              <button
                onClick={() => handleMainButtonClick("staffprofile")}
                className={`flex items-center ${
                  activeButton === "staffprofile" ? "bg-[#eaeaea]" : "bg-white"
                } text-[#E88504] rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden`}
              >
                <div className="flex items-center justify-center bg-[#eaeaea] p-2">
                  <FaUser className="w-5 h-5 text-[#E88504]" /> {/* Replaced with icon */}
                </div>
                <span className="flex-1 text-left pl-3">Staff Profile</span>
              </button>
            </Link>

            {/* Sales Button */}
            <Link to="/dashboard-admin/sales">
              <button
                onClick={() => handleMainButtonClick("sales")}
                className={`flex items-center ${
                  activeButton === "sales" ? "bg-[#eaeaea]" : "bg-white"
                } text-[#E88504] rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden`}
              >
                <div className="flex items-center justify-center bg-[#eaeaea] p-2">
                  <FaChartLine className="w-5 h-5 text-[#E88504]" /> {/* Replaced with icon */}
                </div>
                <span className="flex-1 text-left pl-3">Sales</span>
              </button>
            </Link>
          </>
        ) : (
          <>
            {/* Order Button */}
            <Link to="/ordertable">
              <button
                onClick={() => handleMainButtonClick("order")}
                className={`flex items-center ${
                  activeButton === "order" ? "bg-[#eaeaea]" : "bg-white"
                } text-[#E88504] rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden`}
              >
                <div className="flex items-center justify-center bg-[#eaeaea] p-2">
                  <FaClipboardList className="w-5 h-5 text-[#E88504]" /> {/* Replaced with icon */}
                </div>
                <span className="flex-1 text-left pl-3">Order</span>
              </button>
            </Link>

            {/* Inventory Button with Dropdown */}
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleInventoryDropdown}
                className={`flex items-center ${
                  activeButton === "inventory" ? "bg-[#eaeaea]" : "bg-white"
                } text-[#E88504] rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden`}
              >
                <div className="flex items-center justify-center bg-[#eaeaea] p-2">
                  <FaBoxOpen className="w-5 h-5 text-[#E88504]" /> {/* Replaced with icon */}
                </div>
                <span className="flex-1 text-left pl-3">Inventory</span>
                {/* Dropdown Arrow */}
                <span className="pr-2">
                  {isInventoryDropdownOpen ? (
                    <FaChevronUp className="w-3 h-4" />
                  ) : (
                    <FaChevronDown className="w-3 h-4" />
                  )}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isInventoryDropdownOpen && (
                <div className="flex flex-col gap-2 bg-[#ffffff] p-2 rounded-md w-full">
                  <Link to="/inventory">
                    <button
                      onClick={() => handleDropdownButtonClick("inventory")}
                      className={`text-[#E88504] ${
                        activeDropdownButton === "inventory" ? "font-bold" : ""
                      }`}
                    >
                      <span className="flex-1 text-left pl-3">Inventory</span>
                    </button>
                  </Link>
                  <Link to="/stockin">
                    <button
                      onClick={() => handleDropdownButtonClick("stockin")}
                      className={`text-[#E88504] ${
                        activeDropdownButton === "stockin" ? "font-bold" : ""
                      }`}
                    >
                      <span className="flex-1 text-left pl-3">Stock In</span>
                    </button>
                  </Link>
                  <Link to="/stockout">
                    <button
                      onClick={() => handleDropdownButtonClick("stockout")}
                      className={`text-[#E88504] ${
                        activeDropdownButton === "stockout" ? "font-bold" : ""
                      }`}
                    >
                      <span className="flex-1 text-left pl-3">Disposed</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Attendance Button */}
            <Link to="/attendance">
              <button
                onClick={() => handleMainButtonClick("attendance")}
                className={`flex items-center ${
                  activeButton === "attendance" ? "bg-[#eaeaea]" : "bg-white"
                } text-[#E88504] rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 w-full overflow-hidden`}
              >
                <div className="flex items-center justify-center bg-[#eaeaea] p-2">
                  <FaCheck className="w-5 h-5 text-[#E88504]" /> {/* Replaced with icon */}
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
            className="flex items-center justify-center bg-white text-[#E88504] p-2 rounded-lg shadow hover:shadow-lg w-full"
          >
            <span>Logout</span>
          </button>
        ) : (
          // When not logged in, show a Login button that redirects to the Login page
          <Link to="/login">
            <button className="flex items-center justify-center bg-white text-[#E88504] p-2 rounded-lg shadow hover:shadow-lg w-full">
              <span>Login</span>
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;