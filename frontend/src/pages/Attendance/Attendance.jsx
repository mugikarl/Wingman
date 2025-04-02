import React, { useState, useEffect, useCallback } from "react";
import AttendanceSheet from "../../components/tables/AttendanceSheet";
import TimeIn from "../../components/popups/TimeIn";
import TimeOut from "../../components/popups/TimeOut";
import AttendanceReview from "./AttendanceReview";
import LoadingScreen from "../../components/popups/LoadingScreen";
import axios from "axios";

const Attendance = () => {
  const [isTimeInModalOpen, setIsTimeInModalOpen] = useState(false);
  const [isTimeOutModalOpen, setIsTimeOutModalOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  // Use a cache to store fetched data by date
  const [attendanceCache, setAttendanceCache] = useState({});

  // Improved fetch function with caching using useCallback to prevent recreating on every render
  const fetchAttendanceData = useCallback(
    async (date = null) => {
      const targetDate = date || currentDate;

      // Check if we already have cached data for this date
      if (attendanceCache[targetDate]) {
        setAttendanceData(attendanceCache[targetDate]);
        setLoading(false);
        return attendanceCache[targetDate];
      }

      // If not in cache, show loading and fetch
      setLoading(true);
      let url = "http://127.0.0.1:8000/fetch-attendance-data/";

      if (targetDate) {
        url += `?date=${targetDate}`;
        setCurrentDate(targetDate);
      }

      try {
        console.log(`Fetching attendance data for date: ${targetDate}`);
        const response = await axios.get(url);
        const fetchedData = response.data;

        // Update the cache with the new data
        setAttendanceCache((prev) => ({
          ...prev,
          [targetDate]: fetchedData,
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
    [currentDate, attendanceCache]
  );

  // Fetch initial data only once when the component mounts
  useEffect(() => {
    fetchAttendanceData(currentDate);
  }, []);

  // Event handlers for modals
  const handleTimeInSuccess = useCallback(() => {
    // Clear cache for current date and refetch
    setAttendanceCache((prev) => {
      const newCache = { ...prev };
      delete newCache[currentDate];
      return newCache;
    });
    fetchAttendanceData(currentDate);
    setIsTimeInModalOpen(false);
  }, [currentDate, fetchAttendanceData]);

  const handleTimeOutSuccess = useCallback(() => {
    // Clear cache for current date and refetch
    setAttendanceCache((prev) => {
      const newCache = { ...prev };
      delete newCache[currentDate];
      return newCache;
    });
    fetchAttendanceData(currentDate);
    setIsTimeOutModalOpen(false);
  }, [currentDate, fetchAttendanceData]);

  return (
    <div className="flex-grow p-6 bg-[#E2D6D5] min-h-full">
      <div className="flex items-start mb-4 space-x-4">
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
            <LoadingScreen />
          </div>
        ) : (
          <AttendanceReview
            attendanceData={attendanceData}
            refreshAttendance={fetchAttendanceData}
            initialDate={currentDate}
            loading={loading}
          />
        )}
      </div>

      {/* Show modals when respective states are true */}
      {isTimeInModalOpen && (
        <TimeIn
          refreshAttendance={handleTimeInSuccess}
          closeModal={() => setIsTimeInModalOpen(false)}
        />
      )}
      {isTimeOutModalOpen && (
        <TimeOut
          refreshAttendance={handleTimeOutSuccess}
          closeModal={() => setIsTimeOutModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Attendance;
