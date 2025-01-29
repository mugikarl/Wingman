import React, { useState } from "react";

const AddProfile = ({ isOpen, closeModal }) => {
  if (!isOpen) return null; // Don't render the modal if it's not open

  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
      <div className="bg-white rounded-lg p-6 w-8/10 space-y-4">
        {/* Modal Header */}
        <h2 className="text-2xl font-bold">Add New Staff Profile</h2>

        {/* Staff Profile Form */}
        <div className="flex space-x-4">
          {/* Left Column */}
          <div className="flex flex-col space-y-4 w-1/2">
            <div className="flex flex-col space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                className="p-2 border rounded-lg shadow-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                className="p-2 border rounded-lg shadow-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="middleInitial" className="text-sm font-medium">
                Middle Initial
              </label>
              <input
                type="text"
                id="middleInitial"
                maxLength={1}
                className="p-2 border rounded-lg shadow-sm focus:outline-none w-1/4"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="contactNumber" className="text-sm font-medium">
                Contact Number
              </label>
              <input
                type="text"
                id="contactNumber"
                className="p-2 border rounded-lg shadow-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="salary" className="text-sm font-medium">
                Salary
              </label>
              <input
                type="text"
                id="salary"
                className="p-2 border rounded-lg shadow-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col space-y-4 w-1/2">
            <div className="flex flex-col space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="p-2 border rounded-lg shadow-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="p-2 border rounded-lg shadow-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                className="p-2 border rounded-lg shadow-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-blue-500 text-sm"
              >
                {passwordVisible ? "Hide" : "Show"} Password
              </button>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="role1" />
                  <label htmlFor="role1" className="text-sm">Admin</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="role2" />
                  <label htmlFor="role2" className="text-sm">Manager</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="role3" />
                  <label htmlFor="role3" className="text-sm">Staff</label>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="role1" />
                  <label htmlFor="role1" className="text-sm">Employed</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="role2" />
                  <label htmlFor="role2" className="text-sm">Resigned</label>
                </div>
              </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Modal Footer */}
        <div className="flex justify-center space-x-4 mt-4">
          <button
            onClick={closeModal}
            className="bg-red-500 text-white p-2 rounded-lg shadow hover:shadow-lg w-1/3"
          >
            Cancel
          </button>
          <button className="bg-green-500 text-white p-2 rounded-lg shadow hover:shadow-lg w-1/3">
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProfile;
