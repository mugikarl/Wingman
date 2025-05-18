import React, { useState, useEffect } from "react";
import axios from "axios";

const EditExpense = ({
  isOpen,
  onClose,
  expense,
  expenseTypes = [],
  onExpenseUpdated = () => {},
}) => {
  const [expenseDetails, setExpenseDetails] = useState({
    date: "",
    amount: "",
    expenseType: "",
    note: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingText, setSavingText] = useState("Save Changes");
  const [deletingText, setDeletingText] = useState("Delete");

  // Initialize form with expense data when component mounts or expense changes
  useEffect(() => {
    if (expense) {
      setExpenseDetails({
        date: formatDateForInput(expense.date),
        amount: expense.cost.toString(),
        expenseType: expense.type_id.toString(),
        note: expense.note || "",
      });
    }
  }, [expense]);

  // Format date to YYYY-MM-DD for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Loading animation effect
  useEffect(() => {
    let loadingInterval;
    if (isSubmitting || isDeleting) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        if (isSubmitting) {
          setSavingText(`Saving${dots}`);
        } else if (isDeleting) {
          setDeletingText(`Deleting${dots}`);
        }
        dotCount++;
      }, 500);
    } else {
      setSavingText("Save Changes");
      setDeletingText("Delete");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmitting, isDeleting]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseDetails({ ...expenseDetails, [name]: value });
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (
      !expenseDetails.date ||
      !expenseDetails.amount ||
      !expenseDetails.expenseType
    ) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send update to the API
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-expense/${expense.id}/`,
        {
          date: expenseDetails.date,
          cost: expenseDetails.amount,
          expense_type_id: expenseDetails.expenseType,
          note: expenseDetails.note || null,
        }
      );

      console.log("Expense Updated:", response.data);

      // Call the callback to refresh data
      onExpenseUpdated();

      // Exit edit mode
      setEditMode(false);
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    setIsDeleting(true);

    try {
      // Send delete request to the API
      const response = await axios.delete(
        `http://127.0.0.1:8000/delete-expense/${expense.id}/`
      );

      console.log("Expense Deleted:", response.data);

      // Call the callback to refresh data
      onExpenseUpdated();

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[500px] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Expense Details</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleEditMode}
              className={`px-3 py-1 rounded ${
                editMode
                  ? "bg-gray-200 text-gray-700"
                  : "bg-[#CC5500] text-white"
              }`}
            >
              {editMode ? "Cancel Edit" : "Edit"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className={`px-3 py-1 rounded min-w-[100px] text-center ${
                isDeleting
                  ? "bg-red-400 text-white cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {deletingText}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={expenseDetails.date}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${
                !editMode ? "bg-gray-100" : ""
              }`}
              required
              disabled={!editMode || isSubmitting || isDeleting}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={expenseDetails.amount}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${
                !editMode ? "bg-gray-100" : ""
              }`}
              required
              disabled={!editMode || isSubmitting || isDeleting}
            />
          </div>

          {/* Expense Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Expense Type
            </label>
            <select
              id="expenseType"
              name="expenseType"
              value={expenseDetails.expenseType}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${
                !editMode ? "bg-gray-100" : ""
              }`}
              required
              disabled={!editMode || isSubmitting || isDeleting}
            >
              <option value="" hidden>
                Select Type
              </option>
              {expenseTypes
                .filter((type) => type.name !== "Stock In")
                .map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <input
              type="text"
              id="note"
              name="note"
              value={expenseDetails.note}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-lg ${
                !editMode ? "bg-gray-100" : ""
              }`}
              disabled={!editMode || isSubmitting || isDeleting}
            />
          </div>
        </form>

        {/* Footer with fixed height */}
        <div className="border-t p-4 flex justify-end items-center h-[64px]">
          <div className="w-[140px]">
            <button
              onClick={handleSubmit}
              disabled={!editMode || isSubmitting}
              className={`px-4 py-2 rounded-md w-full text-center ${
                editMode && !isSubmitting
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : isSubmitting
                  ? "bg-green-500 opacity-70 text-white cursor-not-allowed"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? savingText : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditExpense;
