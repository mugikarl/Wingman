import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import axios from "axios";
import { PiBasket } from "react-icons/pi";
import { useModal } from "../utils/modalUtils";

const EditTransactionMenu = ({
  menuCategories,
  isCatDropdownOpen,
  setIsCatDropdownOpen,
  selectedMenuCategory,
  setSelectedMenuCategory,
  filteredMenuItems,
  onItemSelect, // callback when a menu item is selected
  isHighlighted, // new prop
}) => {
  const [inventoryWarnings, setInventoryWarnings] = useState({});
  const { alert } = useModal();

  // Simplified handleItemSelect - just check if item is unavailable
  const handleItemSelect = (item) => {
    // The availability check is already done in the parent's onItemSelect
    onItemSelect(item);
  };

  return (
    <div className="w-full overflow-y-auto flex flex-col h-full">
      <h3
        className={`font-semibold text-xl mb-4 ${
          isHighlighted ? "text-orange-500" : ""
        }`}
      >
        {isHighlighted ? "Select an Item for Unli Wings" : "Menu"}
      </h3>
      {/* Select Category Dropdown */}
      <div className="relative inline-block text-left mb-4">
        <button
          onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
          className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
        >
          <div className="flex items-center justify-center border-r p-3">
            <PiBasket className="w-5 h-5 text-[#CC5500]" />
          </div>
          <span className="flex-1 text-left pl-3">
            {selectedMenuCategory ? selectedMenuCategory.name : "All"}
          </span>
          <div className="flex items-center justify-center pr-3">
            {isCatDropdownOpen ? (
              <FaChevronUp className="h-4 w-4 text-[#CC5500]" />
            ) : (
              <FaChevronDown className="h-4 w-4 text-[#CC5500]" />
            )}
          </div>
        </button>
        {isCatDropdownOpen && (
          <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg z-10">
            <div className="bg-white rounded-md py-2">
              <button
                onClick={() => {
                  setSelectedMenuCategory({ id: 0, name: "All" });
                  setIsCatDropdownOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                All
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
