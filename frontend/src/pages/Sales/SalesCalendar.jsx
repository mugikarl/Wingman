import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoadingScreen from "../../components/popups/LoadingScreen";
import { FaCalendarAlt, FaChartBar, FaFileExport, FaPlus } from "react-icons/fa";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import ExportSales from "../../components/popups/ExportSales";
import AddExpense from "../../components/popups/AddExpense";

const SalesCalendar = () => {
  const [month, setMonth] = useState(new Date());
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showExportSales, setShowExportSales] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setSalesData([
        { col2: 10, col3: 20, col4: 30 },
        { col2: 15, col3: 25, col4: 35 },
        { col2: 20, col3: 30, col4: 40 },
      ]);
      setLoading(false);
    }, 1000);
  }, [month]);

  useEffect(() => {
    setSelectedDate(month);
  }, [month]);

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

  const handleExportClick = () => {
    setShowExportSales(true);
  };

  const handleAddExpenseClick = () => {
    setShowAddExpense(true);
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderCalendarDays = () => {
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    ).getDate();
    const firstDayOfMonth = new Date(
      month.getFullYear(),
      month.getMonth(),
      1
    ).getDay();
    const totalBoxes = firstDayOfMonth + daysInMonth;

    return Array.from({ length: totalBoxes }, (_, index) => {
      const isBlank = index < firstDayOfMonth;
      const dayIndex = (index - firstDayOfMonth) % salesData.length;
      const dayNumber = index - firstDayOfMonth + 1;

      return (
        <div
          key={index}
          className="border border-gray-300 p-2 flex flex-col items-end bg-white"
        >
          {isBlank ? null : (
            <>
              <span className="text-gray-500 text-sm self-start">
                {dayNumber}
              </span>
              <span className="text-green-600 font-bold">
                {salesData[dayIndex]?.col2}
              </span>
              <span className="text-red-600 font-bold">
                {salesData[dayIndex]?.col3}
              </span>
              <span className="text-orange-600 font-bold">
                {salesData[dayIndex]?.col4}
              </span>
            </>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen bg-[#fcf4dc] flex flex-col p-6">
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <Link
            to="/dashboard-admin/sales"
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <FaChartBar className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">Daily</span>
          </Link>
          <button className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden">
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
            ? month.toLocaleString("default", { month: "long" }) +
              " " +
              month.getFullYear()
            : "Invalid Date"}
        </div>
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#cc5500]"
          onClick={handleNextMonth}
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
        {showMonthPicker && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-white shadow-lg rounded-md p-4">
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
      <div className="grid grid-cols-7 gap-0 text-center font-bold mb-2 bg-[#cc5500] text-[#ffffff] shadow">
        {dayNames.map((day, index) => (
          <div key={index} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
      {showExportSales && (
        <ExportSales
          isOpen={showExportSales}
          onClose={() => setShowExportSales(false)}
          selectedDate={selectedDate}
        />
      )}
      {showAddExpense && (
        <AddExpense closePopup={() => setShowAddExpense(false)} />
      )}
    </div>
  );
};

export default SalesCalendar;