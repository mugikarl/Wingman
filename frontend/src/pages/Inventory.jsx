import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import NewItem from "../components/popups/NewItem";
import Table from "../components/tables/Table";
import axios from "axios";
import DisposedInventory from "../components/popups/DisposedInventory";

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState([]); // State to hold inventory data
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); // State to track selected item for editing
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reason, setReason] = useState([]);
  const [isDisposedModalOpen, setIsDisposedModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // State to track search query

  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const openDisposedModal = (item) => {
    console.log("Row clicked:", item);
    setSelectedInventory(item);
    setIsDisposedModalOpen(true);
  };

  // Fetch inventory data from the API
  const fetchInventoryData = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-item-data/"
      ); // Adjust to your actual API endpoint
      setInventoryData(response.data.inventory); // Store formatted inventory data in state
      setUnits(response.data.units || []); // Store units
      setCategories(response.data.categories || []); // Store categories
      setEmployees(response.data.employees || []); // Store employees
      setReason(response.data.disposalreason || []); // Store reason of disposal
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Filter inventory data based on search query
  const filteredInventoryData = inventoryData.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) || // Search by name
      item.id.toString().includes(searchLower) || // Search by ID
      (categories.find((c) => c.id === item.category)?.name || "")
        .toLowerCase()
        .includes(searchLower) // Search by category
    );
  });

  return (
    <div className="flex-grow p-6 bg-[#E2D6D5] min-h-full">
      {/* Main Content */}

      <div className="flex flex-col space-y-4 mb-4">
        {/* Side Buttons with Image and Text (Moved Above Search Bar) */}
        <div className="flex space-x-4 overflow-x-auto">
          {/* Inventory Button */}
          <Link to="/inventory">
            <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
              {/* Darker Left Section for Icon */}
              <div className="flex items-center justify-center bg-[#D87A03] p-3">
                <img
                  src="/images/stockout/trolley.png"
                  alt="New Product"
                  className="w-6 h-6"
                />
              </div>
              {/* Text Aligned Left in Normal Color Section */}
              <span className="flex-1 text-left pl-3">Inventory</span>
            </button>
          </Link>

          {/* Items Button (Admin Only) */}
          {role === "Admin" && (
            <Link to="/dashboard-admin/items">
              <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
                {/* Darker Left Section for Icon */}
                <div className="flex items-center justify-center bg-[#D87A03] p-3">
                  <img
                    src="/images/stockout/menu.png"
                    alt="Menu"
                    className="w-6 h-6"
                  />
                </div>
                {/* Text Aligned Left in Normal Color Section */}
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
                    alt="Stock In"
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
              {/* Darker Left Section for Icon */}
              <div className="flex items-center justify-center bg-[#009E2A] p-3">
                <img
                  src="/images/stockout/stock.png"
                  alt="Stock In"
                  className="w-6 h-6"
                />
              </div>
              {/* Text Aligned Left in Normal Color Section */}
              <span className="flex-1 text-left pl-3">Stock In</span>
            </button>
          </Link>

          {/* Disposed Button */}
          <Link to="/stockout">
            <button className="flex items-center bg-gradient-to-r from-[#E60000] to-[#FF0000] text-white rounded-md shadow-md hover:from-[#CC0000] hover:to-[#E60000] transition-colors duration-200 w-48 overflow-hidden">
              {/* Darker Left Section for Icon */}
              <div className="flex items-center justify-center bg-[#E60000] p-3">
                <img
                  src="/images/stockout/trash-can.png"
                  alt="Disposed"
                  className="w-6 h-6"
                />
              </div>
              {/* Text Aligned Left in Normal Color Section */}
              <span className="flex-1 text-left pl-3">Disposed</span>
            </button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex mb-4 w-[400px]">
          <input
            type="text"
            placeholder="Search..."
            className="flex-grow p-2 border rounded-lg shadow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query state
          />
        </div>

        {/* Scrollable Buttons */}
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
