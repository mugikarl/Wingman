import React, { useState } from "react";
import Table from "../../components/tables/Table";
import axios from "axios";

const StockIn = () => {
  const columns = ["ID", "PRODUCT NAME", "UNIT", "QUANTITY", "TOTAL COST"];
  const [data, setData] = useState([]);

  // State for input fields
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("Kg");
  const [quantity, setQuantity] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");

  // Item list for dropdown
  const items = ["Item A", "Item B", "Item C"];

  // Function to add a new row to the table
  const addItem = () => {
    if (selectedItem && quantity && costPerUnit) {
      const totalCost = (
        parseFloat(quantity) * parseFloat(costPerUnit)
      ).toFixed(2);
      setData([
        ...data,
        [
          data.length + 1,
          selectedItem,
          selectedUnit,
          quantity,
          totalCost,
          <button
            className="bg-red-500 text-white p-2 rounded shadow remove-btn"
            onClick={() => removeItem(data.length)}
          >
            Remove
          </button>,
        ],
      ]);

      // Reset input fields after adding
      setSelectedItem("");
      setQuantity("");
      setCostPerUnit("");
    }
  };

  // Function to remove a row from the table
  const removeItem = (index) => {
    setData(data.filter((_, i) => i !== index));
  };

  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      {/* Main Content */}
      <div className="flex-grow">
        {/* Top Section */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <label htmlFor="supplier" className="font-bold">
              Supplier Name:
            </label>
            <input
              type="text"
              id="supplier"
              placeholder="Enter text"
              className="p-2 border rounded-lg shadow"
            />
          </div>
          <div className="flex items-center">
            <label className="font-bold mr-4 w-1/4">Date</label>
            <input
              type="date"
              className="p-2 border rounded-lg shadow w-full"
              id="calendar"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="receipt" className="font-bold">
              Receipt No:
            </label>
            <input
              type="text"
              id="receipt"
              placeholder="Enter text"
              className="p-2 border rounded-lg shadow"
            />
          </div>
          <button className="bg-[#E88504] text-white px-6 py-2 rounded-lg shadow">
            Submit
          </button>
        </div>

        {/* New Row Input Section */}
        <div className="flex items-center space-x-4 mb-6 p-4">
          {/* Item Dropdown */}
          <select
            className="p-2 border rounded-lg shadow w-1/5"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">Select Item</option>
            {items.map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* Unit Dropdown */}
          <select
            className="p-2 border rounded-lg shadow w-1/6"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <option value="Kg">Kg</option>
            <option value="pc">pc</option>
            <option value="L">L</option>
          </select>

          {/* Quantity Input */}
          <input
            type="number"
            placeholder="Quantity"
            className="p-2 border rounded-lg shadow w-1/6"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          {/* Cost per Unit Input */}
          <input
            type="number"
            placeholder="Cost per Unit"
            className="p-2 border rounded-lg shadow w-1/6"
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
          />

          {/* Add Button */}
          <button
            onClick={addItem}
            className="bg-[#00BA34] text-white px-6 py-2 rounded-lg shadow"
          >
            Add
          </button>
        </div>

        {/* Table */}
        <Table columns={columns} data={data} />
      </div>
    </div>
  );
};

export default StockIn;
