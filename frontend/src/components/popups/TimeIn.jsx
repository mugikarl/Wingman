import React, { useState, useEffect } from "react";
import axios from "axios";
import CameraModal from "../CameraModal";

const TimeIn = ({ closeModal }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [code, setCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Fetch attendance data using Axios
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/fetch-attendance-data/")
      .then((response) => {
        // Filter for employees with an "Active" employee status
        const activeEmployees = response.data.filter(
          (emp) => emp.employeeStatus === "ACTIVE"
        );
        setEmployees(activeEmployees);
      })
      .catch((error) => {
        console.error("Error fetching attendance data:", error);
      });
  }, []);

  // When an employee is selected, store the employee id and name
  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    setSelectedEmployeeId(selectedId);
    const selectedEmp = employees.find((emp) => emp.id === selectedId);
    if (selectedEmp) {
      setEmployeeName(selectedEmp.name);
    } else {
      setEmployeeName("");
    }
  };

  // Use Axios to post the employee_id and passcode for verification
  const verifyCode = () => {
    if (!selectedEmployeeId) {
      alert("Please select an employee.");
      return;
    }
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      alert("Invalid code! Please enter a 6-digit number.");
      return;
    }
    axios
      .post("http://127.0.0.1:8000/verify-attendance/", {
        employee_id: selectedEmployeeId,
        passcode: code,
      })
      .then((response) => {
        if (response.data.success) {
          // Update employeeName from backend response (in case it differs)
          setEmployeeName(response.data.employee.name);
          setIsVerified(true);
        } else {
          alert("Verification failed.");
        }
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          alert(error.response.data.error);
        } else {
          alert("Verification failed. Please try again.");
        }
      });
  };

  return (
    <>
      {!isVerified ? (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4 relative">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>

            <h2 className="text-xl font-bold">Time In</h2>

            {/* Name Dropdown populated from fetched employee data */}
            <select
              value={selectedEmployeeId}
              onChange={handleSelectChange}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select Name</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>

            {/* 6-Digit Code Input */}
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength="6"
              placeholder="Enter 6-digit code"
              className="w-full p-2 border rounded-lg text-center"
            />

            {/* Verify Button */}
            <button
              onClick={verifyCode}
              className="bg-[#E88504] text-white p-2 w-full rounded-lg"
            >
              Verify
            </button>
          </div>
        </div>
      ) : (
        <CameraModal
          name={employeeName}
          onClose={closeModal}
          onCapture={() => {}}
        />
      )}
    </>
  );
};

export default TimeIn;
