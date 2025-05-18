import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import NewMenuModal from "../../components/popups/NewMenuModal";
import EditMenuModal from "../../components/popups/EditMenuModal";
import ItemBox from "../../components/tables/ItemBox";
import NewMenuCategory from "../../components/popups/NewMenuCategory";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import LoadingScreen from "../../components/popups/LoadingScreen";
import {
  PiBowlSteam,
  PiGridFour,
  PiBasket,
  PiMagnifyingGlass,
  PiArrowsClockwise,
} from "react-icons/pi";

const Menu = () => {
  const role = localStorage.getItem("role");

  // Modal and dropdown states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMenuCategoryModalOpen, setIsMenuCategoryModalOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [selectedMenuType, setSelectedMenuType] = useState(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingDots, setLoadingDots] = useState("");

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
  const [menuDataLoaded, setMenuDataLoaded] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Loading animation for dots
  useEffect(() => {
    let interval;
    if (isUpdatingAvailability) {
      let dotCount = 0;
      interval = setInterval(() => {
        setLoadingDots(".".repeat(dotCount % 4));
        dotCount++;
      }, 500);
    } else {
      setLoadingDots("");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isUpdatingAvailability]);

  const closeMenuCategoryModal = () => setIsMenuCategoryModalOpen(false);

  // Fetch menus when the component mounts
  const fetchMenus = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-menu-data/",
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

      // Mark menu data as loaded
      setMenuDataLoaded(true);
    } catch (error) {
      console.error("Error fetching menus:", error);
      // Still mark as loaded so we don't get stuck in loading state
      setMenuDataLoaded(true);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Function to update menu availability
  const updateMenuAvailability = async () => {
    if (isUpdatingAvailability) return; // Prevent multiple simultaneous updates

    try {
      setIsUpdatingAvailability(true);
      setAvailabilityMessage("");

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
      await fetchMenus();
      setAvailabilityChecked(true);
    } catch (error) {
      console.error("Error updating menu availability:", error);
      setAvailabilityMessage("Failed to update menu availability");
      setAvailabilityChecked(true); // Mark as checked even on error
    } finally {
      setIsUpdatingAvailability(false);

      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setAvailabilityMessage("");
      }, 5000);
    }
  };

  // Initial load of data and availability check
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await fetchMenus();
      await updateMenuAvailability();
      setLoading(false);
    };

    initialLoad();
  }, []);

  // Set default filter to "In Store" once menuTypes are loaded
  useEffect(() => {
    if (menuTypes.length > 0 && !selectedMenuType) {
      const inStoreType = menuTypes.find(
        (type) => type.name.toLowerCase() === "in store"
      );
      setSelectedMenuType(inStoreType || menuTypes[0]);
    }
  }, [menuTypes, selectedMenuType]);

  if (loading) {
    return <LoadingScreen message="Checking menu availability" />;
  }

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

  // Filter items based on selected type, category, and search query
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesType = selectedMenuType
      ? item.type_id === selectedMenuType.id
      : true;
    const matchesCategory =
      selectedMenuCategory && selectedMenuCategory.id !== 0
        ? item.category_id === selectedMenuCategory.id
        : true;
    const matchesSearch =
      !searchQuery ||
      (item.name &&
        item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesCategory && matchesSearch;
  });

  // Sort items so that available (status_id === 1) come first
  const sortedFilteredMenuItems = filteredMenuItems.slice().sort((a, b) => {
    if (a.status_id === 1 && b.status_id !== 1) return -1;
    if (a.status_id !== 1 && b.status_id === 1) return 1;
    return 0;
  });

  // Handle type filter button click
  const handleTypeFilter = (type) => {
    setSelectedMenuType(type);
  };

  return (
    <div className="h-screen bg-[#fcf4dc] flex flex-col p-6">
      {/* Fixed Header Section */}
      <div className="flex flex-col space-y-4">
        {/* Top section with search and action buttons */}
        <div className="flex justify-between items-start mb-2">
          {/* Search Bar - Updated to match OrderTable style */}
          <div className="w-[400px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <PiMagnifyingGlass className="w-5 h-5 text-gray-500" />
              </div>
              <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                <span className="text-gray-400">|</span>
              </div>
              <input
                type="text"
                placeholder="Search by menu items..."
                className="w-full pl-14 p-2 border rounded-lg shadow"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="flex gap-4">
            {/* New Menu Button */}
            <button
              className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="flex items-center justify-center border-r p-3">
                <PiBowlSteam className="w-5 h-5 text-[#CC5500]" />
              </div>
              <span className="flex-1 text-left pl-3">New Menu</span>
            </button>

            {/* New Category Button */}
            <button
              onClick={() => setIsMenuCategoryModalOpen(true)}
              className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
            >
              <div className="flex items-center justify-center border-r p-3">
                <PiGridFour className="w-5 h-5 text-[#CC5500]" />
              </div>
              <span className="flex-1 text-left pl-3">New Category</span>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col space-y-4 mb-4">
          {/* Menu Type Buttons */}
          <div className="flex gap-2">
            {menuTypes.map((type) => {
              let color = "bg-white hover:bg-gray-200";
              if (type.id === 1) {
                color = "bg-[#CC5500] hover:bg-[#B34A00]";
              } else if (type.id === 2) {
                color = "bg-green-500 hover:bg-green-600";
              } else if (type.id === 3) {
                color = "bg-pink-500 hover:bg-pink-600";
              }

              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeFilter(type)}
                  className={`px-3 py-1 rounded-md transition-colors w-28 text-center border border-gray-300 shadow-sm ${
                    selectedMenuType && selectedMenuType.id === type.id
                      ? `${color} text-white`
                      : "bg-white hover:bg-gray-200"
                  }`}
                >
                  {type.name}
                </button>
              );
            })}
          </div>

          {/* Category Dropdown and Update Availability Button */}
          <div className="relative text-left flex justify-between items-center">
            <button
              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
              className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
            >
              <div className="flex items-center justify-center border-r p-3">
                <PiBasket className="w-5 h-5 text-[#CC5500]" />
              </div>
              <span className="flex-1 text-left pl-3">
                {selectedMenuCategory
                  ? selectedMenuCategory.name
                  : "All Categories"}
              </span>
              <div className="flex items-center justify-center pr-3">
                {isCatDropdownOpen ? (
                  <FaChevronUp className="h-4 w-4 text-[#CC5500]" />
                ) : (
                  <FaChevronDown className="h-4 w-4 text-[#CC5500]" />
                )}
              </div>
            </button>

            {/* Status message - Adjusted to match dropdown height */}
            {(availabilityMessage || isUpdatingAvailability) && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 flex-1 mx-4 p-2.5 shadow-sm flex items-center">
                <p className="pl-3">
                  {isUpdatingAvailability
                    ? `Updating Menu Availability${loadingDots}`
                    : availabilityMessage}
                </p>
              </div>
            )}

            {/* Update Menu Availability Button - Reverted to icon-only but keeping consistent height */}
            <button
              onClick={updateMenuAvailability}
              disabled={isUpdatingAvailability}
              className="flex items-center justify-center p-3 rounded-full bg-blue-100 hover:bg-blue-700 transition-all duration-200 group shadow-sm"
              title="Update Menu Availability"
            >
              <PiArrowsClockwise
                className={`w-5 h-5 ${
                  isUpdatingAvailability ? "animate-spin" : ""
                } 
                text-blue-700 group-hover:text-blue-100`}
              />
            </button>

            {isCatDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg z-10 top-full">
                <div className="bg-white rounded-md py-2">
                  <button
                    onClick={() => {
                      setSelectedMenuCategory({
                        id: 0,
                        name: "All Categories",
                      });
                      setIsCatDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedMenuCategory(cat);
                        setIsCatDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Menu Items Grid */}
      <div
        className="overflow-y-auto flex-1 mt-4"
        style={{ height: "calc(100vh - 240px)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedFilteredMenuItems.map((item) => (
            <div key={item.id} className="min-w-[200px]">
              <ItemBox
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
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <NewMenuModal
          onClose={() => {
            setIsModalOpen(false);
            // Don't refresh when just closing
          }}
          onSave={(newItemData) => {
            // Add the new item to state
            addMenuItem(newItemData);
            // Close modal
            setIsModalOpen(false);
            // Show loading screen and refresh data
            const refreshWithLoading = async () => {
              setLoading(true);
              await fetchMenus();
              await updateMenuAvailability();
              setLoading(false);
            };
            refreshWithLoading();
          }}
          categories={categories}
          menuTypes={menuTypes}
          inventory={inventory}
          units={units}
          fetchMenus={fetchMenus}
        />
      )}

      {isEditModalOpen && (
        <EditMenuModal
          item={selectedItem}
          onClose={() => {
            setIsEditModalOpen(false);
            // Don't refresh when just closing
          }}
          onSave={(updatedItemData) => {
            // Update the item in state
            updateMenuItem(updatedItemData);
            // Close modal
            setIsEditModalOpen(false);
            // Show loading screen and refresh data
            const refreshWithLoading = async () => {
              setLoading(true);
              await fetchMenus();
              await updateMenuAvailability();
              setLoading(false);
            };
            refreshWithLoading();
          }}
          onDelete={() => {
            // Close modal
            setIsEditModalOpen(false);
            // Show loading screen and refresh data
            const refreshWithLoading = async () => {
              setLoading(true);
              await fetchMenus();
              await updateMenuAvailability();
              setLoading(false);
            };
            refreshWithLoading();
          }}
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
