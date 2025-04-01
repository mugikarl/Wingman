import React, { useState, useEffect } from "react";
import { Datepicker } from "flowbite-react";
import LoadingScreen from "../../components/popups/LoadingScreen";

// Helper: Converts a Date object to a "YYYY-MM-DD" string in local time.
const getLocalDateString = (date) => {
  return date.toLocaleDateString("en-CA");
};

// Custom theme object for Flowbite React Datepicker.
const customTheme = {
  root: {
    base: "relative",
  },
  popup: {
    root: {
      base: "absolute top-10 z-50 block pt-2",
      inline: "relative top-0 z-auto",
      inner:
        "inline-block rounded-lg bg-white p-4 shadow-lg dark:bg-yellow-200",
    },
    header: {
      base: "",
      title:
        "px-2 py-3 text-center font-semibold text-gray-900 dark:text-white",
      selectors: {
        base: "mb-2 flex justify-between",
        button: {
          base: "rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600",
          prev: "",
          next: "",
          view: "",
        },
      },
    },
    view: {
      base: "p-1",
    },
    footer: {
      base: "mt-2 flex space-x-2",
      button: {
        base: "w-full rounded-lg px-5 py-2 text-center text-sm font-medium focus:ring-4 focus:ring-cyan-300",
        // Today button: custom style.
        today:
          "bg-[#c27100] text-white hover:bg-[#a95a00] dark:bg-[#c27100] dark:hover:bg-[#a95a00]",
        // Clear button hidden.
        clear: "hidden",
      },
    },
  },
  views: {
    days: {
      header: {
        base: "mb-1 grid grid-cols-7",
        title:
          "h-6 text-center text-sm font-medium leading-6 text-gray-500 dark:text-gray-400",
      },
      items: {
        base: "grid w-64 grid-cols-7",
        item: {
          base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-yellow-200 dark:text-white dark:hover:bg-gray-600",
          selected: "bg-[#c27100] text-white hover:bg-[#a95a00]",
          disabled: "text-gray-500",
        },
      },
    },
    months: {
      items: {
        base: "grid w-64 grid-cols-4",
        item: {
          base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-yellow-200 dark:text-white dark:hover:bg-gray-600",
          selected: "bg-cyan-700 text-white hover:bg-cyan-600",
          disabled: "text-gray-500",
        },
      },
    },
    years: {
      items: {
        base: "grid w-64 grid-cols-4",
        item: {
          base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-yellow-200 dark:text-white dark:hover:bg-gray-600",
          selected: "bg-cyan-700 text-white hover:bg-cyan-600",
          disabled: "text-gray-500",
        },
      },
    },
    decades: {
      items: {
        base: "grid w-64 grid-cols-4",
        item: {
          base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-yellow-200 dark:text-white dark:hover:bg-gray-600",
          selected: "bg-cyan-700 text-white hover:bg-cyan-600",
          disabled: "text-gray-500",
        },
      },
    },
  },
};

const AttendanceReview = ({ attendanceData, refreshAttendance }) => {
  // Store the selected date as a "YYYY-MM-DD" string.
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(new Date())
  );
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [loading, setLoading] = useState(true);

  // Display the selected date in a human-friendly format.
  const displayDate = new Date(selectedDate).toDateString();

  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Refresh attendance data whenever the selected date changes.
  useEffect(() => {
    setLoading(true);
    refreshAttendance(selectedDate)
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
    console.log("Selected date:", selectedDate);
  }, [selectedDate]);

  // Functions to decrement or increment the selected date.
  const decrementDate = () => {
    const dateObj = new Date(selectedDate);
    dateObj.setDate(dateObj.getDate() - 1);
    setSelectedDate(getLocalDateString(dateObj));
  };

  const incrementDate = () => {
    const dateObj = new Date(selectedDate);
    dateObj.setDate(dateObj.getDate() + 1);
    setSelectedDate(getLocalDateString(dateObj));
  };

  // Sort attendanceData by employee id in ascending order.
  const sortedAttendanceData = [...attendanceData].sort(
    (a, b) => Number(a.id) - Number(b.id)
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 mx-auto">
      {/* Top navigation: arrows and current date */}
      <div className="relative bg-[#c27100] text-lg font-semibold w-full rounded flex justify-between items-center">
        {/* Leftmost: Decrement Button */}
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#c27100] border-r border-white"
          onClick={decrementDate}
        >
          &lt;
        </button>

        {/* Center: Date Display */}
        <div
          className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer px-2 bg-[#c27100] text-white"
          onClick={() => setShowDatepicker(!showDatepicker)}
        >
          {displayDate}
        </div>

        {/* Rightmost: Increment Button */}
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#c27100] border-l border-white"
          onClick={incrementDate}
        >
          &gt;
        </button>

        {/* Datepicker - Always centered */}
        {showDatepicker && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-white shadow-lg rounded-lg">
            <Datepicker
              inline
              value={new Date(selectedDate)}
              onChange={(date) => {
                console.log("Date selected:", date);
                if (date instanceof Date) {
                  setSelectedDate(getLocalDateString(date));
                  setShowDatepicker(false);
                } else if (Array.isArray(date) && date.length > 0) {
                  setSelectedDate(getLocalDateString(date[0]));
                  setShowDatepicker(false);
                }
              }}
              theme={customTheme}
              className="bg-white"
            />
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white text-black rounded-lg shadow-md">
          <thead>
            <tr className="bg-[#FFCF03] text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Attendance Status</th>
              <th className="p-2">Time In</th>
              <th className="p-2">Time Out</th>
            </tr>
          </thead>
          <tbody>
            {sortedAttendanceData.map((entry, index) => (
              <tr
                key={entry.id}
                className={
                  index % 2 === 0
                    ? "bg-[#FFFFFF] border-b border-[#FFCF03]"
                    : "bg-[#FFEEA6] border-b"
                }
              >
                <td className="p-2">{entry.id}</td>
                <td className="p-2">{entry.name}</td>
                <td className="p-2">{entry.attendanceStatus}</td>
                <td className="p-2">{formatTime(entry.timeIn)}</td>
                <td className="p-2">{formatTime(entry.timeOut)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceReview;
