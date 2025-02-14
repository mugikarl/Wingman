import React, { useState, useEffect } from "react";
import axios from "axios";

const TimeIn = ({ closeModal, refreshAttendance }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [timeInSuccess, setTimeInSuccess] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/fetch-attendance-data/")
      .then((response) => {
        setEmployees(
          response.data.filter((emp) => emp.employeeStatus === "ACTIVE")
        );
      })
      .catch((error) => {
        console.error("Error fetching attendance data:", error);
      });
  }, []);

  const verifyCode = () => {
    if (
      !selectedEmployeeId ||
      !email ||
      code.length !== 6 ||
      !/^\d+$/.test(code)
    ) {
      alert("Please enter valid details.");
      return;
    }

    axios
      .post("http://127.0.0.1:8000/time-in/", {
        employee_id: selectedEmployeeId,
        email: email,
        passcode: code,
      })
      .then((response) => {
        if (response.data.success) {
          setTimeInSuccess(true);
          alert("Time in successful.");
          refreshAttendance(); // Refresh attendance review after success
          closeModal(); // Close modal after successful time-in
        } else {
          alert("Verification failed.");
        }
      })
      .catch((error) => {
        alert(error.response?.data?.error || "Verification failed.");
      });
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
      <div className="bg-white rounded-lg p-6 w-96 space-y-4 relative">
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold">Time In</h2>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(parseInt(e.target.value, 10))} // Convert to int
          className="w-full p-2 border rounded-lg"
        >
          <option value="">Select Name</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className="w-full p-2 border rounded-lg text-center"
        />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength="6"
          placeholder="Enter 6-digit code"
          className="w-full p-2 border rounded-lg text-center"
        />
        <button
          onClick={verifyCode}
          className="bg-[#E88504] text-white p-2 w-full rounded-lg"
        >
          Verify & Time In
        </button>
      </div>
    </div>
  );
};

export default TimeIn;
