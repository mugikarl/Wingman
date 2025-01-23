import React, { useState } from "react";
import AddProfile from "./AddProfile"; // Import the AddProfile component

const StaffProfile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex-grow p-6">
      {/* Top Section */}
      <div className="flex items-start mb-4 space-x-4">
        {/* Top Buttons */}
        <div className="flex space-x-4">
          <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow">
            Button 1
          </button>
          <button
            onClick={openModal} // Open the modal on click
            className="flex items-center justify-center bg-[#E88504] text-white p-2 rounded-lg shadow"
          >
            Add New Profile
          </button>
          <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow">
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
            {/* Example Row */}
            <tr className="bg-[#FFEEA6] border-b">
              <td className="p-2">Data 1</td>
              <td className="p-2">Data 2</td>
              <td className="p-2">Data 3</td>
              <td className="p-2">
                <button className="bg-blue-500 text-white p-1 rounded shadow">Time In</button>
              </td>
              <td className="p-2">
                <button className="bg-red-500 text-white p-1 rounded shadow">Time Out</button>
              </td>
            </tr>
            {/* Repeat rows dynamically */}
          </tbody>
        </table>
      </div>

      {/* Add Profile Modal */}
      <AddProfile isOpen={isModalOpen} closeModal={closeModal} />
    </div>
  );
};

export default StaffProfile;
