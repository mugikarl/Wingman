import React, { useState, useEffect } from "react";
import axios from "axios";
import { PiArrowsClockwiseLight } from "react-icons/pi";

const AddProfile = ({
  isOpen,
  closeModal,
  fetchEmployees,
  roles,
  statuses,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [salary, setSalary] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [status, setStatus] = useState(1); // Default to Active (assuming 1 is Active)

  const generatePasscode = () => {
    const newPasscode = Math.floor(100000 + Math.random() * 900000).toString();
    setPassword(newPasscode);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleRoleChange = (roleId) => {
    setSelectedRoles((prevRoles) =>
      prevRoles.includes(roleId)
        ? prevRoles.filter((id) => id !== roleId)
        : [...prevRoles, roleId]
    );
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Authentication required. Please log in.");
      return;
    }

    const employeeData = {
      first_name: firstName,
      last_name: lastName,
      middle_initial: middleInitial,
      email,
      contact: contactNumber,
      base_salary: parseFloat(salary) || 0,
      password,
      roles: selectedRoles,
      status_id: parseInt(status),
    };

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/add-employee/`,
        employeeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        alert("Employee added successfully!");
        fetchEmployees();
        closeModal();
      } else {
        alert("Failed to add employee. Please try again.");
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      alert(`Error: ${error.response?.data?.error || "Something went wrong"}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium">Add New Staff Profile</h2>
            <button
              onClick={closeModal}
              className="p-1 rounded hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
            >
              &times;
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Personal Information Section */}
              <div className="h-full">
                <div className="bg-white p-4 rounded-lg border h-full flex flex-col">
                  <h3 className="text-lg font-medium mb-4">
                    Personal Information
                  </h3>

                  {/* First Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  {/* Middle Initial */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Initial
                    </label>
                    <input
                      type="text"
                      value={middleInitial}
                      onChange={(e) => setMiddleInitial(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  {/* Salary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary
                    </label>
                    <input
                      type="text"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Account Details & Role Section */}
              <div className="flex flex-col space-y-6">
                {/* Account Details */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-medium mb-4">Account Details</h3>

                  {/* Email */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  {/* Password Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Set Password
                    </h4>

                    {/* Password */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={passwordVisible ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md pr-10"
                          placeholder="Click to generate a 6 digit code"
                        />
                        <button
                          onClick={generatePasscode}
                          className="absolute inset-y-0 right-2 p-2 hover:text-[#CC5500] transition-colors"
                          title="Generate 6-Digit Code"
                          type="button"
                        >
                          <PiArrowsClockwiseLight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Show/Hide button */}
                    <div className="flex items-center">
                      <button
                        onClick={togglePasswordVisibility}
                        className="text-[#CC5500] text-sm"
                        type="button"
                      >
                        {passwordVisible ? "Hide Password" : "Show Password"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role & Status */}
                <div className="bg-white p-4 rounded-lg border flex-grow">
                  <h3 className="text-lg font-medium mb-4">Role & Status</h3>

                  {/* Roles */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Roles
                    </label>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {roles.map((role) => (
                        <label
                          key={role.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.id)}
                            onChange={() => handleRoleChange(role.id)}
                            className="hidden"
                          />
                          <div
                            className={`w-5 h-5 border rounded-md flex items-center justify-center 
                              ${
                                selectedRoles.includes(role.id)
                                  ? "bg-[#CC5500] border-[#b34600] text-white"
                                  : "border-gray-400 bg-white"
                              }`}
                          >
                            {selectedRoles.includes(role.id) && "✓"}
                          </div>
                          <span>{role.role_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex space-x-6">
                      {statuses.map((statusOption) => (
                        <label
                          key={statusOption.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="status"
                            value={statusOption.id}
                            checked={parseInt(status) === statusOption.id}
                            onChange={(e) =>
                              setStatus(parseInt(e.target.value))
                            }
                            className="hidden"
                          />
                          <div
                            className={`w-5 h-5 border rounded-full flex items-center justify-center 
                              ${
                                parseInt(status) === statusOption.id
                                  ? "bg-[#CC5500] border-[#b34600]"
                                  : "border-gray-400 bg-white"
                              }`}
                          >
                            {parseInt(status) === statusOption.id && (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span>{statusOption.status_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with save button */}
          <div className="border-t p-4 flex justify-end space-x-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-md bg-[#CC5500] text-white hover:bg-[#b34600]"
            >
              Add Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProfile;
