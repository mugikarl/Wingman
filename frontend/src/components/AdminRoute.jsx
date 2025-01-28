import React from "react";
import { Navigate, useParams } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const { adminId } = useParams(); // Extract admin ID from the URL
  const role = localStorage.getItem("role");
  const storedAdminId = localStorage.getItem("admin_id");

  if (role !== "Admin" || storedAdminId !== adminId) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default AdminRoute;
