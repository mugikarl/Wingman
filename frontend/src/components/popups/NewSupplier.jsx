import React, { useState } from "react";
import axios from "axios";

const NewSupplier = ({ isOpen, onClose, suppliers, fetchItemData }) => {
  const [supplierName, setSupplierName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddSupplier = async () => {
    if (!supplierName.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://127.0.0.1:8000/add-supplier/",
        { name: supplierName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchItemData();
      setSupplierName("");
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  };

  const handleEditSupplier = async (e) => {
    e.preventDefault();

    if (!supplierName.trim() || selectedIndex === null) return;

    const supplierId = suppliers[selectedIndex]?.id; // Get the actual ID
    console.log("Editing supplier ID:", supplierId); // ✅ Debugging log

    if (!supplierId) {
      console.error("Error: No supplier ID found!");
      return;
    }

    const updatedSupplierData = {
      name: supplierName, // Send the updated supplier name
    };

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://127.0.0.1:8000/edit-supplier/${supplierId}/`, // ✅ API endpoint for updating supplier
        updatedSupplierData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Supplier updated successfully!");
      fetchItemData((prevSuppliers) =>
        prevSuppliers.map((supplier, index) =>
          index === selectedIndex
            ? { ...supplier, name: supplierName }
            : supplier
        )
      ); // Refresh suppliers
      setSupplierName("");
      setIsEditing(false);
      setSelectedIndex(null); // Close modal if applicable
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("Failed to update supplier.");
    }
  };

  const handleDeleteSupplier = async (index) => {
    const confirmDelete = window.confirm("Delete supplier?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `http://127.0.0.1:8000/delete-supplier/${suppliers[index].id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchItemData((prevItems) => prevItems.filter((_, i) => i !== index));
      if (index === selectedIndex) {
        setSupplierName("");
        setIsEditing(false);
        setSelectedIndex(null);
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          x
        </button>

        <h2 className="text-lg font-bold mb-4">Manage Suppliers</h2>

        {/* Input & Buttons */}
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            placeholder="Enter Supplier"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="w-1/2 p-2 border rounded-lg"
          />
          {!isEditing ? (
            <button
              onClick={handleAddSupplier}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg"
            >
              Add
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-3 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSupplier}
                className="bg-green-500 text-white px-3 py-2 rounded-lg"
              >
                Update
              </button>
            </>
          )}
        </div>

        {/* Scrollable Table */}
        <div className="max-h-60 overflow-y-auto border rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-200">
              <tr>
                <th className="p-2">Supplier</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(suppliers || []).length > 0 ? (
                suppliers.map((supplier, index) => (
                  <tr
                    key={index}
                    className="border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      console.log("Clicked supplier:", supplier); // Debugging log
                      console.log("supplier ID:", supplier.id);
                      setSupplierName(supplier.name);
                      setSelectedIndex(index);
                      setIsEditing(true);
                    }}
                  >
                    <td className="p-2">{supplier.name}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDeleteSupplier(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="p-2 text-center">
                    No Suppliers Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : null;
};

export default NewSupplier;
