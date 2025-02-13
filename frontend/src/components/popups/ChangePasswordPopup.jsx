import React, { useState } from "react";

const ChangePasswordPopup = ({ isOpen, closePopup, currentPassword, onSave }) => {
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  const generatePasscode = () => {
    const generatedPasscode = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPasscode(generatedPasscode);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSave = () => {
    if (!currentPasscode) {
      setError("Please enter your current password.");
      return;
    }

    if (currentPasscode !== currentPassword) {
      setError("Incorrect current password.");
      return;
    }

    if (!newPasscode) {
      setError("Please generate a new passcode.");
      return;
    }

    onSave(newPasscode);
    closePopup();
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
        <div className="bg-white rounded-lg p-6 w-96 space-y-4 shadow-lg">
          <h2 className="text-xl font-bold">Change Password</h2>
          <div className="flex flex-col space-y-4">
            {/* Current Password Field */}
            <div className="flex flex-col space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium">
                Current Password
              </label>
              <input
                type="password"
                value={currentPasscode}
                onChange={(e) => setCurrentPasscode(e.target.value)}
                className="p-2 border rounded-lg"
                placeholder="Enter current password"
              />
            </div>

            {/* New Password Field */}
            <div className="flex flex-col space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={newPasscode}
                  readOnly
                  className="p-2 border rounded-lg bg-gray-200 w-full pr-10"
                  placeholder="Generated password"
                />
                {/* Generate Icon Button */}
                <button
                  onClick={generatePasscode}
                  className="absolute inset-y-0 right-2 p-2 hover:text-blue-500 transition-colors"
                  title="Generate Passcode"
                >
                  🔄
                </button>
              </div>
              {/* Show/Hide Button */}
              <button
                onClick={togglePasswordVisibility}
                className="text-blue-500 text-sm self-start"
              >
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={closePopup}
                className="bg-gray-500 text-white p-2 rounded-lg px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-green-500 text-white p-2 rounded-lg px-4"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ChangePasswordPopup;
