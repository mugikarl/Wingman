import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { PiUser } from "react-icons/pi";
import { PiLock } from "react-icons/pi";
import { PiEye } from "react-icons/pi";
import { PiEyeSlash } from "react-icons/pi";
import { PiWarningCircleLight } from "react-icons/pi";

const Login = ({ setIsAdmin }) => {
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Login");
  const navigate = useNavigate();

  useEffect(() => {
    let loadingInterval;
    if (isLoading) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setLoadingText(`Login${dots}`);
        dotCount++;
      }, 500);
    } else {
      setLoadingText("Login");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isLoading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

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
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      // Display the error message returned from the backend, or a generic message.
      setError(err.response?.data?.error || "Login failed");
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="bg-[#fcf4dc] h-screen flex flex-col justify-center">
      <div className="w-full max-w-md mx-auto rounded-sm bg-[#CC5500] shadow-lg p-8">
        <div className="p-4 flex justify-center">
          <img src="/images/bawkbawk 2.png" alt="Logo" className="h-32" />
        </div>
        <div className="text-center py-2">
          <h1 className="text-5xl font-normal text-white">WINGMAN</h1>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-500 px-4 py-3 rounded-lg mb-4 flex items-center shadow-sm">
              <PiWarningCircleLight className="h-6 w-6 mr-2" />
              <p className="font-normal">{error}</p>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <div className="flex items-center border-2 rounded-sm overflow-hidden transition-colors">
                <div className="bg-gray-100 p-3 text-[#CC5500]">
                  <PiUser className="h-6 w-6" />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3 px-4 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center border-2 rounded-sm overflow-hidden transition-colors">
                <div className="bg-gray-100 p-3 text-[#CC5500]">
                  <PiLock className="h-6 w-6" />
                </div>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder="Passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full py-3 px-4 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="bg-gray-100 p-3 text-[#CC5500] border-l focus:outline-none"
                >
                  {isPasswordVisible ? (
                    <PiEye className="h-6 w-6" />
                  ) : (
                    <PiEyeSlash className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-[#CC5500] font-normal py-3 px-4 rounded-sm hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E88504] focus:ring-opacity-50 disabled:bg-gray-300 disabled:text-[#CC5500]/50 disabled:cursor-not-allowed"
            >
              {loadingText}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
