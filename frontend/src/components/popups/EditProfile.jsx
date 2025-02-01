import React, { useState, useEffect } from "react";
import axios from "axios";

const EditProfile = ({ isOpen, closeModal, employee, fetchEmployees, roles, statuses }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [firstName, setFirstName] = useState(employee?.first_name || "");
  const [lastName, setLastName] = useState(employee?.last_name || "");
  const [middleInitial, setMiddleInitial] = useState(employee?.middle_initial || "");
  const [username, setUsername] = useState(employee?.username || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [contactNumber, setContactNumber] = useState(employee?.contact || "");
  const [salary, setSalary] = useState(employee?.base_salary || "");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [status, setStatus] = useState(employee?.status || "");
  const [selectedRoles, setSelectedRoles] = useState(employee?.roles || []);

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
    const updatedEmployeeData = {
      first_name: firstName,
      last_name: lastName,
      middle_initial: middleInitial,
      username: username,
      email: email,
      contact: contactNumber,
      base_salary: salary,
      status: status,
      roles: selectedRoles,
      passcode: password || undefined, // Only update password if provided
    };

    try {
      await axios.put(`http://127.0.0.1:8000/api/edit-employee/${employee.id}/`, updatedEmployeeData);
      fetchEmployees(); // Refresh employee data after update
      closeModal(); // Close modal after successful edit
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
        <div className="bg-white rounded-lg p-6 w-8/10 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Edit Staff Profile</h2>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className="bg-blue-500 text-white p-2 rounded-lg"
            >
              {isEditMode ? "Cancel Edit" : "Edit"}
            </button>
          </div>

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
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
                />
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
                        disabled={!isEditMode}
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

              {/* Status */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex space-x-4">
                  {statuses.map((statusOption) => (
                    <label key={statusOption.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={statusOption.id}
                        checked={status === statusOption.id}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={!isEditMode}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 border rounded-full flex items-center justify-center 
                        ${status === statusOption.id ? "bg-green-500 border-green-600" : "border-gray-400 bg-white"}`}>
                        {status === statusOption.id && <div className="w-3 h-3 bg-white rounded-full"></div>}
                      </div>
                      <span>{statusOption.status_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 mt-4">
            <button onClick={closeModal} className="bg-red-500 text-white p-2 rounded-lg">Close</button>
            <button onClick={handleSubmit} className="bg-green-500 text-white p-2 rounded-lg" disabled={!isEditMode}>Save</button>
          </div>
        </div>
      </div>
    )
  );
};

export default EditProfile;
