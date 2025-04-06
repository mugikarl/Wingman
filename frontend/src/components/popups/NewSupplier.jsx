import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";

const NewSupplier = ({ isOpen, onClose, suppliers, fetchItemData }) => {
  const [supplierName, setSupplierName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addingText, setAddingText] = useState("Add");
  const [updatingText, setUpdatingText] = useState("Update");

  // Handle loading text animations
  useEffect(() => {
    let loadingInterval;

    if (isSubmitting && !isEditing) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setAddingText(`Adding${dots}`);
        dotCount++;
      }, 500);
    } else if (isSubmitting && isEditing) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setUpdatingText(`Updating${dots}`);
        dotCount++;
      }, 500);
    } else {
      setAddingText("Add");
      setUpdatingText("Update");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmitting, isEditing]);

  const handleAddSupplier = async () => {
    if (!supplierName.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSupplier = async (e) => {
    e.preventDefault();

    if (!supplierName.trim() || selectedIndex === null) return;

    setIsSubmitting(true);

    const supplierId = suppliers[selectedIndex]?.id;

    if (!supplierId) {
      console.error("Error: No supplier ID found!");
      setIsSubmitting(false);
      return;
    }

    const updatedSupplierData = {
      name: supplierName,
    };

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://127.0.0.1:8000/edit-supplier/${supplierId}/`,
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
      );
      setSupplierName("");
      setIsEditing(false);
      setSelectedIndex(null);
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("Failed to update supplier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (selectedIndex === null) return;

    const confirmDelete = window.confirm("Delete supplier?");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `http://127.0.0.1:8000/delete-supplier/${suppliers[selectedIndex].id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchItemData((prevItems) =>
        prevItems.filter((_, i) => i !== selectedIndex)
      );
      setSupplierName("");
      setIsEditing(false);
      setSelectedIndex(null);
    } catch (error) {
      console.error("Error deleting supplier:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setSupplierName("");
    setIsEditing(false);
    setSelectedIndex(null);
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Manage Suppliers</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Fixed Input Area */}
          <div className="flex items-center space-x-2 p-4 bg-white border-b">
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
                disabled={isSubmitting}
                className={`bg-[#CC5500] text-white px-3 py-2 rounded-lg ${
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-[#b34600]"
                }`}
              >
                {addingText}
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg w-8 h-8 flex items-center justify-center hover:bg-gray-300"
                >
                  ✕
                </button>
                <button
                  onClick={handleEditSupplier}
                  disabled={isSubmitting}
                  className={`bg-green-500 text-white px-3 py-2 rounded-lg ${
                    isSubmitting
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-green-600"
                  }`}
                >
                  {updatingText}
                </button>
                <button
                  onClick={handleDeleteSupplier}
                  disabled={isDeleting}
                  className={`bg-red-500 text-white w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDeleting
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-red-600"
                  }`}
                  title="Delete"
                >
                  {isDeleting ? (
                    <span>...</span>
                  ) : (
                    <FaTrash className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Scrollable Table Area */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-sm flex-1 p-4">
            <div className="overflow-y-auto max-h-[calc(100%_-_80px)]">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Supplier
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(suppliers || []).length > 0 ? (
                    suppliers.map((supplier, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } border-b hover:bg-gray-200 group cursor-pointer`}
                        onClick={() => {
                          setSupplierName(supplier.name);
                          setSelectedIndex(index);
                          setIsEditing(true);
                        }}
                      >
                        <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                          {supplier.name}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white border-b">
                      <td
                        colSpan="1"
                        className="px-6 py-4 text-center font-normal text-gray-500 italic"
                      >
                        No Suppliers Available
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
  ) : null;
};

export default NewSupplier;
