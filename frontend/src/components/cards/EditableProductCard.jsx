import React, { useState, useEffect } from "react";
import { getItemKey } from "../cards/OrderProductCard";

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
    <div className="flex items-center border rounded p-1 mb-2 w-full">
      <div className="flex-shrink-0">
        <img
          src={item.menu_item?.image || "/placeholder.svg"}
          alt={item.menu_item?.name}
          className="w-20 h-20 object-cover"
        />
      </div>
      <div className="flex flex-col flex-grow ml-2">
        <p className="font-semibold text-sm truncate">{item.menu_item?.name}</p>
        <div className="flex items-center mt-1">
          <button
            onClick={handleDecrease}
            className="bg-[#E88504] px-2 text-sm text-white h-8 flex items-center justify-center"
          >
            -
          </button>
          <input
            type="number"
            value={inputQty}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-10 text-center border text-sm h-8"
          />
          <button
            onClick={handleIncrease}
            className="bg-[#E88504] px-2 text-sm text-white h-8 flex items-center justify-center"
          >
            +
          </button>
          {/* Only show discount dropdown if not an Unli Wings order */}
          {discounts && !isUnliWings && (
            <select
              value={item.discount ? item.discount.id : 0}
              onChange={handleDiscountChange}
              className="ml-2 h-8 text-sm border rounded w-24"
            >
              <option value={0}>None</option>
              {discounts.map((disc) => (
                <option key={disc.id} value={disc.id}>
                  {disc.type} ({(disc.percentage * 100).toFixed(0)}%)
                </option>
              ))}
            </select>
          )}
        </div>
        {/* For Unli Wings orders, don't show individual prices */}
        {!isUnliWings && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-600">
              ₱{originalPrice.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-green-600">
              ₱{computedPrice.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableProductCard;
