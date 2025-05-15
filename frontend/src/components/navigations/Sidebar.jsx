import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // Import icons
import {
  FaClipboard,
  FaBoxOpen,
  FaUser,
  FaChartLine,
  FaClipboardList,
  FaCheck,
  FaHouse,
} from "react-icons/fa6";

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
    setActiveButton(null);
    setActiveDropdownButton(null);
    setIsInventoryDropdownOpen(false);
    navigate("/dashboard");
  };

  useEffect(() => {
    setActiveButton(null);
    setActiveDropdownButton(null);
    setIsInventoryDropdownOpen(false);
  }, [isAdmin]);

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
    <div className="w-52 bg-[#CC5500] flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-center py-4">
        <Link to={isAdmin ? "/admin" : "/dashboard"}>
          <button className="flex p-2 rounded-lg w-full justify-center">
            <img src="/images/bawkbawk.png" alt="Logo" className="w-24" />
          </button>
        </Link>
      </div>

      {/* Navigation Buttons */}
      <div className="flex-grow overflow-y-auto">
        <div className="flex flex-col w-full px-2 gap-y-2">
          {isAdmin ? (
            <>
              {/* Order Button */}
              <Link to="/admin/ordertable">
                <button
                  onClick={() => handleMainButtonClick("order")}
                  className={`flex items-center py-3 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                    activeButton === "order" ? "bg-white/10" : "bg-transparent"
                  } hover:bg-white/10`}
                >
                  <div className="flex items-center justify-center p-2">
                    <FaClipboard className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left pl-3">Order</span>
                </button>
              </Link>

              {/* Inventory Button with Dropdown */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={toggleInventoryDropdown}
                  className={`flex items-center py-3 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                    activeButton === "inventory"
                      ? "bg-white/10"
                      : "bg-transparent"
                  } hover:bg-white/10`}
                >
                  <div className="flex items-center justify-center p-2">
                    <FaBoxOpen className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left pl-3">Inventory</span>
                  <span className="pr-2">
                    {isInventoryDropdownOpen ? (
                      <FaChevronUp className="w-3 h-4" />
                    ) : (
                      <FaChevronDown className="w-3 h-4" />
                    )}
                  </span>
                </button>

                {/* Dropdown Menu with Sliding Animation and Scrollable Area */}
                <div
                  className={`overflow-y-auto custom-scrollbar transition-[max-height] duration-300 ${
                    isInventoryDropdownOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="flex flex-col gap-2 pl-6 p-2 bg-transparent rounded-md">
                    <Link to="/inventory">
                      <button
                        onClick={() => handleDropdownButtonClick("inventory")}
                        className={`flex items-center py-2 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                          activeDropdownButton === "inventory"
                            ? "bg-white/10 font-bold"
                            : "bg-transparent"
                        } hover:bg-white/10`}
                      >
                        <span className="flex-1 text-left pl-3">Inventory</span>
                      </button>
                    </Link>
                    {role === "Admin" && (
                      <>
                        <Link to="/admin/menu">
                          <button
                            onClick={() => handleDropdownButtonClick("menu")}
                            className={`flex items-center py-2 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                              activeDropdownButton === "menu"
                                ? "bg-white/10 font-bold"
                                : "bg-transparent"
                            } hover:bg-white/10`}
                          >
                            <span className="flex-1 text-left pl-3">Menu</span>
                          </button>
                        </Link>
                      </>
                    )}
                    <Link to="/stockin">
                      <button
                        onClick={() => handleDropdownButtonClick("stockin")}
                        className={`flex items-center py-2 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                          activeDropdownButton === "stockin"
                            ? "bg-white/10 font-bold"
                            : "bg-transparent"
                        } hover:bg-white/10`}
                      >
                        <span className="flex-1 text-left pl-3">Stock In</span>
                      </button>
                    </Link>
                    <Link to="/stockout">
                      <button
                        onClick={() => handleDropdownButtonClick("stockout")}
                        className={`flex items-center py-2 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                          activeDropdownButton === "stockout"
                            ? "bg-white/10 font-bold"
                            : "bg-transparent"
                        } hover:bg-white/10`}
                      >
                        <span className="flex-1 text-left pl-3">Disposed</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Staff Profile Button */}
              <Link to="/admin/staffprofile">
                <button
                  onClick={() => handleMainButtonClick("staffprofile")}
                  className={`flex items-center py-3 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                    activeButton === "staffprofile"
                      ? "bg-white/10"
                      : "bg-transparent"
                  } hover:bg-white/10`}
                >
                  <div className="flex items-center justify-center p-2">
                    <FaUser className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left pl-3">Staff Profile</span>
                </button>
              </Link>

              {/* Sales Button */}
              <Link to="/admin/sales">
                <button
                  onClick={() => handleMainButtonClick("sales")}
                  className={`flex items-center py-3 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                    activeButton === "sales" ? "bg-white/10" : "bg-transparent"
                  } hover:bg-white/10`}
                >
                  <div className="flex items-center justify-center p-2">
                    <FaChartLine className="w-5 h-5 text-white" />
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
                  className={`flex items-center py-3 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                    activeButton === "order" ? "bg-white/10" : "bg-transparent"
                  } hover:bg-white/10`}
                >
                  <div className="flex items-center justify-center p-2">
                    <FaClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left pl-3">Order</span>
                </button>
              </Link>

              {/* Inventory Button with Dropdown */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={toggleInventoryDropdown}
                  className={`flex items-center py-3 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                    activeButton === "inventory"
                      ? "bg-white/10"
                      : "bg-transparent"
                  } hover:bg-white/10`}
                >
                  <div className="flex items-center justify-center p-2">
                    <FaBoxOpen className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left pl-3">Inventory</span>
                  <span className="pr-2">
                    {isInventoryDropdownOpen ? (
                      <FaChevronUp className="w-3 h-4" />
                    ) : (
                      <FaChevronDown className="w-3 h-4" />
                    )}
                  </span>
                </button>

                {/* Dropdown Menu with Sliding Animation and Scrollable Area */}
                <div
                  className={`overflow-y-auto custom-scrollbar transition-[max-height] duration-300 ${
                    isInventoryDropdownOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="flex flex-col gap-2 bg-transparent p-2 rounded-md w-full">
                    <Link to="/inventory">
                      <button
                        onClick={() => handleDropdownButtonClick("inventory")}
                        className={`flex items-center py-2 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                          activeDropdownButton === "inventory"
                            ? "bg-white/10 font-bold"
                            : "bg-transparent"
                        } hover:bg-white/10`}
                      >
                        <span className="flex-1 text-left pl-3">Inventory</span>
                      </button>
                    </Link>
                    {role === "Admin" && (
                      <>
                        <Link to="/admin/menu">
                          <button
                            onClick={() => handleDropdownButtonClick("menu")}
                            className={`flex items-center py-2 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                              activeDropdownButton === "menu"
                                ? "bg-white/10 font-bold"
                                : "bg-transparent"
                            } hover:bg-white/10`}
                          >
                            <span className="flex-1 text-left pl-3">Menu</span>
                          </button>
                        </Link>
                      </>
                    )}
                    <Link to="/stockin">
                      <button
                        onClick={() => handleDropdownButtonClick("stockin")}
                        className={`flex items-center py-2 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                          activeDropdownButton === "stockin"
                            ? "bg-white/10 font-bold"
                            : "bg-transparent"
                        } hover:bg-white/10`}
                      >
                        <span className="flex-1 text-left pl-3">Stock In</span>
                      </button>
                    </Link>
                    <Link to="/stockout">
                      <button
                        onClick={() => handleDropdownButtonClick("stockout")}
                        className={`flex items-center py-2 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                          activeDropdownButton === "stockout"
                            ? "bg-white/10 font-bold"
                            : "bg-transparent"
                        } hover:bg-white/10`}
                      >
                        <span className="flex-1 text-left pl-3">Disposed</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Attendance Button */}
              <Link to="/attendance">
                <button
                  onClick={() => handleMainButtonClick("attendance")}
                  className={`flex items-center py-3 px-2 rounded-xl text-white transition-all duration-200 w-full overflow-hidden ${
                    activeButton === "attendance"
                      ? "bg-white/10"
                      : "bg-transparent"
                  } hover:bg-white/10`}
                >
                  <div className="flex items-center justify-center p-2">
                    <FaCheck className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left pl-3">Attendance</span>
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Bottom Section: Login/Logout Button */}
      <div className="w-full px-4 py-6">
        {isAdmin ? (
          <button
            onClick={handleLogout}
            className="flex items-center justify-center bg-white text-[#E88504] p-2 rounded-sm shadow hover:shadow-lg hover:bg-gray-300 w-full"
          >
            <span>Logout</span>
          </button>
        ) : (
          <Link to="/login">
            <button className="flex items-center justify-center bg-white text-[#E88504] p-2 rounded-sm shadow hover:shadow-lg hover:bg-gray-300 w-full">
              <span>Admin Mode</span>
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
