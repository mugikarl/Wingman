import React, { useState } from "react";

const AddExpense = ({ closePopup }) => {
  const [expenseDetails, setExpenseDetails] = useState({
    expenseId: "",
    amount: "",
    description: "",
    date: "",
    expenseType: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseDetails({ ...expenseDetails, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic to save the expense (e.g., making an API call)
    console.log("Expense Added:", expenseDetails);
    closePopup(); // Close the popup after submission
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-md w-96 shadow-lg">
        <h2 className="text-lg font-semibold text-[#CC5500] mb-4">Add Expense</h2>

        <form onSubmit={handleSubmit}>
          {/* Expense ID */}
          <div className="mb-4 flex items-center justify-between">
            <label
              htmlFor="expenseId"
              className="block text-sm font-semibold text-gray-700 w-1/3"
            >
              Expense ID
            </label>
            <input
              type="text"
              id="expenseId"
              name="expenseId"
              value={expenseDetails.expenseId}
              onChange={handleInputChange}
              className="w-2/3 p-2 border border-gray-300 rounded-md mt-2"
              required
            />
          </div>
          <div className="mb-4 flex items-center justify-between">
            <label
              htmlFor="expenseType"
              className="block text-sm font-semibold text-gray-700 w-1/3"
            >
              Expense Type
            </label>
            <select
              id="expenseType"
              name="expenseType"
              value={expenseDetails.expenseType}
              onChange={handleInputChange}
              className="w-2/3 p-2 border border-gray-300 rounded-md mt-2"
              required
            >
              <option value="">Select Type</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Others">Others</option>
            </select>
          </div>
          {/* Amount */}
          <div className="mb-4 flex items-center justify-between">
            <label
              htmlFor="amount"
              className="block text-sm font-semibold text-gray-700 w-1/3"
            >
              Amount
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={expenseDetails.amount}
              onChange={handleInputChange}
              className="w-2/3 p-2 border border-gray-300 rounded-md mt-2"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4 flex items-center justify-between">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-700 w-1/3"
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={expenseDetails.description}
              onChange={handleInputChange}
              className="w-2/3 p-2 border border-gray-300 rounded-md mt-2"
              required
            />
          </div>

          {/* Date */}
          <div className="mb-4 flex items-center justify-between">
            <label
              htmlFor="date"
              className="block text-sm font-semibold text-gray-700 w-1/3"
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={expenseDetails.date}
              onChange={handleInputChange}
              className="w-2/3 p-2 border border-gray-300 rounded-md mt-2"
              required
            />
          </div>


          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={closePopup}
              className="px-4 py-2 bg-gray-300 rounded-md text-black hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#CC5500] text-white rounded-md hover:bg-[#cc4400]"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
