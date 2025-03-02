import React, { useState, useEffect } from "react";
import axios from "axios";

const DisposedInventory = ({ isOpen, closeModal, inventoryName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-96">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-xl font-semibold">
            Disposal for {inventoryName}
          </h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          {/* Disposer */}
          <div>
            <label className="block text-sm font-medium">Disposer</label>
            <select className="w-full p-2 border rounded-lg">
              <option>Employee 1</option>
              <option>Employee 2</option>
              <option>Employee 3</option>
            </select>
          </div>

          {/* Current Quantity & Current Unit (Side by Side) */}
          <div className="flex space-x-4">
            {/* Current Quantity */}
            <div className="w-1/2">
              <label className="block text-sm font-medium">
                Current Quantity
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                disabled
              />
            </div>

            {/* Current Unit */}
            <div className="w-1/2">
              <label className="block text-sm font-medium">Current Unit</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          {/* Disposal Quantity & Disposal Unit (Side by Side) */}
          <div className="flex space-x-4">
            {/* Disposal Quantity */}
            <div className="w-1/2">
              <label className="block text-sm font-medium">
                Disposal Quantity
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                min="1"
              />
            </div>

            {/* Disposal Unit */}
            <div className="w-1/2">
              <label className="block text-sm font-medium">
                Unit for Disposal
              </label>
              <select className="w-full p-2 border rounded-lg">
                <option>kg</option>
                <option>pcs</option>
                <option>liters</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <select className="w-full p-2 border rounded-lg">
              <option>Expired</option>
              <option>Damaged</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={() => alert("Disposed Successfully!")}
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
