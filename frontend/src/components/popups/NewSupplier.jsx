import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const NewSupplier = ({ isOpen, onClose, suppliers = [], fetchItemData }) => {
  const [supplierName, setSupplierName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addingText, setAddingText] = useState("Add");
  const [updatingText, setUpdatingText] = useState("Update");
  const [deletingDots, setDeletingDots] = useState("");

  // Sort suppliers alphabetically by name
  const sortedSuppliers = [...suppliers].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // Handle loading text animations
  useEffect(() => {
    let loadingInterval;

    if (isSubmitting || isDeleting) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);

        if (isSubmitting && !isEditing) {
          setAddingText(`Adding${dots}`);
        } else if (isSubmitting && isEditing) {
          setUpdatingText(`Updating${dots}`);
        }

        if (isDeleting) {
          setDeletingDots(dots);
        }

        dotCount++;
      }, 500);
    } else {
      setAddingText("Add");
      setUpdatingText("Update");
      setDeletingDots("");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmitting, isEditing, isDeleting]);

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

    const supplierId = sortedSuppliers[selectedIndex]?.id;

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
      fetchItemData();
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
        `http://127.0.0.1:8000/delete-supplier/${sortedSuppliers[selectedIndex].id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchItemData();
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
      <div className="bg-white rounded-lg shadow-lg w-[480px] h-[500px] flex flex-col">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Input Area */}
          <div className="flex items-center space-x-2 p-4 bg-white border-b">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Enter Supplier"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full p-2 pr-10 border rounded-lg"
                style={{ paddingRight: "2.5rem" }}
              />
              {supplierName && (
                <button
                  onClick={handleCancelEdit}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <IoMdClose size={16} />
                </button>
              )}
            </div>
            {!isEditing ? (
              <button
                onClick={handleAddSupplier}
                disabled={isSubmitting}
                className={`bg-green-500 text-white px-3 py-2 rounded-lg h-10 w-24 flex-shrink-0 ${
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-green-600"
                }`}
              >
                {addingText}
              </button>
            ) : (
              <>
                <button
                  onClick={handleEditSupplier}
                  disabled={isSubmitting}
                  className={`bg-green-500 text-white px-3 py-2 rounded-lg h-10 w-28 flex-shrink-0 ${
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
                  className={`bg-red-500 text-white w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDeleting
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-red-600"
                  }`}
                  title="Delete"
                >
                  {isDeleting ? deletingDots : <FaTrash className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>

          {/* Scrollable Table Area */}
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full overflow-y-auto">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Supplier
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSuppliers.length > 0 ? (
                    sortedSuppliers.map((supplier, index) => (
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
