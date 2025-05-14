import React, { useState, useEffect, useRef } from "react";
import { getItemKey } from "../cards/OrderProductCard";
import EditableProductCard from "../cards/EditableProductCard";
import OrderEditPayment from "../popups/OrderEditPayment";
import axios from "axios";
import { useModal } from "../utils/modalUtils";

const EditTransactionOrderSummary = ({
  orderDetails,
  finalTotal, // (You might recalc final total later)
  totalAmount,
  handleEditOrder, // Passed from OrderEditModal
  onUpdateComplete,
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
  // Additional props for payment modal:
  transaction,
  paymentMethods,
  employees,
  fetchOrderData,
}) => {
  const [openAccordion, setOpenAccordion] = useState({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [buttonText, setButtonText] = useState("Save All Changes"); // Button text state
  const loadingIntervalRef = useRef(null); // Ref for the loading interval
  const { alert, confirm } = useModal();
  // Compute orders directly from orderDetails prop.
  const alaCarteOrders = orderDetails.filter(
    (detail) => detail.instore_category?.id === 1
  );
  const unliWingsOrders = orderDetails.filter(
    (detail) => detail.instore_category?.id === 2
  );

  // Group the Unli Wings orders by group.
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
  const getUnliWingsBaseAmount = (groupOrders) => {
    if (groupOrders.length > 0) {
      // First try to get the direct base_amount property
      const storedBaseAmount = groupOrders[0]?.base_amount;
      if (storedBaseAmount !== undefined && storedBaseAmount !== null) {
        return storedBaseAmount;
      }
      // Then fall back to the instore_category.base_amount
      return groupOrders[0]?.instore_category?.base_amount;
    }
    return unliWingsCategory?.base_amount;
  };

  // Calculate subtotal for Ala Carte orders.
  const alaCarteSubtotal = alaCarteOrders.reduce((sum, item) => {
    const price = item.menu_item?.price || 0;
    const quantity = item.quantity || 0;
    const discountPercentage = item.discount ? item.discount.percentage : 0;
    return sum + price * quantity * (1 - discountPercentage);
  }, 0);

  // For Unli Wings orders, add the base_amount once per unique group.
  const uniqueUnliWingsGroups = Array.from(
    new Set(unliWingsOrders.map((item) => item.unli_wings_group))
  ).filter((g) => g);
  const unliWingsSubtotal = uniqueUnliWingsGroups.reduce((sum, groupKey) => {
    const groupOrders = groupedUnliWingsOrders[groupKey] || [];
    const baseAmount = getUnliWingsBaseAmount(groupOrders);
    return sum + (baseAmount || 0);
  }, 0);

  // Overall subtotal.
  const newSubtotal =
    menuType === "Grab" || menuType === "FoodPanda"
      ? orderDetails.reduce((sum, item) => {
          if (item.instore_category?.id === 2) {
            // For Unli Wings in delivery, we should add the base amount once per group
            const groupKey = item.unli_wings_group || "Ungrouped";
            // Check if we're the first item in this group being processed
            const isFirstItemInGroup =
              orderDetails.findIndex(
                (detail) =>
                  detail.unli_wings_group === groupKey &&
                  detail.instore_category?.id === 2
              ) === orderDetails.indexOf(item);

            if (isFirstItemInGroup) {
              const base = unliWingsCategory?.base_amount || 0;
              return sum + base;
            }
            return sum; // Skip other items in the same group
          } else {
            const price = item.menu_item?.price || 0;
            const quantity = item.quantity || 0;
            const discount = item.discount ? item.discount.percentage : 0;
            return sum + price * quantity * (1 - discount);
          }
        }, 0)
      : alaCarteSubtotal + unliWingsSubtotal;

  // For payment purposes, we use the full subtotal without any deductions
  const newTotal = newSubtotal;

  // Track deduction separately for reporting only
  const deductionAmount =
    menuType === "Grab" || menuType === "FoodPanda"
      ? newSubtotal * deductionPercentage
      : 0;

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateOriginalOrderPrice = () => {
    // Handle Ala Carte items
    const alaCarteTotal = transaction.order_details
      .filter((detail) => detail.instore_category?.id === 1)
      .reduce((sum, detail) => {
        const price = detail.menu_item?.price || 0;
        const quantity = detail.quantity || 0;
        const discount = detail.discount?.percentage || 0;
        return sum + price * quantity * (1 - discount);
      }, 0);

    // Handle Unli Wings - calculate once per group
    const unliWingsGroups = {};
    transaction.order_details
      .filter((detail) => detail.instore_category?.id === 2)
      .forEach((detail) => {
        const group = detail.unli_wings_group || "default";
        if (!unliWingsGroups[group]) {
          unliWingsGroups[group] = detail.instore_category?.base_amount || 0;
        }
      });

    const unliWingsTotal = Object.values(unliWingsGroups).reduce(
      (sum, amount) => sum + amount,
      0
    );

    return alaCarteTotal + unliWingsTotal;
  };

  const hasOrderChanges = () => {
    // 1. Compare total number of items
    if (orderDetails.length !== transaction.order_details.length) return true;

    // 2. Check if any item quantities changed
    for (const detail of orderDetails) {
      // Find matching item in original transaction
      const originalItem = transaction.order_details.find(
        (item) =>
          item.menu_item.id === detail.menu_item.id &&
          item.unli_wings_group === detail.unli_wings_group &&
          (item.discount?.id || 0) === (detail.discount?.id || 0)
      );

      // If no matching item or quantity changed, there is a change
      if (!originalItem || originalItem.quantity !== detail.quantity) {
        return true;
      }
    }

    // 3. Check if items were removed
    for (const detail of transaction.order_details) {
      const matchingItem = orderDetails.find(
        (item) =>
          item.menu_item.id === detail.menu_item.id &&
          item.unli_wings_group === detail.unli_wings_group &&
          (item.discount?.id || 0) === (detail.discount?.id || 0)
      );

      if (!matchingItem) {
        return true;
      }
    }

    // No changes detected
    return false;
  };

  const hasNewUnliWingsGroup = Object.keys(groupedUnliWingsOrders).some(
    (group) =>
      !transaction.order_details.some(
        (detail) => detail.unli_wings_group === Number(group)
      )
  );

  const requiresPayment =
    hasNewUnliWingsGroup || newTotal > calculateOriginalOrderPrice();

  // Function to check inventory for all items before saving changes
  const checkInventoryBeforeSave = async () => {
    if (orderDetails.length === 0) {
      await alert(
        "Please add at least one item before saving changes",
        "Error"
      );
      return false;
    }

    // Group items by ID and sum quantities to check total amounts needed
    const itemQuantityMap = {};
    orderDetails.forEach((item) => {
      if (!itemQuantityMap[item.menu_item.id]) {
        itemQuantityMap[item.menu_item.id] = 0;
      }
      itemQuantityMap[item.menu_item.id] += item.quantity;
    });

    // Check inventory for each menu item
    let allItemsAvailable = true;
    let warningMessages = [];

    try {
      // Check each item's inventory
      for (const [menuId, quantity] of Object.entries(itemQuantityMap)) {
        const response = await axios.get(
          `http://127.0.0.1:8000/check-menu-inventory/${menuId}?quantity=${quantity}`
        );

        if (response.data.has_sufficient_inventory === false) {
          const warnings = response.data.warnings || [];

          if (warnings.length > 0) {
            // Find the menu item name
            const itemName =
              orderDetails.find(
                (item) => item.menu_item.id.toString() === menuId
              )?.menu_item.name || "Unknown item";

            // Add to warning messages
            warnings.forEach((w) => {
              warningMessages.push(
                `${itemName}: ${w.inventory_name} - ${w.available_quantity} ${w.unit} available, ${w.required_quantity} ${w.unit} needed`
              );
            });

            allItemsAvailable = false;
          }
        }
      }

      // If there are warnings, show them all together
      if (!allItemsAvailable) {
        const proceed = await confirm(
          `Warning: Some items may exceed available inventory! Insufficient ingredients will default to 0 quantity.\n\n${warningMessages.join(
            "\n"
          )}\n\nDo you want to continue?`,
          "Warning"
        );
        return proceed;
      }
      return true;
    } catch (error) {
      console.error("Error checking inventory:", error);
      const proceed = await confirm(
        "Error checking inventory. If you proceed, items with insufficient ingredients will have quantity set to 0. Do you want to continue anyway?",
        "Error"
      );
      return proceed;
    }
  };

  // Effect to handle the loading animation
  useEffect(() => {
    if (isLoading) {
      let dotCount = 0;
      loadingIntervalRef.current = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setButtonText(`Processing${dots}`);
        dotCount++;
      }, 500);
    } else {
      setButtonText(requiresPayment ? "Complete Order" : "Save All Changes");
    }

    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoading, requiresPayment]);

  // Modify the "Save All Changes" button click handler
  const handleSaveAllChanges = async () => {
    setIsLoading(true);

    try {
      // Check inventory before saving changes
      const canProceed = await checkInventoryBeforeSave();
      if (canProceed) {
        if (requiresPayment) {
          setIsPaymentModalOpen(true);
        } else {
          // Create a payload object for the edit
          const payload = {
            employee_id: transaction.employee.id,
            payment_method: transaction.payment_method.id,
            payment_amount: transaction.payment_amount,
            reference_id: transaction.reference_id,
            receipt_image: transaction.receipt_image,
            // Pass the current orderDetails so handleEditOrder can use them
            order_details: orderDetails,
          };
          handleEditOrder(payload);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
        <div>
          <h2 className="text-xl font-bold">Order Summary</h2>
        </div>
        <div className="p-4 flex flex-col flex-grow overflow-y-auto">
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
                          {isActive ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setActiveUnliWingsGroup(null);
                                }}
                                className="px-2 py-1 rounded text-xs bg-red-500 text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  // Don't call handleEditOrder here - just exit edit mode
                                  setActiveUnliWingsGroup(null);
                                }}
                                className="px-2 py-1 rounded text-xs bg-green-500 text-white"
                              >
                                Done Editing
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveUnliWingsGroup(Number(groupKey));
                              }}
                              className="px-2 py-1 rounded text-xs bg-orange-500 text-white"
                            >
                              Update
                            </button>
                          )}
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
                          base_amount: baseAmount, // Store directly as well
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
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        {menuType === "Grab" || menuType === "FoodPanda" ? (
          <>
            {/* Section for Total Amount to be Paid - without applying deduction to payment */}
            <div className="">
              <div className="flex justify-between">
                <span className="">Subtotal:</span>
                <span className="font-bold">₱{newSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-sm">
                <span className="">
                  Platform Deduction ({(deductionPercentage * 100).toFixed(0)}
                  %):
                </span>
                <span className="">₱{deductionAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-2 font-bold">
                <span className="">Total Amount to be Paid:</span>
                <span className="">₱{newTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between gap-2 mt-4">
                <button
                  className="w-1/2 px-3 py-2 bg-red-500 text-white rounded"
                  onClick={onCancelUpdate}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAllChanges}
                  className={`w-1/2 px-3 py-2 rounded text-white ${
                    !hasOrderChanges() || isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500"
                  }`}
                  disabled={!hasOrderChanges() || isLoading}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="flex justify-between mb-1">
              <span>Subtotal:</span>
              <span>₱{newSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount:</span>
              <span>₱{newTotal.toFixed(2)}</span>
            </div>
            <div className="flex w-full mt-4">
              <button
                onClick={handleSaveAllChanges}
                className={`w-full px-3 py-2 rounded text-white ${
                  activeUnliWingsGroup || !hasOrderChanges() || isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500"
                }`}
                disabled={
                  activeUnliWingsGroup || !hasOrderChanges() || isLoading
                }
              >
                {buttonText}
              </button>
            </div>
          </div>
        )}
      </div>
      <OrderEditPayment
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        transaction={transaction}
        totalAmount={transaction.payment_amount}
        finalTotal={newTotal}
        onUpdateComplete={(data) => {
          console.log("Update complete:", data);
          onUpdateComplete && onUpdateComplete(data);
        }}
        handleEditOrder={handleEditOrder}
        paymentMethods={paymentMethods}
        employees={employees}
        fetchOrderData={fetchOrderData}
      />
    </div>
  );
};

export default EditTransactionOrderSummary;
