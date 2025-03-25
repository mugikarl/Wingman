import React, { useState, useEffect } from "react";
import { getItemKey } from "../cards/OrderProductCard";

// EditableProductCard now accepts discounts and onDiscountChange props.
const EditableProductCard = ({
  item,
  onQuantityChange,
  discounts,
  onDiscountChange,
}) => {
  // Local state to hold quantity for this card
  const [qty, setQty] = useState(item.quantity);

  // Compute computed price
  const originalPrice = item.menu_item?.price || 0;
  const computedPrice = originalPrice * qty;

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

  // Handler for discount dropdown change
  const handleDiscountChange = (e) => {
    const newDiscount = parseInt(e.target.value, 10);
    onDiscountChange(item, newDiscount);
  };

  return (
    <div
      className="flex items-center border rounded p-1 mb-2"
      style={{ width: "100%" }}
    >
      {/* Image container without extra padding */}
      <div className="flex-shrink-0">
        <img
          src={item.menu_item?.image || "/placeholder.svg"}
          alt={item.menu_item?.name}
          className="w-20 h-20 object-cover"
        />
      </div>
      {/* Details Column */}
      <div className="flex flex-col flex-grow ml-2">
        {/* Item Name */}
        <p className="font-semibold text-sm truncate">{item.menu_item?.name}</p>
        {/* Quantity Row with uniform height */}
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
          {/* Render discount dropdown if discounts prop is provided and item is not "Unli Wings" */}
          {discounts && item.instoreCategory !== "Unli Wings" && (
            <select
              value={item.discount || 0}
              onChange={handleDiscountChange}
              className="ml-2 h-8 text-sm border rounded"
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
        {/* Prices Row */}
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

const EditTransactionOrderSummary = ({
  orderDetails,
  groupedUnliWingsOrders = {}, // default to empty object if not provided
  alaCarteOrders = [], // default to empty array if not provided
  finalTotal,
  onCancelUpdate,
  onAddOrderDetails,
  menuType,
  discounts,
  openDropdownId,
  setOpenDropdownId,
  deductionPercentage = 0, // for Delivery orders (FoodPanda/Grab)
}) => {
  // Local state for controlling accordion open/closed for Unli Wings groups
  const [openAccordion, setOpenAccordion] = useState({});

  // Create local state for order details so that quantity and discount updates are reflected
  const [localOrderDetails, setLocalOrderDetails] = useState(orderDetails);

  // Update local state if orderDetails prop changes
  useEffect(() => {
    setLocalOrderDetails(orderDetails);
  }, [orderDetails]);

  const toggleAccordion = (groupKey) => {
    setOpenAccordion((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Handler for quantity change in a product card
  const handleQuantityChange = (changedItem, newQty) => {
    console.log(
      "Quantity changed for",
      changedItem.menu_item?.name,
      "to",
      newQty
    );
    const updated = localOrderDetails.map((item) => {
      if (item.id === changedItem.id) {
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setLocalOrderDetails(updated);
  };

  // Handler for discount change in a product card
  const handleDiscountChange = (changedItem, newDiscount) => {
    console.log(
      "Discount changed for",
      changedItem.menu_item?.name,
      "to",
      newDiscount
    );
    const updated = localOrderDetails.map((item) => {
      if (item.id === changedItem.id) {
        return { ...item, discount: newDiscount };
      }
      return item;
    });
    setLocalOrderDetails(updated);
  };

  // Compute new subtotal from localOrderDetails (sum of price * quantity)
  const newSubtotal = localOrderDetails.reduce(
    (sum, item) => sum + (item.menu_item?.price || 0) * (item.quantity || 0),
    0
  );
  // For Delivery orders, compute new total after deduction; for In‑Store, no deduction.
  const newTotal =
    menuType === "Grab" || menuType === "FoodPanda"
      ? newSubtotal - newSubtotal * deductionPercentage
      : newSubtotal;

  return (
    // Set the component width to 350px
    <div
      className="p-4 flex flex-col h-full overflow-y-auto"
      style={{ width: "350px" }}
    >
      {menuType === "In-Store" ? (
        <>
          {/* Unli Wings Section */}
          <div className="mt-4">
            <button
              className="w-full flex justify-between items-center px-2 py-3 bg-gray-100 hover:bg-gray-200 rounded"
              onClick={() => toggleAccordion("unliWings")}
            >
              <span className="font-semibold">Unli Wings Orders</span>
              {openAccordion["unliWings"] ? (
                <span>&#9650;</span>
              ) : (
                <span>&#9660;</span>
              )}
            </button>
            {openAccordion["unliWings"] &&
              Object.keys(groupedUnliWingsOrders).map((groupKey) => {
                const groupOrders = groupedUnliWingsOrders[groupKey];
                return (
                  <div key={groupKey} className="border rounded mb-2 p-2">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-sm">
                        Unli Wings #{groupKey}
                      </h4>
                      <button
                        onClick={() => console.log("Update group", groupKey)}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Update
                      </button>
                    </div>
                    {groupOrders.map((item) => (
                      <EditableProductCard
                        key={getItemKey(item, { id: 1, name: "In-Store" })}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                      />
                    ))}
                  </div>
                );
              })}
          </div>

          {/* Ala Carte Section */}
          <div className="mt-4">
            {console.log("Ala Carte Orders:", alaCarteOrders)}
            <h3 className="font-semibold text-lg mb-2">Ala Carte Orders</h3>
            {alaCarteOrders.length === 0 ? (
              <p className="text-gray-500 text-center">
                No Order Details Found
              </p>
            ) : (
              alaCarteOrders.map((item) => (
                <EditableProductCard
                  key={getItemKey(item, { id: 1, name: "In-Store" })}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  discounts={discounts} // Pass discount options for Ala Carte
                  onDiscountChange={handleDiscountChange}
                />
              ))
            )}
          </div>
        </>
      ) : (
        // For Delivery orders, simply list the items using the same product card layout.
        <div>
          <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
          {localOrderDetails.length === 0 ? (
            <p className="text-gray-500 text-center">No Order Details Found</p>
          ) : (
            localOrderDetails.map((item) => (
              <EditableProductCard
                key={getItemKey(item, { id: 2, name: "Delivery" })}
                item={item}
                onQuantityChange={handleQuantityChange}
              />
            ))
          )}
          <div className="mt-4 text-right">
            <p>
              <strong>Percentage Deduction:</strong>{" "}
              {(deductionPercentage * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Footer with computed new subtotal and total */}
      <div className="border-t pt-2 mt-2">
        {menuType === "Grab" || menuType === "FoodPanda" ? (
          <>
            <div className="flex justify-between">
              <span>New Subtotal:</span>
              <span>₱{newSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>New Total:</span>
              <span>₱{newTotal.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span>New Subtotal:</span>
              <span>₱{newSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>New Total:</span>
              <span>₱{newTotal.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>
      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to cancel updating the order?"
              )
            ) {
              onCancelUpdate();
            }
          }}
          className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Cancel
        </button>
        <button
          onClick={() => onAddOrderDetails()}
          className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          Add Order Details
        </button>
      </div>
    </div>
  );
};

export default EditTransactionOrderSummary;
