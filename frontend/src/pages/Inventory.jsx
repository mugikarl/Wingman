import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Table from "../components/tables/Table";
import axios from "axios";
import DisposedInventory from "../components/popups/DisposedInventory";

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

  const navigate = useNavigate();

  const openDisposedModal = (item) => {
    console.log("Row clicked:", item);
    setSelectedInventory(item);
    setIsDisposedModalOpen(true);
  };

  const fetchInventoryData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/fetch-item-data/");
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

  const filteredInventoryData = inventoryData.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.id.toString().includes(searchLower) ||
      (categories.find((c) => c.id === item.category)?.name || "")
        .toLowerCase()
        .includes(searchLower)
    );
  });

  return (
    <div className="flex-grow p-6 bg-[#E2D6D5] min-h-full">
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
      <Table
        columns={["NAME", "CATEGORY", "QUANTITY"]}
        data={
          loading
            ? [["", "Loading...", ""]]
            : filteredInventoryData.map((item) => {
                const unit = units.find((u) => u.id === item.measurement);
                const category = categories.find((c) => c.id === item.category);
                const quantityWithUnit = `${item.quantity} ${
                  unit ? unit.symbol : ""
                }`;

                return [
                  item.name,
                  category ? category.name : "",
                  quantityWithUnit,
                ];
              })
        }
        rowOnClick={(rowIndex) =>
          openDisposedModal(filteredInventoryData[rowIndex])
        }
      />

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