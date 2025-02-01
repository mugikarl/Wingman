import React, { useState, useEffect } from "react";
import axios from "axios";
import AddProfile from "../components/popups/AddProfile"; 
import EditProfile from "../components/popups/EditProfile"; 

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
          <button className="bg-green-500 text-white p-2 rounded-lg shadow">
            Button 3
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container border rounded-lg shadow overflow-x-auto">
        <table className="table-auto w-full text-left">
          <thead className="bg-[#FFCF03] font-bold">
            <tr>
              <th className="p-1">Employee</th>
              <th className="p-1">Resigned</th>
            </tr>
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">NAME</th>
              <th className="p-2">ROLE</th>
              <th className="p-2">TIME IN</th>
              <th className="p-2">TIME OUT</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="bg-[#FFEEA6] border-b cursor-pointer hover:bg-yellow-200"
                  onClick={() => openEditModal(employee)}
                >
                  <td className="p-2">{employee.id}</td>
                  <td className="p-2">
                    {employee.first_name} {employee.last_name}
                  </td>
                  <td className="p-2">
                    {employee.roles.length > 0 ? employee.roles.join(", ") : "No Role"}
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
                  Load
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
