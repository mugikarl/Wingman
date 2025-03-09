import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import NewMenuModal from "../../components/popups/NewMenuModal";
import EditMenuModal from "../../components/popups/EditMenuModal"; // Import the EditMenuModal
import ItemBox from "../../components/tables/ItemBox"; // Import the updated ItemBox

const Menu = () => {
  const role = localStorage.getItem("role");

  // State to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // State to store menu items, categories, and types
  const [menuItems, setMenuItems] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuTypes, setMenuTypes] = useState([]);
  const [units, setUnits] = useState([]);

  // Fetch menus when the component mounts
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
      setCategories(response.data.menu_categories || []);
      setMenuTypes(response.data.menu_types || []);
      setUnits(response.data.units || []);
      setItems(response.data.items || []);
      setMenuItems(response.data.menus || []);
      console.log("Fetched menu items:", response.data.menus);
    } catch (error) {
      console.error("Error fetching menus:", error);
    }
  };

  useEffect(() => {
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

  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      {/* Side Buttons with Image and Text (Moved Above Search Bar) */}
      <div className="flex space-x-4 mb-4">
        {/* Inventory Button */}
        <Link to="/inventory">
          <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
            <div className="flex items-center justify-center bg-[#D87A03] p-3">
              <img
                src="/images/stockout/trolley.png"
                alt="New Product"
                className="w-6 h-6"
              />
            </div>
            <span className="flex-1 text-left pl-3">Inventory</span>
          </button>
        </Link>

        {/* Items Button (Admin Only) */}
        {role === "Admin" && (
          <Link to="/dashboard-admin/items">
            <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
              <div className="flex items-center justify-center bg-[#D87A03] p-3">
                <img
                  src="/images/stockout/menu.png"
                  alt="Menu"
                  className="w-6 h-6"
                />
              </div>
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
            <div className="flex items-center justify-center bg-[#009E2A] p-3">
              <img
                src="/images/stockout/stock.png"
                alt="Stock In"
                className="w-6 h-6"
              />
            </div>
            <span className="flex-1 text-left pl-3">Stock In</span>
          </button>
        </Link>

        {/* Disposed Button */}
        <Link to="/stockout">
          <button className="flex items-center bg-gradient-to-r from-[#E60000] to-[#FF0000] text-white rounded-md shadow-md hover:from-[#CC0000] hover:to-[#E60000] transition-colors duration-200 w-48 overflow-hidden">
            <div className="flex items-center justify-center bg-[#E60000] p-3">
              <img
                src="/images/stockout/trash-can.png"
                alt="Disposed"
                className="w-6 h-6"
              />
            </div>
            <span className="flex-1 text-left pl-3">Disposed</span>
          </button>
        </Link>
      </div>

      <div className="flex justify-between items-start mb-2">
        <div className="w-[400px]">
          <input
            type="text"
            placeholder="Search "
            className="w-full p-2 border rounded-lg shadow"
          />
        </div>

        {/* New Menu Button */}
        <button
          className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-center justify-center bg-[#D87A03] p-3">
            <img
              src="/images/menu (2).png"
              alt="New Menu"
              className="w-6 h-6"
            />
          </div>
          <span className="text-left pl-3">New Menu</span>
        </button>
      </div>

      {/* Grid Layout for Menu Items */}
      <div className="grid grid-cols-6 gap-y-5 pt-1">
        {menuItems.map((item) => (
          <ItemBox
            key={item.id}
            item={item}
            image={item.image || "/placeholder.svg"}
            name={item.name}
            price={item.price}
            currency="₱"
            inStock={item.status_id}
            onClick={() => {
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
          fetchMenus={fetchMenus}
        />
      )}

      {/* Edit Menu Modal */}
      {isEditModalOpen && (
        <EditMenuModal
          item={selectedItem}
          onClose={() => setIsEditModalOpen(false)}
          onSave={updateMenuItem}
          categories={categories}
          menuTypes={menuTypes}
          items={items}
          units={units}
          fetchMenus={fetchMenus}
        />
      )}
    </div>
  );
};

export default Menu;
