import React, { useState, useEffect, useCallback } from "react";
import TimeIn from "../../components/popups/TimeIn";
import TimeOut from "../../components/popups/TimeOut";
import LoadingScreen from "../../components/popups/LoadingScreen";
import TableWithDatePicker from "../../components/tables/TablewithDatePicker";
import axios from "axios";
import { Datepicker } from "flowbite-react";
import { FaSortUp, FaSortDown } from "react-icons/fa";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

// Helper function to convert Date to YYYY-MM-DD string
const getLocalDateString = (date) => {
  return date.toLocaleDateString("en-CA");
};

const Attendance = () => {
  const [isTimeInModalOpen, setIsTimeInModalOpen] = useState(false);
  const [isTimeOutModalOpen, setIsTimeOutModalOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(
    getLocalDateString(new Date())
  );
  const [attendanceCache, setAttendanceCache] = useState({});
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Format time for display
  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Display the selected date in a human-friendly format
  const displayDate = new Date(currentDate).toDateString();

  // Functions to decrement or increment the selected date
  const decrementDate = () => {
    const dateObj = new Date(currentDate);
    dateObj.setDate(dateObj.getDate() - 1);
    const newDate = getLocalDateString(dateObj);
    setCurrentDate(newDate);
    fetchAttendanceData(newDate);
  };

  const incrementDate = () => {
    const dateObj = new Date(currentDate);
    dateObj.setDate(dateObj.getDate() + 1);
    const newDate = getLocalDateString(dateObj);
    setCurrentDate(newDate);
    fetchAttendanceData(newDate);
  };

  // Fetch attendance data with caching
  const fetchAttendanceData = useCallback(
    async (date, bypassCache = false) => {
      if (!bypassCache && attendanceCache[date]) {
        setAttendanceData(attendanceCache[date]);
        setLoading(false);
        return attendanceCache[date];
      }

      setLoading(true);
      const url = `http://127.0.0.1:8000/fetch-attendance-data/?date=${date}`;

      try {
        const response = await axios.get(url);
        const fetchedData = response.data;

        setAttendanceCache((prev) => ({
          ...prev,
          [date]: fetchedData,
        }));

        setAttendanceData(fetchedData);
        return fetchedData;
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [attendanceCache]
  );

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

  // Load initial data once
  useEffect(() => {
    fetchAttendanceData(currentDate);
  }, []);

  // Event handlers
  const handleTimeInSuccess = useCallback(() => {
    setAttendanceCache((prev) => {
      const newCache = { ...prev };
      delete newCache[currentDate];
      return newCache;
    });

    // Force non-cached fetch by passing null to the cache check
    fetchAttendanceData(currentDate).then(() => {
      // Only close modal after data is fetched
      setIsTimeInModalOpen(false);
    });
  }, [currentDate, fetchAttendanceData]);

  const handleTimeOutSuccess = useCallback(() => {
    setAttendanceCache((prev) => {
      const newCache = { ...prev };
      delete newCache[currentDate];
      return newCache;
    });

    // Force non-cached fetch by passing null to the cache check
    fetchAttendanceData(currentDate).then(() => {
      // Only close modal after data is fetched
      setIsTimeOutModalOpen(false);
    });
  }, [currentDate, fetchAttendanceData]);

  // Prepare table data
  const tableData = attendanceData
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((entry) => [
      entry.id,
      entry.name,
      entry.attendanceStatus,
      formatTime(entry.timeIn),
      formatTime(entry.timeOut),
    ]);

  // Sort data if sort config exists
  const sortedData = React.useMemo(() => {
    let sortableData = [...tableData];
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
  }, [tableData, sortConfig]);

  // Custom theme for the date picker
  const datepickerTheme = {
    popup: {
      root: {
        inner:
          "inline-block rounded-lg bg-white p-4 shadow-lg dark:bg-yellow-200",
      },
    },
    views: {
      days: {
        items: {
          item: {
            selected: "bg-[#c27100] text-white hover:bg-[#a95a00]",
          },
        },
      },
    },
  };

  // Force refresh function for the attendance data
  const forceRefresh = useCallback(() => {
    // Clear cache for current date
    setAttendanceCache((prev) => {
      const newCache = { ...prev };
      delete newCache[currentDate];
      return newCache;
    });

    // Set loading to true to show loading indicator
    setLoading(true);

    // Fetch fresh data from server without using cache
    const url = `http://127.0.0.1:8000/fetch-attendance-data/?date=${currentDate}`;
    axios
      .get(url)
      .then((response) => {
        const fetchedData = response.data;
        setAttendanceData(fetchedData);

        // Update cache with new data
        setAttendanceCache((prev) => ({
          ...prev,
          [currentDate]: fetchedData,
        }));
      })
      .catch((error) => {
        console.error("Error refreshing attendance data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentDate]);

  // Handle date change from the TableWithDatePicker component
  const handleDateChange = useCallback(
    (newDate) => {
      setCurrentDate(newDate);
      fetchAttendanceData(newDate);
    },
    [fetchAttendanceData]
  );

  // Table columns
  const columns = ["ID", "Name", "Attendance Status", "Time In", "Time Out"];

  return (
    <div className="flex-grow p-6 bg-[#fcf4dc] min-h-full">
      <div className="">
        <div className="flex items-start mb-4 gap-2">
          <button
            onClick={() => setIsTimeInModalOpen(true)}
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-[#CC5500]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <span className="flex-1 text-left pl-3">Time In</span>
          </button>
          <button
            onClick={() => setIsTimeOutModalOpen(true)}
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-[#CC5500]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <span className="flex-1 text-left pl-3">Time Out</span>
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <LoadingScreen message="Loading attendance" />
            </div>
          ) : (
            <TableWithDatePicker
              columns={columns}
              data={tableData}
              initialDate={new Date(currentDate)}
              onDateChange={handleDateChange}
              emptyMessage="No attendance data available"
              maxHeight="700px"
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {isTimeInModalOpen && (
        <TimeIn
          forceRefresh={forceRefresh}
          closeModal={() => setIsTimeInModalOpen(false)}
          currentDate={currentDate}
        />
      )}
      {isTimeOutModalOpen && (
        <TimeOut
          forceRefresh={forceRefresh}
          closeModal={() => setIsTimeOutModalOpen(false)}
          currentDate={currentDate}
        />
      )}
    </div>
  );
};

export default Attendance;
