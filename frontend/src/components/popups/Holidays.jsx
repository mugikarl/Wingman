import React, { useState } from "react";

const Holidays = ({ isOpen, closeModal }) => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [leaveDate, setLeaveDate] = useState("");

  const holidayname = ["John Doe", "Jane Smith", "Mike Johnson"]; // Sample data

  const handleSave = () => {
    if (!selectedEmployee || !leaveDate) {
      alert("Please select an employee and a leave date.");
      return;
    }

    alert(`Leave scheduled for ${selectedEmployee} on ${leaveDate}`);
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Schedule Holiday</h2>

        <label className="block mb-2">Holiday Name</label>
        <input
                type="text"
                id="lastName"
                className="p-2 border rounded-lg shadow-sm focus:outline-none"
              />
         

        <label className="block mb-2">Select Date:</label>
        <input
          type="date"
          className="w-full p-2 border rounded-lg mb-4"
          value={leaveDate}
          onChange={(e) => setLeaveDate(e.target.value)}
        />

        <div className="flex justify-end space-x-4">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-[#E88504] text-white rounded-lg">Save</button>
        </div>
      </div>
    </div>
  );
};

export default Holidays;