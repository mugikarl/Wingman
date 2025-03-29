import React from "react";
import { getItemKey } from "../cards/OrderProductCard";
import EditableProductCard from "../cards/EditableProductCard";

const EditTransactionOrderSummary = ({
  orderDetails,
  finalTotal, // (You might recalc final total later)
  onCancelUpdate,
  onAddOrderDetails,
  menuType,
  discounts,
  onQuantityChange, // Parent callback
  onDiscountChange, // Parent callback
  activeUnliWingsGroup, // NEW
  setActiveUnliWingsGroup,
  openDropdownId,
  setOpenDropdownId,
  deductionPercentage = 0,
  // unliWingsCategory is passed from the backend.
  unliWingsCategory,
}) => {
  // Compute orders directly from orderDetails prop.
  const alaCarteOrders = orderDetails.filter(
    (detail) => detail.instore_category?.id === 1
  );
  const unliWingsOrders = orderDetails.filter(
    (detail) => detail.instore_category?.id === 2
  );

  // Group the unli wings orders by group.
  const groupedUnliWingsOrders = unliWingsOrders.reduce((acc, detail) => {
    const groupKey = detail.unli_wings_group || "Ungrouped";
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(detail);
    return acc;
  }, {});

  // Ensure the active group is always present—even if empty.
  if (activeUnliWingsGroup && !groupedUnliWingsOrders[activeUnliWingsGroup]) {
    groupedUnliWingsOrders[activeUnliWingsGroup] = [];
  }

  // Helper: get the base amount for Unli Wings.
  // If there are existing orders in the group, use the first item's base_amount;
  // otherwise, use unliWingsCategory's base_amount (retrieved from the backend).
  const getUnliWingsBaseAmount = (groupOrders) => {
    if (groupOrders.length > 0) {
      return groupOrders[0]?.instore_category?.base_amount;
    }
    return unliWingsCategory?.base_amount;
  };

  // Calculate subtotal for Ala Carte orders as before.
  const alaCarteSubtotal = alaCarteOrders.reduce((sum, item) => {
    const price = item.menu_item?.price || 0;
    const quantity = item.quantity || 0;
    const discountPercentage = item.discount ? item.discount.percentage : 0;
    return sum + price * quantity * (1 - discountPercentage);
  }, 0);

  // For Unli Wings orders, we only add the base_amount once per unique group.
  const uniqueUnliWingsGroups = Array.from(
    new Set(unliWingsOrders.map((item) => item.unli_wings_group))
  ).filter((g) => g); // filter out falsy values if any

  const unliWingsSubtotal = uniqueUnliWingsGroups.reduce((sum, groupKey) => {
    const groupOrders = groupedUnliWingsOrders[groupKey] || [];
    const baseAmount = getUnliWingsBaseAmount(groupOrders);
    return sum + (baseAmount || 0);
  }, 0);

  // Overall subtotal: sum of ala carte and unli wings (flat fee per group)
  const newSubtotal =
    menuType === "Grab" || menuType === "FoodPanda"
      ? orderDetails.reduce((sum, item) => {
          if (item.instore_category?.id === 2) {
            // For Unli Wings orders, use the base amount from backend * quantity
            const base = unliWingsCategory?.base_amount || 0;
            return sum + base * (item.quantity || 0);
          } else {
            const price = item.menu_item?.price || 0;
            const quantity = item.quantity || 0;
            const discount = item.discount ? item.discount.percentage : 0;
            return sum + price * quantity * (1 - discount);
          }
        }, 0)
      : alaCarteSubtotal + unliWingsSubtotal;

  // For delivery menus, you might subtract a deduction percentage.
  const newTotal =
    menuType === "Grab" || menuType === "FoodPanda"
      ? newSubtotal - newSubtotal * deductionPercentage
      : newSubtotal;

  const [openAccordion, setOpenAccordion] = React.useState({});

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative w-[350px] h-full">
      <div>
        <h2 className="text-xl font-bold">Order Summary</h2>
      </div>
      <div className="p-4 flex flex-col flex-grow overflow-y-auto h-[calc(100%-150px)]">
        {menuType === "In-Store" ? (
          <>
            {/* Ala Carte Section */}
            <div>
              <button
                className="w-full flex justify-between items-center px-2 py-3 bg-gray-100 hover:bg-gray-200 rounded"
                onClick={() => toggleAccordion("alaCarte")}
              >
                <span className="font-semibold">
                  Ala Carte Orders - ₱{alaCarteSubtotal.toFixed(2)}
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
                      onQuantityChange={onQuantityChange}
                      discounts={discounts}
                      onDiscountChange={onDiscountChange}
                    />
                  ))
                ))}
            </div>
            {/* Unli Wings Section */}
            <div className="mt-2">
              <button
                className="w-full flex justify-between items-center px-2 py-3 bg-gray-100 hover:bg-gray-200 rounded"
                onClick={() => toggleAccordion("unliWings")}
              >
                <span className="font-semibold">
                  Unli Wings Orders - ₱{unliWingsSubtotal.toFixed(2)}
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
                  const baseAmount = getUnliWingsBaseAmount(groupOrders);
                  // Convert groupKey to a number for accurate comparison.
                  const isActive = Number(groupKey) === activeUnliWingsGroup;
                  return (
                    <div
                      key={groupKey}
                      className={`border rounded mb-2 p-2 ${
                        isActive ? "border-green-900" : "border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm">
                          Unli Wings Order #{groupKey} - ₱
                          {baseAmount && baseAmount.toFixed(2)}
                        </h4>
                        <button
                          onClick={() => {
                            if (isActive) {
                              setActiveUnliWingsGroup(null);
                            } else {
                              setActiveUnliWingsGroup(Number(groupKey));
                            }
                          }}
                          className={`px-2 py-1 rounded text-xs ${
                            isActive
                              ? "bg-green-500 text-white"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {isActive ? "Done" : "Update"}
                        </button>
                      </div>
                      {/* If there are no items, show a placeholder */}
                      {groupOrders.length === 0 && (
                        <p className="text-gray-500 text-center">
                          No items added yet
                        </p>
                      )}
                      {groupOrders.map((item) => (
                        <EditableProductCard
                          key={getItemKey(item, { id: 1, name: "In-Store" })}
                          item={item}
                          onQuantityChange={onQuantityChange}
                        />
                      ))}
                    </div>
                  );
                })}
              {/* Add New Unli Wings Order Button */}
              {openAccordion["unliWings"] && (
                <div className="mb-2">
                  <button
                    onClick={() => {
                      // Ensure the Unli Wings accordion is open.
                      setOpenAccordion((prev) => ({
                        ...prev,
                        unliWings: true,
                      }));
                      const currentGroups = unliWingsOrders
                        .map((detail) => detail.unli_wings_group)
                        .filter((g) => g !== undefined)
                        .map(Number);
                      const newGroupNumber =
                        currentGroups.length > 0
                          ? Math.max(...currentGroups) + 1
                          : 1;
                      // Always use the base_amount from unliWingsCategory (retrieved from backend)
                      const baseAmount = unliWingsCategory?.base_amount;
                      const newDetail = {
                        id: Date.now(),
                        unli_wings_group: newGroupNumber,
                        instore_category: { id: 2, base_amount: baseAmount },
                        quantity: 1,
                        menu_item: {
                          id: 0,
                          name: "New Unli Wings Order",
                          price: 0,
                        },
                        discount: { id: 0, type: "None", percentage: 0 },
                      };
                      onQuantityChange(newDetail, newDetail.quantity);
                      setActiveUnliWingsGroup(newGroupNumber);
                    }}
                    className="w-full px-3 py-2 bg-[#E88504] text-white rounded"
                  >
                    Add New Unli Wings Order
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div>
            {orderDetails.length === 0 ? (
              <p className="text-gray-500 text-center">
                No Order Details Found
              </p>
            ) : (
              orderDetails.map((item) => (
                <EditableProductCard
                  key={getItemKey(item, { id: 2, name: "Delivery" })}
                  item={item}
                  onQuantityChange={onQuantityChange}
                />
              ))
            )}
          </div>
        )}
      </div>
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-4">
        {menuType === "Grab" || menuType === "FoodPanda" ? (
          <>
            {/* Section for Total Amount to be Paid */}
            <div className="">
              <div className="flex justify-between">
                <span className="">Total Amount to be Paid:</span>
                <span className="font-bold">₱{newSubtotal.toFixed(2)}</span>
              </div>
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
