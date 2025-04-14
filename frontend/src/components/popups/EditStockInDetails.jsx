import React, { useEffect, useState } from "react";
import axios from "axios";
import { IoMdClose } from "react-icons/io";
import { useModal } from "../utils/modalUtils";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [savingText, setSavingText] = useState("Save Changes");
  const [deletingText, setDeletingText] = useState("Delete Receipt");
  const { alert, confirm } = useModal();

  // Add this useEffect for the loading animations
  useEffect(() => {
    let loadingInterval;
    if (isSubmitting) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        if (isEditing) {
          setSavingText(`Saving${dots}`);
        } else {
          setDeletingText(`Deleting${dots}`);
        }
        dotCount++;
      }, 500);
    } else {
      setSavingText("Save Changes");
      setDeletingText("Delete Receipt");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmitting, isEditing]);

  // On mount or when receipt, unitMeasurements, or suppliers change, initialize local state from props.
  useEffect(() => {
    if (receipt) {
      console.log("Receipt data:", receipt);

      // Ensure we capture the receipt ID correctly
      const receiptId = receipt.id || receipt.receipt_id;

      // Format stock entries if available.
      if (receipt.stock_ins && Array.isArray(receipt.stock_ins)) {
        console.log("Stock-ins data:", receipt.stock_ins);

        const formattedStock = receipt.stock_ins.map((stock) => {
          console.log("Processing stock item:", stock);

          // Handle different possible data structures
          let itemName = "Unknown Item";
          let itemId = null;
          let measurementId = null;
          let measurementSymbol = "N/A";
          let inventoryId = stock.inventory_id || null;

          // Try to get item details from the nested structure
          if (stock.inventory && stock.inventory.item) {
            const item = stock.inventory.item;
            itemName = item.name || "Unknown Item";
            itemId = item.id || null;
            measurementId = item.measurement || null;

            // Find the unit measurement
            if (measurementId && unitMeasurements) {
              const unit = unitMeasurements.find((u) => u.id === measurementId);
              measurementSymbol = unit ? unit.symbol : "N/A";
            }
          }
          // If no nested item, try to find from the items prop
          else if (stock.item_id) {
            const item = items.find((i) => i.id === stock.item_id);
            if (item) {
              itemName = item.name;
              itemId = item.id;
              measurementId = item.measurement;

              // Find the unit measurement
              if (measurementId && unitMeasurements) {
                const unit = unitMeasurements.find(
                  (u) => u.id === measurementId
                );
                measurementSymbol = unit ? unit.symbol : "N/A";
              }
            }
          }

          console.log(`Item: ${itemName}, Unit: ${measurementSymbol}`);

          return {
            id: stock.id,
            name: itemName,
            measurement: measurementSymbol,
            price: stock.price || 0,
            quantity: stock.quantity_in || 0,
            totalCost: (stock.price || 0) * (stock.quantity_in || 0),
            // Save original quantity and IDs for backend calculations.
            old_quantity: stock.quantity_in || 0,
            inventory_id: inventoryId,
            item_id: itemId,
            // Flag for deferred deletion.
            to_delete: false,
          };
        });

        console.log("Formatted stock data:", formattedStock);
        setStockInData(formattedStock);
        setEditedStockData(formattedStock);
      } else {
        console.warn("No stock_ins array found in receipt:", receipt);
        setStockInData([]);
        setEditedStockData([]);
      }

      // Handle the nested supplier object
      if (
        receipt.supplier &&
        typeof receipt.supplier === "object" &&
        receipt.supplier.id
      ) {
        setEditedReceipt({
          ...receipt,
          id: receiptId, // Ensure we have the ID
          supplier_id: receipt.supplier.id,
          supplier_name: receipt.supplier.name || "",
        });
      } else {
        const supplierId = receipt.supplier ? Number(receipt.supplier) : "";
        const supplierObj = suppliers.find((s) => s.id === supplierId) || {};
        setEditedReceipt({
          ...receipt,
          id: receiptId, // Ensure we have the ID
          supplier_id: supplierId,
          supplier_name: supplierObj.name || "",
        });
      }
    }
  }, [receipt, unitMeasurements, suppliers, items]);

  // Toggle editing mode. If canceling, revert local changes.
  const toggleEditMode = () => {
    if (isEditing) {
      // Restoring original data when canceling edit
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

      // FIXED: Properly restore the supplier data when canceling edit
      if (
        receipt.supplier &&
        typeof receipt.supplier === "object" &&
        receipt.supplier.id
      ) {
        setEditedReceipt({
          ...receipt,
          supplier_id: receipt.supplier.id,
          supplier_name: receipt.supplier.name || "",
        });
      } else {
        const supplierId = receipt.supplier ? Number(receipt.supplier) : "";
        const supplierObj = suppliers.find((s) => s.id === supplierId) || {};
        setEditedReceipt({
          ...receipt,
          supplier_id: supplierId,
          supplier_name: supplierObj.name || "",
        });
      }
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
  const handleAddStock = async () => {
    if (
      selectedStock &&
      selectedStock.name &&
      selectedStock.quantity &&
      selectedStock.price
    ) {
      setIsAdding(true);

      try {
        // Find the selected item by name
        const selectedItem = items.find(
          (item) => item.name === selectedStock.name
        );
        if (!selectedItem) {
          await alert("Selected item not found.", "Error");
          return;
        }

        console.log("Selected item:", selectedItem);
        console.log("Available inventory:", inventory);

        // Find the inventory record for this item
        // Try multiple ways to match inventory to item
        let inventoryId = null;
        let foundInventory = null;

        // Loop through all inventory items to find a match
        if (inventory && inventory.length > 0) {
          for (const inv of inventory) {
            // Check if inventory has a direct item property
            if (inv.item !== undefined) {
              // Case 1: item is an ID that matches the selected item's ID
              if (
                inv.item === selectedItem.id ||
                String(inv.item) === String(selectedItem.id)
              ) {
                inventoryId = inv.id;
                foundInventory = inv;
                console.log("Found inventory by direct ID match:", inv);
                break;
              }

              // Case 2: item is a nested object
              if (typeof inv.item === "object" && inv.item !== null) {
                if (
                  inv.item.id === selectedItem.id ||
                  String(inv.item.id) === String(selectedItem.id)
                ) {
                  inventoryId = inv.id;
                  foundInventory = inv;
                  console.log(
                    "Found inventory by nested object ID match:",
                    inv
                  );
                  break;
                }
              }
            }
          }
        }

        // If we still don't have an inventory ID, create a temporary one for display
        if (!inventoryId) {
          console.warn("Could not find inventory for item:", selectedItem.id);
          // This is just for display; the backend will handle the actual creation
          inventoryId = `temp_${selectedItem.id}`;
          console.log("Using temporary inventory ID:", inventoryId);
        }

        // Get the measurement symbol
        const measurementSymbol =
          unitMeasurements?.find((unit) => unit.id === selectedItem.measurement)
            ?.symbol || "N/A";

        // Create the new stock-in entry
        const newStock = {
          id: null,
          name: selectedStock.name,
          measurement: measurementSymbol,
          price: parseFloat(selectedStock.price),
          quantity: parseInt(selectedStock.quantity, 10),
          totalCost:
            parseFloat(selectedStock.price) *
            parseInt(selectedStock.quantity, 10),
          old_quantity: 0,
          inventory_id: inventoryId,
          item_id: selectedItem.id,
          to_delete: false,
        };

        console.log("Adding new stock-in entry:", newStock);
        await alert("Stock added successfully!", "Success");
        setEditedStockData((prev) => [...prev, newStock]);
        setSelectedStock({
          name: "",
          measurement: "",
          quantity: "",
          price: "",
        });
      } catch (error) {
        console.error("Error adding stock:", error);
        await alert(`Error adding stock: ${error.message}`, "Error");
      } finally {
        setIsAdding(false);
      }
    } else {
      await alert(
        "Please fill in all fields for the new stock entry.",
        "Error"
      );
    }
  };

  // Updated handleStockInputChange function for EditStockInDetails.jsx
  const handleStockInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const selectedItem = items.find((item) => item.name === value);
      if (selectedItem) {
        console.log("Selected item for new entry:", selectedItem);

        // Find the measurement unit
        let measurementSymbol = "N/A";
        if (selectedItem.measurement && unitMeasurements) {
          const unit = unitMeasurements.find(
            (u) => u.id === selectedItem.measurement
          );
          if (unit) {
            measurementSymbol = unit.symbol;
          }
        }

        console.log(`Unit for ${selectedItem.name}: ${measurementSymbol}`);

        // Update the selected stock state with item info
        setSelectedStock({
          name: value,
          measurement: measurementSymbol,
          quantity: "",
          price: "",
          item_id: selectedItem.id,
        });
      }
    } else {
      setSelectedStock((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Mark a stock row for deletion.
  const markStockForDeletion = (index) => {
    const stockItem = editedStockData[index];

    // For newly added items (no ID), completely remove from the array
    if (!stockItem.id) {
      setEditedStockData((prev) => prev.filter((_, i) => i !== index));
    } else {
      // For existing items, mark as to_delete
      setEditedStockData((prev) =>
        prev.map((stock, i) =>
          i === index ? { ...stock, to_delete: true } : stock
        )
      );
    }
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
    const confirmDelete = await confirm(
      "Are you sure you want to delete this receipt?",
      "Delete Receipt"
    );

    if (confirmDelete) {
      try {
        setIsSubmitting(true);

        // Use editedReceipt.id instead of editedReceipt.receipt_id
        const receiptId = editedReceipt.id || editedReceipt.receipt_id;

        if (!receiptId) {
          console.error("No receipt ID found:", editedReceipt);
          await alert(
            "Error: Cannot delete receipt - receipt ID is missing",
            "Error"
          );
          return;
        }

        const res = await axios.delete(
          `http://127.0.0.1:8000/delete-receipt/${receiptId}/`
        );

        if (res.status === 200) {
          await alert("Receipt deleted successfully!", "Success");
          onUpdate();
          onClose();
        }
      } catch (error) {
        console.error("Failed to delete receipt:", error);
        await alert("An error occurred while deleting the receipt.", "Error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // On submit, send all changes to the backend.
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Log the receipt details to help debug
      console.log("Submitting changes for receipt:", editedReceipt);

      // Use editedReceipt.id instead of editedReceipt.receipt_id
      const receiptId = editedReceipt.id || editedReceipt.receipt_id;

      if (!receiptId) {
        console.error("No receipt ID found:", editedReceipt);
        await alert(
          "Error: Cannot update receipt - receipt ID is missing",
          "Error"
        );
        return;
      }

      const response = await axios.put(
        `http://127.0.0.1:8000/edit-receipt-stockin-data/${receiptId}/`,
        {
          receipt_no: editedReceipt.receipt_no,
          supplier: editedReceipt.supplier_id,
          date: editedReceipt.date,
          stock_in_updates: editedStockData.map((stock) => ({
            id: stock.id || null,
            old_quantity: stock.old_quantity || 0,
            quantity_in: stock.to_delete ? 0 : stock.quantity,
            price: stock.price,
            inventory_id: stock.inventory_id,
            item_id: stock.item_id,
            delete: stock.to_delete || false,
          })),
        }
      );

      await alert("Changes saved successfully!", "Success");
      if (response.data && response.data.receipt) {
        const updatedReceipt = response.data.receipt;

        // Add this block to handle nested supplier object
        let supplierData = {};
        if (
          updatedReceipt.supplier &&
          typeof updatedReceipt.supplier === "object"
        ) {
          supplierData = {
            supplier_id: updatedReceipt.supplier.id,
            supplier_name: updatedReceipt.supplier.name,
          };
        } else {
          const supplierId = updatedReceipt.supplier
            ? Number(updatedReceipt.supplier)
            : "";
          const supplierObj = suppliers.find((s) => s.id === supplierId) || {};
          supplierData = {
            supplier_id: supplierId,
            supplier_name: supplierObj.name || "",
          };
        }

        setEditedReceipt({
          ...updatedReceipt,
          ...supplierData,
        });

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
      await alert("An error occurred while saving the changes.", "Error");
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
      if (typeof onUpdate === "function") {
        onUpdate();
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl h-[600px] flex flex-col">
        {/* Header - fixed height */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">
            Edit Stock In - Receipt No. {receipt.receipt_no}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleEditMode}
              className={`px-3 py-1 rounded ${
                isEditing
                  ? "bg-gray-200 text-gray-700"
                  : "bg-[#CC5500] text-white"
              }`}
            >
              {isEditing ? "Cancel Edit" : "Edit Receipt"}
            </button>
            {!isEditing && (
              <button
                onClick={deleteReceiptHandler}
                disabled={isSubmitting}
                className={`px-3 py-1 rounded min-w-[100px] text-center ${
                  isSubmitting
                    ? "bg-red-500 opacity-70 text-white cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {deletingText}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content - takes remaining space with fixed height */}
        <div
          className="flex-1 p-4 overflow-hidden"
          style={{ maxHeight: "calc(100% - 128px)" }}
        >
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Left Column: Receipt Details (1/3 width) */}
            <div className="h-full flex flex-col space-y-6">
              {/* Receipt Details */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-medium mb-4">Receipt Details</h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="font-medium mb-1">Receipt No.:</label>
                    <input
                      type="text"
                      name="receipt_no"
                      value={editedReceipt.receipt_no}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`p-2 border rounded-lg ${
                        isEditing ? "bg-white" : "bg-gray-200"
                      }`}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-medium mb-1">Supplier:</label>
                    {isEditing ? (
                      <select
                        name="supplier_id"
                        value={editedReceipt.supplier_id || ""}
                        onChange={handleChange}
                        className="p-2 border rounded-lg bg-white"
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2 border rounded-lg bg-gray-200">
                        {editedReceipt.supplier_name}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="font-medium mb-1">Date:</label>
                    <input
                      type="date"
                      name="date"
                      value={editedReceipt.date}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`p-2 border rounded-lg ${
                        isEditing ? "bg-white" : "bg-gray-200"
                      }`}
                    />
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
                      {editedStockData
                        .filter((stock) => !stock.to_delete)
                        .reduce(
                          (total, stock) => total + (stock.totalCost || 0),
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

            {/* Right Column: Stock Table (2/3 width) */}
            <div className="col-span-2 h-full">
              <div className="bg-white p-4 rounded-lg border h-full flex flex-col">
                <h3 className="text-lg font-medium mb-4">Stock Items</h3>

                {/* Table container */}
                <div
                  className="relative"
                  style={{ height: "calc(100% - 2.5rem)" }}
                >
                  {/* Fixed header - position sticky */}
                  <div className="sticky top-0 z-10 w-full bg-[#CC5500]">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-sm text-white uppercase">
                        <tr>
                          {[
                            "ID",
                            "ITEM NAME",
                            "UNIT",
                            "QUANTITY",
                            "COST",
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
                        {editedStockData.length > 0 ? (
                          editedStockData.map((stock, index) => (
                            <tr
                              key={index}
                              className={`
                                ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} 
                                border-b hover:bg-gray-200 group
                                ${stock.to_delete ? "bg-red-100" : ""}
                              `}
                            >
                              <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                {stock.id}
                              </td>
                              <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                {stock.name}
                              </td>
                              <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                {stock.measurement}
                              </td>
                              <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={stock.quantity}
                                    onChange={(e) =>
                                      handleStockChange(
                                        index,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    className="p-1 border rounded w-20"
                                  />
                                ) : (
                                  stock.quantity
                                )}
                              </td>
                              <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={stock.price}
                                    onChange={(e) =>
                                      handleStockChange(
                                        index,
                                        "price",
                                        e.target.value
                                      )
                                    }
                                    className="p-1 border rounded w-20"
                                  />
                                ) : (
                                  stock.price
                                )}
                              </td>
                              <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                                <div className="flex items-center justify-between">
                                  <span>{stock.totalCost}</span>
                                  {isEditing && !stock.to_delete && (
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!stock.id) {
                                          markStockForDeletion(index);
                                        } else {
                                          const confirmDelete = await confirm(
                                            "Are you sure you want to delete this stock-in detail?",
                                            "Delete Stock Item"
                                          );
                                          if (confirmDelete) {
                                            markStockForDeletion(index);
                                          }
                                        }
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-full ml-2"
                                    >
                                      <IoMdClose size={18} />
                                    </button>
                                  )}
                                  {stock.to_delete && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelStockDeletion(index);
                                      }}
                                      className="text-gray-500 hover:text-gray-700 p-1 rounded-full ml-2"
                                    >
                                      <IoMdClose size={18} />
                                    </button>
                                  )}
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
                        {/* Add Row */}
                        {isEditing && (
                          <tr className="bg-white border-b">
                            <td className="px-4 py-3 font-normal text-gray-700">
                              {/* ID (empty for new entries) */}
                            </td>
                            <td className="px-4 py-3 font-normal text-gray-700">
                              <select
                                className="p-1 border rounded w-full"
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
                            <td className="px-4 py-3 font-normal text-gray-700">
                              <input
                                type="text"
                                placeholder="Unit"
                                className="p-1 border rounded bg-gray-100 w-full"
                                name="measurement"
                                value={selectedStock.measurement}
                                disabled
                              />
                            </td>
                            <td className="px-4 py-3 font-normal text-gray-700">
                              <input
                                type="number"
                                placeholder="Quantity"
                                className="p-1 border rounded w-full"
                                name="quantity"
                                value={selectedStock.quantity}
                                onChange={handleStockInputChange}
                              />
                            </td>
                            <td className="px-4 py-3 font-normal text-gray-700">
                              <input
                                type="number"
                                placeholder="Cost/Unit"
                                className="p-1 border rounded w-full"
                                name="price"
                                value={selectedStock.price}
                                onChange={handleStockInputChange}
                              />
                            </td>
                            <td className="px-4 py-3 font-normal text-gray-700">
                              <button
                                onClick={handleAddStock}
                                disabled={isAdding}
                                className={`bg-[#CC5500] text-white px-2 py-1 rounded min-w-[80px] ${
                                  isAdding
                                    ? "opacity-70 cursor-not-allowed"
                                    : "hover:bg-[#b34600]"
                                }`}
                              >
                                {isAdding ? "Adding..." : "Add"}
                              </button>
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
        </div>

        {/* Footer - fixed height */}
        <div className="border-t p-4 flex justify-end items-center h-[64px]">
          <div className="w-[140px]">
            {isEditing && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md w-full text-center ${
                  isSubmitting
                    ? "bg-green-500 opacity-70 text-white cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {savingText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStockInDetails;
