import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Table from "../components/tables/Table";
import axios from "axios";
import DisposedInventory from "../components/popups/DisposedInventory";
import LoadingScreen from "../components/popups/LoadingScreen";
import ManageItems from "../components/popups/ManageItems";
import { PiMagnifyingGlass, PiBasket } from "react-icons/pi";

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

  // Added states for ManageItems modal
  const [isManageItemsOpen, setIsManageItemsOpen] = useState(false);
  const [items, setItems] = useState([]);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "Admin");
  }, []);

  const openDisposedModal = (item) => {
    console.log("Row clicked:", item);
    setSelectedInventory(item);
    setIsDisposedModalOpen(true);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Combined function to fetch both inventory and items data
  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // Fetch data from the combined endpoint
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-inventory-page-data/"
      );

      // Set all the state variables from a single API response
      setInventoryData(response.data.inventory || []);
      setUnits(response.data.units || []);
      setCategories(response.data.categories || []);
      setEmployees(response.data.employees || []);
      setReason(response.data.disposalreason || []);
      setItems(response.data.items || []); // Items data now comes from the same endpoint

      console.log("Data fetched successfully:", {
        inventory: response.data.inventory?.length || 0,
        units: response.data.units?.length || 0,
        categories: response.data.categories?.length || 0,
        items: response.data.items?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Renamed from fetchInventoryData to fetchData
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
    <div className="flex-grow p-6 bg-[#fcf4dc] min-h-full">
      <div className="flex flex-col space-y-4 mb-4">
        {/* Search Bar */}
        <div className="flex w-[400px]">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <PiMagnifyingGlass className="w-5 h-5 text-gray-500" />
            </div>
            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
              <span className="text-gray-400">|</span>
            </div>
            <input
              type="text"
              placeholder="Search by item name or category..."
              className="w-full pl-14 p-2 border rounded-lg shadow"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Action Buttons - Added from Items.jsx */}
        {isAdmin && (
          <div className="w-full">
            <div className="flex justify-start gap-x-2 items-center w-full">
              {/* Manage Items Button */}
              <button
                onClick={() => setIsManageItemsOpen(true)}
                className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
              >
                <div className="flex items-center justify-center border-r p-3">
                  <PiBasket className="w-5 h-5 text-[#CC5500]" />
                </div>
                <span className="flex-1 text-left pl-3">Manage Items</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Show search results info if searching */}
      {searchQuery && (
        <div className="mb-2 text-sm text-gray-600">
          Showing {filteredInventoryData.length} of {inventoryData.length} items
          for "{searchQuery}"
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="w-full flex justify-center items-center">
          <LoadingScreen message="Loading inventory" />
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

      {/* ManageItems Modal - Updated to pass items */}
      <ManageItems
        isOpen={isManageItemsOpen}
        onClose={() => setIsManageItemsOpen(false)}
        categories={categories}
        units={units}
        fetchItemData={fetchInventoryData}
        items={items}
      />
    </div>
  );
};

export default Inventory;
