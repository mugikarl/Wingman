import React, { useState, useEffect } from "react";
import axios from "axios";
import CameraModal from "../CameraModal";

const AttendanceSheet = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch attendance data on component mount.
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/fetch-attendance-data/")
      .then((response) => {
        // The API should return an array of employee attendance objects.
        setAttendanceData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching attendance data:", error);
      });
  }, []);

  // Set the selected employee for which the camera modal will open.
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
              <th className="p-2">Employee Status</th>
              <th className="p-2">Attendance Status</th>
              <th className="p-2">Time In</th>
              <th className="p-2">Time Out</th>
              <th className="p-2">Picture</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((entry, index) => (
              <tr
                key={entry.id}
                className={index % 2 === 0 ? "bg-yellow-100" : "bg-yellow-200"}
              >
                <td className="p-2">{entry.id}</td>
                <td className="p-2">{entry.name}</td>
                <td className="p-2">{entry.employeeStatus}</td>
                <td className="p-2">{entry.attendanceStatus}</td>
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

      {/* Render the CameraModal if an employee is selected */}
      {selectedEmployee && (
        <CameraModal
          name={selectedEmployee.name}
          onClose={handleCloseModal}
          onCapture={() => {}}
        />
      )}
    </div>
  );
};

export default AttendanceSheet;
