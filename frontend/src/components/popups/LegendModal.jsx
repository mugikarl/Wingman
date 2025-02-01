import React, { useState } from "react";

const LegendModal = ({ isOpen, closeModal, addLegend }) => {
  const [legendName, setLegendName] = useState("");
  const [legendColor, setLegendColor] = useState("#FF0000");

  const handleSave = () => {
    if (legendName.trim() !== "") {
      addLegend({ name: legendName, color: legendColor });
      setLegendName("");
      setLegendColor("#FF0000");
      closeModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add Legend</h2>

        {/* Legend Name Dropdown */}
        <label className="block font-semibold">Legend Name:</label>
        <select
          className="w-full p-2 border rounded mt-1"
          value={legendName}
          onChange={(e) => setLegendName(e.target.value)}
        >
          <option value="">Select a name</option>
          <option value="Shift 1">Shift 1</option>
          <option value="Shift 2">Shift 2</option>
          <option value="Day Off">Day Off</option>
        </select>

        {/* Color Picker */}
        <label className="block font-semibold mt-4">Choose Color:</label>
        <input
          type="color"
          className="w-full p-2 mt-1"
          value={legendColor}
          onChange={(e) => setLegendColor(e.target.value)}
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-400 text-white rounded">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegendModal;
