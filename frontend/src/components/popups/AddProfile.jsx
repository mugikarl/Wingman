import React, { useState } from "react";

const AddProfile = ({ isOpen, closeModal, fetchEmployees }) => {
  if (!isOpen) return null; // Don't render the modal if it's not open

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [salary, setSalary] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);

  const handleRoleChange = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
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
      passcode: password,
      roles: selectedRoles, // Send selected role IDs
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/api/add-employee/",
        employeeData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      alert("Employee added successfully!");
      fetchEmployees(); // Refresh the table immediately
      closeModal(); // Close modal after success
    } catch (error) {
      console.error("Error adding employee:", error);
      alert(`Error: ${error.response?.data?.error || "Something went wrong"}`);
    }
  };

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
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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
                value={middleInitial}
                onChange={(e) => setMiddleInitial(e.target.value)}
                maxLength={2}
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
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
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
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  <input
                    type="checkbox"
                    id="role1"
                    checked={selectedRoles.includes(1)}
                    onChange={() => handleRoleChange(1)}
                  />
                  <label htmlFor="role1" className="text-sm">
                    Admin
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="role2"
                    checked={selectedRoles.includes(2)}
                    onChange={() => handleRoleChange(2)}
                  />
                  <label htmlFor="role2" className="text-sm">
                    Kitchen
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="role3"
                    checked={selectedRoles.includes(3)}
                    onChange={() => handleRoleChange(3)}
                  />
                  <label htmlFor="role3" className="text-sm">
                    Waiter
                  </label>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="role1" />
                    <label htmlFor="role1" className="text-sm">
                      Employed
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="role2" />
                    <label htmlFor="role2" className="text-sm">
                      Resigned
                    </label>
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
