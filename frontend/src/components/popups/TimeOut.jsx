import React, { useState } from "react";
import CameraModal from "../CameraModal";

const TimeOut = ({ closeModal }) => {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [isVerified, setIsVerified] = useState(false);

    const verifyCode = () => {
        if (code.length === 6 && /^\d+$/.test(code)) {
            setIsVerified(true);
        } else {
            alert("Invalid code! Please enter a 6-digit number.");
        }
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

                        <h2 className="text-xl font-bold">Time Out</h2>

                        {/* Name Dropdown */}
                        <select
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                        >
                            <option value="">Select Name</option>
                            <option value="John Doe">John Doe</option>
                            <option value="Jane Smith">Jane Smith</option>
                            <option value="Alex Johnson">Alex Johnson</option>
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
                <CameraModal name={name} onClose={closeModal} onCapture={() => {}} />
            )}
        </>
    );
}

export default TimeOut
