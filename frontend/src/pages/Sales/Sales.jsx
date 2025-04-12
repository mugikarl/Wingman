import React, { useState, useEffect } from "react";
import LoadingScreen from "../../components/popups/LoadingScreen";
import {
  FaCalendarAlt,
  FaChartBar,
  FaFileExport,
  FaPlus,
} from "react-icons/fa";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import ExportSales from "../../components/popups/ExportSales";
import { FaSortUp, FaSortDown } from "react-icons/fa";
import { PiStackPlus } from "react-icons/pi";
import axios from "axios";
import ExpensesType from "../../components/popups/ExpensesType";
import DailySales from "../../components/popups/DailySales";

const Sales = () => {
  // State Management
  const [month, setMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "ascending",
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isExpenseTypeModalOpen, setIsExpenseTypeModalOpen] = useState(false);
  const [isDailyTransactionsOpen, setIsDailyTransactionsOpen] = useState(false);
  const [selectedDateForTransactions, setSelectedDateForTransactions] =
    useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDailyExpensesOpen, setIsDailyExpensesOpen] = useState(false);
  const [isDailySalesOpen, setIsDailySalesOpen] = useState(false);
  const [selectedDateForDailySales, setSelectedDateForDailySales] =
    useState(null);

  useEffect(() => {
    setSelectedDate(month);
  }, [month]);

  // Data Fetching Function
  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/fetch-sales-data/`
      );
      console.log("Sales data fetched:", response.data);

      if (response.data.error) {
        setError(response.data.error);
        setSalesData(null);
        setData([]);
        return;
      }

      // Store all data
      setSalesData(response.data);

      // Helper function to calculate transaction total (same as DailySales.jsx)
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
        const menuTypeData = response.data.menu_types?.find(
          (type) => type.id === menuTypeId
        );
        const menuType = menuTypeData ? menuTypeData.name : "Unknown";
        const isDelivery = menuType === "Grab" || menuType === "FoodPanda";

        // Debug: Log menu type and deduction percentage
        console.log("Menu Type:", menuType);
        console.log("Menu Type Data:", menuTypeData);
        console.log(
          "Deduction Percentage:",
          menuTypeData?.deduction_percentage
        );

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

      // Process transactions for the current month
      const selectedYear = month.getFullYear();
      const selectedMonth = month.getMonth();

      const monthTransactions = (response.data.transactions || []).filter(
        (transaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            transactionDate.getFullYear() === selectedYear &&
            transactionDate.getMonth() === selectedMonth &&
            transaction.order_status === 2
          );
        }
      );

      // Process expenses
      const monthExpenses = (response.data.expenses || []).filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getFullYear() === selectedYear &&
          expenseDate.getMonth() === selectedMonth
        );
      });

      // Calculate daily totals
      const dailyTotals = {};

      // Process transactions (using the same logic as DailySales.jsx)
      monthTransactions.forEach((transaction) => {
        const dateStr = new Date(transaction.date).toLocaleDateString();
        if (!dailyTotals[dateStr]) {
          dailyTotals[dateStr] = { date: dateStr, sales: 0, expenses: 0 };
        }
        dailyTotals[dateStr].sales += calculateTransactionTotal(transaction);
      });

      // Process expenses
      monthExpenses.forEach((expense) => {
        const dateStr = new Date(expense.date).toLocaleDateString();
        if (!dailyTotals[dateStr]) {
          dailyTotals[dateStr] = { date: dateStr, sales: 0, expenses: 0 };
        }
        dailyTotals[dateStr].expenses += parseFloat(expense.cost || 0);
      });

      // Format data showing all transactions and expenses
      const displayData = Object.values(dailyTotals).map((day) => ({
        date: day.date,
        sales: day.sales,
        expenses: day.expenses,
        netIncome: day.sales - day.expenses,
      }));

      // Calculate totals
      const totalValues = displayData.reduce(
        (totals, row) => ({
          sales: totals.sales + row.sales,
          expenses: totals.expenses + row.expenses,
          netIncome: totals.netIncome + row.netIncome,
        }),
        { sales: 0, expenses: 0, netIncome: 0 }
      );

      setData([
        ...displayData,
        {
          date: "Total",
          sales: totalValues.sales,
          expenses: totalValues.expenses,
          netIncome: totalValues.netIncome,
        },
      ]);
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError(err.message || "Error fetching data");
      setSalesData(null);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [month]);

  // Event Handlers
  const handleExportClick = () => setIsModalOpen(true);
  const handleAddExpenseTypeClick = () => setIsExpenseTypeModalOpen(true);
  const handlePreviousMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setMonth(newMonth);
  };
  const handleNextMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setMonth(newMonth);
  };
  const handleMonthChange = (date) => {
    setMonth(date);
    setShowMonthPicker(false);
  };

  const handleRowClick = (row) => {
    if (row.date !== "Total") {
      console.log("Clicked row date:", row.date);

      // Convert the string date to a Date object to ensure consistent formatting
      const clickedDate = new Date(row.date);
      const formattedDate = clickedDate.toLocaleDateString();

      console.log("Formatted date:", formattedDate);
      setSelectedDateForDailySales(formattedDate);
      setIsDailySalesOpen(true);
    }
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    const dataToSort = [...data];
    if (!sortConfig.key) {
      // Default sort by date (earliest to latest) when no sort is applied
      return dataToSort.sort((a, b) => {
        if (a.date === "Total") return 1; // Always keep Total at the end
        if (b.date === "Total") return -1;
        return new Date(a.date) - new Date(b.date); // Sort dates earliest to latest
      });
    }

    return dataToSort.sort((a, b) => {
      if (a.date === "Total") return 1; // Always keep Total at the end
      if (b.date === "Total") return -1;

      if (sortConfig.key === "date") {
        // Special handling for date sorting
        if (sortConfig.direction === "ascending") {
          return new Date(a.date) - new Date(b.date);
        } else {
          return new Date(b.date) - new Date(a.date);
        }
      } else {
        // For numeric columns (sales, expenses, netIncome)
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      }
    });
  };

  // Utility Functions
  const formatCurrency = (value) => {
    return `₱${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center">
        <LoadingScreen message="Loading sales data" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="h-screen bg-[#fcf4dc] flex flex-col p-6">
      {/* Buttons */}
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={handleAddExpenseTypeClick}
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-2">
              <PiStackPlus className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">Add Expense Type</span>
          </button>
          <button
            onClick={handleExportClick}
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <FaFileExport className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">Export</span>
          </button>
        </div>
      </div>

      {/* Month Navigation - Top part now rounded */}
      <div className="bg-[#cc5500] text-lg font-semibold w-full rounded-t-sm flex justify-between items-center relative">
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#cc5500]"
          onClick={handlePreviousMonth}
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>
        <div
          className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer px-2 bg-[#cc5500] text-white"
          onClick={() => setShowMonthPicker(!showMonthPicker)}
        >
          {month instanceof Date && !isNaN(month)
            ? `${month.toLocaleString("default", {
                month: "long",
              })} ${month.getFullYear()}`
            : "Invalid Date"}
        </div>
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#cc5500]"
          onClick={handleNextMonth}
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
        {showMonthPicker && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 mt-2 z-20 bg-white shadow-lg rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newYear = month.getFullYear() - 1;
                  setMonth(new Date(newYear, month.getMonth()));
                }}
                className="px-2 py-1 text-[#cc5500] hover:bg-gray-100 rounded-md"
              >
                &lt;
              </button>
              <div className="font-semibold">{month.getFullYear()}</div>
              <button
                onClick={() => {
                  const newYear = month.getFullYear() + 1;
                  setMonth(new Date(newYear, month.getMonth()));
                }}
                className="px-2 py-1 text-[#cc5500] hover:bg-gray-100 rounded-md"
              >
                &gt;
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-lg">
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = new Date(month.getFullYear(), i, 1);
                return (
                  <button
                    key={i}
                    onClick={() => handleMonthChange(monthDate)}
                    className={`px-4 py-2 rounded-md text-center ${
                      month.getMonth() === i
                        ? "bg-[#cc5500] text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {monthDate.toLocaleString("default", { month: "short" })}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Table with sticky header & scrollable content */}
      <div
        className="relative shadow-md rounded-b-sm overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 290px)" }}
      >
        <table className="w-full text-sm text-left text-gray-500 table-auto">
          <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0">
            <tr>
              {["Date", "Sales", "Expenses", "Net Income"].map(
                (column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-4 font-medium text-left cursor-pointer"
                    onClick={() =>
                      requestSort(
                        index === 0
                          ? "date"
                          : index === 1
                          ? "sales"
                          : index === 2
                          ? "expenses"
                          : "netIncome"
                      )
                    }
                  >
                    <div className="flex items-center">
                      {column}
                      {sortConfig.key ===
                      (index === 0
                        ? "date"
                        : index === 1
                        ? "sales"
                        : index === 2
                        ? "expenses"
                        : "netIncome") ? (
                        <span className="ml-1.5">
                          {sortConfig.direction === "ascending" ? (
                            <FaSortUp className="inline h-3 w-3 text-white" />
                          ) : (
                            <FaSortDown className="inline h-3 w-3 text-white" />
                          )}
                        </span>
                      ) : (
                        <span className="ml-1.5 text-gray-300 opacity-30">
                          <svg
                            className="w-3 h-3"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {getSortedData().filter((row) => row.date !== "Total").length >
            0 ? (
              getSortedData()
                .filter((row) => row.date !== "Total")
                .map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`${
                      rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } border-b hover:bg-gray-200 group cursor-pointer`}
                    onClick={() => handleRowClick(row)}
                  >
                    <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                      {row.date}
                    </td>
                    <td className="px-6 py-4 font-normal text-left text-green-600">
                      {formatCurrency(row.sales)}
                    </td>
                    <td className="px-6 py-4 font-normal text-left text-red-600">
                      {formatCurrency(row.expenses)}
                    </td>
                    <td
                      className={`px-6 py-4 font-normal text-left ${
                        row.netIncome >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(row.netIncome)}
                    </td>
                  </tr>
                ))
            ) : (
              <tr className="bg-white border-b">
                <td
                  className="px-6 py-4 text-center font-normal text-gray-500 italic"
                  colSpan={4}
                >
                  No sales data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: TOTAL displayed as footer only */}
      {data.some((row) => row.date === "Total") && (
        <div className="sticky bottom-0 w-full border-t-2 border-[#CC5500]">
          <table className="w-full text-sm text-left">
            <tfoot>
              <tr className="bg-white">
                {data
                  .filter((row) => row.date === "Total")
                  .map((totalRow, index) => (
                    <React.Fragment key={index}>
                      <td className="px-6 py-4 font-bold text-left text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-4 font-bold text-left text-green-600">
                        {formatCurrency(totalRow.sales)}
                      </td>
                      <td className="px-6 py-4 font-bold text-left text-red-600">
                        {formatCurrency(totalRow.expenses)}
                      </td>
                      <td
                        className={`px-6 py-4 font-bold text-left ${
                          totalRow.netIncome >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(totalRow.netIncome)}
                      </td>
                    </React.Fragment>
                  ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <ExportSales
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        salesData={salesData}
      />
      {isExpenseTypeModalOpen && (
        <ExpensesType
          isOpen={isExpenseTypeModalOpen}
          onClose={() => setIsExpenseTypeModalOpen(false)}
          expensesTypes={salesData?.expenses_types || []}
          fetchExpensesData={fetchSalesData}
        />
      )}
      <DailySales
        isOpen={isDailySalesOpen}
        onClose={() => setIsDailySalesOpen(false)}
        selectedDate={selectedDateForDailySales}
        salesData={salesData}
        fetchSalesData={fetchSalesData}
      />
    </div>
  );
};

export default Sales;
