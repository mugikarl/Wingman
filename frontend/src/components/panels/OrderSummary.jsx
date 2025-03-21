import React, { useState, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa"; // kebab menu icon

const OrderSummary = ({
  selectedItems,
  handleQuantityChange,
  handleRemoveItem,
  menuType,
  handleInstoreCategoryChange,
  handleDiscountChange, // passed from Order.jsx
}) => {
  const [localQuantities, setLocalQuantities] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Update local quantities whenever selectedItems changes.
  useEffect(() => {
    const newQuantities = {};
    selectedItems.forEach((item) => {
      // Composite key: id, instoreCategory (default "default"), and discount (default 0)
      const key = `${item.id}-${item.instoreCategory || "default"}-${
        item.discount || 0
      }`;
      newQuantities[key] = item.quantity.toString();
    });
    setLocalQuantities(newQuantities);
  }, [selectedItems]);

  const calculateSubtotal = () => {
    return selectedItems.reduce((total, item) => {
      const discountFactor = 1 - (item.discount || 0) / 100;
      return total + item.price * item.quantity * discountFactor;
    }, 0);
  };

  const handleBlur = (id, category, discount) => {
    const key = `${id}-${category || "default"}-${discount || 0}`;
    const inputVal = localQuantities[key];
    if (inputVal === "") {
      const currentItem = selectedItems.find(
        (i) =>
          i.id === id &&
          (menuType?.id === 1 ? i.instoreCategory === category : true) &&
          (menuType?.id === 1 ? Number(i.discount) === Number(discount) : true)
      );
      setLocalQuantities((prev) => ({
        ...prev,
        [key]: currentItem ? currentItem.quantity.toString() : "1",
      }));
      return;
    }
    const newQuantity = parseInt(inputVal, 10);
    if (isNaN(newQuantity)) {
      const currentItem = selectedItems.find(
        (i) =>
          i.id === id &&
          (menuType?.id === 1 ? i.instoreCategory === category : true) &&
          (menuType?.id === 1 ? Number(i.discount) === Number(discount) : true)
      );
      setLocalQuantities((prev) => ({
        ...prev,
        [key]: currentItem ? currentItem.quantity.toString() : "1",
      }));
    } else {
      handleQuantityChange(id, category, discount, newQuantity);
    }
  };

  const renderProductCard = (item) => {
    // For In‑Store orders, use the provided instoreCategory; otherwise, default to "default"
    const instoreCat =
      menuType?.id === 1 ? item.instoreCategory || "Ala Carte" : "default";
    const currentDiscount = menuType?.id === 1 ? item.discount || 0 : 0;
    const key = `${item.id}-${instoreCat}-${currentDiscount}`;
    const discountFactor = 1 - currentDiscount / 100;
    return (
      <div
        key={key}
        className="flex border rounded-lg p-1 relative overflow-hidden"
      >
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
            <span className="font-semibold text-base truncate">
              {item.name}
            </span>
            {menuType?.id === 1 && (
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenDropdownId(openDropdownId === key ? null : key)
                  }
                  className="p-1"
                >
                  <FaEllipsisV className="text-gray-600" />
                </button>
                {openDropdownId === key && (
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
                  instoreCat,
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
              min="0"
              value={localQuantities[key] || ""}
              onChange={(e) =>
                setLocalQuantities((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
              onBlur={() => handleBlur(item.id, instoreCat, currentDiscount)}
              className="w-10 text-center border-t border-b border-gray-300 text-sm h-8"
            />
            <button
              onClick={() =>
                handleQuantityChange(
                  item.id,
                  instoreCat,
                  currentDiscount,
                  item.quantity + 1
                )
              }
              className="bg-[#E88504] text-white px-2 border border-l-0 h-8 whitespace-nowrap"
            >
              +
            </button>
            {/* Only show discount dropdown for In‑Store orders */}
            {menuType?.id === 1 && (
              <select
                value={currentDiscount}
                onChange={(e) => {
                  console.log("New discount value:", e.target.value);
                  // Pass the composite key (i.e. key) to the handler so that only the target card is updated.
                  handleDiscountChange(
                    item.id,
                    instoreCat,
                    parseInt(e.target.value, 10),
                    key
                  );
                }}
                className="ml-2 border border-gray-300 text-sm h-8 w-24 whitespace-nowrap"
              >
                <option value="0">None (0%)</option>
                <option value="15">Senior (15%)</option>
                <option value="20">PWD (20%)</option>
              </select>
            )}
          </div>
          {/* Bottom Row: Prices */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              ₱{item.price.toFixed(2)}
            </span>
            <span className="font-semibold text-green-600 whitespace-nowrap">
              ₱{(item.price * item.quantity * discountFactor).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderGroupedProducts = () => {
    const unliWingsItems = selectedItems.filter(
      (item) => item.instoreCategory === "Unli Wings"
    );
    const alaCarteItems = selectedItems.filter(
      (item) => !item.instoreCategory || item.instoreCategory === "Ala Carte"
    );
    return (
      <>
        {unliWingsItems.length > 0 && (
          <div>
            <h3 className="font-bold text-base mb-2">Unli Wings</h3>
            <div className="space-y-4">
              {unliWingsItems.map((item) => renderProductCard(item))}
            </div>
          </div>
        )}
        {alaCarteItems.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold text-base mb-2">Ala Carte</h3>
            <div className="space-y-4">
              {alaCarteItems.map((item) => renderProductCard(item))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="w-1/4 bg-white p-4 flex flex-col justify-between overflow-hidden">
      <div className="text-center font-bold text-lg border-b pb-2">
        Order Summary
      </div>
      <div className="flex-grow overflow-y-auto mt-4 mb-4 space-y-4">
        {selectedItems.length === 0 ? (
          <p className="text-gray-500 text-center">No items added.</p>
        ) : menuType?.id === 1 ? (
          renderGroupedProducts()
        ) : (
          selectedItems.map((item) => renderProductCard(item))
        )}
      </div>
      <div className="bg-gray-100 p-4 rounded-t-lg">
        {/* For non-In‑Store types, change the discount label */}
        {menuType?.id === 1 ? (
          <div className="flex justify-between mb-2">
            <span>Discount:</span>
            <span>₱0.00</span>
          </div>
        ) : (
          <div className="flex justify-between mb-2">
            <span>Percentage Deduction:</span>
            <span>{menuType.percentageDeduction}%</span>
          </div>
        )}
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>₱{calculateSubtotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>
            {menuType?.id === 1
              ? `₱${calculateSubtotal().toFixed(2)}`
              : `₱${(
                  calculateSubtotal() -
                  calculateSubtotal() * (menuType.percentageDeduction / 100)
                ).toFixed(2)}`}
          </span>
        </div>
        <button className="w-full bg-green-500 text-white py-2 mt-4 rounded">
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
