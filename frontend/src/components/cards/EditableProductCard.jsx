import React, { useState, useEffect } from "react";
import { getItemKey } from "../cards/OrderProductCard";
import { FaChevronDown } from "react-icons/fa";

const EditableProductCard = ({
  item,
  onQuantityChange,
  discounts,
  onDiscountChange,
}) => {
  // Use a string state for the input value.
  const [inputQty, setInputQty] = useState(String(item.quantity));

  // Keep local input in sync when the item's quantity changes externally.
  useEffect(() => {
    setInputQty(String(item.quantity));
  }, [item.quantity]);

  // Determine if the item is part of an Unli Wings group.
  const isUnliWings = item.instore_category?.id === 2 && item.unli_wings_group;

  // For non-Unli Wings, use the menu item's price.
  const originalPrice = isUnliWings ? 0 : item.menu_item?.price || 0;
  const discountPercentage = item.discount ? item.discount.percentage : 0;
  const computedPrice =
    originalPrice * item.quantity * (1 - discountPercentage);

  const handleDecrease = () => {
    const newQty = item.quantity - 1;
    onQuantityChange(item, newQty);
  };

  const handleIncrease = () => {
    const newQty = item.quantity + 1;
    onQuantityChange(item, newQty);
  };

  const handleInputChange = (e) => {
    setInputQty(e.target.value);
  };

  const handleInputBlur = () => {
    let newQty = parseInt(inputQty, 10);
    if (isNaN(newQty)) {
      newQty = 0;
    }
    onQuantityChange(item, newQty);
    setInputQty(String(newQty));
  };

  const handleDiscountChange = (e) => {
    const newDiscountId = parseInt(e.target.value, 10);
    onDiscountChange(item, newDiscountId);
  };

  return (
    <div className="flex border border-gray-200 rounded-sm p-2 relative overflow-hidden hover:shadow-md transition-shadow duration-200 bg-white">
      {/* Left Column: Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden">
        <img
          src={item.menu_item?.image || "/placeholder.svg"}
          alt={item.menu_item?.name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Right Column: Details */}
      <div className="flex flex-col flex-grow ml-3 overflow-hidden">
        <div className="flex justify-between items-start mb-1">
          <span className="font-semibold text-base truncate">
            {item.menu_item?.name}
          </span>
        </div>

        {/* Middle Row: Quantity Controls and Discount Dropdown (conditional) */}
        <div className="flex items-center mt-1 space-x-2">
          <div className="flex border border-gray-300 rounded-sm overflow-hidden shadow-sm">
            <button
              onClick={handleDecrease}
              className="bg-[#CC5500] text-white px-3 hover:bg-[#B34A00] transition-colors duration-150 h-8 flex items-center justify-center font-medium"
            >
              -
            </button>
            <input
              type="number"
              value={inputQty}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="w-8 text-center text-sm h-8 focus:outline-none focus:ring-1 focus:ring-[#CC5500]"
            />
            <button
              onClick={handleIncrease}
              className="bg-[#CC5500] text-white px-3 hover:bg-[#B34A00] transition-colors duration-150 h-8 flex items-center justify-center font-medium"
            >
              +
            </button>
          </div>
          {/* Only show discount dropdown if not an Unli Wings order */}
          {discounts && !isUnliWings && (
            <div className="relative w-28">
              <select
                value={item.discount ? item.discount.id : 0}
                onChange={handleDiscountChange}
                className="border border-gray-300 rounded-sm text-sm h-8 px-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#CC5500] appearance-none bg-white w-full"
              >
                <option value={0}>None (0%)</option>
                {discounts.map((disc) => (
                  <option key={disc.id} value={disc.id}>
                    {disc.type} ({(disc.percentage * 100).toFixed(0)}%)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FaChevronDown className="w-3 h-3" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row: Price Information (only for non-Unli orders) */}
        {!isUnliWings && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              ₱{originalPrice.toFixed(2)} × {item.quantity}
            </span>
            <span className="font-semibold text-green-600 whitespace-nowrap">
              ₱{computedPrice.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableProductCard;
