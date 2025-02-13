import React from "react";

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
                  <button className="bg-orange-500 text-white px-3 py-1 rounded">Image</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceSheet;