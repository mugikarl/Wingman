import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AddProfile from "../../components/popups/AddProfile";
import EditProfile from "../../components/popups/EditProfile";
import LoadingScreen from "../../components/popups/LoadingScreen";
import { FaCalendarDays, FaPersonCirclePlus, FaRegNewspaper } from "react-icons/fa6";

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
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-employee-data/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
    <div className="flex-grow p-6 bg-[#] min-h-full">
      {/* Top Section */}
      <div className="flex items-start mb-4 space-x-4">
        {/* Attendance Sheet Button */}
        <Link to="/attendancereview">
          <button className="flex items-center bg-gradient-to-r from-[#1c4686] to-[#2a5ca7] text-white rounded-md shadow-md hover:from-[#163a6f] hover:to-[#1c4686] transition-colors duration-200 w-48 overflow-hidden">
            {/* Darker Left Section for Icon */}
            <div className="flex items-center justify-center bg-[#1c4686] p-3">
              <FaRegNewspaper className="w-5 h-5 text-white" />
            </div>
            {/* Text Aligned Left in Normal Color Section */}
            <span className="flex-1 text-left pl-3">Attendance Sheet</span>
          </button>
        </Link>

        {/* Add New Profile Button */}
        <button
          onClick={openAddModal}
          className="flex items-center bg-gradient-to-r from-[#E88504] to-[#F89A1C] text-white rounded-md shadow-md hover:from-[#D87A03] hover:to-[#E88504] transition-colors duration-200 w-48 overflow-hidden"
        >
          {/* Darker Left Section for Icon */}
          <div className="flex items-center justify-center bg-[#E88504] p-3">
            <FaPersonCirclePlus className="w-5 h-5 text-white" />
          </div>
          {/* Text Aligned Left in Normal Color Section */}
          <span className="flex-1 text-left pl-3">Add New Profile</span>
        </button>

        {/* Schedule Button */}
        <Link to="/schedule">
          <button className="flex items-center bg-gradient-to-r from-[#009E2A] to-[#00BA34] text-white rounded-md shadow-md hover:from-[#008C25] hover:to-[#009E2A] transition-colors duration-200 w-48 overflow-hidden">
            {/* Darker Left Section for Icon */}
            <div className="flex items-center justify-center bg-[#009E2A] p-3">
              <FaCalendarDays className="w-5 h-5 text-white" />
            </div>
            {/* Text Aligned Left in Normal Color Section */}
            <span className="flex-1 text-left pl-3">Schedule</span>
          </button>
        </Link>
      </div>
      <div className="flex space">
        {/* Active Button */}
        <button
          className={`flex items-center justify-center p-2 transition-colors duration-200 w-48 ${
            filterStatus === 1
              ? "bg-[#FFCF03] text-black" // Active state (same as table header)
              : "bg-[#bf9e0b] text-black opacity-70" // Inactive state (same as even rows)
          }`}
          onClick={() => setFilterStatus(1)}
        >
          Active
        </button>

        {/* Inactive Button */}
        <button
          className={`flex items-center justify-center transition-colors duration-200 w-48 ${
            filterStatus === 2
              ? "bg-[#FFCF03] text-black" // Active state (same as table header)
              : "bg-[#bf9e0b] text-black opacity-70" // Inactive state (same as odd rows)
          }`}
          onClick={() => setFilterStatus(2)}
        >
          Inactive
        </button>
      </div>

      {/* Table */}
      <div className="table-container border rounded-lg rounded-tl-none shadow overflow-x-auto">
        <table className="table-auto w-full text-left">
          <thead className="bg-[#FFCF03] font-bold">
            <tr>
              <th className="p-2">NAME</th>
              <th className="p-2">ROLE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-2 text-center" colSpan="5">
                  return <LoadingScreen />; 
                </td>
              </tr>
            ) : sortedEmployees.length > 0 ? (
              sortedEmployees.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={
                    index % 2 === 0
                      ? "bg-[#FFEEA6] border-b cursor-pointer hover:bg-yellow-200"
                      : "bg-[#FFFFFF] border-b border-[#FFCF03] cursor-pointer hover:bg-gray-200"
                  }
                  onClick={() => openEditModal(employee)}
                >
                  <td className="p-2">
                    {employee.first_name} {employee.last_name}
                  </td>
                  <td className="p-2">
                    {employee.roles.map((role) => role.role_name).join(", ")}
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
