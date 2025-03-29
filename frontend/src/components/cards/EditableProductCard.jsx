import React, { useState, useEffect } from "react";
import { getItemKey } from "../cards/OrderProductCard";

const EditableProductCard = ({
  item,
  onQuantityChange,
  discounts,
  onDiscountChange,
}) => {
  const [qty, setQty] = useState(item.quantity);

  // Sync local quantity with item.quantity prop when it changes.
  useEffect(() => {
    setQty(item.quantity);
  }, [item.quantity]);

  const originalPrice = item.menu_item?.price || 0;
  // If discount exists, use its percentage; otherwise, no discount (0%)
  const discountPercentage = item.discount ? item.discount.percentage : 0;
  const computedPrice = originalPrice * qty * (1 - discountPercentage);

  const handleDecrease = () => {
    if (qty > 1) {
      const newQty = qty - 1;
      setQty(newQty);
      onQuantityChange(item, newQty);
    }
  };

  const handleIncrease = () => {
    const newQty = qty + 1;
    setQty(newQty);
    onQuantityChange(item, newQty);
  };

  const handleInputChange = (e) => {
    const newQty = parseInt(e.target.value, 10) || 1;
    setQty(newQty);
    onQuantityChange(item, newQty);
  };

  // When a discount is selected, update the order detail.
  const handleDiscountChange = (e) => {
    const newDiscountId = parseInt(e.target.value, 10);
    onDiscountChange(item, newDiscountId);
  };

  return (
    <div
      className="flex items-center border rounded p-1 mb-2 w-full"
      style={{ width: "100%" }}
    >
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
            value={qty}
            onChange={handleInputChange}
            className="w-10 text-center border text-sm h-8"
          />
          <button
            onClick={handleIncrease}
            className="bg-[#E88504] px-2 text-sm text-white h-8 flex items-center justify-center"
          >
            +
          </button>
          {discounts && item.instoreCategory !== "Unli Wings" && (
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
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-600">
            ₱{originalPrice.toFixed(2)}
          </span>
          <span className="text-xs font-semibold text-green-600">
            ₱{computedPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EditableProductCard;
