import React, { useState, useEffect } from "react";
import { FaSortUp, FaSortDown } from "react-icons/fa";

const Table = ({
  columns,
  data,
  rowOnClick,
  maxHeight = "100%",
  maxWidth = "100%",
  tableName = "Table", // New prop for table name
  emptyMessage = "No Data Available",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(data.length);
  const [totalPages, setTotalPages] = useState(
    Math.ceil(data.length / itemsPerPage)
  );
  const [displayData, setDisplayData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

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

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
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

  return (
    <div className="w-full">
      <div
        className="relative overflow-x-auto w-full "
        style={{ maxHeight, maxWidth }}
      >
        {/* Table header with table name */}

        {/* Table Component */}
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 table-auto">
          <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-4 font-medium text-left ${
                    index === 0 ? "cursor-pointer" : ""
                  }`}
                  onClick={() => (index === 0 ? requestSort(index) : null)}
                >
                  <div className="flex items-center">
                    {column}
                    {index === 0 && (
                      <>
                        {sortConfig.key === 0 ? (
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
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length > 0 ? (
              displayData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`
                    ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"} 
                    border-b hover:bg-gray-200 group
                    ${rowOnClick ? "cursor-pointer" : ""}
                  `}
                  onClick={() =>
                    rowOnClick && rowOnClick(sortedData.indexOf(row))
                  }
                >
                  {row.map((cell, cellIndex) => (
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
    </div>
  );
};

export default Table;
