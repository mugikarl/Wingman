import React, { useState, useEffect } from "react";
import axios from "axios";

const NewItem = ({ isOpen, closeModal, fetchInventoryData }) => {
  const [itemName, setItemName] = useState("");
  const [stockTrigger, setStockTrigger] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchItemData();
    }
  }, [isOpen]);

  const fetchItemData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-item-data/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUnits(response.data.units || []);
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error("Error fetching item data:", err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!itemName || !stockTrigger || !selectedUnit || !selectedCategory) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        "http://127.0.0.1:8000/add-item/",
        {
          name: itemName,
          stock_trigger: stockTrigger,
          measurement: selectedUnit,
          category: selectedCategory,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Item added successfully!");
      fetchInventoryData();
      closeModal(); // Refresh inventory list
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
      <div className="bg-white rounded-lg p-6 w-1/4 space-y-4">
        <h2 className="text-2xl font-bold text-center">New Item</h2>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Item Name</label>
          <input
            type="text"
            className="p-2 border rounded-lg"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select
            className="p-2 border rounded-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Unit</label>
          <select
            className="p-2 border rounded-lg"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <option value="">Select Unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.symbol}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Stock Trigger</label>
          <input
            type="text"
            className="p-2 border rounded-lg"
            value={stockTrigger}
            onChange={(e) => setStockTrigger(e.target.value)}
          />
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={closeModal}
            className="bg-red-500 text-white p-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#E88504] text-white p-2 rounded-lg"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add New Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewItem;
