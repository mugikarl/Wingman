import React, { useState } from "react";
import { Link } from "react-router-dom";
import LegendModal from "../../components/popups/LegendModal";
import EmployeeLeave from "../../components/popups/EmployeeLeave";
import Holidays from "../../components/popups/Holidays";

const Schedule = () => {
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isHolidayOpen, setIsHolidayOpen] = useState(false);
  const [legends, setLegends] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const openLegendModal = () => setIsLegendOpen(true);
  const closeLegendModal = () => setIsLegendOpen(false);

  const openHolidayModal = () => setIsHolidayOpen(true);
  const closeHolidayModal = () => setIsHolidayOpen(false);

  const openLeaveModal = () => setIsLeaveOpen(true);
  const closeLeaveModal = () => setIsLeaveOpen(false);

  const addLegend = (newLegend) => {
    setLegends([...legends, newLegend]);
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getMonthDays = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const daysArray = Array(firstDay).fill(null).concat([...Array(totalDays).keys()].map(d => d + 1));
    return daysArray;
  };

  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const daysCurrentMonth = getMonthDays(currentMonth);
  const daysNextMonth = getMonthDays(nextMonth);

  return (
    <div className="p-6">
      {/* Top Buttons */}
      <div className="flex justify-between mb-4">
        <Link to="/staffprofile">
        <button className="bg-[#E88504] text-white px-4 py-2 rounded-lg shadow">Return to Staff Profile</button>
        </Link>
        <div className="flex space-x-4">
          <button onClick={openLegendModal} className="bg-[#E88504] text-white px-4 py-2 rounded-lg shadow">
            Legends
          </button>
          <button onClick={openHolidayModal} className="bg-[#E88504] text-white px-4 py-2 rounded-lg shadow">Holidays</button>
          <button onClick={openLeaveModal} className="bg-[#E88504] text-white px-4 py-2 rounded-lg shadow">
            Schedule Leave
          </button>
        </div>
      </div>

      {/* Frame */}
      <div className="border-2 border-gray-300 rounded-lg p-6 shadow-lg">
        <h2 className="text-center text-2xl font-bold mb-4">Schedule</h2>

        {/* Legends Section */}
        <h3 className="text-lg font-semibold">Legend</h3>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {legends.map((legend, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: legend.color }}></div>
              <span>{legend.name}</span>
            </div>
          ))}
        </div>

        {/* Calendar Section */}
        <div className="flex justify-between items-center my-4">
          <button onClick={handlePrevMonth} className="text-2xl">&lt;</button>
          <h3 className="text-lg font-semibold">{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}</h3>
          <h3 className="text-lg font-semibold">{nextMonth.toLocaleString("default", { month: "long", year: "numeric" })}</h3>
          <button onClick={handleNextMonth} className="text-2xl">&gt;</button>
        </div>

        {/* Two Side-by-Side Calendars */}
        <div className="grid grid-cols-2 gap-4">
          {[daysCurrentMonth, daysNextMonth].map((days, i) => (
            <div key={i} className="border p-4 rounded-lg shadow">
              <div className="grid grid-cols-7 gap-2 font-bold text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <div key={index} className="p-2">{day}</div>
                ))}
                {days.map((day, index) => (
                  <div key={index} className="p-4 border text-center">{day || ""}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <LegendModal isOpen={isLegendOpen} closeModal={closeLegendModal} addLegend={addLegend} />
      <EmployeeLeave isOpen={isLeaveOpen} closeModal={closeLeaveModal} />
      <Holidays isOpen={isHolidayOpen} closeModal={closeHolidayModal} />
    </div>
  );
};

export default Schedule;