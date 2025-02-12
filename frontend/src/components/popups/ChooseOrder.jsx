import React from "react";
import { useNavigate } from "react-router-dom";

const ChooseOrder = ({ onClose }) => {
  const navigate = useNavigate();

  const handleOrderTypeClick = (orderType) => {
    // Navigate to the Order page (can pass orderType as state or query params if needed)
    navigate("/order");
  };

  const handleClickOutside = (e) => {
    if (e.target.id === "modal-bg") {
      onClose();
    }
  };

  return (
    <div
      id="modal-bg"
      onClick={handleClickOutside}
      className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="w-1/2 bg-white shadow-lg rounded-lg p-4">
        {/* Title */}
        <h1 className="text-center text-2xl font-semibold mb-4">Choose Order Type</h1>

        {/* Button Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Button 1 */}
          <button
            onClick={() => handleOrderTypeClick("DINE_IN")}
            className="w-full h-[33vh] rounded-[5px] overflow-hidden relative"
          >
            <img
              src="./images/Dine in.png"
              alt="Dine In"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-semibold bg-black bg-opacity-50">
              DINE IN
            </span>
          </button>

          {/* Button 2 */}
          <button
            onClick={() => handleOrderTypeClick("TAKE_OUT")}
            className="w-full h-[33vh] rounded-[5px] overflow-hidden relative"
          >
            <img
              src="./images/Take out.png"
              alt="Take Out"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-semibold bg-black bg-opacity-50">
              TAKE OUT
            </span>
          </button>

          {/* Button 3 */}
          <button
            onClick={() => handleOrderTypeClick("GRAB")}
            className="w-full h-[33vh] rounded-[5px] overflow-hidden relative"
          >
            <img
              src="./images/Grab.png"
              alt="Grab"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-semibold bg-black bg-opacity-50">
              GRAB
            </span>
          </button>

          {/* Button 4 */}
          <button
            onClick={() => handleOrderTypeClick("FOODPANDA")}
            className="w-full h-[33vh] rounded-[5px] overflow-hidden relative"
          >
            <img
              src="./images/Foodpanda.png"
              alt="Foodpanda"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-semibold bg-black bg-opacity-50">
              FOODPANDA
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseOrder;