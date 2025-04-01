import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import axios from "axios";

const EditTransactionMenu = ({
  menuCategories,
  isCatDropdownOpen,
  setIsCatDropdownOpen,
  selectedMenuCategory,
  setSelectedMenuCategory,
  filteredMenuItems,
  onItemSelect, // callback when a menu item is selected
}) => {
  const [inventoryWarnings, setInventoryWarnings] = useState({});

  // New function to check inventory before adding item
  const handleItemSelect = async (item) => {
    try {
      // First check if this item is already unavailable
      if (item.status_id === 2) {
        alert("This item is currently unavailable!");
        return;
      }

      // Check inventory levels via API
      const response = await axios.get(
        `http://127.0.0.1:8000/check-menu-inventory/${item.id}?quantity=1`
      );

      if (response.data.has_sufficient_inventory === false) {
        const warnings = response.data.warnings || [];

        if (warnings.length > 0) {
          // Format warning message
          const warningItems = warnings
            .map(
              (w) =>
                `${w.inventory_name}: ${w.available_quantity} ${w.unit} available, ${w.required_quantity} ${w.unit} needed`
            )
            .join("\n");

          // Show warning but allow adding
          const proceed = window.confirm(
            `Warning: Adding this item may exceed available inventory!\n\n${warningItems}\n\nDo you want to continue?`
          );

          if (!proceed) {
            return;
          }

          // Store warning for this item
          setInventoryWarnings((prev) => ({
            ...prev,
            [item.id]: warnings,
          }));
        }
      }

      // If we get here, either inventory is sufficient or user confirmed to proceed
      onItemSelect(item);
    } catch (error) {
      console.error("Error checking inventory:", error);
      // Still allow adding if check fails
      onItemSelect(item);
    }
  };

  return (
    <div className="w-400 px-4 flex flex-col h-full">
      <h3 className="font-bold text-xl mb-4">Menu</h3>
      {/* Select Category Dropdown */}
      <div className="relative inline-block text-left mb-4">
        <button
          onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
          className="flex items-center bg-[#E88504] rounded-md shadow-md hover:opacity-90 active:scale-95 transition-transform duration-150 w-56 overflow-hidden"
        >
          <div className="flex items-center justify-center bg-[#D87A03] p-3">
            <img
              src="/images/groceries.png"
              alt="Category"
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
                onClick={() => {
                  setSelectedMenuCategory({ id: 0, name: "Overall" });
                  setIsCatDropdownOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                Overall
              </button>
              {menuCategories.map((cat) => (
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
      {/* Render filtered menu items as rectangular cards */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="space-y-2">
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center border rounded cursor-pointer hover:shadow-md w-full ${
                item.status_id === 2 ? "opacity-50" : ""
              } ${
                inventoryWarnings[item.id] ? "border-orange-500 border-2" : ""
              }`}
              onClick={() => handleItemSelect(item)}
            >
              {/* Image occupies left side with no extra padding */}
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-16 h-16 object-cover"
              />
              {/* Details: name and price */}
              <div className="flex-grow pl-2">
                <p className="font-semibold truncate">
                  {item.name.length > 15
                    ? item.name.substring(0, 15) + "..."
                    : item.name}
                </p>
                {inventoryWarnings[item.id] && (
                  <p className="text-xs text-orange-500">Low inventory</p>
                )}
              </div>
              <p className="font-semibold pr-2">₱{item.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditTransactionMenu;
