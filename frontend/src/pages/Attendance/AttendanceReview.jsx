import React, { useState } from "react";
import { Datepicker } from "flowbite-react";

const AttendanceReview = ({ attendanceData, refreshAttendance }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const [showDatepicker, setShowDatepicker] = useState(false);

  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 mx-auto">
      <div className="relative bg-yellow-300 text-center text-lg font-semibold w-full py-2 rounded flex justify-center items-center">
        <button
          className="px-3 py-1 rounded-l-lg hover:bg-orange-400"
          onClick={() =>
            setSelectedDate(
              new Date(
                new Date(selectedDate).setDate(
                  new Date(selectedDate).getDate() - 1
                )
              ).toDateString()
            )
          }
        >
          &lt;
        </button>
        <div
          className="cursor-pointer mx-4"
          onClick={() => setShowDatepicker(!showDatepicker)}
        >
          {selectedDate}
        </div>
        <button
          className="px-3 py-1 rounded-r-lg hover:bg-orange-400"
          onClick={() =>
            setSelectedDate(
              new Date(
                new Date(selectedDate).setDate(
                  new Date(selectedDate).getDate() + 1
                )
              ).toDateString()
            )
          }
        >
          &gt;
        </button>
        {showDatepicker && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-white shadow-lg rounded-lg">
            <Datepicker
              inline
              onSelectedDateChange={(date) => {
                if (date) {
                  setSelectedDate(date.toDateString());
                  setShowDatepicker(false);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse bg-white text-black rounded-lg shadow-md">
          <thead>
            <tr className="bg-yellow-400 text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Employee Status</th>
              <th className="p-2">Attendance Status</th>
              <th className="p-2">Time In</th>
              <th className="p-2">Time Out</th>
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
                <td className="p-2">{formatTime(entry.timeIn)}</td>
                <td className="p-2">{formatTime(entry.timeOut)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceReview;
