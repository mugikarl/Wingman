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

  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const openDisposedModal = (item) => {
    console.log("Row clicked:", item);
    setSelectedInventory(item);
    setIsDisposedModalOpen(true);
  };

  // Fetch inventory data from the API
  useEffect(() => {
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

    fetchInventoryData();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#E2D6D5] flex">
      {/* Main Content */}
      <div className="flex-grow p-6">
        {/* Top Section */}
        <div className="flex flex-col space-y-4 mb-4">
          {/* Side Buttons with Image and Text (Moved Above Search Bar) */}
          <div className="flex space-x-4">
            <Link to="/inventory">
              <button className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
                <img
                  src="/images/stockout/cart.png"
                  alt="New Product"
                  className="w-8 h-8 mr-2"
                />
                <span className="text-white">Inventory</span>
              </button>
            </Link>
            {/* Other Buttons */}
            {role === "Admin" && (
              <Link to="/dashboard-admin/items">
                <button className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
                  <img
                    src="/images/stockout/menu.png"
                    alt="Menu"
                    className="w-8 h-8 mr-2"
                  />
                  <span className="text-white">Items</span>
                </button>
              </Link>
            )}
            <Link to="/stockin">
              <button className="flex items-center bg-[#00BA34] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
                <img
                  src="/images/stockout/stock.png"
                  alt="Stock In"
                  className="w-8 h-8 mr-2"
                />
                <span className="text-white">Stock In</span>
              </button>
            </Link>

            {/* Conditionally render the Menu button only for Admin */}
            {role === "Admin" && (
              <Link to="/dashboard-admin/menu">
                <button className="flex items-center bg-[#00BA34] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
                  <img
                    src="/images/stockout/stock.png"
                    alt="Stock In"
                    className="w-8 h-8 mr-2"
                  />
                  <span className="text-white">Menu</span>
                </button>
              </Link>
            )}

            <Link to="/stockout">
              <button className="flex items-center bg-[#FF0000] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
                <img
                  src="/images/stockout/trash.png"
                  alt="Disposed"
                  className="w-8 h-8 mr-2"
                />
                <span className="text-white">Disposed</span>
              </button>
            </Link>
          </div>

          {/* Search Bar and Scrollable Buttons */}
          <div className="w-full">
            {/* Search Bar */}
            <div className="flex items-center space-x-2 mb-4 w-1/2">
              <input
                type="text"
                placeholder="Search..."
                className="flex-grow p-2 border rounded-lg shadow"
              />
            </div>

            {/* Scrollable Buttons */}
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
              <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[12%]">
                Button
              </button>
              <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[12%]">
                Button 2
              </button>
              <button className="flex items-center justify-center bg-yellow-500 text-white p-2 rounded-lg shadow min-w-[11%]">
                Button 3
              </button>
              <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[11%]">
                Button 4
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={["ID", "NAME", "UNIT", "CATEGORY", "QUANTITY"]}
          data={
            loading
              ? [["", "", "Loading...", "", ""]]
              : inventoryData.map((item) => {
                  // Find the corresponding unit symbol
                  const unit = units.find((u) => u.id === item.measurement);
                  // Find the corresponding category name
                  const category = categories.find(
                    (c) => c.id === item.category
                  );

                  return [
                    item.id,
                    item.name,
                    unit ? unit.symbol : "", // Display unit symbol if found
                    category ? category.name : "", // Display category name if found
                    item.quantity,
                  ];
                })
          }
          rowOnClick={(rowIndex) => openDisposedModal(inventoryData[rowIndex])}
        />

        {/* Disposed Inventory Modal */}
        <DisposedInventory
          isOpen={isDisposedModalOpen}
          closeModal={() => setIsDisposedModalOpen(false)}
          selectedInventory={selectedInventory}
          employees={employees}
          units={units}
          reason={reason}
        />
      </div>
    </div>
  );
};

export default Inventory;
