import React, { useState, useEffect } from "react";
import { Datepicker } from "flowbite-react";
import { FaSortUp, FaSortDown, FaTimes } from "react-icons/fa";
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
  sortableColumns = [0], // Default to only first column being sortable
}) => {
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(initialDate)
  );
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(data.length);
  const [totalPages, setTotalPages] = useState(
    Math.ceil(data.length / itemsPerPage)
  );
  const [displayData, setDisplayData] = useState([]);
  const [sortedDataWithIndexes, setSortedDataWithIndexes] = useState([]);

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

  // Modified to set specific direction instead of cycling
  const setSortDirection = (key, direction) => {
    // If clicking the same direction that's already active, clear the sort
    if (sortConfig.key === key && sortConfig.direction === direction) {
      setSortConfig({ key: null, direction: null });
    } else {
      setSortConfig({ key, direction });
    }
  };

  // Clear sorting for a specific column
  const clearSorting = (e) => {
    e.stopPropagation(); // Prevent triggering the column header click
    setSortConfig({ key: null, direction: null });
  };

  useEffect(() => {
    const dataWithIndexes = data.map((row, index) => ({
      originalIndex: index,
      data: row,
    }));
    setSortedDataWithIndexes(dataWithIndexes);
  }, [data]);

  const sortedData = React.useMemo(() => {
    let sortableData = [...sortedDataWithIndexes];

    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableData.sort((a, b) => {
        const aValue = a.data[sortConfig.key];
        const bValue = b.data[sortConfig.key];

        // Skip sorting if values are undefined or null
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        // Handle date sorting (column index 1)
        if (
          sortConfig.key === 1 &&
          ((typeof aValue === "object" &&
            aValue.props &&
            aValue.props.children) ||
            (typeof bValue === "object" &&
              bValue.props &&
              bValue.props.children) ||
            (typeof aValue === "string" && aValue.includes("-")) ||
            (typeof bValue === "string" && bValue.includes("-")))
        ) {
          const getDateFromFormatted = (formatted) => {
            if (
              typeof formatted === "object" &&
              formatted.props &&
              formatted.props.children
            ) {
              const dateParts = formatted.props.children.filter(
                (part) => typeof part === "string"
              );
              return new Date(dateParts[0]);
            } else if (typeof formatted === "string") {
              // Try to parse as date if it contains date separators
              if (formatted.includes("-") || formatted.includes("/")) {
                return new Date(formatted.split(" ")[0]);
              }
            }
            return new Date(0);
          };

          const aDate = getDateFromFormatted(aValue);
          const bDate = getDateFromFormatted(bValue);

          return sortConfig.direction === "ascending"
            ? aDate - bDate
            : bDate - aDate;
        }

        // Extract text content from React elements if needed
        const getTextValue = (value) => {
          if (typeof value === "object" && value !== null) {
            if (value.props && value.props.children) {
              // For React elements, try to extract text content
              if (Array.isArray(value.props.children)) {
                return value.props.children
                  .filter((child) => typeof child === "string")
                  .join("");
              }
              return String(value.props.children);
            }
            // For other objects, try to convert to string
            return String(value);
          }
          return value;
        };

        const aTextValue = getTextValue(aValue);
        const bTextValue = getTextValue(bValue);

        // Handle numeric values
        if (!isNaN(aTextValue) && !isNaN(bTextValue)) {
          return sortConfig.direction === "ascending"
            ? Number(aTextValue) - Number(bTextValue)
            : Number(bTextValue) - Number(aTextValue);
        }

        // Handle string values
        const aString = String(aTextValue).toLowerCase();
        const bString = String(bTextValue).toLowerCase();

        if (aString < bString) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aString > bString) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableData;
  }, [sortedDataWithIndexes, sortConfig]);

  // Calculate page details when dependencies change
  useEffect(() => {
    setTotalItems(sortedData.length);
    setTotalPages(Math.ceil(sortedData.length / itemsPerPage));

    // Calculate the visible data for the current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedData.length);
    setDisplayData(sortedData.slice(startIndex, endIndex));
  }, [sortedData, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max to show
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, current page, and surrounding pages
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  const defaultTheme = {
    root: { base: "relative" },
    popup: {
      root: {
        base: "absolute block pt-2",
        inline: "relative top-0",
        inner: "inline-block rounded-lg bg-white p-4 shadow-lg",
      },
      header: {
        base: "",
        title: "px-2 py-3 text-center font-semibold text-[#CC5500]",
        selectors: {
          base: "mb-2 flex justify-between",
          button: {
            base: "rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#CC5500] hover:bg-[#fceee8] focus:outline-none focus:ring-2 focus:ring-[#fceee8]",
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
          today: "bg-[#CC5500] text-white hover:bg-[#b14900]",
          clear: "hidden",
        },
      },
    },
    views: {
      days: {
        header: {
          base: "mb-1 grid grid-cols-7",
          title: "h-6 text-center text-sm font-medium leading-6 text-[#CC5500]",
        },
        items: {
          base: "grid w-64 grid-cols-7",
          item: {
            base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-[#fceee8]",
            selected: "bg-[#CC5500] text-white hover:bg-[#b14900]",
            disabled: "text-gray-500",
          },
        },
      },
      months: {
        items: {
          base: "grid w-64 grid-cols-4",
          item: {
            base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-[#fceee8]",
            selected: "bg-[#CC5500] text-white hover:bg-[#b14900]",
            disabled: "text-gray-500",
          },
        },
      },
      years: {
        items: {
          base: "grid w-64 grid-cols-4",
          item: {
            base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-[#fceee8]",
            selected: "bg-[#CC5500] text-white hover:bg-[#b14900]",
            disabled: "text-gray-500",
          },
        },
      },
      decades: {
        items: {
          base: "grid w-64 grid-cols-4",
          item: {
            base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 text-gray-900 hover:bg-[#fceee8]",
            selected: "bg-[#CC5500] text-white hover:bg-[#b14900]",
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

      {/* Table - with sticky header and scrollable content */}
      <div
        className="relative overflow-y-auto border-t-0"
        style={{ maxHeight }}
      >
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 table-auto">
          <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-4 font-medium text-left ${
                    sortableColumns.includes(index) ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{column}</span>
                    {sortableColumns.includes(index) && (
                      <div className="flex items-center space-x-1">
                        {/* Sort controls */}
                        <div className="flex flex-col -space-y-1">
                          {/* Up arrow */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSortDirection(index, "ascending");
                            }}
                            className={`focus:outline-none -mb-1 ${
                              sortConfig.key === index &&
                              sortConfig.direction === "ascending"
                                ? "text-white"
                                : "text-gray-300 opacity-50 hover:opacity-100"
                            }`}
                            title="Sort ascending"
                          >
                            <FaSortUp className="h-3 w-3" />
                          </button>

                          {/* Down arrow */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSortDirection(index, "descending");
                            }}
                            className={`focus:outline-none -mt-1 ${
                              sortConfig.key === index &&
                              sortConfig.direction === "descending"
                                ? "text-white"
                                : "text-gray-300 opacity-50 hover:opacity-100"
                            }`}
                            title="Sort descending"
                          >
                            <FaSortDown className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Clear button - only show when this column is being sorted */}
                        {sortConfig.key === index && (
                          <button
                            onClick={clearSorting}
                            className="ml-1 hover:bg-[#B34700] rounded-full p-0.5 transition-colors focus:outline-none"
                            title="Clear sorting"
                          >
                            <FaTimes className="h-2.5 w-2.5 text-white" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length > 0 ? (
              displayData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`
                    ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"} 
                    border-b hover:bg-gray-200 group
                    ${rowOnClick ? "cursor-pointer" : ""}
                  `}
                  onClick={() => rowOnClick && rowOnClick(item.originalIndex)}
                >
                  {item.data.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 font-normal text-left text-gray-700 group-hover:text-gray-900"
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

        {/* Bottom Pagination - now within the same border */}
        <div className="bg-gray-100 border-t border-gray-300 px-6 py-3">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-700 mb-2 md:mb-0">
              Showing{" "}
              {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              entries
            </div>

            <nav aria-label="Table pagination">
              <ul className="flex items-center -space-x-px h-8 text-sm">
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-[#CC5500] ${
                      currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Previous
                  </button>
                </li>

                {getPageNumbers().map((page, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`flex items-center justify-center px-3 h-8 leading-tight ${
                        currentPage === page
                          ? "text-white bg-[#CC5500] border border-[#CC5500] hover:bg-[#B34700]"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-[#CC5500]"
                      }`}
                    >
                      {page}
                    </button>
                  </li>
                ))}

                <li>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-[#CC5500] ${
                      currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>

            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-gray-700">Page</span>
              <select
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#CC5500] focus:border-[#CC5500] block p-2"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <option key={page} value={page}>
                      {page}
                    </option>
                  )
                )}
              </select>
              <span className="text-sm text-gray-700">of {totalPages}</span>
            </div>
          </div>
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
