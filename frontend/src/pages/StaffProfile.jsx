import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AddProfile from "../components/popups/AddProfile";
import EditProfile from "../components/popups/EditProfile";

const StaffProfile = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [roles, setRoles] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(1);

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token"); // Retrieve token
      const response = await axios.get("http://127.0.0.1:8000/fetch-data/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployees(response.data.employees || []);
      setRoles(response.data.roles || []);
      setStatuses(response.data.statuses || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setRoles([]);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
  };

  // Filter employees by status and then sort them by id
  const filteredEmployees = employees.filter(
    (emp) => emp.status === filterStatus
  );
  const sortedEmployees = [...filteredEmployees].sort((a, b) => a.id - b.id);

  return (
    <div className="flex-grow p-6 bg-[#E2D6D5] min-h-full">
      {/* Top Section */}
      <div className="flex items-start mb-4 space-x-4">
        <button className="bg-blue-500 text-white p-2 rounded-lg shadow">
          Button 1
        </button>
        <button
          onClick={openAddModal}
          className="bg-[#E88504] text-white p-2 rounded-lg shadow"
        >
          Add New Profile
        </button>
        <Link to="/schedule">
          <button className="bg-green-500 text-white p-2 rounded-lg shadow">
            Schedule
          </button>
        </Link>
      </div>
      <div>
        <button
          className={`p-2 shadow w-40 ${
            filterStatus === 1
              ? "bg-blue-700 text-white"
              : "bg-blue-500 text-gray-200"
          }`}
          onClick={() => setFilterStatus(1)}
        >
          Active
        </button>
        <button
          className={`p-2 shadow w-40 ${
            filterStatus === 2
              ? "bg-red-700 text-white"
              : "bg-red-500 text-gray-200"
          }`}
          onClick={() => setFilterStatus(2)}
        >
          Inactive
        </button>
      </div>

      {/* Table */}
      <div className="table-container border rounded-lg shadow overflow-x-auto">
        <table className="table-auto w-full text-left">
          <thead className="bg-[#FFCF03] font-bold">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">NAME</th>
              <th className="p-2">ROLE</th>
              <th className="p-2">TIME IN</th>
              <th className="p-2">TIME OUT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-2 text-center" colSpan="5">
                  Loading...
                </td>
              </tr>
            ) : sortedEmployees.length > 0 ? (
              sortedEmployees.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={index % 2 === 0 ? "bg-[#FFEEA6] border-b cursor-pointer hover:bg-yellow-200" : "bg-[#FFFFFF] border-b border-[#FFCF03] cursor-pointer hover:bg-gray-200"}
                  onClick={() => openEditModal(employee)}
                >
                  <td className="p-2">{employee.id}</td>
                  <td className="p-2">
                    {employee.first_name} {employee.last_name}
                  </td>
                  <td className="p-2">
                    {employee.roles.map((role) => role.role_name).join(", ")}
                  </td>
                  <td className="p-2">
                    <button className="bg-blue-500 text-white p-1 rounded shadow">
                      Time In
                    </button>
                  </td>
                  <td className="p-2">
                    <button className="bg-red-500 text-white p-1 rounded shadow">
                      Time Out
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-2 text-center" colSpan="5">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Profile Modal */}
      <AddProfile
        isOpen={isAddModalOpen}
        closeModal={closeAddModal}
        fetchEmployees={fetchEmployees}
        roles={roles || []}
        statuses={statuses || []}
      />
      {/* Edit Profile Modal */}
      {isEditModalOpen && selectedEmployee && (
        <EditProfile
          isOpen={isEditModalOpen}
          closeModal={closeEditModal}
          employee={selectedEmployee}
          fetchEmployees={fetchEmployees}
          roles={roles}
          statuses={statuses}
        />
      )}
    </div>
  );
};

export default StaffProfile;
