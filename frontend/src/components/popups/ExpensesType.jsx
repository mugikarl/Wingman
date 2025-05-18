import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { useModal } from "../utils/modalUtils";

const ExpensesType = ({
  isOpen,
  onClose,
  expensesTypes = [],
  fetchExpensesData,
}) => {
  const [expenseTypeName, setExpenseTypeName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addingText, setAddingText] = useState("Add");
  const [updatingText, setUpdatingText] = useState("Update");
  const [deletingDots, setDeletingDots] = useState("");
  const { alert, confirm } = useModal();

  // Define protected expense types that cannot be edited
  const protectedTypes = ["Stock In", "Operational Expenses", "Others"];

  // Sort expenses types alphabetically by name and filter out protected types
  const filteredExpensesTypes = [...expensesTypes]
    .filter((type) => !protectedTypes.includes(type.name))
    .sort((a, b) => a.id - b.id);

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

  const handleAddExpenseType = async () => {
    if (!expenseTypeName.trim()) {
      await alert("Please enter an expense type name", "Error");
      return;
    }

    // Prevent adding duplicates of protected types
    if (protectedTypes.includes(expenseTypeName.trim())) {
      await alert("This expense type is reserved and cannot be added", "Error");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://127.0.0.1:8000/add-expense-type/",
        { name: expenseTypeName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.message) {
        await alert(response.data.message, "Success");
        fetchExpensesData();
        setExpenseTypeName("");

        setTimeout(() => {
          fetchExpensesData();
        }, 0);
      }
    } catch (error) {
      console.error("Error adding expense type:", error);
      if (error.response?.data?.error) {
        await alert(error.response.data.error, "Error");
      } else {
        await alert("Failed to add expense type. Please try again.", "Error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpenseType = async (e) => {
    e.preventDefault();

    if (!expenseTypeName.trim() || selectedIndex === null) return;

    setIsSubmitting(true);

    const expenseTypeId = filteredExpensesTypes[selectedIndex]?.id;

    if (!expenseTypeId) {
      console.error("Error: No expense type ID found!");
      setIsSubmitting(false);
      return;
    }

    const updatedExpenseTypeData = {
      name: expenseTypeName,
    };

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://127.0.0.1:8000/edit-expense-type/${expenseTypeId}/`,
        updatedExpenseTypeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await alert("Expense type updated successfully!", "Success");
      fetchExpensesData();
      setExpenseTypeName("");
      setIsEditing(false);
      setSelectedIndex(null);

      setTimeout(() => {
        fetchExpensesData();
      }, 0);
    } catch (error) {
      console.error("Error updating expense type:", error);
      await alert("Failed to update expense type.", "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpenseType = async () => {
    if (selectedIndex === null) return;

    const confirmDelete = await confirm(
      "Are you sure you want to delete this expense type?",
      "Delete Expense Type"
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `http://127.0.0.1:8000/delete-expense-type/${filteredExpensesTypes[selectedIndex].id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchExpensesData();
      setExpenseTypeName("");
      setIsEditing(false);
      setSelectedIndex(null);
      setTimeout(() => {
        fetchExpensesData();
      }, 0);
    } catch (error) {
      console.error("Error deleting expense type:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setExpenseTypeName("");
    setIsEditing(false);
    setSelectedIndex(null);
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[480px] h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Manage Expense Types</h2>
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
                placeholder="Enter Expense Type"
                value={expenseTypeName}
                onChange={(e) => setExpenseTypeName(e.target.value)}
                className="w-full p-2 pr-10 border rounded-lg"
                style={{ paddingRight: "2.5rem" }}
              />
              {expenseTypeName && (
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
                onClick={handleAddExpenseType}
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
                  onClick={handleEditExpenseType}
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
                  onClick={handleDeleteExpenseType}
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
                      Expense Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpensesTypes.length > 0 ? (
                    filteredExpensesTypes.map((expenseType, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } border-b hover:bg-gray-200 group cursor-pointer`}
                        onClick={() => {
                          setExpenseTypeName(expenseType.name);
                          setSelectedIndex(index);
                          setIsEditing(true);
                        }}
                      >
                        <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                          {expenseType.name}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white border-b">
                      <td
                        colSpan="1"
                        className="px-6 py-4 text-center font-normal text-gray-500 italic"
                      >
                        No Expense Types Available
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

export default ExpensesType;
