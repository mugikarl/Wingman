import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AddProfile from "../../components/popups/AddProfile";
import EditProfile from "../../components/popups/EditProfile";
import LoadingScreen from "../../components/popups/LoadingScreen";
import Table from "../../components/tables/Table";
import {
  FaCalendarDays,
  FaPersonCirclePlus,
  FaRegNewspaper,
} from "react-icons/fa6";

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

  // Filter employees by status
  const filteredEmployees = employees.filter(
    (emp) => emp.status === filterStatus
  );
  // Sort the filtered employees
  const sortedEmployees = [...filteredEmployees].sort((a, b) => a.id - b.id);

  // Transform for table display
  const transformEmployeesForTable = (employees) => {
    return employees.map((employee) => [
      `${employee.first_name} ${employee.last_name}`,
      employee.roles.map((role) => role.role_name).join(", "),
    ]);
  };

  // Handle row click for the Table component
  const handleRowClick = (rowIndex) => {
    openEditModal(sortedEmployees[rowIndex]);
  };

  return (
    <div className="flex-grow p-6 bg-[#fcf4dc] min-h-full">
      {/* Top Section */}
      <div className="flex items-start mb-4 space-x-4">
        {/* Attendance Sheet Button 
        <Link to="/attendancereview">
          <button className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden">
            <div className="flex items-center justify-center border-r p-3">
              <FaRegNewspaper className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-2">Attendance Sheet</span>
          </button>
        </Link> */}

        {/* Add New Profile Button */}
        <button
          onClick={openAddModal}
          className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
        >
          {/* Darker Left Section for Icon */}
          <div className="flex items-center justify-center border-r p-3">
            <FaPersonCirclePlus className="w-5 h-5 text-[#CC5500]" />
          </div>
          {/* Text Aligned Left in Normal Color Section */}
          <span className="flex-1 text-left pl-3">Add New Profile</span>
        </button>
      </div>

      {/* Status Filter Buttons and Table Section */}
      <div className="flex flex-col">
        {/* Status Filter Buttons */}
        <div className="flex">
          <button
            className={`flex items-center justify-center p-2 transition-colors duration-200 w-48 rounded-tl-sm ${
              filterStatus === 1
                ? "bg-[#CC5500] text-white"
                : "bg-[#CC5500]/70 text-white"
            }`}
            onClick={() => setFilterStatus(1)}
          >
            Active
          </button>

          <button
            className={`flex items-center justify-center p-2 transition-colors duration-200 w-48 rounded-tr-sm ${
              filterStatus === 2
                ? "bg-[#CC5500] text-white"
                : "bg-[#CC5500]/70 text-white"
            }`}
            onClick={() => setFilterStatus(2)}
          >
            Inactive
          </button>
        </div>

        {/* Table Section */}
        {loading ? (
          <LoadingScreen message="Loading staff profile" />
        ) : (
          <div className="rounded-tr-lg">
            <Table
              columns={["NAME", "ROLE"]}
              data={transformEmployeesForTable(sortedEmployees)}
              rowOnClick={handleRowClick}
              maxHeight="700px"
            />
          </div>
        )}
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
