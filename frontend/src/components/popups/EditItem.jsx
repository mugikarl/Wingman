import React, { useState, useEffect } from "react";
import axios from "axios";

const EditItem = ({
  isOpen,
  closeModal,
  item,
  fetchItemData,
  units,
  categories,
  stock_trigger,
}) => {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [stockTrigger, setStockTrigger] = useState("");

  // Use useEffect to update form fields when `item` prop changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setUnit(item.measurement);
      setCategory(item.category);
      setStockTrigger(item.stock_trigger); // Set the stock trigger from item
    }
  }, [item]); // Run the effect when `item` changes

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedItemData = {
      name,
      measurement: unit,
      category,
      stock_trigger: stockTrigger, // Send the stock trigger
    };

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://127.0.0.1:8000/api/edit-item/${item.id}/`,
        updatedItemData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Item updated successfully!");
      fetchItemData(); // Refresh the item list
      closeModal(); // Close the modal
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Item</h2>
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
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.unit_name}>
                  {unit.unit_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.category_name}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Trigger input field */}
          <div>
            <label className="block text-sm font-medium">Stock Trigger</label>
            <input
              type="text"
              value={stockTrigger}
              onChange={(e) => setStockTrigger(e.target.value)}
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

export default EditItem;
