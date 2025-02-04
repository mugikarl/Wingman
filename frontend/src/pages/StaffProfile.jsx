import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AddProfile from "../components/popups/AddProfile";
import EditProfile from "../components/popups/EditProfile";
import Table from "../components/tables/Table";

const StaffProfile = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/fetch-data/");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

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

  const columns = ["ID", "NAME", "ROLE", "TIME IN", "TIME OUT"];

  const data = employees.length > 0 ? employees.map((employee) => [
    employee.id,
    `${employee.first_name} ${employee.last_name}`,
    employee.roles.length > 0 ? employee.roles.join(", ") : "No Role",
    <button className="bg-blue-500 text-white p-1 rounded shadow">Time In</button>,
    <button className="bg-red-500 text-white p-1 rounded shadow">Time Out</button>
  ]) : [];

  return (
    <div className="flex-grow p-6">
      {/* Top Section */}
      <div className="flex items-start mb-4 space-x-4">
        <div className="flex space-x-4">
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
      </div>

      {/* Table */}
      <Table 
        columns={columns} 
        data={data} 
        rowOnClick={(index) => openEditModal(employees[index])} 
      />

      {/* Add Profile Modal */}
      <AddProfile isOpen={isAddModalOpen} closeModal={closeAddModal} fetchEmployees={fetchEmployees} />

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfile
          isOpen={isEditModalOpen}
          closeModal={closeEditModal}
          employee={selectedEmployee}
          fetchEmployees={fetchEmployees}
        />
      )}
    </div>
  );
};

export default StaffProfile;
