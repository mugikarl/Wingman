import React, { useState, useEffect } from "react";

const EditProfile = ({ isOpen, closeModal, fetchEmployees, employee }) => {
  if (!isOpen || !employee) return null;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [salary, setSalary] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [status, setStatus] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);


  
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };
  useEffect(() => {
    if (employee) {
      setFirstName(employee.first_name || "");
      setLastName(employee.last_name || "");
      setMiddleInitial(employee.middle_initial || "");
      setUsername(employee.username || "");
      setEmail(employee.email || "");
      setContactNumber(employee.contact || "");
      setSalary(employee.base_salary || "");
      setSelectedRoles(employee.roles || []);
      setStatus(employee.status || "");
    }
  }, [employee]);

  const handleRoleChange = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async () => {
    const updatedEmployee = {
      first_name: firstName,
      last_name: lastName,
      middle_initial: middleInitial,
      username,
      email,
      contact: contactNumber,
      base_salary: salary,
      roles: selectedRoles,
      status,
    };

    try {
      const response = await fetch(`http://localhost:8000/api/update-employee/${employee.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEmployee),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Employee updated successfully!");
        fetchEmployees();
        closeModal();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
      <div className="bg-white rounded-lg p-6 w-8/10 space-y-4">
      <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">
      &times;
          </button>
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
            <div className="flex flex-col space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="p-2 border rounded-lg"
                disabled={!isEditMode}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="p-2 border rounded-lg"
                disabled={!isEditMode}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="middleInitial" className="text-sm font-medium">
                Middle Initial
              </label>
              <input
                type="text"
                value={middleInitial}
                onChange={(e) => setMiddleInitial(e.target.value)}
                maxLength={2}
                placeholder="Middle Initial"
                className="p-2 border rounded-lg w-1/4"
                disabled={!isEditMode}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="contactNumber" className="text-sm font-medium">
                Contact Number
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Contact Number"
                className="p-2 border rounded-lg"
                disabled={!isEditMode}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="salary" className="text-sm font-medium">
                Salary
              </label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Salary"
                className="p-2 border rounded-lg"
                disabled={!isEditMode}
              />
            </div>
          </div>
          <div className="flex flex-col space-y-4 w-1/2">
            <div className="flex flex-col space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="p-2 border rounded-lg"
                disabled={!isEditMode}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="p-2 border rounded-lg"
                disabled={!isEditMode}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="p-2 border rounded-lg shadow-sm focus:outline-none"
                disabled={!isEditMode}
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
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(1)}
                  onChange={() => handleRoleChange(1)}
                  disabled={!isEditMode}
                />{" "}
                Admin
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(2)}
                  onChange={() => handleRoleChange(2)}
                  disabled={!isEditMode}
                />{" "}
                Kitchen
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(3)}
                  onChange={() => handleRoleChange(3)}
                  disabled={!isEditMode}
                />{" "}
                Waiter
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex space-x-4">
                <input
                  type="radio"
                  name="status"
                  value="Employed"
                  checked={status === "Employed"}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!isEditMode}
                />{" "}
                Employed
                <input
                  type="radio"
                  name="status"
                  value="Resigned"
                  checked={status === "Resigned"}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!isEditMode}
                />{" "}
                Resigned
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center space-x-4 mt-4">
          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white p-2 rounded-lg w-1/3"
            disabled={!isEditMode}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;