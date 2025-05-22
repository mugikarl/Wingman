import React, { useState, useEffect } from "react";
import axios from "axios";

const AddExpense = ({
  closePopup,
  expenseTypes = [],
  onExpenseAdded = () => {},
  defaultDate = "",
}) => {
  const [expenseDetails, setExpenseDetails] = useState({
    date: defaultDate,
    amount: "",
    expenseType: "",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDots, setLoadingDots] = useState("");
  const [isOthersSelected, setIsOthersSelected] = useState(false);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (defaultDate) {
      setExpenseDetails((prev) => ({
        ...prev,
        date: defaultDate,
      }));
    }
  }, [defaultDate]);

  // Loading animation effect
  useEffect(() => {
    let interval;
    if (isSubmitting) {
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
  }, [isSubmitting]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseDetails({ ...expenseDetails, [name]: value });

    // Check if "Others" is selected to show/hide note field
    if (name === "expenseType") {
      // Add debugging to check what's coming through
      console.log("Selected value:", value);
      console.log("Expense types:", expenseTypes);

      // Convert both to strings for comparison
      const selectedType = expenseTypes.find(
        (type) => String(type.id) === String(value)
      );

      console.log("Found type:", selectedType);
      setIsOthersSelected(selectedType?.name === "Others");
    }
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

    // Validate note is required when "Others" is selected
    if (isOthersSelected && !expenseDetails.note.trim()) {
      alert("Please provide a note for 'Others' expense type.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send data to the API
      const response = await axios.post(
        "http://127.0.0.1:8000/add-expense/",
        {
          date: expenseDetails.date,
          cost: expenseDetails.amount,
          expense_type_id: expenseDetails.expenseType,
          note: expenseDetails.note || null, // Allow null for note
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Expense Added:", response.data);

      // Important: First finish submission completely
      setIsSubmitting(false);

      // THEN call onExpenseAdded and close the popup
      // This ensures state updates happen in the correct order
      onExpenseAdded();
      closePopup();
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Organize expense types to ensure "Others" appears at the bottom
  const organizedExpenseTypes = React.useMemo(() => {
    const filteredTypes = expenseTypes.filter(
      (type) => type.name !== "Stock In"
    );

    // Find "Others" item
    const othersItem = filteredTypes.find((type) => type.name === "Others");

    // Remove "Others" from the array
    const remainingTypes = filteredTypes.filter(
      (type) => type.name !== "Others"
    );

    // Sort remaining types by ID
    const sortedTypes = [...remainingTypes].sort((a, b) => a.id - b.id);

    // Add "Others" at the end if it exists
    if (othersItem) {
      return [...sortedTypes, othersItem];
    }

    return sortedTypes;
  }, [expenseTypes]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-96">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-xl font-semibold">Add Expense</h2>
          <button
            onClick={closePopup}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={expenseDetails.date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={expenseDetails.amount}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Expense Type */}
          <div>
            <label className="block text-sm font-medium">Expense Type</label>
            <select
              id="expenseType"
              name="expenseType"
              value={expenseDetails.expenseType}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
              required
              disabled={isSubmitting}
            >
              <option value="" hidden>
                Select Type
              </option>
              {organizedExpenseTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Note - Only display when "Others" is selected */}
          {isOthersSelected && (
            <div>
              <label className="block text-sm font-medium">
                Note <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="note"
                name="note"
                value={expenseDetails.note}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                required
                disabled={isSubmitting}
                placeholder="Please specify the expense details"
              />
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-green-500 text-white px-4 py-2 rounded-lg w-32 h-10 flex items-center justify-center ${
                isSubmitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-green-600"
              }`}
            >
              <span className="inline-block whitespace-nowrap overflow-hidden text-ellipsis">
                {isSubmitting ? `Adding${loadingDots}` : "Add Expense"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
