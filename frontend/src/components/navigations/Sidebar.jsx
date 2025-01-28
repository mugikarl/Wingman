import React from "react";
import { Link, useNavigate } from "react-router-dom";

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
      <div className="flex-grow flex flex-col justify-around w-full px-2">
        {/* Other Buttons */}
        <Link to="/">
          <button className="flex items-center justify-center bg-[#FFCF03] p-2 rounded-lg w-full">
            <img src="/images/logo.png" alt="Logo" className="w-20 h-20" />
          </button>
        </Link>
        <Link to="/order">
          <button className="flex flex-col items-center text-[#FFCF03] p-3 rounded-lg shadow hover:shadow-lg">
            <img src="/images/order.png" alt="Order" className="w-12 h-12 mb-2" />
            <span className="text-white">Order</span>
          </button>
        </Link>

        <Link to="/inventory">
          <button className="flex flex-col items-center text-[#FFCF03] p-3 rounded-lg shadow hover:shadow-lg">
            <img src="/images/inventory.png" alt="Inventory" className="w-12 h-12 mb-2" />
            <span className="text-white">Inventory</span>
          </button>
        </Link>
        <Link to="/staffprofile">
          <button className="flex flex-col items-center text-[#FFCF03] p-3 rounded-lg shadow hover:shadow-lg">
            <img src="/images/staff.png" alt="Staff Profile" className="w-12 h-12 mb-2" />
            <span className="text-white">Staff Profile</span>
          </button>
        </Link>
        <Link to="/stockout">
          <button className="flex flex-col items-center text-[#FFCF03] p-3 rounded-lg shadow hover:shadow-lg">
            <img src="/images/sales.png" alt="Inventory" className="w-12 h-12 mb-2" />
            <span className="text-white">Sales</span>
          </button>
        </Link>

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
        
        {/* Add other buttons similarly */}
      </div>
    </div>
  );
};

export default Sidebar;