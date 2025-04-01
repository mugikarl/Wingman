import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoadingScreen from "../../components/popups/LoadingScreen";

const SalesCalendar = () => {
  const [month, setMonth] = useState(new Date());
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch sales data when month changes
  useEffect(() => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setSalesData([
        { col2: 10, col3: 20, col4: 30 },
        { col2: 15, col3: 25, col4: 35 },
        { col2: 20, col3: 30, col4: 40 },
      ]);
      setLoading(false);
    }, 1000);
  }, [month]);

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
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

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

  const handleMonthChange = (event) => {
    const [year, month] = event.target.value.split("-");
    setMonth(new Date(year, month - 1));
  };

  const renderCalendarDays = () => {
    const totalBoxes = firstDayOfMonth + daysInMonth; // Account for blank days
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
    <div className="p-4">
      {/* Buttons */}
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <Link to="/sales">
            <button className="bg-orange-500 text-white px-4 py-2 rounded">
              DAILY
            </button>
          </Link>
          <button className="bg-orange-500 text-white px-4 py-2 rounded">
            CALENDAR
          </button>
        </div>
        <button className="bg-green-500 text-white px-4 py-2 rounded">
          Button 3
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <button onClick={handlePreviousMonth}>&lt;</button>
        <input
          type="month"
          value={month.toISOString().slice(0, 7)}
          onChange={handleMonthChange}
          className="border border-gray-300 rounded p-1"
        />
        <button onClick={handleNextMonth}>&gt;</button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-0 text-center font-bold mb-2 bg-white">
        {dayNames.map((day, index) => (
          <div key={index} className="p-2 border border-gray-300">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 border border-gray-300 bg-white">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default SalesCalendar;
