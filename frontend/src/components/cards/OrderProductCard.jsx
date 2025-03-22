import React from "react";
import { FaEllipsisVertical } from "react-icons/fa6";

// Helper to create a composite key for an item.
// We add a guard to ensure item is defined.
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
  const currentDiscount = menuType?.id === 1 ? item.discount || 0 : 0;
  const compositeKey = getItemKey(item, menuType);
  const discountFactor = 1 - currentDiscount / 100;
  const discountOptions = discounts || [];

  return (
    <div className="flex border rounded-lg p-1 relative overflow-hidden">
      {/* Left Column: Image */}
      <div className="w-20 h-20 flex-shrink-0 p-0">
        <img
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Right Column: Details */}
      <div className="flex flex-col flex-grow ml-1 overflow-hidden">
        <div className="flex justify-between items-start">
          <span className="font-semibold text-base truncate">{item.name}</span>
          {menuType?.id === 1 && (
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdownId(
                    openDropdownId === compositeKey ? null : compositeKey
                  )
                }
                className="p-1"
              >
                <FaEllipsisVertical className="text-gray-600" />
              </button>
              {openDropdownId === compositeKey && (
                <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow-lg z-10">
                  <button
                    onClick={() => {
                      handleInstoreCategoryChange(item.id, "Unli Wings");
                      setOpenDropdownId(null);
                    }}
                    className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm whitespace-nowrap"
                  >
                    Unli Wings
                  </button>
                  <button
                    onClick={() => {
                      handleInstoreCategoryChange(item.id, "Ala Carte");
                      setOpenDropdownId(null);
                    }}
                    className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm whitespace-nowrap"
                  >
                    Ala Carte
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Middle Row: Quantity Controls and Discount Dropdown */}
        <div className="flex items-center mt-1 space-x-1">
          <button
            onClick={() =>
              handleQuantityChange(
                item.id,
                groupIdentifier,
                currentDiscount,
                item.quantity - 1
              )
            }
            className="bg-[#E88504] text-white px-2 border border-r-0 h-8 whitespace-nowrap"
          >
            -
          </button>
          <input
            type="number"
            value={localQuantity}
            onChange={(e) =>
              onLocalQuantityChange(compositeKey, e.target.value)
            }
            onBlur={() => handleBlur(item.id, groupIdentifier, currentDiscount)}
            className="w-10 text-center border-t border-b border-gray-300 text-sm h-8"
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
            className="bg-[#E88504] text-white px-2 border border-l-0 h-8 whitespace-nowrap"
          >
            +
          </button>
          {menuType?.id === 1 && (
            <select
              value={currentDiscount}
              onChange={(e) =>
                handleDiscountChange(
                  item.id,
                  groupIdentifier,
                  parseFloat(e.target.value),
                  compositeKey
                )
              }
              className="ml-2 border border-gray-300 text-sm h-8 w-24 whitespace-nowrap"
            >
              <option value="0">None (0%)</option>
              {discountOptions.map((disc) => (
                <option key={disc.id} value={disc.percentage}>
                  {disc.type} ({(disc.percentage * 100).toFixed(0)}%)
                </option>
              ))}
            </select>
          )}
        </div>
        {/* Bottom Row: Price Information (only for non-Unli orders) */}
        {!isUnliOrder && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              ₱{item.price.toFixed(2)}
            </span>
            <span className="font-semibold text-green-600 whitespace-nowrap">
              ₱{(item.price * item.quantity * discountFactor).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderProductCard;
