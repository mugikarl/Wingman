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
  const [isEditMode, setIsEditMode] = useState(false);
  const [name, setName] = useState("");
  const [unitId, setUnitId] = useState(""); // State for unit ID
  const [categoryId, setCategoryId] = useState(""); // State for category ID
  const [stockTrigger, setStockTrigger] = useState("");

  // Update form fields when `item` prop changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setUnitId(item.measurement); // measurement is the ID of the unit
      setCategoryId(item.category); // category is the ID of the category
      setStockTrigger(item.stock_trigger);
    }
  }, [item]);

  console.log(units);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedItemData = {
      name,
      measurement: unitId, // Send the unit ID
      category: categoryId, // Send the category ID
      stock_trigger: stockTrigger, // Send the stock trigger
    };

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://127.0.0.1:8000/edit-item/${item.id}/`, // API endpoint for updating item
        updatedItemData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Item updated successfully!");
      fetchItemData(); // Refresh the item list
      setIsEditMode(false);
      closeModal();
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item.");
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `http://127.0.0.1:8000/delete-item/${item.id}/`, // Adjust URL if needed
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Item deleted successfully!");
      fetchItemData(); // Refresh the item list
      closeModal();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Item</h2>
          <div className="space-x-2">
            <button onClick={handleDelete} className="bg-red-500 text-white p-2 rounded-lg">
              Delete
            </button>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className="bg-[#E88504] text-white px-4 py-2 rounded-lg hover:bg-[#D57B03] transition-colors"
            >
              {isEditMode ? "Cancel Edit" : "Edit"}
            </button>
            <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-2 border rounded-lg ${
                !isEditMode ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
              }`}
              disabled={!isEditMode}
              required
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium">Unit</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className={`w-full p-2 border rounded-lg ${
                !isEditMode ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
              }`}
              required
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`w-full p-2 border rounded-lg ${
                !isEditMode ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
              }`}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Trigger */}
          <div>
            <label className="block text-sm font-medium">Stock Trigger</label>
            <input
              type="text"
              value={stockTrigger}
              onChange={(e) => setStockTrigger(e.target.value)}
              className={`w-full p-2 border rounded-lg ${
                !isEditMode ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
              }`}
              disabled={!isEditMode}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              disabled={!isEditMode}
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