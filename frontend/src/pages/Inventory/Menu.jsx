import React, { useState } from "react";
import { Link } from "react-router-dom";
import NewMenuModal from "../../components/popups/NewMenuModal";
import EditMenuModal from "../../components/popups/EditMenuModal"; // Import the EditMenuModal

const Menu = () => {
  const role = localStorage.getItem("role")
  // Dummy function for handling item clicks
  const handleAddItem = (item) => {
    console.log("Item added:", item);
  };

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
        <div className="w-full h-32 flex items-center justify-center mb-2"> {/* 50% of h-64 */}
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
        <div className="flex space-x-4">
          <Link to="/inventory">
            <button
              className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]"
            >
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
            <Link to="/items">
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

      {/* Order, Foodpanda, Grab Buttons */}
      <div className="flex space-x-4 mb-8">
        <Link to="/dashboard-admin/menu">
          <button className="flex items-center justify-center bg-[#FF0000] text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Order
          </button>
        </Link>
        {/* <Link to="/dashboard-admin/fpmenu">
          <button className="flex items-center justify-center bg-[#FF0000] text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Foodpanda
          </button>
        </Link>
        <Link to="/dashboard-admin/grabmenu">
          <button className="flex items-center justify-center bg-[#FF0000] text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Grab
          </button>
        </Link> */}
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

export default Menu;