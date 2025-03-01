import React, { useState } from "react";
import { Link } from "react-router-dom";
import NewMenuModal from "../../components/popups/NewMenuModal"; // Import the NewMenuModal
import EditMenuModal from "../../components/popups/EditMenuModal"; // Import the EditMenuModal

const FPMenu = () => {
  // Dummy function for handling item clicks
  const handleAddItem = (item) => {
    console.log("Item added:", item);
  };

  // State for percentage deduction
  const [percentage, setPercentage] = useState("10"); // Default value
  const [isEditable, setIsEditable] = useState(false);

  // State to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // State to store menu items
  const [menuItems, setMenuItems] = useState([]);

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
      {/* Top Section */}
      <button
            onClick={() => (window.location.href = "/inventory")}
            className="bg-orange-500 text-white px-4 py-2 rounded w-60"
          >
            Return to Inventory
          </button>
          <div className="h-4"></div>
      <div className="flex justify-between items-start mb-8">
        {/* Left Section: Search Bar and Scrollable Buttons */}
        <div className="w-3/4">
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search items..."
              className="w-full p-2 border rounded-lg shadow"
            />
          </div>

          {/* Scrollable Buttons */}
          <div className="scrollable-buttons flex space-x-4 overflow-x-auto">
            <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm whitespace-nowrap">
              All
            </button>
            <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm whitespace-nowrap">
              Uni Wings
            </button>
            <button className="flex items-center justify-center bg-yellow-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm whitespace-nowrap">
              Add one
            </button>
            <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm whitespace-nowrap">
              Sandwiches
            </button>
            <button className="flex items-center justify-center bg-purple-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm whitespace-nowrap">
              Sizzlers
            </button>
            <button className="flex items-center justify-center bg-pink-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm whitespace-nowrap">
              Drinks
            </button>
            <button className="flex items-center justify-center bg-gray-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm whitespace-nowrap">
              New Menu
            </button>
          </div>
        </div>

        {/* Disposed Button */}
        <button
          className="flex flex-col items-center bg-[#209528] p-4 rounded-lg shadow"
          onClick={() => setIsModalOpen(true)}
        >
          <img
            src="/images/stockout/trash.png"
            alt="Disposed"
            className="w-32 h-14 mb-2"
          />
          <span className="text-white font-bold">New Menu</span>
        </button>
      </div>

      {/* Order, Foodpanda, Grab Buttons and Percentage Deduction Section */}
      <div className="flex justify-between items-center mb-8">
        {/* Order, Foodpanda, Grab Buttons */}
        <div className="flex space-x-4">
          <Link to="/dashboard-admin/menu">
            <button className="flex items-center justify-center bg-[#FF0000] text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
              Order
            </button>
          </Link>
          <button className="flex items-center justify-center bg-[#FF0000] text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Foodpanda
          </button>
          <Link to="/dashboard-admin/grabmenu">
            <button className="flex items-center justify-center bg-[#FF0000] text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
              Grab
            </button>
          </Link>
        </div>

        {/* Percentage Deduction Section */}
        <div className="flex items-center space-x-4">
          {/* Percentage Deduction Label */}
          <span className="text-base font-medium">Percentage Deduction</span>

          {/* Textbox with % Label */}
          <div className="flex items-center border rounded-lg shadow">
            <input
              type="text"
              value={percentage}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,2}$/.test(value)) {
                  setPercentage(value);
                }
              }}
              disabled={!isEditable}
              className="p-2 w-12 text-center border-none rounded-l-lg focus:outline-none"
            />
            <span className="p-2 bg-gray-100 rounded-r-lg">%</span>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditable(!isEditable)}
            className="flex items-center justify-center bg-[#FF0000] text-white p-2 rounded-lg shadow min-w-[15%] text-sm"
          >
            {isEditable ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      {/* Grid Layout for Images */}
      <div className="grid grid-cols-5 gap-4 h-[calc(100vh-200px)] overflow-y-auto scrollbar scrollbar-thumb-gray-400 scrollbar-track-gray-200 scrollbar-thin">
        {menuItems.map((item, index) => (
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

export default FPMenu;