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
  const [loadingDots, setLoadingDots] = useState("");

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
    let interval;
    if (isSubmitting || isDeleting) {
      let dotCount = 0;
      interval = setInterval(() => {
        setLoadingDots(".".repeat(dotCount % 4));
        dotCount++;
      }, 500);
    } else {
      setLoadingDots("");
    }

    return () => {
      if (interval) clearInterval(interval);
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold">Expense Details</h2>
          <div className="flex gap-2">
            {/* Make Delete button always visible */}
            <div className="w-[100px]">
              <button
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 w-full h-10 flex items-center justify-center"
              >
                <span className="whitespace-nowrap">
                  {isDeleting ? `Deleting${loadingDots}` : "Delete"}
                </span>
              </button>
            </div>
            <div>
              <button
                onClick={toggleEditMode}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg w-full h-10 flex items-center justify-center ${
                  editMode
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-[#CC5500] text-white hover:bg-[#b34d00]"
                }`}
              >
                <span className="whitespace-nowrap text-sm">
                  {editMode ? "Cancel Edit" : "Edit"}
                </span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-bold h-10 w-10 flex items-center justify-center"
              disabled={isSubmitting || isDeleting}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Modal Body - no scrolling */}
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Modal Footer */}
          <div className="flex justify-end mt-6 h-10">
            <div className={`w-[140px] ${editMode ? "block" : "invisible"}`}>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-green-500 text-white px-4 py-2 rounded-lg w-full h-full flex items-center justify-center ${
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-green-600"
                }`}
              >
                <span className="inline-block whitespace-nowrap overflow-hidden text-ellipsis">
                  {isSubmitting ? `Saving${loadingDots}` : "Save Changes"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpense;
