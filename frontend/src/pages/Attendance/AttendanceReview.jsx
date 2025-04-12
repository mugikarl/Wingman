import React, { useState, useEffect } from "react";
import LoadingScreen from "../../components/popups/LoadingScreen";
import TableWithDatePicker from "../../components/tables/TablewithDatePicker";

const getLocalDateString = (date) => {
  return date.toLocaleDateString("en-CA");
};

const AttendanceReview = ({ attendanceData, refreshAttendance }) => {
  const [loading, setLoading] = useState(true);

  // Format time for display
  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle date change from TableWithDatePicker
  const handleDateChange = (newDate) => {
    setLoading(true);
    refreshAttendance(newDate)
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  };

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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 mx-auto">
      <TableWithDatePicker
        columns={["ID", "Name", "Attendance Status", "Time In", "Time Out"]}
        data={tableData}
        onDateChange={handleDateChange}
        customTheme={{
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
        }}
        emptyMessage="No attendance data available"
      />
    </div>
  );
};

export default AttendanceReview;
