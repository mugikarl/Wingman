import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useModal } from "../utils/modalUtils";

const TimeOut = ({
  closeModal,
  refreshAttendance,
  handleTimeOutSuccess,
  currentDate,
  forceRefresh,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [employees, setEmployees] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [buttonText, setButtonText] = useState("Verify & Time Out");
  const [showPassword, setShowPassword] = useState(false);

  const { alert } = useModal();

  // Animation for the loading dots
  useEffect(() => {
    let loadingInterval;

    if (isVerifying) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setButtonText(`Verifying Time Out${dots}`);
        dotCount++;
      }, 500);
    } else {
      setButtonText("Verify & Time Out");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isVerifying]);

  // Modified to fetch attendance data for the current date and filter for employees who have timed in
  useEffect(() => {
    const url = `http://127.0.0.1:8000/fetch-attendance-data/?date=${currentDate}`;

    axios
      .get(url)
      .then((response) => {
        // Filter for active employees who have timed in but not timed out yet
        const timedInEmployees = response.data.filter(
          (emp) => emp.employeeStatus === "ACTIVE" && emp.timeIn && !emp.timeOut
        );
        setEmployees(timedInEmployees);
      })
      .catch((error) => {
        console.error("Error fetching attendance data:", error);
      });
  }, [currentDate]);

  const handleTimeOut = async () => {
    if (
      !selectedEmployeeId ||
      !email ||
      code.length !== 6 ||
      !/^\d+$/.test(code)
    ) {
      await alert("Please enter valid details.", "Validation Error");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/time-out/", {
        employee_id: selectedEmployeeId,
        email: email,
        passcode: code,
      });

      setIsVerifying(false);

      if (response.data.success) {
        await alert("Time out successful.", "Success");

        // First refresh data
        forceRefresh ? forceRefresh() : refreshAttendance(currentDate);

        // Then close modal after a slight delay to ensure the UI has refreshed
        setTimeout(() => {
          closeModal();
        }, 500);
      } else {
        await alert(response.data.error || "Time out failed.", "Error");
      }
    } catch (error) {
      setIsVerifying(false);
      await alert(error.response?.data?.error || "Time out failed.", "Error");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[400px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">Time Out</h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          <select
            value={selectedEmployeeId}
            onChange={(e) =>
              setSelectedEmployeeId(parseInt(e.target.value, 10))
            }
            className="w-full p-2 border rounded-lg"
            disabled={isVerifying}
          >
            <option value="">Select Name</option>
            {employees.length > 0 ? (
              employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No employees timed in
              </option>
            )}
          </select>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            className="w-full p-2 border rounded-lg"
            disabled={isVerifying}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength="6"
              placeholder="Enter 6-digit code"
              className="w-full p-2 border rounded-lg pr-10"
              disabled={isVerifying}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              tabIndex="-1"
            >
              {showPassword ? (
                <FaEyeSlash className="h-5 w-5 text-gray-400" />
              ) : (
                <FaEye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          <button
            onClick={handleTimeOut}
            disabled={isVerifying}
            className={`bg-[#CC5500] hover:bg-[#b34500] text-white p-2 w-full rounded-lg transition-colors duration-200 ${
              isVerifying ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeOut;
