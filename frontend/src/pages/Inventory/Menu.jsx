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
          
        </div>

        {/* Disposed Button */}
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
          <span className="flex-1 text-left pl-3">New Menu</span>
        </button>

      </div>

      {/* Order, Foodpanda, Grab Buttons */}
      <div className="flex space-x-6 mb-8">
        {/* Order Button (Red) */}
        <Link to="/dashboard-admin/menu">
          <button className="flex items-center justify-center bg-[#FF0000] text-white py-3 px-6 rounded-lg shadow-lg min-w-[180px] text-lg font-bold">
            Order
          </button>
        </Link>

        {/* Foodpanda Button (Pink with Custom Font) */}
        <Link to="/dashboard-admin/fpmenu">
          <button className="flex items-center justify-center bg-[#D70F64] text-white py-3 px-6 rounded-lg shadow-lg min-w-[180px] text-lg font-['Poppins'] font-bold">
            Foodpanda
          </button>
        </Link>

        {/* Grab Button (Green with Custom Font) */}
        <Link to="/dashboard-admin/fpmenu">
          <button className="flex items-center justify-center bg-[#00A650] text-white py-3 px-6 rounded-lg shadow-lg min-w-[180px] text-lg font-['Montserrat'] font-bold">
            Grab
          </button>
        </Link>
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