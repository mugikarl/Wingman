import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  // Redirect admin to the dashboard-admin route
  // useEffect(() => {
  //   if (role === "Admin") {
  //     navigate("/dashboard-admin/items", { replace: true });
  //   }
  // }, [role, navigate]);

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
          <div className="w-full">
            <div className="flex justify-between items-center w-full space-x-4">
              <div className="flex w-[400px]">
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-grow p-2 border rounded-lg shadow"
                />
              </div>
              <div className="">
                <button
                  onClick={openModal}
                  className="flex items-center bg-gradient-to-r from-[#1c4686] to-[#2a5ca7] text-white rounded-md shadow-md hover:from-[#163a6f] hover:to-[#1c4686] transition-colors duration-200 w-48 overflow-hidden"
                >
                  {/* Darker Left Section for Icon */}
                  <div className="flex items-center justify-center bg-[#1c4686] p-3">
                    <img
                      src="/images/groceries.png"
                      alt="New Item"
                      className="w-6 h-6"
                    />
                  </div>
                  {/* Text Aligned Left in Normal Color Section */}
                  <span className="flex-1 text-left pl-3">New Item</span>
                </button>
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="flex justify-between items-center w-full">
              <div className="flex space-x-4">
                <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[12%]">
                  Meat
                </button>
                <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[12%]">
                  Beverages
                </button>
                <button className="flex items-center justify-center bg-yellow-500 text-white p-2 rounded-lg shadow min-w-[11%]">
                  Spices
                </button>
                <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[11%]">
                  Blabla
                </button>
              </div>
              {/* New Category button */}
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center bg-gradient-to-r from-[#5930b2] to-[#6b3dcc] text-white rounded-md shadow-md hover:from-[#4a2699] hover:to-[#5930b2] transition-colors duration-200 w-48 overflow-hidden"
              >
                {/* Darker Left Section for Icon */}
                <div className="flex items-center justify-center bg-[#5930b2] p-3">
                  <img
                    src="/images/category.png"
                    alt="New Category"
                    className="w-6 h-6"
                  />
                </div>
                {/* Text Aligned Left in Normal Color Section */}
                <span className="flex-1 text-left pl-3">New Category</span>
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
              : items.map((item) => {
                  // Find the corresponding unit (measurement) and category for each item
                  const unit = units.find((u) => u.id === item.measurement);
                  const category = categories.find(
                    (c) => c.id === item.category
                  );

                  return [
                    item.id,
                    item.name,
                    unit ? unit.symbol : "", // Display the unit symbol
                    category ? category.name : "", // Display the category name
                    item.stock_trigger,
                  ];
                })
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
          categories={categories}
        />
      </div>
    </div>
  );
};

export default Items;
