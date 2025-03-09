import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Datepicker } from "flowbite-react";
import axios from "axios";
import Table from "../../components/tables/Table";

// Helper: Converts a Date object to a "YYYY-MM-DD" string in local time.
const getLocalDateString = (date) => {
  return date.toLocaleDateString("en-CA");
};

// Custom theme object for Flowbite React Datepicker.
const customTheme = {
  root: { base: "relative" },
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
    view: { base: "p-1" },
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
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(new Date())
  );
  const [showDatepicker, setShowDatepicker] = useState(false);
  const role = localStorage.getItem("role");
  const [disposedInventory, setDisposedInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisposedInventory();
  }, []);

  const fetchDisposedInventory = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-item-data/"
      );
      setDisposedInventory(response.data.disposed_inventory || []);
    } catch (error) {
      console.error("Error fetching disposed inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter disposed items based on the selected date.
  const filteredDisposedData = disposedInventory.filter((item) => {
    const itemDate = new Date(item.disposal_datetime).toLocaleDateString(
      "en-CA"
    );
    return itemDate === selectedDate;
  });

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

  const columns = ["ITEM NAME", "DISPOSER", "DISPOSED", "REASON", "DATE"];
  const data = loading
    ? [["", "", "Loading...", "", ""]]
    : filteredDisposedData.map((item) => [
        item.item_name,
        item.disposer,
        `${item.disposed_quantity} ${item.disposed_unit}`,
        item.reason === "Other" ? `Other - ${item.other_reason}` : item.reason,
        new Date(item.disposal_datetime).toLocaleDateString(),
      ]);

  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      <div className="flex justify-between mb-4">
        <div className="flex space-x-4">
          {/* Inventory Button */}
          <Link to="/inventory">
            <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
              <div className="flex items-center justify-center bg-[#D87A03] p-3">
                <img
                  src="/images/stockout/trolley.png"
                  alt="Inventory"
                  className="w-6 h-6"
                />
              </div>
              <span className="flex-1 text-left pl-3">Inventory</span>
            </button>
          </Link>
          {/* Items Button (Admin Only) */}
          {role === "Admin" && (
            <Link to="/dashboard-admin/items">
              <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
                <div className="flex items-center justify-center bg-[#D87A03] p-3">
                  <img
                    src="/images/stockout/menu.png"
                    alt="Items"
                    className="w-6 h-6"
                  />
                </div>
                <span className="flex-1 text-left pl-3">Items</span>
              </button>
            </Link>
          )}
          {role === "Admin" && (
            <Link to="/dashboard-admin/menu">
              <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
                <div className="flex items-center justify-center bg-[#D87A03] p-3">
                  <img
                    src="/images/restaurant.png"
                    alt="Menu"
                    className="w-6 h-6"
                  />
                </div>
                <span className="flex-1 text-left pl-3">Menu</span>
              </button>
            </Link>
          )}
          {/* Stock In Button */}
          <Link to="/stockin">
            <button className="flex items-center bg-gradient-to-r from-[#009E2A] to-[#00BA34] text-white rounded-md shadow-md hover:from-[#008C25] hover:to-[#009E2A] transition-colors duration-200 w-48 overflow-hidden">
              <div className="flex items-center justify-center bg-[#009E2A] p-3">
                <img
                  src="/images/stockout/stock.png"
                  alt="Stock In"
                  className="w-6 h-6"
                />
              </div>
              <span className="flex-1 text-left pl-3">Stock In</span>
            </button>
          </Link>
          {/* Disposed Button */}
          <Link to="/stockout">
            <button className="flex items-center bg-gradient-to-r from-[#E60000] to-[#FF0000] text-white rounded-md shadow-md hover:from-[#CC0000] hover:to-[#E60000] transition-colors duration-200 w-48 overflow-hidden">
              <div className="flex items-center justify-center bg-[#E60000] p-3">
                <img
                  src="/images/stockout/trash-can.png"
                  alt="Disposed"
                  className="w-6 h-6"
                />
              </div>
              <span className="flex-1 text-left pl-3">Disposed</span>
            </button>
          </Link>
        </div>
      </div>
      {/* Top navigation: arrows and current date */}
      <div className="relative bg-[#c27100] text-lg font-semibold w-full rounded flex justify-between items-center">
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#c27100] border-r border-white"
          onClick={decrementDate}
        >
          &lt;
        </button>
        <div
          className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer px-2 bg-[#c27100] text-white"
          onClick={() => setShowDatepicker(!showDatepicker)}
        >
          {displayDate}
        </div>
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#c27100] border-l border-white"
          onClick={incrementDate}
        >
          &gt;
        </button>
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
      <Table
        columns={["ITEM NAME", "DISPOSER", "DISPOSED", "REASON"]}
        data={
          loading
            ? [["", "Loading...", "", ""]]
            : filteredDisposedData.map((item) => [
                item.item_name,
                item.disposer,
                `${item.disposed_quantity} ${item.disposed_unit}`,
                item.reason === "Other"
                  ? `Other - ${item.other_reason}`
                  : item.reason,
              ])
        }
      />
    </div>
  );
};

export default StockOut;
