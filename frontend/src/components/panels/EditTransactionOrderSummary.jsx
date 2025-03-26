import React, { useState, useEffect } from "react";
import { getItemKey } from "../cards/OrderProductCard";
import EditableProductCard from "../cards/EditableProductCard";

const EditTransactionOrderSummary = ({
  orderDetails,
  groupedUnliWingsOrders = {},
  alaCarteOrders = [],
  finalTotal,
  onCancelUpdate,
  onAddOrderDetails,
  menuType,
  discounts,
  openDropdownId,
  setOpenDropdownId,
  deductionPercentage = 0,
}) => {
  const [openAccordion, setOpenAccordion] = useState({});
  const [localOrderDetails, setLocalOrderDetails] = useState(orderDetails);

  useEffect(() => {
    console.log("Received orderDetails:", orderDetails);
    setLocalOrderDetails(orderDetails);
  }, [orderDetails]);

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  // Look up the full discount object from the discounts list
  const handleDiscountChange = (changedItem, newDiscountId) => {
    console.log(
      "Discount changed for",
      changedItem.menu_item?.name,
      "to",
      newDiscountId
    );
    const newDiscountObj =
      discounts.find((disc) => disc.id === newDiscountId) || null;
    const updated = localOrderDetails.map((item) => {
      if (item.id === changedItem.id) {
        return { ...item, discount: newDiscountObj };
      }
      return item;
    });
    setLocalOrderDetails(updated);
  };

  // Recalculate subtotal applying discount for each item from localOrderDetails.
  // For Unli Wings orders (instore_category id 2) use the base_amount instead.
  const newSubtotal = localOrderDetails.reduce((sum, item) => {
    const quantity = item.quantity || 0;
    if (item.instore_category?.id === 2) {
      // Use the base amount for Unli Wings orders.
      const baseAmount = item.instore_category?.base_amount || 0;
      return sum + baseAmount * quantity;
    } else {
      const price = item.menu_item?.price || 0;
      const discountPercentage = item.discount ? item.discount.percentage : 0;
      return sum + price * quantity * (1 - discountPercentage);
    }
  }, 0);

  const newTotal =
    menuType === "Grab" || menuType === "FoodPanda"
      ? newSubtotal - newSubtotal * deductionPercentage
      : newSubtotal;

  // Recalculate totals for each group from localOrderDetails.
  // For Ala Carte orders, use menu_item price with discount.
  const computedAlaCarteTotal = localOrderDetails
    .filter((detail) => detail.instore_category?.id === 1)
    .reduce((sum, detail) => {
      const price = detail.menu_item?.price || 0;
      const quantity = detail.quantity || 0;
      const discountPercentage = detail.discount
        ? detail.discount.percentage
        : 0;
      return sum + price * quantity * (1 - discountPercentage);
    }, 0);

  // For Unli Wings orders, use the base_amount instead.
  const computedUnliWingsTotal = localOrderDetails
    .filter((detail) => detail.instore_category?.id === 2)
    .reduce((sum, detail) => {
      const baseAmount = detail.instore_category?.base_amount || 0;
      const quantity = detail.quantity || 0;
      return sum + baseAmount * quantity;
    }, 0);

  return (
    <div className="relative" style={{ width: "350px", height: "100%" }}>
      <div className="">
        <h2 className="text-xl font-bold">Order Summary</h2>
      </div>
      <div
        className="p-4 flex flex-col flex-grow overflow-y-auto"
        style={{ height: "calc(100% - 150px)" }}
      >
        {menuType === "In-Store" ? (
          <>
            <div className="">
              <button
                className="w-full flex justify-between items-center px-2 py-3 bg-gray-100 hover:bg-gray-200 rounded"
                onClick={() => toggleAccordion("alaCarte")}
              >
                <span className="font-semibold">
                  Ala Carte Orders - ₱{computedAlaCarteTotal.toFixed(2)}
                </span>
                {openAccordion["alaCarte"] ? (
                  <span>&#9650;</span>
                ) : (
                  <span>&#9660;</span>
                )}
              </button>
              {openAccordion["alaCarte"] &&
                (alaCarteOrders.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    No Order Details Found
                  </p>
                ) : (
                  alaCarteOrders.map((item) => (
                    <EditableProductCard
                      key={getItemKey(item, { id: 1, name: "In-Store" })}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      discounts={discounts}
                      onDiscountChange={handleDiscountChange}
                    />
                  ))
                ))}
            </div>
            <div className="mt-2">
              <button
                className="w-full flex justify-between items-center px-2 py-3 bg-gray-100 hover:bg-gray-200 rounded"
                onClick={() => toggleAccordion("unliWings")}
              >
                <span className="font-semibold">
                  Unli Wings Orders - ₱{computedUnliWingsTotal.toFixed(2)}
                </span>
                {openAccordion["unliWings"] ? (
                  <span>&#9650;</span>
                ) : (
                  <span>&#9660;</span>
                )}
              </button>
              {openAccordion["unliWings"] &&
                Object.keys(groupedUnliWingsOrders).map((groupKey) => {
                  const groupOrders = groupedUnliWingsOrders[groupKey];
                  // For each unli group, use the base_amount from the instore_category
                  const baseAmount =
                    groupOrders[0]?.instore_category?.base_amount || 0;
                  return (
                    <div key={groupKey} className="border rounded mb-2 p-2">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm">
                          Unli Wings Order #{groupKey} - ₱
                          {baseAmount.toFixed(2)}
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
          </>
        ) : (
          <div>
            {localOrderDetails.length === 0 ? (
              <p className="text-gray-500 text-center">
                No Order Details Found
              </p>
            ) : (
              localOrderDetails.map((item) => (
                <EditableProductCard
                  key={getItemKey(item, { id: 2, name: "Delivery" })}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                />
              ))
            )}
          </div>
        )}
      </div>
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-2">
        {menuType === "Grab" || menuType === "FoodPanda" ? (
          <>
            <div className="flex justify-between">
              <span>New Subtotal:</span>
              <span>₱{newSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Percentage Deduction:</span>
              <span>{(deductionPercentage * 100).toFixed(2)}%</span>
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
        <div className="flex space-x-2 mt-2">
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
            className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            onClick={() => onAddOrderDetails()}
            className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 whitespace-nowrap"
          >
            Add Order Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionOrderSummary;
