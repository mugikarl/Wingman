import React, { useEffect, useState } from "react";
import axios from "axios";

const EditStockInDetails = ({
  isOpen,
  onClose,
  receipt,
  unitMeasurements,
  items,
  inventory,
  onUpdate,
  suppliers,
}) => {
  if (!isOpen || !receipt) return null;

  // Local state for the stock-in data and receipt details used for editing.
  const [stockInData, setStockInData] = useState([]);
  const [editedStockData, setEditedStockData] = useState([]); // copy used for edits
  const [editedReceipt, setEditedReceipt] = useState({ ...receipt });
  const [selectedStock, setSelectedStock] = useState({
    name: "",
    measurement: "",
    quantity: "",
    price: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // On mount or when receipt, unitMeasurements, or suppliers change, initialize local state from props.
  useEffect(() => {
    if (receipt) {
      // Format stock entries if available.
      if (receipt.stock_ins) {
        const formattedStock = receipt.stock_ins.map((stock) => {
          const measurementSymbol =
            unitMeasurements?.find(
              (unit) => unit.id === stock.inventory?.item?.measurement
            )?.symbol || "N/A";
          return {
            id: stock.id,
            name: stock.inventory?.item?.name || "Unknown Item",
            measurement: measurementSymbol,
            price: stock.price,
            quantity: stock.quantity_in,
            totalCost: stock.price * stock.quantity_in,
            // Save original quantity and IDs for backend calculations.
            old_quantity: stock.quantity_in,
            inventory_id: stock.inventory?.id || null,
            item_id: stock.inventory?.item?.id || null,
            // Flag for deferred deletion.
            to_delete: false,
          };
        });
        setStockInData(formattedStock);
        setEditedStockData(formattedStock);
      }
      // Ensure the supplier id is a number.
      const supplierId = receipt.supplier ? Number(receipt.supplier) : "";
      const supplierObj = suppliers.find((s) => s.id === supplierId) || {};
      setEditedReceipt({
        ...receipt,
        supplier_id: supplierId,
        supplier_name: supplierObj.name || "",
      });
    }
  }, [receipt, unitMeasurements, suppliers]);

  // Toggle editing mode. If canceling, revert local changes.
  const toggleEditMode = () => {
    if (isEditing) {
      if (receipt.stock_ins) {
        const originalStock = receipt.stock_ins.map((stock) => {
          const measurementSymbol =
            unitMeasurements?.find(
              (unit) => unit.id === stock.inventory?.item?.measurement
            )?.symbol || "N/A";
          return {
            id: stock.id,
            name: stock.inventory?.item?.name || "Unknown Item",
            measurement: measurementSymbol,
            price: stock.price,
            quantity: stock.quantity_in,
            totalCost: stock.price * stock.quantity_in,
            old_quantity: stock.quantity_in,
            inventory_id: stock.inventory?.id || null,
            item_id: stock.inventory?.item?.id || null,
            to_delete: false,
          };
        });
        setEditedStockData(originalStock);
      }
      setEditedReceipt({ ...receipt });
    }
    setIsEditing(!isEditing);
    setSelectedStock({
      name: "",
      measurement: "",
      quantity: "",
      price: "",
    });
  };

  // Update receipt fields locally.
  const handleChange = (e) => {
    if (e.target.name === "supplier_id") {
      // Parse the supplier id to a number (or empty string if no selection).
      const newSupplierId = e.target.value ? Number(e.target.value) : "";
      const supplierObj = suppliers.find((s) => s.id === newSupplierId) || {};
      setEditedReceipt({
        ...editedReceipt,
        supplier_id: newSupplierId,
        supplier_name: supplierObj.name || "",
      });
    } else {
      setEditedReceipt({ ...editedReceipt, [e.target.name]: e.target.value });
    }
  };

  // Update an existing stock item in local state.
  const handleStockChange = (index, field, value) => {
    const updatedStock = [...editedStockData];
    updatedStock[index] = {
      ...updatedStock[index],
      [field]: value,
    };
    if (field === "quantity" || field === "price") {
      updatedStock[index].totalCost =
        parseFloat(updatedStock[index].price) *
        parseInt(updatedStock[index].quantity, 10);
    }
    setEditedStockData(updatedStock);
  };

  // For adding new stock entries, update local state.
  const handleAddStock = () => {
    if (
      selectedStock &&
      selectedStock.name &&
      selectedStock.quantity &&
      selectedStock.price
    ) {
      const selectedItem = items.find(
        (item) => item.name === selectedStock.name
      );
      if (!selectedItem) {
        alert("Selected item not found.");
        return;
      }
      let inventoryId = selectedItem.inventory_id;
      if (!inventoryId && typeof inventory !== "undefined") {
        const inv = inventory.find(
          (invRec) => String(invRec.item) === String(selectedItem.id)
        );
        if (inv) {
          inventoryId = inv.id;
        }
      }
      if (!inventoryId) {
        alert("No inventory id available for the selected item.");
        return;
      }
      const measurementSymbol =
        unitMeasurements?.find((unit) => unit.id === selectedItem.measurement)
          ?.symbol || "N/A";
      const newStock = {
        id: null, // new entry
        name: selectedStock.name,
        measurement: measurementSymbol,
        price: parseFloat(selectedStock.price),
        quantity: parseInt(selectedStock.quantity, 10),
        totalCost:
          parseFloat(selectedStock.price) *
          parseInt(selectedStock.quantity, 10),
        old_quantity: 0, // for new entries, original quantity is 0
        inventory_id: inventoryId,
        item_id: selectedItem.id,
        to_delete: false,
      };
      setEditedStockData((prev) => [...prev, newStock]);
      setSelectedStock({
        name: "",
        measurement: "",
        quantity: "",
        price: "",
      });
    }
  };

  // Update local selectedStock from inputs.
  const handleStockInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const selectedItem = items.find((item) => item.name === value);
      if (selectedItem) {
        const measurementSymbol =
          unitMeasurements?.find((unit) => unit.id === selectedItem.measurement)
            ?.symbol || "N/A";
        setSelectedStock({
          name: value,
          measurement: measurementSymbol,
          quantity: "",
          price: "",
          inventory_id: selectedItem.inventory_id,
          item_id: selectedItem.id,
        });
      }
    } else {
      setSelectedStock((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Mark a stock row for deletion.
  const markStockForDeletion = (index) => {
    setEditedStockData((prev) =>
      prev.map((stock, i) =>
        i === index ? { ...stock, to_delete: true } : stock
      )
    );
  };

  // Cancel deletion mark on a stock row.
  const cancelStockDeletion = (index) => {
    setEditedStockData((prev) =>
      prev.map((stock, i) =>
        i === index ? { ...stock, to_delete: false } : stock
      )
    );
  };

  // Handler for deleting the receipt (only visible when not editing).
  const deleteReceiptHandler = async () => {
    if (window.confirm("Are you sure you want to delete this receipt?")) {
      try {
        const res = await axios.delete(
          `http://127.0.0.1:8000/delete-receipt/${editedReceipt.receipt_id}/`
        );
        if (res.status === 200) {
          alert("Receipt deleted successfully!");
          onUpdate();
          onClose();
        }
      } catch (error) {
        console.error("Failed to delete receipt:", error);
        alert("An error occurred while deleting the receipt.");
      }
    }
  };

  // On submit, send all changes to the backend.
  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-receipt-stockin-data/${editedReceipt.receipt_id}/`,
        {
          receipt_no: editedReceipt.receipt_no,
          // Use the supplier id for the update
          supplier: editedReceipt.supplier_id,
          date: editedReceipt.date,
          stock_in_updates: editedStockData.map((stock) => ({
            id: stock.id || null, // if null, backend treats as new
            old_quantity: stock.old_quantity || 0,
            quantity_in: stock.to_delete ? 0 : stock.quantity,
            price: stock.price,
            inventory_id: stock.inventory_id,
            item_id: stock.item_id,
            delete: stock.to_delete || false,
          })),
        }
      );
      alert("Changes saved successfully!");
      if (response.data && response.data.receipt) {
        const updatedReceipt = response.data.receipt;
        setEditedReceipt({ ...updatedReceipt });
        if (updatedReceipt.stock_ins) {
          const formattedStock = updatedReceipt.stock_ins.map((stock) => {
            let itemName, measurementSymbol;
            if (stock.inventory && stock.inventory.item) {
              itemName = stock.inventory.item.name;
              const unit = unitMeasurements.find(
                (u) => u.id === stock.inventory.item.measurement
              );
              measurementSymbol = unit ? unit.symbol : "N/A";
            } else {
              const foundItem = items.find((item) => item.id === stock.item_id);
              itemName = foundItem ? foundItem.name : "Unknown Item";
              const unit = foundItem
                ? unitMeasurements.find((u) => u.id === foundItem.measurement)
                : null;
              measurementSymbol = unit ? unit.symbol : "N/A";
            }
            return {
              id: stock.id,
              name: itemName,
              measurement: measurementSymbol,
              price: stock.price,
              quantity: stock.quantity_in,
              totalCost: stock.price * stock.quantity_in,
              old_quantity: stock.quantity_in,
              inventory_id: stock.inventory?.id || stock.inventory_id || null,
              item_id: stock.inventory?.item?.id || stock.item_id || null,
              to_delete: false,
            };
          });
          setEditedStockData(formattedStock);
        }
      }
      setIsEditing(false);
      if (typeof onUpdate === "function") {
        onUpdate();
      }
      onClose();
    } catch (error) {
      console.error("Failed to update receipt:", error);
      alert("An error occurred while saving the changes.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
        <div className="absolute top-4 right-4 flex space-x-2">
          {isEditing && (
            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600"
            >
              Submit
            </button>
          )}
          {/* Only show Delete Receipt button when NOT editing */}
          {!isEditing && (
            <button
              onClick={deleteReceiptHandler}
              className="bg-red-700 text-white px-4 py-2 rounded-lg shadow hover:bg-red-800"
            >
              Delete Receipt
            </button>
          )}
          <button
            onClick={toggleEditMode}
            className={`px-4 py-2 rounded-lg shadow ${
              isEditing
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {isEditing ? "Cancel Edit Receipt" : "Edit Receipt"}
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            &times;
          </button>
        </div>
        <h2 className="text-xl font-bold mb-4">
          Edit Stock In - Receipt No. {receipt.receipt_no}
        </h2>

        {/* Receipt Details */}
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Receipt No.:</label>
            <input
              type="text"
              name="receipt_no"
              value={editedReceipt.receipt_no}
              onChange={handleChange}
              disabled={!isEditing}
              className={`p-2 border rounded-lg shadow ${
                isEditing ? "bg-white" : "bg-gray-200"
              }`}
            />
          </div>
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Supplier:</label>
            {isEditing ? (
              <select
                name="supplier_id"
                value={editedReceipt.supplier_id || ""}
                onChange={handleChange}
                className="p-2 border rounded-lg shadow bg-white"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2 border rounded-lg shadow bg-gray-200">
                {editedReceipt.supplier_name}
              </div>
            )}
          </div>
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Date:</label>
            <input
              type="date"
              name="date"
              value={editedReceipt.date}
              onChange={handleChange}
              disabled={!isEditing}
              className={`p-2 border rounded-lg shadow ${
                isEditing ? "bg-white" : "bg-gray-200"
              }`}
            />
          </div>
        </div>

        {/* Table with Editable Rows and Add Row */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-[#FFCF03]">
                {[
                  "ID",
                  "ITEM NAME",
                  "UNIT",
                  "COST",
                  "QUANTITY",
                  "TOTAL COST",
                  "ACTION",
                ].map((column, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 border-b border-gray-200 text-left text-sm font-semibold text-gray-700"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editedStockData.map((stock, index) => (
                <tr
                  key={index}
                  className={`hover:bg-yellow-200 ${
                    index % 2 === 0 ? "bg-[#FFEEA6]" : "bg-[#FFEEA6]"
                  }`}
                >
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    {stock.id}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    {stock.name}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    {stock.measurement}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    {isEditing ? (
                      <input
                        type="number"
                        value={stock.price}
                        onChange={(e) =>
                          handleStockChange(index, "price", e.target.value)
                        }
                        className="p-1 border rounded"
                      />
                    ) : (
                      stock.price
                    )}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    {isEditing ? (
                      <input
                        type="number"
                        value={stock.quantity}
                        onChange={(e) =>
                          handleStockChange(index, "quantity", e.target.value)
                        }
                        className="p-1 border rounded"
                      />
                    ) : (
                      stock.quantity
                    )}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    {stock.totalCost}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    <div>
                      {stock.to_delete ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelStockDeletion(index);
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                        >
                          Cancel Delete
                        </button>
                      ) : (
                        <button
                          disabled={!isEditing}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isEditing) return;
                            if (
                              window.confirm(
                                "Are you sure you want to delete this stock-in detail?"
                              )
                            ) {
                              markStockForDeletion(index);
                            }
                          }}
                          className={`bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ${
                            !isEditing ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {/* Add Row */}
              {isEditing && (
                <tr className="bg-[#FFEEA6] hover:bg-gray-50">
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    {/* ID (empty for new entries) */}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    <select
                      className="p-1 border rounded"
                      value={selectedStock.name}
                      name="name"
                      onChange={handleStockInputChange}
                    >
                      <option value="">Select Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    <input
                      type="text"
                      placeholder="Unit"
                      className="p-1 border rounded bg-gray-100"
                      name="measurement"
                      value={selectedStock.measurement}
                      disabled
                    />
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    <input
                      type="number"
                      placeholder="Cost/Unit"
                      className="p-1 border rounded"
                      name="price"
                      value={selectedStock.price}
                      onChange={handleStockInputChange}
                    />
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    <input
                      type="number"
                      placeholder="Quantity"
                      className="p-1 border rounded"
                      name="quantity"
                      value={selectedStock.quantity}
                      onChange={handleStockInputChange}
                    />
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    {/* Total Cost (calculated after adding) */}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                    <button
                      onClick={handleAddStock}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EditStockInDetails;
