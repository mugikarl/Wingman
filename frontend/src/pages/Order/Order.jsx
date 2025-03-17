import React, { useState, useEffect } from "react";
import ItemBox from "../../components/tables/ItemBox";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

const Order = () => {
  // Modal and dropdown states
  const [selectedItems, setSelectedItems] = useState(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [selectedMenuType, setSelectedMenuType] = useState(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState(null);

  // Data states
  const [menuItems, setMenuItems] = useState([]);
  const [menuTypes, setMenuTypes] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuStatuses, setMenuStatuses] = useState([]);

  const fetchMenuOrders = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-order-data/"
      );
      setMenuItems(response.data.menu_items || []);
      setMenuTypes(response.data.menu_types || []);
      setMenuCategories(response.data.menu_categories || []);
      setMenuStatuses(response.data.menu_statuses || []);
    } catch (error) {
      console.log("Error fetching data menu data: ", error);
    }
  };

  useEffect(() => {
    fetchMenuOrders();
  }, []);

  // Handle filter selection
  const handleTypeFilter = (type) => {
    setSelectedMenuType(type);
    setIsTypeDropdownOpen(false);
  };

  const handleCategoryFilter = (cat) => {
    setSelectedMenuCategory(cat);
    setIsCatDropdownOpen(false);
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesType = selectedMenuType
      ? item.type_id === selectedMenuType.id
      : true;
    const matchesCategory =
      selectedMenuCategory && selectedMenuCategory.id !== 0
        ? item.category_id === selectedMenuCategory.id
        : true;
    return matchesType && matchesCategory;
  });

  // Helper to return unique button styles based on type id for the main filter button
  const getMenuTypeButtonStyles = (type) => {
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

  const getMenuLeftContainerBg = (type) => {
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

  const handleAddItem = (item) => {
    const existingItem = selectedItems.find((i) => i.id === item.id);
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    setSelectedItems(
      selectedItems.map((i) =>
        i.id === id ? { ...i, quantity: newQuantity } : i
      )
    );
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== id));
  };

  return (
    <div className="h-screen w-full flex bg-[#E2D6D5]">
      {/* Main Content */}
      <div className="flex-grow p-6 flex flex-col">
        {/* Fixed Header: Search Bar and Filters */}
        <div>
          <div className="flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="w-full">
              <div className="flex justify-between items-center w-full space-x-4">
                <div className="flex w-[430px]">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="flex-grow p-2 border rounded-lg shadow"
                  />
                </div>
              </div>
            </div>
            {/* Filters */}
            <div className="flex gap-x-4">
              {/* Filter Type Dropdown Button */}
              <div className="relative inline-block text-left mb-4">
                <button
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className={`flex items-center ${
                    selectedMenuType
                      ? getMenuTypeButtonStyles(selectedMenuType)
                      : "bg-[#E88504]"
                  } rounded-md shadow-md hover:opacity-90 transition-colors duration-200 w-56 overflow-hidden`}
                >
                  {/* Left Icon Container */}
                  <div
                    className={`flex items-center justify-center ${
                      selectedMenuType
                        ? getMenuLeftContainerBg(selectedMenuType)
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
                    {selectedMenuType ? selectedMenuType.name : "Select Type"}
                  </span>
                  {/* Arrow Icon */}
                  <div className="flex items-center justify-center p-3">
                    {isTypeDropdownOpen ? (
                      <FaChevronUp className="h-6 text-white" />
                    ) : (
                      <FaChevronDown className="h-6 text-white" />
                    )}
                  </div>
                </button>
                {/* Dropdown Menu */}
                {isTypeDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg z-10">
                    <div className="bg-white rounded-md py-2">
                      {menuTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleTypeFilter(type)}
                          className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Filter Category Dropdown Button */}
              <div className="relative inline-block text-left mb-4">
                <button
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="flex items-center bg-[#E88504] rounded-md shadow-md hover:opacity-90 transition-colors duration-200 w-56 overflow-hidden"
                >
                  {/* Left Icon Container */}
                  <div className="flex items-center justify-center bg-[#D87A03] p-3">
                    <img
                      src="/images/groceries.png"
                      alt="Menu"
                      className="w-6 h-6"
                    />
                  </div>
                  {/* Text */}
                  <span className="flex-1 text-left px-3 text-white">
                    {selectedMenuCategory
                      ? selectedMenuCategory.name
                      : "Select Category"}
                  </span>
                  {/* Arrow Icon */}
                  <div className="flex items-center justify-center p-3">
                    {isCatDropdownOpen ? (
                      <FaChevronUp className="h-6 text-white" />
                    ) : (
                      <FaChevronDown className="h-6 text-white" />
                    )}
                  </div>
                </button>
                {/* Dropdown Menu */}
                {isCatDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg z-10">
                    <div className="bg-white rounded-md py-2">
                      {/* Overall Option */}
                      <button
                        onClick={() =>
                          handleCategoryFilter({ id: 0, name: "Overall" })
                        }
                        className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                      >
                        Overall
                      </button>
                      {menuCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryFilter(cat)}
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
        </div>
        {/* Scrollable Grid Layout for Filtered Menu Items */}
        <div className="flex-grow overflow-y-auto pb-2">
          <div className="grid grid-cols-4 gap-x-4 gap-y-4">
            {filteredMenuItems.map((item) => (
              <ItemBox
                key={item.id}
                item={item}
                image={item.image || "/placeholder.svg"}
                name={item.name}
                price={item.price}
                currency="₱"
                status={item.status_id}
                onClick={() => handleAddItem(item)}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Summary Panel (Fixed) */}
      <div className="w-1/4 bg-white p-4 flex flex-col justify-between">
        <div className="text-center font-bold text-lg border-b pb-2">
          Order Summary
        </div>
        <div className="bg-gray-100 p-4 rounded-t-lg">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>$ {/* Calculation here */}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Discount:</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>$ {/* Calculation here */}</span>
          </div>
          <button className="w-full bg-green-500 text-white py-2 mt-4 rounded">
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Order;
