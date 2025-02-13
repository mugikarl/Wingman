import React, { useState, useEffect } from "react";
import axios from "axios";
import ChangePasswordPopup from "./ChangePasswordPopup"; // Import the new component


const EditProfile = ({
  isOpen,
  closeModal,
  employee,
  fetchEmployees,
  roles,
  statuses,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [firstName, setFirstName] = useState(employee?.first_name || "");
  const [lastName, setLastName] = useState(employee?.last_name || "");
  const [middleInitial, setMiddleInitial] = useState(
    employee?.middle_initial || ""
  );
  const [username, setUsername] = useState(employee?.username || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [contactNumber, setContactNumber] = useState(employee?.contact || "");
  const [salary, setSalary] = useState(employee?.base_salary || "");
  const [passcode, setPasscode] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [status, setStatus] = useState(employee?.status || "");
  const [selectedRoles, setSelectedRoles] = useState(
    employee?.roles?.map((role) => role.id) || []
  );
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const generatePasscode = () => {
    const newPasscode = Math.floor(100000 + Math.random() * 900000).toString();
    setPasscode(newPasscode);
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
  const handleChangePassword = (newPasscode) => {
    // Update the employee's passcode in the backend
    const token = localStorage.getItem("access_token");
    axios
      .put(
        `http://127.0.0.1:8000/api/change-password/${employee.id}/`,
        { passcode: newPasscode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        fetchEmployees();
      })
      .catch((error) => {
        console.error("Error changing password:", error);
      });
  };
  const handleSubmit = async () => {
    const updatedEmployeeData = {
      first_name: firstName,
      last_name: lastName,
      middle_initial: middleInitial,
      username,
      email,
      contact: contactNumber,
      base_salary: salary,
      passcode,
      status_id: parseInt(status), // Ensure status is sent as a number
      roles: selectedRoles, // Send role IDs
      ...(passcode && { passcode: passcode }), // Only include password if set
    };

    const token = localStorage.getItem("access_token");

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/edit-employee/${employee.id}/`,
        updatedEmployeeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchEmployees();
      setIsEditMode(!isEditMode);
      closeModal();
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;

    const token = localStorage.getItem("access_token");
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/delete-employee/${employee.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchEmployees();
      closeModal();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
        <div className="bg-white rounded-lg p-6 w-8/10 space-y-4">
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
          <div className="flex justify-between">
            <h2 className="text-2xl font-bold">Edit Staff Profile</h2>
            <div className="space-x-2">
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white p-2 rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className="bg-blue-500 text-white p-2 rounded-lg"
              >
                {isEditMode ? "Cancel Edit" : "Edit"}
              </button>
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="flex flex-col space-y-4 w-1/2">
              {/* First Name */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </label>
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
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </label>
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
                <label htmlFor="contactNumber" className="text-sm font-medium">
                  Contact Number
                </label>
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
                <label htmlFor="salary" className="text-sm font-medium">
                  Salary
                </label>
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
              {/* Username
              <div className="flex flex-col space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="p-2 border rounded-lg"
                  disabled={!isEditMode}
                />
              </div> */}
              {/* Email */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-2 border rounded-lg"
                  disabled={!isEditMode}
                />
              </div>
              {/* Password */}
              <div className="flex flex-col space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
                Password
              </label>
              <div className="flex flex-col space-y-2">
  {/* Password Field with Generate Icon Inside */}
  <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="bg-[#E88504] text-white p-2 rounded-lg"
              >
                Change Password
              </button>
              <ChangePasswordPopup
            isOpen={isChangePasswordOpen}
            closePopup={() => setIsChangePasswordOpen(false)}
            currentPassword={employee?.passcode} // Assuming the passcode is stored in the employee object
            onSave={handleChangePassword}
          />
{/* Show/Hide Button */}
<button
  onClick={togglePasswordVisibility}
  className="text-blue-500 text-sm self-start"
>
  {passwordVisible ? "Hide" : "Show"}
</button>
</div>
</div>
              {/* Roles */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => handleRoleChange(role.id)}
                        disabled={!isEditMode}
                        className="hidden"
                      />
                      <div
                        className={`w-5 h-5 border rounded-md flex items-center justify-center 
                        ${
                          selectedRoles.includes(role.id)
                            ? "bg-blue-500 border-blue-600 text-white"
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
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex space-x-4">
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
                        onChange={(e) => setStatus(parseInt(e.target.value))}
                        disabled={!isEditMode}
                        className="hidden"
                      />
                      <div
                        className={`w-5 h-5 border rounded-full flex items-center justify-center 
                        ${
                          parseInt(status) === statusOption.id
                            ? "bg-green-500 border-green-600"
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

          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white p-2 rounded-lg"
              disabled={!isEditMode}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default EditProfile;