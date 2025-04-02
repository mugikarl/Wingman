import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Table from "../components/tables/Table";
import axios from "axios";
import DisposedInventory from "../components/popups/DisposedInventory";
import LoadingScreen from "../components/popups/LoadingScreen"; // Import the LoadingScreen component

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reason, setReason] = useState([]);
  const [isDisposedModalOpen, setIsDisposedModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const openDisposedModal = (item) => {
    console.log("Row clicked:", item);
    setSelectedInventory(item);
    setIsDisposedModalOpen(true);
  };

  const fetchInventoryData = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-inventory-page-data/"
      );
      setInventoryData(response.data.inventory);
      setUnits(response.data.units || []);
      setCategories(response.data.categories || []);
      setEmployees(response.data.employees || []);
      setReason(response.data.disposalreason || []);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const filteredInventoryData = inventoryData.filter((inventoryItem) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    // Access nested item data correctly
    const item = inventoryItem.item || {};
    const itemName = item.name || "";
    const itemId = (inventoryItem.id || "").toString();

    // Find category safely
    let categoryName = "";
    if (item.category) {
      const category = categories.find((c) => c.id === item.category);
      categoryName = category ? category.name : "";
    }

    return (
      itemName.toLowerCase().includes(searchLower) ||
      itemId.includes(searchLower) ||
      categoryName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex-grow p-6 bg-[#eeeeee] min-h-full">
      {/* Search Bar */}
      <div className="flex mb-4 w-[400px]">
        <input
          type="text"
          placeholder="Search..."
          className="flex-grow p-2 border rounded-lg shadow"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="w-full flex justify-center items-center">
          <LoadingScreen /> {/* Display the LoadingScreen component */}
        </div>
      ) : (
        <Table
          columns={["NAME", "CATEGORY", "QUANTITY"]}
          data={filteredInventoryData.map((inventoryItem) => {
            const item = inventoryItem.item || {};

            // Find unit and category
            const unit = units.find((u) => u.id === item.measurement);
            const category = categories.find((c) => c.id === item.category);

            const quantityWithUnit = `${inventoryItem.quantity || 0} ${
              unit ? unit.symbol : ""
            }`;

            return [
              item.name || "N/A",
              category ? category.name : "",
              quantityWithUnit,
            ];
          })}
          rowOnClick={(rowIndex) =>
            openDisposedModal(filteredInventoryData[rowIndex])
          }
        />
      )}

      {/* Disposed Inventory Modal */}
      <DisposedInventory
        isOpen={isDisposedModalOpen}
        closeModal={() => setIsDisposedModalOpen(false)}
        selectedInventory={selectedInventory}
        employees={employees}
        units={units}
        reason={reason}
        refreshInventory={fetchInventoryData}
      />
    </div>
  );
};

export default Inventory;
