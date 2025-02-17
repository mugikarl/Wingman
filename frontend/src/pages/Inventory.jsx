import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NewItem from "../components/popups/NewItem";
import Table from "../components/tables/Table";
import axios from "axios";

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Fetch inventory data from the backend API
  const fetchInventoryData = async () => {
    try {
      const token = localStorage.getItem("access_token"); // Assuming you're using localStorage for the token
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-item-data/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setInventoryItems(response.data.items); // ✅ Correctly access inventory
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a loader component
  }

  return (
    <div className="min-h-screen w-full bg-[#E2D6D5] flex">
      {/* Main Content */}
      <div className="flex-grow p-6">
        {/* Top Section */}
        <div className="flex items-start mb-4 space-x-4">
          {/* Search Bar and Scrollable Buttons */}
          <div className="w-1/2">
            {/* Search Bar */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                placeholder="Search..."
                className="flex-grow p-2 border rounded-lg shadow"
              />
            </div>

            {/* Scrollable Buttons */}
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
              <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[25%]">
                Button 1
              </button>
              <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[25%]">
                Button 2
              </button>
              <button className="flex items-center justify-center bg-yellow-500 text-white p-2 rounded-lg shadow min-w-[25%]">
                Button 3
              </button>
              <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[25%]">
                Button 4
              </button>
            </div>
          </div>

          {/* Side Buttons with Image and Text */}
          <div className="w-1/2 grid grid-cols-4 gap-4">
            {/* New Item Button */}
            <button
              onClick={openModal}
              className="flex flex-col items-center justify-center bg-[#E88504] p-4 rounded-lg shadow hover:shadow-lg w-full h-28"
            >
              <img
                src="/images/stockout/cart.png"
                alt="New Item"
                className="w-10 h-10 mb-2"
              />
              <span className="text-white">New Item</span>
            </button>

            {/* Other Buttons */}
            <Link to="/menu">
              <button className="flex flex-col items-center justify-center bg-[#E88504] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img
                  src="/images/stockout/menu.png"
                  alt="Menu"
                  className="w-10 h-10 mb-2"
                />
                <span className="text-white">Menu</span>
              </button>
            </Link>

            <Link to="/stockin">
              <button className="flex flex-col items-center justify-center bg-[#00BA34] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img
                  src="/images/stockout/stock.png"
                  alt="Stock In"
                  className="w-10 h-10 mb-2"
                />
                <span className="text-white">Stock In</span>
              </button>
            </Link>

            <Link to="/disposeditems">
              <button className="flex flex-col items-center justify-center bg-[#FF0000] p-4 rounded-lg shadow hover:shadow-lg w-full h-28">
                <img
                  src="/images/stockout/trash.png"
                  alt="Disposed"
                  className="w-10 h-10 mb-2"
                />
                <span className="text-white">Disposed</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={["ID", "ITEM NAME", "UNIT", "CATEGORY"]}
          data={inventoryItems.map((item) => [
            item.id,
            item.name,
            item.measurement,
            item.category,
          ])}
        />

        {/* New Item Modal */}
        <NewItem
          isOpen={isModalOpen}
          closeModal={closeModal}
          fetchInventoryData={fetchInventoryData}
        />
      </div>
    </div>
  );
};

export default Inventory;
