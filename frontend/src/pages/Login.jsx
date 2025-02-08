import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ setIsAdmin }) => {
  const [email, setEmail] = useState(""); // Changed from username to email
  const [passcode, setPasscode] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Send email and passcode to the login endpoint
      const response = await axios.post("http://127.0.0.1:8000/api/login/", {
        email,
        passcode,
      });
      console.log("Login successful:", response.data);

      // Save tokens, role, and admin ID to local storage
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
      localStorage.setItem("role", "Admin");
      localStorage.setItem("admin_id", response.data.admin_id); // Save admin ID (employee ID)

      // Set admin state to true
      setIsAdmin(true);

      // Navigate to dashboard with admin ID in the URL
      navigate(`/dashboard-admin/${response.data.admin_id}`);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="bg-[#FFCF03] h-screen flex flex-col justify-center">
      {/* Container */}
      <div className="w-full max-w-md mx-auto rounded-lg">
        {/* Top Section: Logo */}
        <div className="p-4 flex justify-center">
          <img src="/images/bawkbawk 2.png" alt="Logo" className="h-32" />
        </div>

        {/* Middle Section: App Name */}
        <div className="text-center py-2">
          <h1 className="text-6xl italic font-family['Bangers'] text-outline text-[#E88504] drop-shadow">
            WINGMAN
          </h1>
        </div>

        {/* Bottom Section: Login Form */}
        <div className="p-6">
          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="relative mb-4">
              <div className="flex items-center border rounded-[15px] border-gray-300">
                <img
                  src="/images/username.png"
                  alt="Email Icon"
                  className="h-10 w-10 p-2"
                />
                <div className="h-full w-[1px] bg-gray-300"></div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2 px-3 focus:outline-none rounded-r-[15px]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative mb-4">
              <div className="flex items-center border rounded-[15px] border-gray-300">
                <img
                  src="/images/pass.png"
                  alt="Password Icon"
                  className="h-10 w-10 p-2"
                />
                <div className="h-full w-[1px] bg-gray-300"></div>
                <input
                  type="password"
                  placeholder="Passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full py-2 px-3 focus:outline-none rounded-r-[15px]"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-[#E88504] text-white font-bold py-2 px-4 rounded-none"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
