import React, { useState } from "react";

const AttendanceSheet = () => {
  const attendanceData = [
    { id: 1, name: "Joash A. Lim", status: "Present", timeIn: "08:23", timeOut: "20:00" },
    { id: 2, name: "Karl A. Natividad", status: "Present", timeIn: "08:23", timeOut: "20:00" },
    { id: 3, name: "Bea A. Arapoc", status: "Present", timeIn: "08:23", timeOut: "20:00" },
    { id: 4, name: "Isiah A. Veneracion", status: "Late", timeIn: "09:00", timeOut: "20:00" },
    { id: 5, name: "Hannah B. Alcaide", status: "Late", timeIn: "09:00", timeOut: "20:00" },
    { id: 6, name: "Job C. Pimentel", status: "Late", timeIn: "09:00", timeOut: "20:00" },
    { id: 7, name: "Mae F. Espera", status: "Absent", timeIn: "-", timeOut: "-" },
    { id: 8, name: "Justinne L. Floresca", status: "Absent", timeIn: "-", timeOut: "-" },
  ];

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleImageClick = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleCloseModal = () => {
    setSelectedEmployee(null);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white text-black rounded-lg shadow-md">
          <thead>
            <tr className="bg-yellow-400 text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Status</th>
              <th className="p-2">Time In</th>
              <th className="p-2">Time Out</th>
              <th className="p-2">Picture</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((entry, index) => (
              <tr
                key={entry.id}
                className={
                  index % 2 === 0 ? "bg-yellow-100" : "bg-yellow-200"
                }
              >
                <td className="p-2">{entry.id}</td>
                <td className="p-2">{entry.name}</td>
                <td className="p-2">{entry.status}</td>
                <td className="p-2">{entry.timeIn}</td>
                <td className="p-2">{entry.timeOut}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleImageClick(entry)}
                    className="bg-orange-500 text-white px-3 py-1 rounded"
                  >
                    Image
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render the custom modal if an employee is selected */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-center">February 14</h2>
            <h2 className="text-xl font-bold mb-4">{selectedEmployee.name}</h2>
            <div className="flex justify-between space-x-4">
              <div className="flex-1">
                <label className="block text-center font-medium mb-2">Time In</label>
                <div className="relative">
                  <img
                    src="/images/bawkbawk 2.png"
                    alt="Time In"
                    className="w-full h-auto rounded"
                  />
                  <span className="absolute top-2 right-2 bg-white bg-opacity-75 px-2 py-1 rounded">            
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-center font-medium mb-2">Time Out</label>
                <div className="relative">
                  <img
                    src="/images/bawkbawk 2.png"
                    alt="Time Out"
                    className="w-full h-auto rounded"
                  />
                  <span className="absolute top-2 left-2 bg-white bg-opacity-75 px-2 py-1 rounded">
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;