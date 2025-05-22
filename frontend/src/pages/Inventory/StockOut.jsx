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

      // Process the data to normalize it and remove duplicate fields
      const processedData = (response.data.disposed_inventory || []).map(
        (item) => ({
          id: item.id,
          inventory_id: item.inventory_id,
          item_name: item.item_name || "Unknown Item",
          disposed_quantity: item.disposed_quantity || 0,
          disposed_unit: item.disposed_unit || "",
          reason: item.reason_name || item.reason || "Unknown",
          disposer: item.disposer_name || item.disposer || "Unknown",
          disposal_datetime: item.disposal_datetime,
          other_reason: item.other_reason || "",
        })
      );

      console.log("Processed StockOut data:", processedData[0]);
      setDisposedInventory(processedData);
    } catch (error) {
      console.error("Error fetching disposed inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter disposed items based on the selected date
  const filteredDisposedData = disposedInventory.filter((item) => {
    if (!item.disposal_datetime) return false;

    const itemDate = new Date(item.disposal_datetime).toLocaleDateString(
      "en-CA"
    );
    return itemDate === selectedDate.toLocaleDateString("en-CA");
  });

  // Log the first filtered item for debugging
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
            item.item_name,
            item.disposer,
            `${item.disposed_quantity} ${item.disposed_unit}`,
            item.reason === "Other"
              ? `Other - ${item.other_reason}`
              : item.reason,
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
