import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Datepicker } from "flowbite-react";
import NewItem from "../../components/popups/NewItem";
import Table from "../../components/tables/Table";
import axios from "axios";
import EditItem from "../../components/popups/EditItem";
import NewCategory from "../../components/popups/NewCategory";

const Items = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState(null); // State to track selected item

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const closeCategoryModal = () => setIsCategoryModalOpen(false);


  const openEditModal = (item) => {
    setSelectedItem(item); // Set the selected item
    setIsEditModalOpen(true); // Open the edit modal
  };

  const closeEditModal = () => {
    setSelectedItem(null); // Clear the selected item
    setIsEditModalOpen(false); // Close the edit modal
  };
  // Fetch item data from the backend API
  const fetchItemData = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-item-data/"
      );
      setItems(response.data.items); // ✅ Correctly access items
      setCategories(response.data.categories || []);
      setUnits(response.data.units || []);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchItemData();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#E2D6D5] flex">
      <div className="flex-grow p-6">
        <div className="flex flex-col space-y-4 mb-4">
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
            <Link to="">
              <button className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
                <img
                  src="/images/stockout/menu.png"
                  alt="Menu"
                  className="w-8 h-8 mr-2"
                />
                <span className="text-white">Items</span>
              </button>
            </Link>
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
            <Link to="/disposeditems">
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
          <div className="w-full">
            <div className="flex items-center justify-between space-x-2 mb-4">
              <input
                type="text"
                placeholder="Search..."
                className="w-1/2 p-2 border rounded-lg shadow"
              />
              <button
                onClick={openModal}
                className="flex items-center bg-[#1c4686] p-2 rounded-lg shadow hover:shadow-lg min-w-[15%]"
              >
                <img
                  src="/images/stockout/trash.png"
                  alt="Disposed"
                  className="w-8 h-8 mr-2"
                />
                <span className="text-white">New Item</span>
              </button>
              
            </div>

            <div className="flex justify-between items-center w-full">
              <div className="flex space-x-4">
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
              {/* New Category button */}
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center bg-[#5930b2] p-2 rounded-lg shadow hover:shadow-lg min-w-[15%]"
              >
                <img
                  src="/images/stockout/trash.png"
                  alt="Disposed"
                  className="w-8 h-8 mr-2"
                />
                <span className="text-white">New Category</span>
              </button>
            </div>
          </div>
        </div>
        {/* Table */}
        <Table
          columns={["ID", "ITEM NAME", "UNIT", "CATEGORY", "STOCK TRIGGER"]}
          data={
            loading
              ? [["", "", "Loading...", "", ""]]
              : items.map((item) => [
                  item.id,
                  item.name,
                  item.measurement,
                  item.category,
                  item.stock_trigger
                ])
          }
          rowOnClick={(rowIndex) => openEditModal(items[rowIndex])} // Pass row click handler
        />

        {/* New Item Modal */}
        <NewItem
          isOpen={isModalOpen}
          closeModal={closeModal}
          fetchItemData={fetchItemData}
          categories={categories}
          units={units}
        />
        <EditItem
          isOpen={isEditModalOpen}
          closeModal={closeEditModal}
          item={selectedItem} // Pass the selected item
          fetchItemData={fetchItemData}
          units={units}
          categories={categories}
        />
        <NewCategory
           isOpen={isCategoryModalOpen}
           closeModal={closeCategoryModal}
           fetchItemData={fetchItemData}
           items={items} 
        />

        
      </div>
    </div>
  );
};

export default Items;