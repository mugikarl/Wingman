import React, { useState } from "react";
import Table from "../../components/tables/Table";

const AddStockInDetails = ({ isOpen, onClose, unitMeasurements, items }) => {
  if (!isOpen) return null;

  const [newStockIn, setNewStockIn] = useState({
    receipt_no: "",
    supplier_name: "",
    date: "",
    stock_ins: [],
  });

  const [stockInData, setStockInData] = useState([]);
  const [newEntry, setNewEntry] = useState({
    item_id: "",
    unit: "",
    quantity: "",
    cost: "",
  });

  const handleChange = (e) => {
    setNewStockIn({ ...newStockIn, [e.target.name]: e.target.value });
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;

    if (name === "item_id") {
      // Make sure this matches the select field's name
      const selectedItem = items.find((item) => item.id === Number(value)); // Convert to number

      if (selectedItem) {
        const unitSymbol =
          unitMeasurements.find((unit) => unit.id === selectedItem.measurement)
            ?.symbol || "N/A";

        setNewEntry((prevState) => ({
          ...prevState,
          item_id: value,
          unit: unitSymbol, // Automatically update unit
        }));
      }
    } else {
      setNewEntry((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleAddEntry = () => {
    if (
      !newEntry.item_id ||
      !newEntry.unit ||
      !newEntry.quantity ||
      !newEntry.cost
    ) {
      alert("Please fill in all fields");
      return;
    }

    const itemName =
      items.find((item) => item.id === newEntry.item_id)?.name ||
      "Unknown Item";
    const totalCost = newEntry.quantity * newEntry.cost;

    const entry = [
      stockInData.length + 1,
      itemName,
      newEntry.unit,
      newEntry.cost,
      newEntry.quantity,
      totalCost,
    ];

    setStockInData([...stockInData, entry]);
    setNewEntry({ item_id: "", unit: "", quantity: "", cost: "" });
  };

  const handleSubmit = () => {
    console.log("New Stock In Data:", newStockIn, stockInData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600"
          >
            Submit
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        <h2 className="text-xl font-bold mb-4">Add Stock In</h2>

        <div className="mb-4 flex flex-wrap gap-4">
          <input
            type="text"
            name="receipt_no"
            placeholder="Receipt No"
            value={newStockIn.receipt_no}
            onChange={handleChange}
            className="p-2 border rounded-lg shadow w-1/4"
          />
          <input
            type="text"
            name="supplier_name"
            placeholder="Supplier Name"
            value={newStockIn.supplier_name}
            onChange={handleChange}
            className="p-2 border rounded-lg shadow w-1/4"
          />
          <input
            type="date"
            name="date"
            value={newStockIn.date}
            onChange={handleChange}
            className="p-2 border rounded-lg shadow w-1/4"
          />
        </div>

        <div className="flex space-x-4 mb-6">
          <select
            name="item_id"
            value={newEntry.item_id}
            onChange={handleEntryChange}
            className="p-2 border rounded-lg shadow w-1/3"
          >
            <option value="">Select Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="unit"
            placeholder="Unit"
            value={newEntry.unit}
            readOnly
            className="p-2 border rounded-lg shadow w-1/6 bg-gray-100 cursor-not-allowed"
          />
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={newEntry.quantity}
            onChange={handleEntryChange}
            className="p-2 border rounded-lg shadow w-1/6"
          />
          <input
            type="number"
            name="cost"
            placeholder="Cost/Unit"
            value={newEntry.cost}
            onChange={handleEntryChange}
            className="p-2 border rounded-lg shadow w-1/5"
          />
          <button
            onClick={handleAddEntry}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600"
          >
            Add
          </button>
        </div>

        <Table
          columns={[
            "ID",
            "PRODUCT NAME",
            "UNIT",
            "COST",
            "QUANTITY",
            "TOTAL COST",
          ]}
          data={stockInData}
        />
      </div>
    </div>
  );
};

export default AddStockInDetails;
