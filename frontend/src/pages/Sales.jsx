import React, { useState, useEffect } from "react";
import LoadingScreen from "../components/popups/LoadingScreen";
import {
  FaCalendarAlt,
  FaChartBar,
  FaFileExport,
  FaPlus,
} from "react-icons/fa";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import ExportSales from "../components/popups/ExportSales";
import AddExpense from "../components/popups/AddExpense";
import { FaSortUp, FaSortDown } from "react-icons/fa";
import axios from "axios";
import DailyTransactions from "../components/popups/DailyTransactions";

const Sales = () => {
  const [month, setMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [isDailyTransactionsOpen, setIsDailyTransactionsOpen] = useState(false);
  const [selectedDateForTransactions, setSelectedDateForTransactions] =
    useState(null);
  const [transactionsData, setTransactionsData] = useState([]);

  useEffect(() => {
    setSelectedDate(month);
  }, [month]);

  useEffect(() => {
    setLoading(true);

    // Fetch all sales data without date filtering
    axios
      .get(`http://127.0.0.1:8000/fetch-sales-data/`)
      .then((response) => {
        if (response.data.error) {
          console.error("Error fetching data:", response.data.error);
          setData([]);
          setTransactionsData([]);
          return;
        }

        // Store all transactions for the DailyTransactions component
        const allTransactions = response.data.transactions || [];
        console.log("Raw transaction data:", {
          firstTransaction: allTransactions[0],
          hasOrderStatus: allTransactions.some(
            (t) => t.order_status !== undefined
          ),
          statusValues: [
            ...new Set(allTransactions.map((t) => t.order_status)),
          ],
        });

        setTransactionsData(allTransactions);

        // Filter transactions and expenses for the selected month
        const selectedYear = month.getFullYear();
        const selectedMonth = month.getMonth();

        const monthTransactions = allTransactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            transactionDate.getFullYear() === selectedYear &&
            transactionDate.getMonth() === selectedMonth &&
            transaction.order_status === 1 // Changed from order_status_id
          );
        });

        // Filter expenses to include only those in the current month
        const monthExpenses = (response.data.expenses || []).filter(
          (expense) => {
            const expenseDate = new Date(expense.date);
            return (
              expenseDate.getFullYear() === selectedYear &&
              expenseDate.getMonth() === selectedMonth
            );
          }
        );

        // Calculate daily totals for the selected month
        const dailyTotals = {};

        // Add transaction amounts to daily totals
        monthTransactions.forEach((transaction) => {
          const transactionDate = new Date(transaction.date);
          const dateStr = transactionDate.toLocaleDateString(); // Format: MM/DD/YYYY
          if (!dailyTotals[dateStr]) {
            dailyTotals[dateStr] = { date: dateStr, sales: 0, expenses: 0 };
          }
          dailyTotals[dateStr].sales += parseFloat(
            transaction.payment_amount || 0
          );
        });

        // Add expense amounts to daily totals
        monthExpenses.forEach((expense) => {
          const expenseDate = new Date(expense.date);
          const dateStr = expenseDate.toLocaleDateString(); // Format: MM/DD/YYYY
          if (!dailyTotals[dateStr]) {
            dailyTotals[dateStr] = { date: dateStr, sales: 0, expenses: 0 };
          }
          dailyTotals[dateStr].expenses += parseFloat(expense.cost || 0);
        });

        // Format data for the table based on the selected filter
        let displayData = [];
        if (filterStatus === 1) {
          // Transactions tab - Show only dates with sales
          displayData = Object.values(dailyTotals)
            .filter((day) => day.sales > 0)
            .map((day) => ({
              date: day.date,
              sales: day.sales,
              expenses: 0, // Don't show expenses in transactions tab
              netIncome: day.sales,
            }));
        } else {
          // Expenses tab - Show only dates with expenses
          displayData = Object.values(dailyTotals)
            .filter((day) => day.expenses > 0)
            .map((day) => ({
              date: day.date,
              sales: 0, // Don't show sales in expenses tab
              expenses: day.expenses,
              netIncome: -day.expenses,
            }));
        }

        // Calculate total values for the filtered data
        const totalValues = displayData.reduce(
          (totals, row) => ({
            sales: totals.sales + row.sales,
            expenses: totals.expenses + row.expenses,
            netIncome: totals.netIncome + row.netIncome,
          }),
          { sales: 0, expenses: 0, netIncome: 0 }
        );

        // Add total row only for footer rendering
        const formattedData = [
          ...displayData,
          {
            date: "Total",
            sales: totalValues.sales,
            expenses: totalValues.expenses,
            netIncome: totalValues.netIncome,
          },
        ];

        setData(formattedData);
      })
      .catch((error) => {
        console.error("Error:", error);
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [month, filterStatus]);

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableData.sort((a, b) => {
        if (a.date === "Total") return 1;
        if (b.date === "Total") return -1;
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key) {
      direction =
        sortConfig.direction === "ascending"
          ? "descending"
          : sortConfig.direction === "descending"
          ? null
          : "ascending";
    }
    setSortConfig({ key, direction });
  };

  const formatCurrency = (value) => {
    return `₱${value.toLocaleString()}`;
  };

  const handleExportClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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

  const handleAddExpenseClick = () => {
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
  };

  const handleRowClick = (row) => {
    if (row.date !== "Total") {
      console.log("Clicked row date:", row.date);
      setSelectedDateForTransactions(row.date);
      setIsDailyTransactionsOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center">
        <LoadingScreen message="Loading sales data" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fcf4dc] flex flex-col p-6">
      {/* Buttons */}
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => (window.location.href = "/dashboard-admin/sales")}
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <FaChartBar className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">Daily</span>
          </button>
          <button
            onClick={() =>
              (window.location.href = "/dashboard-admin/salescalendar")
            }
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <FaCalendarAlt className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">Calendar</span>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddExpenseClick}
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <FaPlus className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">Add Expense</span>
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

      {/* Active/Inactive Buttons */}
      <div className="flex mb-0">
        <button
          className={`flex items-center justify-center p-2 transition-colors duration-200 w-48 rounded-tl-sm ${
            filterStatus === 1
              ? "bg-[#CC5500] text-white"
              : "bg-[#CC5500]/70 text-white"
          }`}
          onClick={() => setFilterStatus(1)}
        >
          Transaction
        </button>
        <button
          className={`flex items-center justify-center p-2 transition-colors duration-200 w-48 rounded-tr-sm ${
            filterStatus === 2
              ? "bg-[#CC5500] text-white"
              : "bg-[#CC5500]/70 text-white"
          }`}
          onClick={() => setFilterStatus(2)}
        >
          Expenses
        </button>
      </div>

      {/* Month Navigation */}
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
          <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
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
            {sortedData.filter((row) => row.date !== "Total").length > 0 ? (
              sortedData
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
                    <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                      {formatCurrency(row.sales)}
                    </td>
                    <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
                      {formatCurrency(row.expenses)}
                    </td>
                    <td className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900">
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
      {sortedData.some((row) => row.date === "Total") && (
        <div className="sticky bottom-0 w-full border-t-2 border-[#CC5500]">
          <table className="w-full text-sm text-left">
            <tfoot>
              <tr className="bg-white">
                {sortedData
                  .filter((row) => row.date === "Total")
                  .map((totalRow, index) => (
                    <React.Fragment key={index}>
                      <td className="px-6 py-4 font-bold text-left text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-4 font-bold text-left text-gray-900">
                        {formatCurrency(totalRow.sales)}
                      </td>
                      <td className="px-6 py-4 font-bold text-left text-gray-900">
                        {formatCurrency(totalRow.expenses)}
                      </td>
                      <td className="px-6 py-4 font-bold text-left text-gray-900">
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
        onClose={closeModal}
        selectedDate={selectedDate}
      />
      {isExpenseModalOpen && <AddExpense closePopup={closeExpenseModal} />}
      {isDailyTransactionsOpen && (
        <DailyTransactions
          isOpen={isDailyTransactionsOpen}
          onClose={() => setIsDailyTransactionsOpen(false)}
          date={selectedDateForTransactions}
          transactionsData={transactionsData}
        />
      )}
    </div>
  );
};

export default Sales;
