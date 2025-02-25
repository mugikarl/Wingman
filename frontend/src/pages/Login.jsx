import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ setIsAdmin }) => {
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8000/api/login/",
        { email, passcode },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const access_token =
        response.data.access_token || response.data.session?.access_token;
      const is_admin = response.data.is_admin || false;

      if (!access_token) {
        throw new Error("No token received from backend");
      }

      localStorage.setItem("access_token", access_token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      // Proceed only if the user is an admin.
      if (is_admin) {
        setIsAdmin(true);
        localStorage.setItem("role", "Admin");
        navigate("/dashboard-admin");
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setError("Access denied: Only Admins can log in");
      }
    } catch (err) {
      console.error("Login error:", err);
      // Display the error message returned from the backend, or a generic message.
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="bg-[#FFCF03] h-screen flex flex-col justify-center">
      <div className="w-full max-w-md mx-auto rounded-lg">
        <div className="p-4 flex justify-center">
          <img src="/images/bawkbawk 2.png" alt="Logo" className="h-32" />
        </div>
        <div className="text-center py-2">
          <h1 className="text-6xl italic font-family['Bangers'] text-outline text-[#E88504] drop-shadow">
            WINGMAN
          </h1>
        </div>
        <div className="p-6">
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form onSubmit={handleLogin}>
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
                  required
                />
              </div>
            </div>
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
                  required
                />
              </div>
            </div>
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
