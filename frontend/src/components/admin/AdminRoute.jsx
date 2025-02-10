import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const role = localStorage.getItem("role");
  if (role !== "Admin") {
    return <Navigate to="/login" />;
  }
  return children;
};

export default AdminRoute;
