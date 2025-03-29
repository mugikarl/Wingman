import React from "react";
import { getItemKey } from "../cards/OrderProductCard";
import EditableProductCard from "../cards/EditableProductCard";

const EditTransactionOrderSummary = ({
  orderDetails,
  finalTotal,
  onCancelUpdate,
  onAddOrderDetails,
  menuType,
  discounts,
  onQuantityChange, // Parent callback
  onDiscountChange, // Parent callback
  openDropdownId,
  setOpenDropdownId,
  deductionPercentage = 0,
}) => {
  // Compute orders directly from orderDetails prop.
  const alaCarteOrders = orderDetails.filter(
    (detail) => detail.instore_category?.id === 1
  );
  const unliWingsOrders = orderDetails.filter(
    (detail) => detail.instore_category?.id === 2
  );
  const groupedUnliWingsOrders = unliWingsOrders.reduce((acc, detail) => {
    const groupKey = detail.unli_wings_group || "Ungrouped";
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(detail);
    return acc;
  }, {});

  const newSubtotal = orderDetails.reduce((sum, item) => {
    const quantity = item.quantity || 0;
    if (item.instore_category?.id === 2) {
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

  const [openAccordion, setOpenAccordion] = React.useState({});

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative" style={{ width: "350px", height: "100%" }}>
      <div>
        <h2 className="text-xl font-bold">Order Summary</h2>
      </div>
      <div
        className="p-4 flex flex-col flex-grow overflow-y-auto"
        style={{ height: "calc(100% - 150px)" }}
      >
        {menuType === "In-Store" ? (
          <>
            <div>
              <button
                className="w-full flex justify-between items-center px-2 py-3 bg-gray-100 hover:bg-gray-200 rounded"
                onClick={() => toggleAccordion("alaCarte")}
              >
                <span className="font-semibold">
                  Ala Carte Orders - ₱
                  {alaCarteOrders
                    .reduce((sum, detail) => {
                      const price = detail.menu_item?.price || 0;
                      const quantity = detail.quantity || 0;
                      const discountPercentage = detail.discount
                        ? detail.discount.percentage
                        : 0;
                      return sum + price * quantity * (1 - discountPercentage);
                    }, 0)
                    .toFixed(2)}
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
                  Unli Wings Orders - ₱
                  {unliWingsOrders
                    .reduce((sum, detail) => {
                      const baseAmount =
                        detail.instore_category?.base_amount || 0;
                      const quantity = detail.quantity || 0;
                      return sum + baseAmount * quantity;
                    }, 0)
                    .toFixed(2)}
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
                      // Add a new unli wings order group.
                      // Find current groups.
                      const currentGroups = unliWingsOrders
                        .map((detail) => detail.unli_wings_group)
                        .filter((g) => g !== undefined)
                        .map(Number);
                      const newGroupNumber =
                        currentGroups.length > 0
                          ? Math.max(...currentGroups) + 1
                          : 1;
                      // Use base_amount from an existing unli wings order if available.
                      const baseAmount =
                        unliWingsOrders.length > 0
                          ? unliWingsOrders[0].instore_category.base_amount
                          : 0;
                      // Create a new group header detail with no menu_item.
                      const newDetail = {
                        id: Date.now(),
                        unli_wings_group: newGroupNumber,
                        instore_category: { id: 2, base_amount: baseAmount },
                        quantity: 0,
                        menu_item: null,
                        discount: { id: 0, type: "None", percentage: 0 },
                      };
                      // Update orderDetails by adding new detail.
                      // (Assuming onQuantityChange can be used to update parent's state for new items as well.)
                      onQuantityChange(newDetail, newDetail.quantity);
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
