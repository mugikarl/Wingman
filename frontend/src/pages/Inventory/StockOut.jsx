import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingScreen from "../../components/popups/LoadingScreen";
import TableWithDatePicker from "../../components/tables/TableWithDatePicker";

const StockOut = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
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

      console.log("StockOut data:", response.data);
      setDisposedInventory(response.data.disposed_inventory || []);
    } catch (error) {
      console.error("Error fetching disposed inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter disposed items based on the selected date.
  const filteredDisposedData = disposedInventory.filter((item) => {
    if (!item.disposal_datetime) return false;

    const itemDate = new Date(item.disposal_datetime).toLocaleDateString(
      "en-CA"
    );
    return itemDate === selectedDate.toLocaleDateString("en-CA");
  });

  useEffect(() => {
    if (filteredDisposedData.length > 0) {
      console.log("Filtered disposed data sample:", filteredDisposedData[0]);
    }
  }, [filteredDisposedData]);

  const handleDateChange = (newDate) => {
    setSelectedDate(new Date(newDate));
  };

  return (
    <div className="h-screen bg-[#fcf4dc] flex flex-col p-6">
      {loading ? (
        <div className="w-full flex justify-center items-center">
          <LoadingScreen message="Loading disposed items" />
        </div>
      ) : (
        <TableWithDatePicker
          columns={["ITEM NAME", "DISPOSER", "DISPOSED", "REASON"]}
          data={filteredDisposedData.map((item) => [
            item.item_name || "Unknown Item",
            item.disposer_name || item.disposer || "Unknown",
            `${item.disposed_quantity || 0} ${item.disposed_unit || ""}`,
            item.reason === "Other" || item.reason_name === "Other"
              ? `Other - ${item.other_reason || ""}`
              : item.reason_name || item.reason || "Unknown",
          ])}
          initialDate={selectedDate}
          onDateChange={handleDateChange}
          maxHeight="calc(100vh - 140px)"
          emptyMessage={
            disposedInventory.length > 0
              ? "No Disposed Items for Today."
              : "No Data Available"
          }
          sortableColumns={[0, 1]}
        />
      )}
    </div>
  );
};

export default StockOut;
