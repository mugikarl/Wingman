import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import NewMenuModal from "../../components/popups/NewMenuModal";
import EditMenuModal from "../../components/popups/EditMenuModal"; // Import the EditMenuModal

const Menu = () => {
  const role = localStorage.getItem("role");

  // State to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // State to store menu items, categories, and types
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuTypes, setMenuTypes] = useState([]);
  const [units, setUnits] = useState([]);

  // Fetch menus when the component mounts
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(
          "http://127.0.0.1:8000/fetch-item-data/", // Use the correct endpoint here
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setItems(response.data.items || []);
        setCategories(response.data.menu_categories || []);
        setMenuTypes(response.data.menu_types || []);
        setUnits(response.data.units || []);
      } catch (error) {
        console.error("Error fetching menus:", error);
      }
    };

    fetchMenus();
  }, []);

  // Function to add a new menu item
  const addMenuItem = (newItem) => {
    setMenuItems([...menuItems, newItem]);
  };

  // Function to update a menu item
  const updateMenuItem = (updatedItem) => {
    const updatedItems = menuItems.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
    setMenuItems(updatedItems);
  };

  // Dummy component for item boxes
  const ItemBox = ({ item, onClick }) => {
    return (
      <div
        className="bg-white shadow p-4 rounded-lg flex flex-col items-center cursor-pointer w-60 h-64"
        onClick={() => onClick(item)}
      >
        {/* Image (50% height of the ItemBox) */}
        <div className="w-full h-32 flex items-center justify-center mb-2">
          {" "}
          {/* 50% of h-64 */}
          <img
            src={item.image || "../../images/chicken.jpg"}
            alt={item.name}
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        {/* Text (Left-aligned) */}
        <div className="w-full text-left">
          <p className="text-base font-medium">{item.name}</p>
          <p className="text-sm text-gray-600">P{item.price}.00</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      {/* Side Buttons with Image and Text (Moved Above Search Bar) */}
      <div className="flex space-x-4 mb-4">
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
      <div className="flex justify-between items-start mb-2">
        {/* Left Section: Search Bar and Scrollable Buttons */}

        <div className="w-[400px]">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search "
            className="w-full p-2 border rounded-lg shadow"
          />
        </div>

        {/* Menu */}
        <button
          className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden"
          onClick={() => setIsModalOpen(true)}
        >
          {/* Darker Left Section for Icon */}
          <div className="flex items-center justify-center bg-[#D87A03] p-3">
            <img
              src="/images/menu (2).png" // Ensure correct image path
              alt="New Menu"
              className="w-6 h-6"
            />
          </div>
          {/* Text Aligned Left in Normal Color Section */}
          <span className="text-left pl-3">New Menu</span>
        </button>
      </div>

      {/* Order, Foodpanda, Grab Buttons */}
      <div className="flex space-x-4 mb-4">
        {/* Order Button (Red) */}
        <Link to="/dashboard-admin/menu">
          <button className="flex items-start justify-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white p-3 rounded-lg shadow-lg w-48">
            Order
          </button>
        </Link>

        {/* Foodpanda Button (Pink with Custom Font) */}
        <Link to="/dashboard-admin/fpmenu">
          <button className="flex items-center justify-center bg-[#D70F64] text-white p-3 rounded-lg shadow-lg w-48">
            Foodpanda
          </button>
        </Link>

        {/* Grab Button (Green with Custom Font) */}
        <Link to="/dashboard-admin/fpmenu">
          <button className="flex items-center justify-center bg-[#00A650] text-white p-3 rounded-lg shadow-lg w-48">
            Grab
          </button>
        </Link>
      </div>

      {/* Grid Layout for Images */}
      <div className="grid grid-cols-5 gap-4 h-[calc(100vh-200px)] overflow-y-auto scrollbar scrollbar-thumb-gray-400 scrollbar-track-gray-200 scrollbar-thin">
        {items.map((item, index) => (
          <ItemBox
            key={index}
            item={item}
            onClick={(item) => {
              setSelectedItem(item);
              setIsEditModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* New Menu Modal */}
      {isModalOpen && (
        <NewMenuModal
          onClose={() => setIsModalOpen(false)}
          onSave={addMenuItem}
          categories={categories}
          menuTypes={menuTypes}
          items={items}
          units={units}
        />
      )}

      {/* Edit Menu Modal */}
      {isEditModalOpen && (
        <EditMenuModal
          item={selectedItem}
          onClose={() => setIsEditModalOpen(false)}
          onSave={updateMenuItem}
        />
      )}
    </div>
  );
};

export default Menu;
