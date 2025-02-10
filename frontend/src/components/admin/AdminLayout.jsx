import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../navigations/Sidebar"; // your combined Sidebar component

const AdminLayout = ({ isAdmin, setIsAdmin }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar remains constant */}
      <Sidebar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      {/* The Outlet will render the nested admin pages */}
      <div className="flex-grow p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
