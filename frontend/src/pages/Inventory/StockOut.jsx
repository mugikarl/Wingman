import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Datepicker } from "flowbite-react";

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
        today:
          "bg-[#c27100] text-white hover:bg-[#a95a00] dark:bg-[#c27100] dark:hover:bg-[#a95a00]",
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

const StockOut = () => {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [showDatepicker, setShowDatepicker] = useState(false);
  const role = localStorage.getItem("role");
  const [data, setData] = useState([
    { id: 1, itemName: "Item 1", disposer: "User A", unit: "pcs", disposed: 10, reason: "Expired" },
    { id: 2, itemName: "Item 2", disposer: "User B", unit: "kg", disposed: 15, reason: "Damaged" },
    { id: 3, itemName: "Item 3", disposer: "User C", unit: "liters", disposed: 20, reason: "Obsolete" },
  ]);

  const totalValues = data.reduce(
    (totals, row) => ({
      disposed: totals.disposed + row.disposed,
    }),
    { disposed: 0 }
  );

  // Display the selected date in a human-friendly format.
  const displayDate = new Date(selectedDate).toDateString();

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

  return (
    <div className="p-4 mx-auto">
      <div className="flex justify-between mb-4">
        <div className="flex space-x-4">
          <Link to="/inventory">
            <button
              className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]"
            >
              <img
                src="/images/stockout/cart.png"
                alt="New Product"
                className="w-8 h-8 mr-2"
              />
              <span className="text-white">Inventory</span>
            </button>
          </Link>
          {/* Other Buttons */}
          {role === "Admin" && (
            <Link to="/dashboard-admin/items">
            <button className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
              <img
                src="/images/stockout/menu.png"
                alt="Menu"
                className="w-8 h-8 mr-2"
              />
              <span className="text-white">Items</span>
            </button>
          </Link>
          )}
          <Link to="/stockin">
            <button className="flex items-center bg-[#00BA34] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
              <img
                src="/images/stockout/stock.png"
                alt="Stock In"
                className="w-8 h-8 mr-2"
              />
              <span className="text-white">Stock In</span>
            </button>
          </Link>

          {/* Conditionally render the Menu button only for Admin */}
          {role === "Admin" && (
            <Link to="/dashboard-admin/menu">
              <button className="flex items-center bg-[#00BA34] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
                <img
                  src="/images/stockout/stock.png"
                  alt="Stock In"
                  className="w-8 h-8 mr-2"
                />
                <span className="text-white">Menu</span>
              </button>
            </Link>
          )}

          <Link to="/stockout">
            <button className="flex items-center bg-[#FF0000] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
              <img
                src="/images/stockout/trash.png"
                alt="Disposed"
                className="w-8 h-8 mr-2"
              />
              <span className="text-white">Disposed</span>
            </button>
          </Link>
        </div>
      </div>
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

   

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white text-black rounded-lg shadow-md">
          <thead>
            <tr className="bg-[#FFCF03] text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Item Name</th>
              <th className="p-2">Disposer</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Disposed</th>
              <th className="p-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id}
                className={
                  index % 2 === 0
                    ? "bg-[#FFFFFF] border-b border-[#FFCF03]"
                    : "bg-[#FFEEA6] border-b"
                }
              >
                <td className="p-2">{row.id}</td>
                <td className="p-2">{row.itemName}</td>
                <td className="p-2">{row.disposer}</td>
                <td className="p-2">{row.unit}</td>
                <td className="p-2">{row.disposed}</td>
                <td className="p-2">{row.reason}</td>
              </tr>
            ))}
            
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockOut;