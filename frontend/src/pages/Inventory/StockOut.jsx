import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Datepicker } from "flowbite-react";
import axios from "axios";
import Table from "../../components/tables/Table";
import LoadingScreen from "../../components/popups/LoadingScreen"; // Import the LoadingScreen component

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
        "http://127.0.0.1:8000/fetch-stockout-page-data/"
      );

      // Debug logging to see the data structure
      console.log("Disposed inventory data:", response.data.disposed_inventory);

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

  return (
    <div className="h-screen bg-[#eeeeee] flex flex-col p-6">
      {/* Top navigation: arrows and current date */}
      <div className="relative bg-[#cc5500] text-lg font-semibold w-full rounded-t-sm flex justify-between items-center">
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#cc5500] border-r border-white"
          onClick={decrementDate}
        >
          &lt;
        </button>
        <div
          className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer px-2 bg-[#cc5500] text-white"
          onClick={() => setShowDatepicker(!showDatepicker)}
        >
          {displayDate}
        </div>
        <button
          className="px-4 py-2 text-white hover:bg-white hover:text-[#cc5500] border-l border-white"
          onClick={incrementDate}
        >
          &gt;
        </button>
        {showDatepicker && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-white shadow-lg ">
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
      {loading ? (
        <div className="w-full flex justify-center items-center">
          <LoadingScreen /> {/* Display the LoadingScreen component */}
        </div>
      ) : (
        <Table
          columns={["ITEM NAME", "DISPOSER", "DISPOSED", "REASON"]}
          data={filteredDisposedData.map((item) => {
            // Use the processed fields from the backend
            return [
              item.item_name || "Unknown Item",
              item.disposer_name || item.disposer || "Unknown",
              `${item.disposed_quantity || 0} ${item.disposed_unit || ""}`,
              item.reason === "Other" || item.reason_name === "Other"
                ? `Other - ${item.other_reason || ""}`
                : item.reason_name || item.reason || "Unknown",
            ];
          })}
        />
      )}
    </div>
  );
};

export default StockOut;
