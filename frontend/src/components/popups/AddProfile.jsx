import React, { useState, useEffect } from "react";
import axios from "axios";

const AddProfile = ({ isOpen, closeModal, fetchEmployees, roles, statuses }) => {
  if (!isOpen) return null; // Don't render the modal if it's not open

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [salary, setSalary] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);

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
    const employeeData = {
      first_name: firstName,
      last_name: lastName,
      middle_initial: middleInitial,
      username,
      email,
      contact: contactNumber,
      base_salary: salary,
      status: parseInt(status),
      passcode: password,
      roles: selectedRoles, // Send selected role IDs
    };

    try {
      await axios.post(`http://127.0.0.1:8000/api/add-employee/`, employeeData);
      alert("Employee added successfully!");
      fetchEmployees(); // Refresh the table immediately
      closeModal(); // Close modal after success
    } catch (error) {
      console.error("Error adding employee:", error);
      alert(`Error: ${error.response?.data?.error || "Something went wrong"}`);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
      <div className="bg-white rounded-lg p-6 w-8/10 space-y-4">
        {/* Modal Header */}
        <h2 className="text-2xl font-bold">Add New Staff Profile</h2>

        <div className="flex space-x-4">
            <div className="flex flex-col space-y-4 w-1/2">
              {/* First Name */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="p-2 border rounded-lg"
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="p-2 border rounded-lg"
                />
              </div>
              {/* Middle Initial */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="middleInitial" className="text-sm font-medium">Middle Initial</label>
                <input
                  type="text"
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value)}
                  className="p-2 border rounded-lg"
                />
              </div>
              {/* Contact Number */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="contactNumber" className="text-sm font-medium">Contact Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="p-2 border rounded-lg"
                />
              </div>
              {/* Salary */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="salary" className="text-sm font-medium">Salary</label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-4 w-1/2">
              {/* Username */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="username" className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="p-2 border rounded-lg"
                />
              </div>
              {/* Email */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-2 border rounded-lg"
                />
              </div>
              {/* Password */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="passcode" className="text-sm font-medium">Passcode</label>
                <input
                  type={passwordVisible ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  className="p-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-blue-500 text-sm"
                >
                  {passwordVisible ? "Hide" : "Show"} Passcode
                </button>
              </div>
              {/* Roles */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => handleRoleChange(role.id)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 border rounded-md flex items-center justify-center 
                        ${selectedRoles.includes(role.id) ? "bg-blue-500 border-blue-600 text-white" : "border-gray-400 bg-white"}`}>
                        {selectedRoles.includes(role.id) && "✓"}
                      </div>
                      <span>{role.role_name}</span>
                    </label>
                  ))}
                </div>
              </div>             
              {/* Status
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex space-x-4">
                  {statuses.map((statusOption) => (
                    <label key={statusOption.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={statusOption.id}
                        checked={parseInt(status) === statusOption.id}
                        onChange={(e) => setStatus(parseInt(e.target.value))}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 border rounded-full flex items-center justify-center 
                        ${parseInt(status) === statusOption.id ? "bg-green-500 border-green-600" : "border-gray-400 bg-white"}`}>
                        {parseInt(status) === statusOption.id && <div className="w-3 h-3 bg-white rounded-full"></div>}
                      </div>
                      <span>{statusOption.status_name}</span>
                    </label>
                  ))}
                </div>
              </div> */}
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
          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white p-2 rounded-lg shadow hover:shadow-lg w-1/3"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProfile;
