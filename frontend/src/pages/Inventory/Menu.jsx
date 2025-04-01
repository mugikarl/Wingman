import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import NewMenuModal from "../../components/popups/NewMenuModal";
import EditMenuModal from "../../components/popups/EditMenuModal"; // Import the EditMenuModal
import ItemBox from "../../components/tables/ItemBox"; // Import the updated ItemBox
import NewMenuCategory from "../../components/popups/NewMenuCategory";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

const Menu = () => {
  const role = localStorage.getItem("role");

  // Modal and dropdown states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMenuCategoryModalOpen, setIsMenuCategoryModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMenuType, setSelectedMenuType] = useState(null);

  // Data states
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [menuTypes, setMenuTypes] = useState([]);
  const [units, setUnits] = useState([]);

  // Add state for tracking availability update status
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const closeMenuCategoryModal = () => setIsMenuCategoryModalOpen(false);

  // Fetch menus when the component mounts
  const fetchMenus = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-item-data/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCategories(response.data.menu_categories || []);
      setStatuses(response.data.menu_statuses || []);
      setMenuTypes(response.data.menu_types || []);
      setUnits(response.data.units || []);
      setInventory(response.data.inventory || []);
      setMenuItems(response.data.menu_items || []);

      // Mark data as fully loaded only after all state is updated
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error fetching menus:", error);
    }
  };

  // Function to update menu availability
  const updateMenuAvailability = async () => {
    // Skip if data isn't loaded yet
    if (!isDataLoaded) return;

    try {
      setIsUpdatingAvailability(true);
      setAvailabilityMessage("Updating menu availability...");

      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://127.0.0.1:8000/update-menu-availability/",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update UI with results
      const updatedCount = response.data.updated_items?.length || 0;
      setAvailabilityMessage(
        updatedCount > 0
          ? `Updated availability for ${updatedCount} menu items`
          : "All menu items are up to date"
      );

      // Refresh menu items
      fetchMenus();
    } catch (error) {
      console.error("Error updating menu availability:", error);
      setAvailabilityMessage("Failed to update menu availability");
    } finally {
      setIsUpdatingAvailability(false);

      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setAvailabilityMessage("");
      }, 5000);
    }
  };

  // Separate effects for initial data fetch and availability updates
  useEffect(() => {
    fetchMenus();
  }, []);

  // Set up availability checking only after data is loaded
  useEffect(() => {
    let intervalId = null;

    // Only set up the interval if data is loaded
    if (isDataLoaded) {
      // Run once initially after data is loaded
      updateMenuAvailability();

      // Set up interval for subsequent checks every 2 minutes
      intervalId = setInterval(updateMenuAvailability, 2 * 60 * 1000);
    }

    // Clean up function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isDataLoaded]); // Only re-run when isDataLoaded changes

  // Set default filter to "In Store" once menuTypes are loaded
  useEffect(() => {
    if (menuTypes.length > 0 && !selectedMenuType) {
      const defaultType = menuTypes.find(
        (type) => type.name.toLowerCase() === "in store"
      );
      setSelectedMenuType(defaultType || menuTypes[0]);
    }
  }, [menuTypes, selectedMenuType]);

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

  // Filter the menu items based on the selected menu type
  const filteredMenuItems = selectedMenuType
    ? menuItems.filter((item) => item.type_id === selectedMenuType.id)
    : menuItems;

  // Handle filter selection
  const handleFilter = (type) => {
    setSelectedMenuType(type);
    setIsDropdownOpen(false);
  };

  // Helper to return unique button styles based on type id for the main filter button
  const getTypeButtonStyles = (type) => {
    switch (type.id) {
      case 1:
        return "bg-[#E88504] text-white";
      case 2:
        return "bg-green-500 text-white";
      case 3:
        return "bg-pink-500 text-white";
      default:
        return "bg-[#E88504] text-white";
    }
  };

  const getLeftContainerBg = (type) => {
    switch (type.id) {
      case 1:
        return "bg-[#D87A03]";
      case 2:
        return "bg-green-600";
      case 3:
        return "bg-pink-600";
      default:
        return "bg-[#D87A03]";
    }
  };

  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      {/* Top section with search and action buttons */}
      <div className="flex justify-between items-start mb-2">
        <div className="w-[400px]">
          <input
            type="text"
            placeholder="Search "
            className="w-full p-2 border rounded-lg shadow"
          />
        </div>
        <div className="flex gap-4">
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
          {/* New Category Button */}
          <button
            onClick={() => setIsMenuCategoryModalOpen(true)}
            className="flex items-center bg-gradient-to-r from-[#5930b2] to-[#6b3dcc] text-white rounded-md shadow-md hover:from-[#4a2699] hover:to-[#5930b2] transition-colors duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center bg-[#5930b2] p-3">
              <img
                src="/images/category.png"
                alt="New Category"
                className="w-6 h-6"
              />
            </div>
            <span className="flex-1 text-left pl-3">New Category</span>
          </button>

          {/* Add manual refresh button */}
          <button
            onClick={updateMenuAvailability}
            disabled={isUpdatingAvailability}
            className={`flex items-center bg-gradient-to-r from-[#3366cc] to-[#4477dd] text-white rounded-md shadow-md ${
              isUpdatingAvailability
                ? "opacity-70"
                : "hover:from-[#2255bb] hover:to-[#3366cc]"
            } transition-colors duration-200 w-48 overflow-hidden`}
          >
            <div className="flex items-center justify-center bg-[#3366cc] p-3">
              <img
                src="/images/refresh.png"
                alt="Update Availability"
                className="w-6 h-6"
              />
            </div>
            <span className="flex-1 text-left pl-3">
              {isUpdatingAvailability ? "Updating..." : "Update Availability"}
            </span>
          </button>
        </div>
      </div>

      {/* Status message */}
      {availabilityMessage && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 mb-4">
          <p>{availabilityMessage}</p>
        </div>
      )}

      {/* Filter Dropdown Button */}
      <div className="relative inline-block text-left mb-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center ${
            selectedMenuType
              ? getTypeButtonStyles(selectedMenuType)
              : "bg-gradient-to-r from-[#D87A03] to-[#E88504]"
          } rounded-md shadow-md hover:opacity-90 transition-colors duration-200 w-48 overflow-hidden`}
        >
          {/* Left Icon Container*/}
          <div
            className={`flex items-center justify-center ${
              selectedMenuType
                ? getLeftContainerBg(selectedMenuType)
                : "bg-[#D87A03]"
            } p-3`}
          >
            <img
              src="/images/stockout/menu.png"
              alt="Menu"
              className="w-6 h-6"
            />
          </div>
          {/* Text */}
          <span className="flex-1 text-left px-3 text-white">
            {selectedMenuType ? selectedMenuType.name : "Filter Items"}
          </span>

          {/* Arrow Icon */}
          <div className="flex items-center justify-center p-3">
            {isDropdownOpen ? (
              <FaChevronUp className="h-6 text-white" />
            ) : (
              <FaChevronDown className="h-6 text-white" />
            )}
          </div>
        </button>
        {isDropdownOpen && (
          <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg z-10">
            <div className="bg-white rounded-md py-2">
              {menuTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleFilter(type)}
                  className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid Layout for Filtered Menu Items */}
      <div className="grid grid-cols-5 gap-x-2 gap-y-4 pt-1">
        {filteredMenuItems.map((item) => (
          <ItemBox
            key={item.id}
            item={item}
            image={item.image || "/placeholder.svg"}
            name={item.name}
            price={item.price}
            currency="₱"
            status={item.status_id}
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
          inventory={inventory}
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
          inventory={inventory}
          units={units}
          fetchMenus={fetchMenus}
        />
      )}

      <NewMenuCategory
        isOpen={isMenuCategoryModalOpen}
        onClose={closeMenuCategoryModal}
        fetchItemData={fetchMenus}
        menuCategories={categories}
      />
    </div>
  );
};

export default Menu;
