import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useModal } from "../utils/modalUtils";

const EmployeeVerification = ({
  closeModal,
  employee,
  onVerificationSuccess,
  isOpen,
}) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [buttonText, setButtonText] = useState("Verify & Proceed");
  const [showPassword, setShowPassword] = useState(false);

  const { alert } = useModal();

  // Reset form when component opens
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setCode("");
      setIsVerifying(false);
    }
  }, [isOpen]);

  // Animation for the loading dots
  useEffect(() => {
    let loadingInterval;

    if (isVerifying) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setButtonText(`Verifying${dots}`);
        dotCount++;
      }, 500);
    } else {
      setButtonText("Verify & Proceed");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isVerifying]);

  const verifyCode = async () => {
    if (!employee || !email || code.length !== 6 || !/^\d+$/.test(code)) {
      await alert("Please enter valid details.", "Validation Error");
      return;
    }

    setIsVerifying(true);

    try {
      // Now just collecting the credentials for verification on the backend
      // No separate verification API call, passing credentials to parent
      setIsVerifying(false);

      // Pass the verification info back to parent component
      onVerificationSuccess(email, code);
    } catch (error) {
      setIsVerifying(false);
      await alert("Verification process failed.", "Error");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[400px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">Verify Employee</h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          {/* Employee info display */}
          <div className="bg-gray-100 p-3 rounded-lg text-center">
            <p className="text-gray-500 text-sm">Selected Employee</p>
            <p className="font-semibold text-lg">
              {employee
                ? `${employee.first_name} ${employee.last_name}`
                : "None"}
            </p>
          </div>

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
            onClick={verifyCode}
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

export default EmployeeVerification;
