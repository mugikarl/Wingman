import React from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  // Handle form submission (you can add actual login logic here)
  const handleSubmit = (e) => {
    e.preventDefault();
    // Redirect to another page after successful login (e.g., dashboard)
    navigate("/dashboard"); // Modify as needed
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
          <form onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="relative mb-4">
              <div className="flex items-center border rounded-[15px] border-gray-300">
                <img
                  src="/images/username.png"
                  alt="Username Icon"
                  className="h-10 w-10 p-2"
                />
                <div className="h-full w-[1px] bg-gray-300"></div>
                <input
                  type="text"
                  placeholder="Username"
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
                  placeholder="Password"
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
