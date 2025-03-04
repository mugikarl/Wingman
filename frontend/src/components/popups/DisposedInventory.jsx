import React, { useState } from "react";
import axios from "axios";

const DisposedInventory = ({
  isOpen,
  closeModal,
  selectedInventory,
  employees,
  units,
  reason,
}) => {
  if (!isOpen) return null;

  // Get values from selectedInventory (if available)
  const itemName = selectedInventory ? selectedInventory.name : "";
  const currentQuantity = selectedInventory ? selectedInventory.quantity : "";
  const currentUnit =
    selectedInventory &&
    units.find((unit) => unit.id === selectedInventory.measurement)
      ? units.find((unit) => unit.id === selectedInventory.measurement).symbol
      : "";

  // Local state for form inputs
  const [disposalQuantity, setDisposalQuantity] = useState("");
  const [selectedDisposalUnit, setSelectedDisposalUnit] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedDisposer, setSelectedDisposer] = useState("");

  // Handler to call the dispose_item backend endpoint
  const handleDispose = async () => {
    // Prepare the payload with values from the form and selectedInventory
    const payload = {
      inventory_id: selectedInventory.id, // id from selected inventory row
      disposed_quantity: parseFloat(disposalQuantity),
      disposed_unit: selectedDisposalUnit, // unit id from dropdown
      reason_of_disposal: selectedReason, // reason id from dropdown
      // Optionally add disposer if needed:
      // disposer: selectedDisposer,
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/dispose-item/",
        payload
      );
      console.log("Dispose response:", response.data);
      alert("Disposed Successfully!");
      closeModal();
    } catch (error) {
      console.error("Error disposing item:", error);
      alert("Error disposing item");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-96">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-xl font-semibold">Disposal for {itemName}</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          {/* Disposer Dropdown */}
          <div>
            <label className="block text-sm font-medium">Disposer</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={selectedDisposer}
              onChange={(e) => setSelectedDisposer(e.target.value)}
            >
              <option value="" hidden></option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Current Quantity & Current Unit (Side by Side) */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium">
                Current Quantity
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                value={currentQuantity}
                disabled
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium">Current Unit</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                value={currentUnit}
                disabled
              />
            </div>
          </div>

          {/* Disposal Quantity & Disposal Unit (Side by Side) */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium">
                Disposal Quantity
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                min="1"
                value={disposalQuantity}
                onChange={(e) => setDisposalQuantity(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium">
                Unit for Disposal
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={selectedDisposalUnit}
                onChange={(e) => setSelectedDisposalUnit(e.target.value)}
              >
                <option value="" hidden></option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              <option value="" hidden></option>
              {reason
                .filter((r) => r.id !== 1)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={handleDispose}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Dispose
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisposedInventory;
