import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoMdClose } from "react-icons/io";

const AddStockInDetails = ({
  isOpen,
  onClose,
  unitMeasurements,
  fetchReceipts,
  items,
  inventory,
  suppliers,
}) => {
  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];

  const [newStockIn, setNewStockIn] = useState({
    receipt_no: "",
    supplier_id: "",
    date: today,
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
  const [loadingText, setLoadingText] = useState("Submit");

  // Handle loading text animation
  useEffect(() => {
    let loadingInterval;
    if (loading) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setLoadingText(`Submitting${dots}`);
        dotCount++;
      }, 500);
    } else {
      setLoadingText("Submit");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [loading]);

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

    // Add the new entry to payload
    setStockInPayload([...stockInPayload, entryPayload]);

    // Don't create row elements here, just store the raw data
    setStockInRows([
      ...stockInRows,
      {
        id: stockInRows.length + 1,
        name: itemName,
        unit: newEntry.unit,
        cost: newEntry.cost,
        quantity: newEntry.quantity,
        totalCost: totalCost,
      },
    ]);

    setNewEntry({ item_id: "", unit: "", quantity: "", cost: "" });
  };

  const handleRemoveEntry = (index) => {
    setStockInPayload((prevPayload) => {
      const newPayload = [...prevPayload];
      newPayload.splice(index, 1);
      return newPayload;
    });

    setStockInRows((prevRows) => {
      const newRows = [...prevRows];
      newRows.splice(index, 1);
      return newRows;
    });
  };

  const handleAddReceipt = () => {
    if (!newStockIn.receipt_no || !newStockIn.supplier_id || !newStockIn.date) {
      alert("Please fill in all receipt details");
      return;
    }
    setNewStockIn((prev) => ({ ...prev, stock_ins: stockInData }));
    setReceiptAdded(true);
  };

  const handleSubmit = async () => {
    if (stockInRows.length === 0) {
      alert("Please add at least one item");
      return;
    }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`bg-white rounded-lg shadow-lg ${
          receiptAdded ? "w-full max-w-5xl h-[600px]" : "w-[500px]"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Add Stock In</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {!receiptAdded ? (
            /* Initial Receipt Details Form */
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="font-medium mb-1">Receipt No.:</label>
                <input
                  type="text"
                  name="receipt_no"
                  placeholder="Receipt No"
                  value={newStockIn.receipt_no}
                  onChange={handleChange}
                  className="p-2 border rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium mb-1">Supplier:</label>
                <select
                  name="supplier_id"
                  value={newStockIn.supplier_id || ""}
                  onChange={handleChange}
                  className="p-2 border rounded-lg"
                >
                  <option value="">Select Supplier</option>
                  {(suppliers || []).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="font-medium mb-1">Date:</label>
                <input
                  type="date"
                  name="date"
                  value={newStockIn.date}
                  onChange={handleChange}
                  className="p-2 border rounded-lg"
                />
              </div>
              <button
                onClick={handleAddReceipt}
                className="bg-green-500 text-white px-4 py-2 rounded w-full hover:bg-green-600 mt-4"
              >
                Add Receipt to Stock In
              </button>
            </div>
          ) : (
            /* Expanded View with Grid Layout */
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Left Column: Receipt Details */}
              <div className="h-full flex flex-col space-y-6">
                {/* Receipt Details */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-medium mb-4">Receipt Details</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="font-medium mb-1">Receipt No.:</label>
                      <div className="p-2 border rounded-lg bg-gray-200">
                        {newStockIn.receipt_no}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="font-medium mb-1">Supplier:</label>
                      <div className="p-2 border rounded-lg bg-gray-200">
                        {suppliers.find(
                          (s) => s.id === Number(newStockIn.supplier_id)
                        )?.name || ""}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="font-medium mb-1">Date:</label>
                      <div className="p-2 border rounded-lg bg-gray-200">
                        {newStockIn.date}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Computations */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex flex-col">
                    <p className="font-medium text-xl mt-1">
                      <span>Total Receipt Cost: </span> <br />
                      <span className="font-bold">
                        ₱{" "}
                        {stockInRows
                          .reduce(
                            (total, row) =>
                              total + parseFloat(row.totalCost || 0),
                            0
                          )
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Stock Table */}
              <div className="col-span-2 h-full">
                <div className="bg-white p-4 rounded-lg border h-full flex flex-col">
                  <h3 className="text-lg font-medium mb-4">Stock Items</h3>

                  {/* Add Stock Form */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    <div className="col-span-2">
                      <select
                        name="item_id"
                        value={newEntry.item_id}
                        onChange={handleEntryChange}
                        className="p-2 border rounded w-full"
                      >
                        <option value="">Select Item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        name="unit"
                        placeholder="Unit"
                        value={newEntry.unit}
                        readOnly
                        className="p-2 border rounded w-full bg-gray-100"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        name="quantity"
                        placeholder="Quantity"
                        value={newEntry.quantity}
                        onChange={handleEntryChange}
                        className="p-2 border rounded w-full"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        name="cost"
                        placeholder="Cost/Unit"
                        value={newEntry.cost}
                        onChange={handleEntryChange}
                        className="p-2 border rounded w-full"
                      />
                    </div>
                  </div>
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={handleAddEntry}
                      className="bg-[#CC5500] text-white px-4 py-2 rounded hover:bg-[#b34600]"
                    >
                      Add Item
                    </button>
                  </div>

                  {/* Table with fixed header and scrollable body */}
                  <div className="relative flex-1">
                    {/* Fixed header - position sticky */}
                    <div className="sticky top-0 z-10 w-full bg-[#CC5500]">
                      <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-sm text-white uppercase">
                          <tr>
                            {[
                              "ID",
                              "ITEM NAME",
                              "UNIT",
                              "COST",
                              "QUANTITY",
                              "TOTAL COST",
                            ].map((column, index) => (
                              <th
                                key={index}
                                scope="col"
                                className="px-4 py-3 font-medium whitespace-nowrap"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      </table>
                    </div>

                    {/* Scrollable area with absolute positioning */}
                    <div className="absolute top-[43px] left-0 right-0 bottom-0 overflow-y-auto">
                      <table className="w-full text-sm text-left text-gray-500">
                        <tbody>
                          {stockInRows.length > 0 ? (
                            stockInRows.map((row, index) => (
                              <tr
                                key={index}
                                className={`
                                  ${
                                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  } 
                                  border-b hover:bg-gray-200 group
                                `}
                              >
                                <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                  {row.name}
                                </td>
                                <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                  {row.unit}
                                </td>
                                <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                  {row.cost}
                                </td>
                                <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                  {row.quantity}
                                </td>
                                <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                  <div className="flex items-center justify-between">
                                    <span>{row.totalCost}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveEntry(index);
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-full ml-2"
                                    >
                                      <IoMdClose size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="bg-white border-b">
                              <td
                                className="px-4 py-3 text-center font-normal text-gray-500 italic"
                                colSpan={6}
                              >
                                No Stock Data Available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {receiptAdded && (
          <div className="border-t p-4 flex justify-end items-center h-[64px]">
            <div className="w-[140px]">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-4 py-2 rounded-md w-full text-center ${
                  loading
                    ? "bg-green-500 opacity-70 text-white cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {loadingText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStockInDetails;
