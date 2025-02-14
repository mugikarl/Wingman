import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Datepicker } from "flowbite-react";

const AttendanceReview = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const [showDatepicker, setShowDatepicker] = useState(false);

  // Function to handle going to the previous day
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1); // Subtract one day
    setSelectedDate(date.toDateString());
  };

  // Function to handle going to the next day
  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1); // Add one day
    setSelectedDate(date.toDateString());
  };

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
    <div className="p-4 mx-auto">
      {/* Return Button */}
      <Link to="/staffprofile">
        <button className="bg-[#E88504] text-white px-4 py-2 rounded-lg shadow mb-2">
          Return to Staff Profile
        </button>
      </Link>

      {/* Date Row with Datepicker and Arrow Buttons */}
      <div className="relative bg-yellow-300 text-center text-lg font-semibold w-full py-2 rounded flex justify-center items-center">
        {/* Previous Day Button */}
        <button
          className="px-3 py-1 rounded-l-lg hover:bg-orange-400"
          onClick={goToPreviousDay}
        >
          &lt; {/* Left arrow symbol */}
        </button>

        {/* Selected Date */}
        <div
          className="cursor-pointer mx-4"
          onClick={() => setShowDatepicker(!showDatepicker)}
        >
          {selectedDate}
        </div>

        {/* Next Day Button */}
        <button
          className="px-3 py-1 rounded-l-lg hover:bg-orange-400"
          onClick={goToNextDay}
        >
          &gt; {/* Right arrow symbol */}
        </button>

        {/* Popup Date Picker */}
        {showDatepicker && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-white shadow-lg rounded-lg">
            <Datepicker
              inline // Use inline to show the calendar directly
              onSelectedDateChange={(date) => {
                if (date) {
                  setSelectedDate(date.toDateString()); // Update the selected date
                  setShowDatepicker(false); // Close the calendar
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto mt-0">
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
              <tr key={entry.id} className={index % 2 === 0 ? "bg-yellow-100" : "bg-yellow-200"}>
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

export default AttendanceReview;