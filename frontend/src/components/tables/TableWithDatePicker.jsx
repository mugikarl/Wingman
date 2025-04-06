import React, { useState } from "react";
import { Datepicker } from "flowbite-react";
import { FaSortUp, FaSortDown } from "react-icons/fa";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

// Helper: Converts a Date object to a "YYYY-MM-DD" string in local time.
const getLocalDateString = (date) => {
  return date.toLocaleDateString("en-CA");
};

const TableWithDatePicker = ({
  columns,
  data,
  rowOnClick,
  maxHeight = "700px",
  initialDate = new Date(),
  onDateChange,
  customTheme = {},
  emptyMessage = "No Data Available",
}) => {
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(initialDate)
  );
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Display the selected date in a human-friendly format
  const displayDate = new Date(selectedDate).toDateString();

  // Functions to decrement or increment the selected date
  const decrementDate = () => {
    const dateObj = new Date(selectedDate);
    dateObj.setDate(dateObj.getDate() - 1);
    const newDate = getLocalDateString(dateObj);
    setSelectedDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };

  const incrementDate = () => {
    const dateObj = new Date(selectedDate);
    dateObj.setDate(dateObj.getDate() + 1);
    const newDate = getLocalDateString(dateObj);
    setSelectedDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };

  // Function to handle sorting
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

  // Sort data if sort config exists
  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableData.sort((a, b) => {
        // Get values at the specified column index
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle numeric values
        if (!isNaN(aValue) && !isNaN(bValue)) {
          return sortConfig.direction === "ascending"
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue);
        }

        // Handle string values
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

  // Default theme for the date picker
  const defaultTheme = {
    root: { base: "relative" },
    popup: {
      root: {
        base: "absolute top-10 z-50 block pt-2",
        inline: "relative top-0 z-auto",
        inner:
          "inline-block rounded-lg bg-white p-4 shadow-lg dark:bg-[#fceee8]",
      },
      header: {
        base: "",
        title:
          "px-2 py-3 text-center font-semibold text-gray-900 dark:text-white",
        selectors: {
          base: "mb-2 flex justify-between",
          button: {
            base: "rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-[#fceee8] focus:outline-none focus:ring-2 focus:ring-[#fceee8] dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600",
            prev: "",
            next: "",
            view: "",
          },
        },
      },
      view: { base: "p-1" },
      footer: {
        base: "mt-2 flex space-x-2",
        button: {
          base: "w-full rounded-lg px-5 py-2 text-center text-sm font-medium focus:ring-4 focus:ring-[#b14900]",
          today:
            "bg-[#cc5500] text-white hover:bg-[#b14900] dark:bg-[#cc5500] dark:hover:bg-[#b14900]",
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
            base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-[#fceee8] dark:text-white dark:hover:bg-gray-600",
            selected: "bg-[#cc5500] text-white hover:bg-[#b14900]",
            disabled: "text-gray-500",
          },
        },
      },
      months: {
        items: {
          base: "grid w-64 grid-cols-4",
          item: {
            base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-[#fceee8] dark:text-white dark:hover:bg-gray-600",
            selected: "bg-[#cc5500] text-white hover:bg-[#b14900]",
            disabled: "text-gray-500",
          },
        },
      },
      years: {
        items: {
          base: "grid w-64 grid-cols-4",
          item: {
            base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-[#fceee8] dark:text-white dark:hover:bg-gray-600",
            selected: "bg-[#cc5500] text-white hover:bg-[#b14900]",
            disabled: "text-gray-500",
          },
        },
      },
      decades: {
        items: {
          base: "grid w-64 grid-cols-4",
          item: {
            base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-[#fceee8] dark:text-white dark:hover:bg-gray-600",
            selected: "bg-[#cc5500] text-white hover:bg-[#b14900]",
            disabled: "text-gray-500",
          },
        },
      },
    },
  };

  // Merge custom theme with default theme
  const theme = { ...defaultTheme, ...customTheme };

  return (
    <div className="flex flex-col">
      {/* Date picker navigation */}
      <div className="bg-[#cc5500] text-lg font-semibold w-full rounded-t-sm flex justify-between items-center relative shadow-md">
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#cc5500]"
          onClick={decrementDate}
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>
        <div
          className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer px-2 bg-[#cc5500] text-white text-"
          onClick={() => setShowDatepicker(!showDatepicker)}
        >
          {displayDate}
        </div>
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#cc5500]"
          onClick={incrementDate}
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
        {showDatepicker && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-white shadow-lg">
            <Datepicker
              inline
              value={new Date(selectedDate)}
              onChange={(date) => {
                if (date instanceof Date) {
                  const newDate = getLocalDateString(date);
                  setSelectedDate(newDate);
                  if (onDateChange) onDateChange(newDate);
                  setShowDatepicker(false);
                } else if (Array.isArray(date) && date.length > 0) {
                  const newDate = getLocalDateString(date[0]);
                  setSelectedDate(newDate);
                  if (onDateChange) onDateChange(newDate);
                  setShowDatepicker(false);
                }
              }}
              theme={theme}
              className="bg-white"
            />
          </div>
        )}
      </div>

      {/* Table - with NO top border radius */}
      <div className="relative shadow-md rounded-b-sm">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-4 font-medium"
                  onClick={() => requestSort(index)}
                >
                  <div className="flex items-center cursor-pointer">
                    {column}
                    {sortConfig.key === index ? (
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
              ))}
            </tr>
          </thead>
        </table>
        <div className="overflow-y-auto" style={{ maxHeight }}>
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`
                      ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"} 
                      border-b hover:bg-gray-200 group
                      ${rowOnClick ? "cursor-pointer" : ""}
                    `}
                    onClick={() => rowOnClick && rowOnClick(rowIndex)}
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900"
                        scope={cellIndex === 0 ? "row" : undefined}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr className="bg-white border-b">
                  <td
                    className="px-6 py-4 text-center font-normal text-gray-500 italic"
                    colSpan={columns.length}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add CSS to ensure no top rounded borders on the table */}
      <style jsx>{`
        .rounded-b-sm {
          border-bottom-left-radius: 0.125rem;
          border-bottom-right-radius: 0.125rem;
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }
      `}</style>
    </div>
  );
};

export default TableWithDatePicker;
