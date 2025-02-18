import React, { useState, useEffect } from "react";
import axios from "axios";

const EditInventory = ({ isOpen, closeModal, item, fetchInventoryData }) => {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");

  // Use effect to populate fields when the `item` prop changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setUnit(item.measurement);
      setCategory(item.category);
      setQuantity(item.quantity);
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedItemData = {
      name,
      measurement: unit,
      category,
      quantity,
    };

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://127.0.0.1:8000/api/edit-inventory/${item.id}/`,
        updatedItemData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Inventory updated successfully!");
      fetchInventoryData(); // Refresh inventory data
      closeModal(); // Close the modal
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert("Failed to update inventory.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Inventory</h2>
          <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInventory;
