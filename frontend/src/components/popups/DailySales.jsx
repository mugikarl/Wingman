import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import LoadingScreen from "./LoadingScreen";
import TransactionModal from "./TransactionModal";
import AddExpense from "./AddExpense";
import StockInExpense from "./StockInExpense";
import axios from "axios";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { Datepicker } from "flowbite-react";
import EditExpense from "./EditExpense";

const DailySales = ({
  isOpen,
  onClose,
  selectedDate,
  salesData = null,
  fetchSalesData,
}) => {
  // State variables
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [localSalesData, setLocalSalesData] = useState(salesData);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(
    selectedDate || new Date().toLocaleDateString()
  );
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [totals, setTotals] = useState({ sales: 0, expenses: 0, netIncome: 0 });
  const [isStockInExpenseOpen, setIsStockInExpenseOpen] = useState(false);
  const [selectedStockInReceipt, setSelectedStockInReceipt] = useState(null);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Convert selectedDate to a Date object for the date picker
  const [currentDate, setCurrentDate] = useState(() => {
    try {
      return new Date(selectedDate);
    } catch {
      return new Date();
    }
  });

  // Update display date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      console.log("selectedDate received:", selectedDate);

      // Parse the date string consistently
      try {
        const parsedDate = new Date(selectedDate);
        console.log("Parsed date:", parsedDate);

        if (!isNaN(parsedDate.getTime())) {
          // Valid date
          setCurrentDate(parsedDate);
          setDisplayDate(parsedDate.toLocaleDateString());
        } else {
          console.error("Could not parse date:", selectedDate);
          setCurrentDate(new Date());
          setDisplayDate(new Date().toLocaleDateString());
        }
      } catch (error) {
        console.error("Error parsing date:", selectedDate, error);
        setCurrentDate(new Date());
        setDisplayDate(new Date().toLocaleDateString());
      }
    }
  }, [selectedDate]);

  // Fetch data if not provided
  useEffect(() => {
    if (isOpen) {
      if (!salesData) {
        fetchSalesDataFromApi();
      } else {
        setLocalSalesData(salesData);
        filterData(salesData, displayDate, filterType);
        setLoading(false);
      }
    }
  }, [isOpen, selectedDate, salesData, displayDate, filterType]);

  // Data Fetching Function if needed
  const fetchSalesDataFromApi = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/fetch-sales-data/`
      );

      if (response.data.error) {
        setLocalSalesData(null);
        setFilteredItems([]);
        return;
      }

      // Store the complete data
      setLocalSalesData(response.data);

      // Filter data based on selected date and filter type
      filterData(response.data, displayDate, filterType);
    } catch (err) {
      console.error("Error fetching sales data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on date and filter type
  const filterData = (data, dateStr, type) => {
    if (!data) return;

    console.log("Filtering for date:", dateStr);

    // Function to standardize date conversion
    const getStandardDateString = (dateInput) => {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateInput);
        return null;
      }
      return date.toLocaleDateString();
    };

    // Helper function to calculate transaction total
    const calculateTransactionTotal = (transaction) => {
      if (
        !transaction.order_details ||
        !Array.isArray(transaction.order_details)
      ) {
        console.error("Invalid order_details:", transaction.order_details);
        return 0;
      }

      // Debug: Log the full transaction object
      console.log("Full transaction:", transaction);

      // Get menu type (for delivery deductions)
      const menuTypeId = transaction.order_details?.[0]?.menu_item?.type_id;
      const menuTypeData = data.menu_types?.find(
        (type) => type.id === menuTypeId
      );
      const menuType = menuTypeData ? menuTypeData.name : "Unknown";
      const isDelivery = menuType === "Grab" || menuType === "FoodPanda";

      // Debug: Log menu type and deduction percentage
      console.log("Menu Type:", menuType);
      console.log("Menu Type Data:", menuTypeData);
      console.log("Deduction Percentage:", menuTypeData?.deduction_percentage);

      // Track Unli Wings groups to avoid duplicate base_amount additions
      const unliWingsGroups = new Set();

      // Calculate subtotal and discounts from order details
      let subtotal = 0;
      let totalDiscounts = 0;

      transaction.order_details.forEach((detail) => {
        // Check if this is an Unli Wings order
        const isUnliWings = detail.instore_category?.name === "Unli Wings";
        const unliWingsGroup = detail.unli_wings_group;

        if (isUnliWings && unliWingsGroup !== undefined) {
          // Skip if this group has already been processed
          if (unliWingsGroups.has(unliWingsGroup)) {
            console.log(
              `Skipping duplicate Unli Wings group ${unliWingsGroup}`
            );
            return;
          }

          // Add the base_amount for this Unli Wings group
          const baseAmount = parseFloat(
            detail.instore_category.base_amount || 0
          );
          subtotal += baseAmount;
          unliWingsGroups.add(unliWingsGroup);
          console.log(
            `Unli Wings group ${unliWingsGroup} added: ₱${baseAmount.toFixed(
              2
            )}`
          );
        } else {
          // Regular item: calculate based on menu item price and quantity
          const price = parseFloat(detail.menu_item?.price || 0);
          const quantity = parseInt(detail.quantity || 0);
          const itemTotal = price * quantity;
          subtotal += itemTotal;

          // Apply discount per order detail (if exists)
          if (detail.discount?.percentage) {
            const discountAmount =
              itemTotal * parseFloat(detail.discount.percentage);
            totalDiscounts += discountAmount;
            console.log(
              `Discount applied: ${detail.discount.type} (${
                detail.discount.percentage * 100
              }%) = ₱${discountAmount.toFixed(2)}`
            );
          }
        }
      });

      // Debug: Log calculations
      console.log("Subtotal:", subtotal);
      console.log("Total Discounts:", totalDiscounts);

      // Apply delivery platform deduction (if applicable)
      const percentageDeduction =
        isDelivery && menuTypeData?.deduction_percentage
          ? subtotal * parseFloat(menuTypeData.deduction_percentage)
          : 0;
      console.log("Platform Deduction:", percentageDeduction);

      // Final total: subtotal - discounts - platform deduction
      const total = subtotal - totalDiscounts - percentageDeduction;
      console.log("Final Total:", total);

      return total;
    };

    // Get transactions for the date
    const transactions = (data.transactions || []).filter((transaction) => {
      const transactionDateString = getStandardDateString(transaction.date);
      const result =
        transactionDateString === dateStr && transaction.order_status === 2;
      if (transactionDateString === dateStr) {
        console.log(
          "Transaction match:",
          transaction.id,
          transactionDateString,
          dateStr
        );
      }
      return result;
    });

    // Get expenses for the date
    const expenses = (data.expenses || []).filter((expense) => {
      const expenseDateString = getStandardDateString(expense.date);
      const result = expenseDateString === dateStr;
      if (expenseDateString === dateStr) {
        console.log("Expense match:", expense.id, expenseDateString, dateStr);
      }
      return result;
    });

    console.log("Filtered transactions:", transactions.length);
    console.log("Filtered expenses:", expenses.length);

    // Combine or filter based on the selected type
    let filteredData = [];
    if (type === "all") {
      filteredData = [...transactions, ...expenses];
    } else if (type === "transactions") {
      filteredData = transactions;
    } else if (type === "expenses") {
      filteredData = expenses;
    }

    // Calculate totals
    const totalSales = transactions.reduce(
      (sum, transaction) => sum + calculateTransactionTotal(transaction),
      0
    );
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + parseFloat(expense.cost || 0),
      0
    );
    const netIncome = totalSales - totalExpenses;

    setTotals({
      sales: totalSales,
      expenses: totalExpenses,
      netIncome: netIncome,
    });

    // Convert filtered data to table rows
    const formattedData = filteredData.map((item) => {
      const isTransaction = item.order_details !== undefined;

      // Format details
      let details = "";
      if (isTransaction) {
        // Check if there are order details
        if (item.order_details && item.order_details.length > 0) {
          // Get the type_id from the first menu item (assuming all items in an order have the same type)
          const typeId = item.order_details[0].menu_item?.type_id;

          // Find the menu type name using the type_id
          const menuType = data.menu_types?.find((type) => type.id === typeId);
          details = menuType?.name || "N/A";
        } else {
          details = "N/A";
        }
      } else {
        const expenseType =
          data.expenses_types?.find((type) => type.id === item.type_id)?.name ||
          "Unknown";
        details = `${expenseType}${item.note ? ` - ${item.note}` : ""}`;
      }

      // Format sales/expenses with color
      const salesAmount = isTransaction ? calculateTransactionTotal(item) : 0;
      const expensesAmount = !isTransaction ? parseFloat(item.cost || 0) : 0;

      // Store the expense type ID as a data attribute for easy access when clicked
      const expenseTypeId = !isTransaction ? item.type_id : null;

      return [
        item.id || "N/A",
        isTransaction ? "Transaction" : "Expense",
        details,
        <span className="text-green-600">{formatCurrency(salesAmount)}</span>,
        <span className="text-red-600">{formatCurrency(expensesAmount)}</span>,
        expenseTypeId, // Hidden column for expense type ID
      ];
    });

    setFilteredItems(formattedData);
  };

  // Functions to decrement or increment the selected date
  const decrementDate = () => {
    const dateObj = new Date(currentDate);
    dateObj.setDate(dateObj.getDate() - 1);
    const newDate = dateObj.toLocaleDateString();
    setCurrentDate(dateObj);
    setDisplayDate(newDate);
    if (localSalesData) {
      filterData(localSalesData, newDate, filterType);
    }
  };

  const incrementDate = () => {
    const dateObj = new Date(currentDate);
    dateObj.setDate(dateObj.getDate() + 1);
    const newDate = dateObj.toLocaleDateString();
    setCurrentDate(dateObj);
    setDisplayDate(newDate);
    if (localSalesData) {
      filterData(localSalesData, newDate, filterType);
    }
  };

  // Handle row click
  const handleRowClick = (rowIndex) => {
    console.log("Row clicked:", rowIndex);

    const rowData = filteredItems[rowIndex];
    console.log("Row data:", rowData);

    const itemId = rowData[0];
    const itemType = rowData[1];
    const expenseTypeId = rowData[5];

    console.log(
      "Item ID:",
      itemId,
      "Type:",
      itemType,
      "Expense Type ID:",
      expenseTypeId
    );

    // Find the original item
    const originalItem =
      localSalesData?.transactions?.find((t) => t.id === itemId) ||
      localSalesData?.expenses?.find((e) => e.id === itemId);

    console.log("Original item found:", !!originalItem, originalItem);

    if (!originalItem) {
      console.error("Original item not found for ID:", itemId);
      return;
    }

    // Check if this is a Stock In expense
    const isStockInExpense =
      itemType === "Expense" &&
      localSalesData?.expenses_types?.find((type) => type.id === expenseTypeId)
        ?.name === "Stock In";

    console.log("Is stock-in expense:", isStockInExpense);

    if (isStockInExpense) {
      console.log("Receipt property:", originalItem.receipt);

      if (originalItem.receipt) {
        // The receipt data is already attached to the expense
        console.log(
          "Opening StockInExpense with receipt:",
          originalItem.receipt
        );
        setSelectedStockInReceipt(originalItem.receipt);
        setIsStockInExpenseOpen(true);
      } else {
        console.error(
          "Receipt data missing for stock-in expense. This shouldn't happen with the updated API."
        );
        console.log("Full expense object:", originalItem);

        // Display an error to the user
        alert(
          "Receipt data is missing for this stock-in expense. Please refresh the page or contact support."
        );
      }
    } else if (itemType === "Transaction") {
      // Open transaction modal
      setSelectedItem(originalItem);
    } else if (itemType === "Expense") {
      // Open the EditExpense modal for non-stock-in expenses
      setSelectedExpense(originalItem);
      setIsEditExpenseOpen(true);
    }
  };

  // Utility Functions
  const formatCurrency = (value) => {
    return `₱${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Determine if the selected item is a transaction (for modal rendering)
  const isSelectedItemTransaction =
    selectedItem && selectedItem.order_details !== undefined;

  // Add this helper function at the top of the component (before the return statement)
  // This converts a Date object to the YYYY-MM-DD format required by the date input
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Add this effect to verify data
  useEffect(() => {
    if (salesData) {
      // Verify we have all the required data
      console.log("Received salesData:", {
        hasTransactions: !!salesData.transactions,
        transactionCount: salesData.transactions?.length || 0,
        hasExpenses: !!salesData.expenses,
        expenseCount: salesData.expenses?.length || 0,
        hasExpensesTypes: !!salesData.expenses_types,
        hasUnitMeasurements: !!salesData.unit_measurements,
        hasItems: !!salesData.items,
      });

      // Check if we have any stock-in expenses with receipt data
      const stockInExpenses =
        salesData.expenses?.filter((e) => e.stockin_id && e.receipt) || [];

      console.log("Stock-in expenses with receipt:", stockInExpenses.length);
      if (stockInExpenses.length > 0) {
        console.log("Sample stock-in expense:", stockInExpenses[0]);
      }
    }
  }, [salesData]);

  // First, add this function to determine which columns to show based on the filter type
  const getColumnsForFilterType = () => {
    switch (filterType) {
      case "transactions":
        return ["ID", "Type", "Details", "Sales"];
      case "expenses":
        return ["ID", "Type", "Details", "Expenses"];
      default: // 'all'
        return ["ID", "Type", "Details", "Sales", "Expenses"];
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
        {/* Header - fixed */}
        <div className="bg-white border-b text-black px-6 py-4 rounded-t-lg flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-semibold">
            Daily Sales for {displayDate}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className=" bg-[#CC5500] text-white px-4 py-2 rounded-lg shadow min-w-[140px] hover:bg-[#b34d00]"
            >
              Add Expense
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Filter Buttons - fixed */}
        <div className="p-4 bg-white border-b flex gap-2 flex-shrink-0">
          <button
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              filterType === "all"
                ? "bg-[#CC5500] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              filterType === "transactions"
                ? "bg-[#CC5500] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setFilterType("transactions")}
          >
            Transactions
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              filterType === "expenses"
                ? "bg-[#CC5500] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setFilterType("expenses")}
          >
            Expenses
          </button>
        </div>

        {/* Date picker navigation - fixed */}
        <div className="bg-[#cc5500] text-lg font-semibold w-full flex justify-between items-center relative shadow-md flex-shrink-0">
          <button
            className="px-4 py-2 text-white hover:bg-white hover:text-[#cc5500]"
            onClick={decrementDate}
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <div
            className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer px-2 bg-[#cc5500] text-white"
            onClick={() => setShowDatepicker(!showDatepicker)}
          >
            {currentDate.toDateString()}
          </div>
          <button
            className="px-4 py-2 text-white hover:bg-white hover:text-[#cc5500]"
            onClick={incrementDate}
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
          {showDatepicker && (
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 mt-2 bg-white shadow-lg">
              <Datepicker
                inline
                value={currentDate}
                onChange={(date) => {
                  if (date instanceof Date) {
                    console.log("Datepicker selected date:", date);
                    setCurrentDate(date);
                    const newDate = date.toLocaleDateString();
                    console.log("Formatted date for filtering:", newDate);
                    setDisplayDate(newDate);
                    if (localSalesData) {
                      filterData(localSalesData, newDate, filterType);
                    }
                    setShowDatepicker(false);
                  }
                }}
                className="bg-white"
              />
            </div>
          )}
        </div>

        {/* Table with fixed header and footer */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <LoadingScreen message="Loading data" />
          ) : (
            <div className="flex flex-col h-full relative">
              {/* Table container */}
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm text-left text-gray-500 relative">
                  <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 ">
                    <tr>
                      {getColumnsForFilterType().map((column, index) => (
                        <th
                          key={index}
                          scope="col"
                          className={`px-6 py-4 font-medium text-left ${
                            column === "ID"
                              ? "w-[10%]"
                              : column === "Type"
                              ? "w-[15%]"
                              : column === "Details"
                              ? "w-[40%]"
                              : filterType === "all"
                              ? "w-[17.5%]"
                              : "w-[35%]"
                          }`}
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="relative">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={`${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } border-b hover:bg-gray-200 group cursor-pointer`}
                          onClick={() => handleRowClick(rowIndex)}
                        >
                          {filterType === "transactions" ? (
                            // Show only ID, Type, Details, Sales columns for transactions
                            <>
                              <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                                {row[0]}
                              </td>
                              <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                                {row[1]}
                              </td>
                              <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                                {row[2]}
                              </td>
                              <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                                {row[3]}
                              </td>
                            </>
                          ) : filterType === "expenses" ? (
                            // Show only ID, Type, Details, Expenses columns for expenses
                            <>
                              <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                                {row[0]}
                              </td>
                              <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                                {row[1]}
                              </td>
                              <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                                {row[2]}
                              </td>
                              <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                                {row[4]}
                              </td>
                            </>
                          ) : (
                            // Show all columns for 'all' filter
                            row.slice(0, 5).map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900"
                              >
                                {cell}
                              </td>
                            ))
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr className="bg-white border-b">
                        <td
                          className="px-6 py-4 text-center font-normal text-gray-500 italic"
                          colSpan={filterType === "all" ? 5 : 4}
                        >
                          {filterType === "transactions"
                            ? "No transactions for today."
                            : filterType === "expenses"
                            ? "No expenses for today."
                            : "No sales data for today."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add a separate fixed footer outside the scrollable area but within the flex container */}
              <div className="bg-white border-t-2 border-[#CC5500] flex-shrink-0">
                <table className="w-full text-sm text-left text-gray-500">
                  <tfoot>
                    {filterType === "transactions" ? (
                      // Transaction footer with proper column alignment
                      <tr>
                        <td className="px-6 py-4 w-[10%]"></td>{" "}
                        {/* ID column */}
                        <td className="px-6 py-4 w-[15%]"></td>{" "}
                        {/* Type column */}
                        <td className="px-6 py-4 font-bold text-right w-[40%]">
                          TOTAL SALES:
                        </td>
                        <td className="px-6 py-4 font-bold text-green-600 w-[35%]">
                          {formatCurrency(totals.sales)}
                        </td>
                      </tr>
                    ) : filterType === "expenses" ? (
                      // Expenses footer with proper column alignment
                      <tr>
                        <td className="px-6 py-4 w-[10%]"></td>{" "}
                        {/* ID column */}
                        <td className="px-6 py-4 w-[15%]"></td>{" "}
                        {/* Type column */}
                        <td className="px-6 py-4 font-bold text-right w-[40%]">
                          TOTAL EXPENSES:
                        </td>
                        <td className="px-6 py-4 font-bold text-red-600 w-[35%]">
                          {`-${formatCurrency(totals.expenses)}`}
                        </td>
                      </tr>
                    ) : (
                      // All filter - both rows for totals and net income
                      <>
                        <tr>
                          <td
                            colSpan="3"
                            className="px-6 py-4 font-bold text-right"
                          >
                            TOTAL:
                          </td>
                          <td className="px-6 py-4 font-bold text-green-600 w-[17.5%]">
                            {formatCurrency(totals.sales)}
                          </td>
                          <td className="px-6 py-4 font-bold text-red-600 w-[17.5%]">
                            {`-${formatCurrency(totals.expenses)}`}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="3"
                            className="px-6 py-4 font-bold text-right"
                          >
                            NET INCOME:
                          </td>
                          {totals.netIncome >= 0 ? (
                            <>
                              <td className="px-6 py-4 font-bold text-green-600 w-[17.5%]">
                                {formatCurrency(totals.netIncome)}
                              </td>
                              <td className="px-6 py-4 font-bold w-[17.5%]"></td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 font-bold w-[17.5%]"></td>
                              <td className="px-6 py-4 font-bold text-red-600 w-[17.5%]">
                                {`-${formatCurrency(
                                  Math.abs(totals.netIncome)
                                )}`}
                              </td>
                            </>
                          )}
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Modals */}
      {isSelectedItemTransaction && selectedItem && (
        <TransactionModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          transaction={selectedItem}
          menuTypes={localSalesData?.menu_types || []}
          discountsData={localSalesData?.discounts || []}
          menuItems={localSalesData?.menu_items || []}
          menuCategories={localSalesData?.menu_categories || []}
          employees={localSalesData?.employees || []}
          unliWingsCategory={localSalesData?.instore_categories?.find(
            (cat) => cat.id === 2
          )}
          fetchOrderData={fetchSalesData || fetchSalesDataFromApi}
        />
      )}

      {isAddExpenseOpen && (
        <AddExpense
          closePopup={() => setIsAddExpenseOpen(false)}
          expenseTypes={localSalesData?.expenses_types || []}
          onExpenseAdded={() => {
            if (fetchSalesData) fetchSalesData();
            else fetchSalesDataFromApi();
            setIsAddExpenseOpen(false);
          }}
          defaultDate={formatDateForInput(currentDate)}
        />
      )}

      {/* StockInExpense Modal */}
      {isStockInExpenseOpen && selectedStockInReceipt && (
        <StockInExpense
          isOpen={isStockInExpenseOpen}
          onClose={() => {
            setIsStockInExpenseOpen(false);
            setSelectedStockInReceipt(null);
          }}
          receipt={selectedStockInReceipt}
          unitMeasurements={localSalesData?.unit_measurements || []}
          items={localSalesData?.items || []}
          suppliers={localSalesData?.suppliers || []}
        />
      )}

      {isEditExpenseOpen && selectedExpense && (
        <EditExpense
          isOpen={isEditExpenseOpen}
          onClose={() => {
            setIsEditExpenseOpen(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
          expenseTypes={localSalesData?.expenses_types || []}
          onExpenseUpdated={() => {
            if (fetchSalesData) fetchSalesData();
            else fetchSalesDataFromApi();
          }}
        />
      )}
    </div>
  );
};

export default DailySales;
