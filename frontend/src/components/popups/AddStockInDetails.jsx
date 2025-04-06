import React, { useState } from "react";
import axios from "axios";
import Table from "../../components/tables/Table";

const AddStockInDetails = ({
  isOpen,
  onClose,
  unitMeasurements,
  fetchReceipts,
  items,
  inventory,
  suppliers, // New prop for suppliers
}) => {
  if (!isOpen) return null;

  const [newStockIn, setNewStockIn] = useState({
    receipt_no: "",
    supplier_id: "", // Changed from supplier_name to supplier_id
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
  const [receiptAdded, setReceiptAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stockInPayload, setStockInPayload] = useState([]);
  const [stockInRows, setStockInRows] = useState([]);

  const handleChange = (e) => {
    setNewStockIn({ ...newStockIn, [e.target.name]: e.target.value });
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    if (name === "item_id") {
      const selectedItem = items.find((item) => item.id === Number(value));
      if (selectedItem) {
        const unitSymbol =
          unitMeasurements.find((unit) => unit.id === selectedItem.measurement)
            ?.symbol || "N/A";
        setNewEntry((prevState) => ({
          ...prevState,
          item_id: value,
          unit: unitSymbol,
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

    // Convert item_id to number for proper comparison
    const itemId = Number(newEntry.item_id);

    // Find matching inventory item
    const selectedInventory = inventory.find((inv) => {
      // Get the item_id, which might be directly on the inventory object
      // or nested in the item property
      const invItemId = inv.item
        ? Number(inv.item.id)
        : Number(inv.item_id || inv.item);
      return invItemId === itemId;
    });

    if (!selectedInventory) {
      console.error("No inventory found for item ID:", itemId);
      console.log("Available inventory items:", inventory);
      alert("No inventory record found for the selected item.");
      return;
    }

    const entryPayload = {
      inventory_id: selectedInventory.id,
      item_id: itemId,
      quantity_in: parseFloat(newEntry.quantity),
      price: parseFloat(newEntry.cost),
    };

    const itemName =
      items.find((item) => Number(item.id) === itemId)?.name || "Unknown Item";
    const totalCost = parseFloat(newEntry.quantity) * parseFloat(newEntry.cost);
    const displayRow = [
      stockInPayload.length + 1,
      itemName,
      newEntry.unit,
      newEntry.cost,
      newEntry.quantity,
      totalCost,
    ];

    setStockInPayload([...stockInPayload, entryPayload]);
    setStockInRows([...stockInRows, displayRow]);
    setNewEntry({ item_id: "", unit: "", quantity: "", cost: "" });
  };

  const handleAddReceipt = () => {
    setNewStockIn((prev) => ({ ...prev, stock_ins: stockInData }));
    setReceiptAdded(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...newStockIn,
      stock_ins: stockInPayload,
    };

    console.log("Submitting payload:", payload);
    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/add-stockin-data/",
        payload
      );
      console.log("Response:", response.data);
      fetchReceipts();
      onClose();
    } catch (error) {
      console.error(
        "Error submitting stock in data:",
        error.response?.data || error.message
      );
      alert("Error submitting data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        <h2 className="text-xl font-bold mb-4">Add Stock In</h2>

        {/* Receipt Details */}
        <div className="flex space-x-4 mb-6">
          <input
            type="text"
            name="receipt_no"
            placeholder="Receipt No"
            value={newStockIn.receipt_no}
            onChange={handleChange}
            disabled={receiptAdded}
            className="p-2 border rounded-lg shadow w-1/4"
          />
          {/* Supplier dropdown instead of textbox */}
          <select
            name="supplier_id" // Using supplier_id
            value={newStockIn.supplier_id || ""}
            onChange={handleChange}
            disabled={receiptAdded}
            className="p-2 border rounded-lg shadow w-1/4"
          >
            <option value="">Select Supplier</option>
            {(suppliers || []).map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            value={newStockIn.date}
            onChange={handleChange}
            disabled={receiptAdded}
            className="p-2 border rounded-lg shadow w-1/4"
          />
          {!receiptAdded && (
            <button
              onClick={handleAddReceipt}
              className="bg-[#CC5500] text-white px-4 py-2 rounded-lg shadow hover:bg-[#b34600]"
            >
              Add Receipt
            </button>
          )}
        </div>

        {/* Stock Entry Form */}
        {receiptAdded && (
          <div className="">
            <div className="flex flex-wrap mb-4 gap-4">
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
                className="bg-[#CC5500] text-white px-4 py-2 rounded-lg shadow hover:bg-[#b34600]"
              >
                Add
              </button>
            </div>
            <div className="mb-4">
              <Table
                columns={[
                  "ID",
                  "PRODUCT NAME",
                  "UNIT",
                  "COST",
                  "QUANTITY",
                  "TOTAL COST",
                ]}
                data={stockInRows}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-[#CC5500] text-white px-4 py-2 rounded-lg shadow hover:bg-[#b34600]"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStockInDetails;
