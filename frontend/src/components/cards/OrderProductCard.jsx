import React from "react";
import { FaChevronDown } from "react-icons/fa6";

export const getItemKey = (item, menuType) => {
  if (!item) return "";
  if (
    menuType?.id === 1 &&
    item.instoreCategory === "Unli Wings" &&
    item.orderNumber !== undefined
  ) {
    return `${item.id}-unli-${item.orderNumber}-${String(item.discount || 0)}`;
  }
  return `${item.id}-${item.instoreCategory || "Ala Carte"}-${String(
    item.discount || 0
  )}`;
};

export const getKeyFromParams = (id, groupIdentifier, discount, isUnli) => {
  if (isUnli) return `${id}-unli-${groupIdentifier}-${String(discount)}`;
  return `${id}-${groupIdentifier}-${String(discount)}`;
};

const OrderProductCard = ({
  item,
  menuType,
  localQuantity,
  onLocalQuantityChange,
  handleBlur,
  handleQuantityChange,
  handleInstoreCategoryChange,
  handleDiscountChange,
  openDropdownId,
  setOpenDropdownId,
  discounts,
}) => {
  if (!item) return null;

  // For In‑Store orders, default to "Ala Carte" if instoreCategory is not set.
  const instoreCat =
    menuType?.id === 1 ? item.instoreCategory || "Ala Carte" : "default";
  // For Unli orders, use the orderNumber as the unique group identifier.
  const isUnliOrder =
    menuType?.id === 1 && item.instoreCategory === "Unli Wings";
  const groupIdentifier =
    isUnliOrder && item.orderNumber !== undefined
      ? item.orderNumber
      : instoreCat;

  // currentDiscount is now the discount ID (or 0 for none)
  const currentDiscount = menuType?.id === 1 ? item.discount || 0 : 0;
  const compositeKey = getItemKey(item, menuType);

  // Calculate the final price after discount:
  // Look up the discount option based on the discount ID.
  const discountOption = discounts.find((d) => d.id === currentDiscount);
  const discountDecimal = discountOption ? discountOption.percentage : 0;
  const subtotal = item.price * item.quantity;
  const finalPrice = subtotal - subtotal * discountDecimal;

  const discountOptions = discounts || [];

  return (
    <div className="flex border border-gray-200 rounded-sm p-2 relative overflow-hidden hover:shadow-md transition-shadow duration-200 bg-white">
      {/* Left Column: Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden">
        <img
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Right Column: Details */}
      <div className="flex flex-col flex-grow ml-3 overflow-hidden">
        <div className="flex justify-between items-start mb-1">
          <span className="font-semibold text-base truncate">{item.name}</span>
        </div>

        {/* Middle Row: Quantity Controls and Discount Dropdown (conditional) */}
        <div className="flex items-center mt-1 space-x-2">
          <div className="flex border border-gray-300 rounded-sm overflow-hidden shadow-sm">
            <button
              onClick={() =>
                handleQuantityChange(
                  item.id,
                  groupIdentifier,
                  currentDiscount,
                  item.quantity - 1
                )
              }
              className="bg-[#CC5500] text-white px-3 hover:bg-[#B34A00] transition-colors duration-150 h-8 flex items-center justify-center font-medium"
            >
              -
            </button>
            <input
              type="number"
              value={localQuantity}
              onChange={(e) =>
                onLocalQuantityChange(compositeKey, e.target.value)
              }
              onBlur={() =>
                handleBlur(item.id, groupIdentifier, currentDiscount)
              }
              className="w-8 text-center text-sm h-8 focus:outline-none focus:ring-1 focus:ring-[#CC5500]"
            />
            <button
              onClick={() =>
                handleQuantityChange(
                  item.id,
                  groupIdentifier,
                  currentDiscount,
                  item.quantity + 1
                )
              }
              className="bg-[#CC5500] text-white px-3 hover:bg-[#B34A00] transition-colors duration-150 h-8 flex items-center justify-center font-medium"
            >
              +
            </button>
          </div>
          {/* Only show discount dropdown for non-Unli Wings orders and menuType is In-Store */}
          {menuType?.id === 1 && !isUnliOrder && (
            <div className="relative w-28">
              <select
                value={item.discount || "0"}
                onChange={(e) =>
                  handleDiscountChange(
                    item.id,
                    groupIdentifier,
                    parseInt(e.target.value, 10),
                    compositeKey
                  )
                }
                className="border border-gray-300 rounded-sm text-sm h-8 px-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#CC5500] appearance-none bg-white w-full"
              >
                <option value="0">None (0%)</option>
                {discountOptions.map((disc) => (
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
        {!isUnliOrder && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              ₱{(item.price || 0).toFixed(2)} × {item.quantity}
            </span>
            <span className="font-semibold text-green-600 whitespace-nowrap">
              ₱{finalPrice.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderProductCard;
