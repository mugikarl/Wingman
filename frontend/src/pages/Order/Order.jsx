import React, { useState, useEffect } from "react";
import ItemBox from "../../components/tables/ItemBox";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import OrderSummary from "../../components/panels/OrderSummary";

const Order = () => {
  // Modal and dropdown states
  const [selectedItems, setSelectedItems] = useState([]);
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

  // Set default selected menu type to "In‑Store" immediately
  useEffect(() => {
    if (menuTypes.length > 0 && !selectedMenuType) {
      // Assuming the "In‑Store" type has id 1
      const inStoreType = menuTypes.find((type) => type.id === 1);
      setSelectedMenuType(inStoreType);
    }
  }, [menuTypes, selectedMenuType]);

  // When menu type changes to a non‑In‑Store type, clear order details.
  useEffect(() => {
    if (selectedMenuType && selectedMenuType.id !== 1) {
      setSelectedItems([]);
    }
  }, [selectedMenuType]);

  // Handle filter selection
  const handleTypeFilter = (type) => {
    setSelectedMenuType(type);
  };

  const handleCategoryFilter = (cat) => {
    setSelectedMenuCategory(cat);
    setIsCatDropdownOpen(false);
  };

  // Filter items based on selected type and category
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

  // Sort items so that available (status_id === 1) come first
  const sortedFilteredMenuItems = filteredMenuItems.slice().sort((a, b) => {
    if (a.status_id === 1 && b.status_id !== 1) return -1;
    if (a.status_id !== 1 && b.status_id === 1) return 1;
    return 0;
  });

  // Helper functions for button styles
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

  // Add item or increment quantity
  const handleAddItem = (item) => {
    if (selectedMenuType?.id === 1) {
      // For In‑Store, default instoreCategory is "Ala Carte" and discount is 0 (None)
      const defaultCategory = "Ala Carte";
      const defaultDiscount = 0;
      // Only merge if same product, same instoreCategory, and same discount
      const existingItem = selectedItems.find(
        (i) =>
          i.id === item.id &&
          i.instoreCategory === defaultCategory &&
          i.discount === defaultDiscount
      );
      if (existingItem) {
        setSelectedItems(
          selectedItems.map((i) =>
            i.id === item.id &&
            i.instoreCategory === defaultCategory &&
            i.discount === defaultDiscount
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        );
      } else {
        setSelectedItems([
          ...selectedItems,
          {
            ...item,
            quantity: 1,
            instoreCategory: defaultCategory,
            discount: defaultDiscount,
          },
        ]);
      }
    } else {
      // For non‑In‑Store types, use the existing behavior.
      const existingItem = selectedItems.find((i) => i.id === item.id);
      if (existingItem) {
        setSelectedItems(
          selectedItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        );
      } else {
        setSelectedItems([
          ...selectedItems,
          { ...item, quantity: 1, instoreCategory: "default", discount: 0 },
        ]);
      }
    }
  };

  // Update discount only for the targeted card.
  // It does not merge with others if the new discount differs.
  const handleDiscountChange = (id, category, newDiscount, targetKey) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        const key = `${item.id}-${item.instoreCategory || "default"}-${
          item.discount || 0
        }`;
        if (item.id.toString() === id.toString() && key === targetKey) {
          return { ...item, discount: Number(newDiscount) };
        }
        return item;
      })
    );
    setOpenDropdownId(null);
  };

  // Update quantity with discount considered.
  const handleQuantityChange = (id, category, discount, newQuantity) => {
    if (newQuantity === 0) {
      setSelectedItems(
        selectedItems.filter(
          (i) =>
            !(
              i.id === id &&
              (selectedMenuType?.id === 1
                ? i.instoreCategory === category &&
                  Number(i.discount) === Number(discount)
                : true)
            )
        )
      );
    } else if (newQuantity < 0) {
      return;
    } else {
      setSelectedItems(
        selectedItems.map((i) =>
          i.id === id &&
          (selectedMenuType?.id === 1
            ? i.instoreCategory === category &&
              Number(i.discount) === Number(discount)
            : true)
            ? { ...i, quantity: newQuantity }
            : i
        )
      );
    }
  };

  // Remove item from the order
  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== id));
  };

  // Update instore category for a product
  const handleInstoreCategoryChange = (id, category) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.id === id ? { ...item, instoreCategory: category } : item
      )
    );
  };

  return (
    <div className="h-screen w-full flex bg-[#E2D6D5]">
      {/* Main Content */}
      <div className="flex-grow p-6 flex flex-col">
        {/* Fixed Header: Search Bar and Filters */}
        <div>
          <div className="flex flex-col space-y-4 mb-4">
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
            {/* Filters Section */}
            <div className="flex flex-col space-y-4">
              {/* Menu Type Buttons */}
              <div className="flex gap-4">
                {menuTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeFilter(type)}
                    className={`flex items-center ${getMenuTypeButtonStyles(
                      type
                    )} ${
                      selectedMenuType && selectedMenuType.id === type.id
                        ? "filter brightness-90"
                        : ""
                    } rounded-md shadow-md hover:opacity-90 active:scale-95 transition-transform duration-150 w-56 overflow-hidden`}
                  >
                    <div
                      className={`flex items-center justify-center ${getMenuLeftContainerBg(
                        type
                      )} p-3`}
                    >
                      <img
                        src="/images/stockout/menu.png"
                        alt="Menu"
                        className="w-6 h-6"
                      />
                    </div>
                    <span className="flex-1 text-left px-3 text-white">
                      {type.name}
                    </span>
                  </button>
                ))}
              </div>
              {/* Select Category Dropdown */}
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="flex items-center bg-[#E88504] rounded-md shadow-md hover:opacity-90 active:scale-95 transition-transform duration-150 w-56 overflow-hidden"
                >
                  <div className="flex items-center justify-center bg-[#D87A03] p-3">
                    <img
                      src="/images/groceries.png"
                      alt="Menu"
                      className="w-6 h-6"
                    />
                  </div>
                  <span className="flex-1 text-left px-3 text-white">
                    {selectedMenuCategory
                      ? selectedMenuCategory.name
                      : "Select Category"}
                  </span>
                  <div className="flex items-center justify-center p-3">
                    {isCatDropdownOpen ? (
                      <FaChevronUp className="h-6 text-white" />
                    ) : (
                      <FaChevronDown className="h-6 text-white" />
                    )}
                  </div>
                </button>
                {isCatDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg z-10">
                    <div className="bg-white rounded-md py-2">
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
        {/* Scrollable Grid Layout for Sorted Menu Items */}
        <div className="flex-grow overflow-y-auto pb-2">
          <div className="grid grid-cols-4 gap-x-4 gap-y-4">
            {sortedFilteredMenuItems.map((item) => (
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
      <OrderSummary
        selectedItems={selectedItems}
        handleQuantityChange={handleQuantityChange}
        handleRemoveItem={handleRemoveItem}
        menuType={selectedMenuType} // pass current menu type
        handleInstoreCategoryChange={handleInstoreCategoryChange}
        handleDiscountChange={handleDiscountChange}
      />
    </div>
  );
};

export default Order;
