import React from "react";
import { Link, useNavigate } from "react-router-dom";

const SidebarButton = ({ to, imgSrc, imgAlt, label }) => {
  return (
    <Link to={to}>
      <button className="flex flex-col items-center justify-center text-[#FFCF03] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
        {imgSrc && <img src={imgSrc} alt={imgAlt} className="mb-2" />}
        {label && <span className="text-center text-white">{label}</span>}
      </button>
    </Link>
  );
};

const Sidebar = ({ isAdmin, setIsAdmin }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    setIsAdmin(false);
    navigate("/login");
  };

  return (
    <div className="w-1/8 bg-[#FFCF03] flex flex-col justify-between items-center py-4">
      {/* Buttons */}
      <div className="flex-grow flex flex-col justify-around w-full px-4 gap-4">
        {/* Logo Button */}
        <Link to="/">
          <button className="flex items-center justify-center bg-[#FFCF03] p-2 rounded-lg w-full">
            <img src="/images/logo.png" alt="Logo" className="w-20 h-20" />
          </button>
        </Link>

        {/* Other Buttons */}
        <SidebarButton to="/ordertable" imgSrc="/images/order.png" imgAlt="Order" label="Order" />
        <SidebarButton to="/inventory" imgSrc="/images/inventory.png" imgAlt="Inventory" label="Inventory" />
        <SidebarButton to="/staffprofile" imgSrc="/images/staff.png" imgAlt="Staff Profile" label="Staff Profile" />
        <SidebarButton to="/sales" imgSrc="/images/sales.png" imgAlt="Sales" label="Sales" />

        {isAdmin ? (
          <button
            onClick={handleLogout}
            className="flex items-center justify-center bg-white text-[#FFCF03] p-2 rounded-lg shadow hover:shadow-lg w-full"
          >
            <span>Logout</span>
          </button>
        ) : (
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
