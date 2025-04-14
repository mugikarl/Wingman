import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaMinus } from "react-icons/fa6";
import OrderProductCard from "../cards/OrderProductCard";
import OrderPayment from "../popups/OrderPayment";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useModal } from "../utils/modalUtils";

// Helper to create a composite key for an item
const getItemKey = (item, menuType) => {
  if (menuType?.id === 1 && item.instoreCategory === "Unli Wings") {
    return `${item.id}-unli-${item.orderNumber}-${String(item.discount || 0)}`;
  }
  return `${item.id}-${item.instoreCategory || "Ala Carte"}-${String(
    item.discount || 0
  )}`;
};

const getKeyFromParams = (id, groupIdentifier, discount, isUnli) => {
  if (isUnli) return `${id}-unli-${groupIdentifier}-${String(discount)}`;
  return `${id}-${groupIdentifier}-${String(discount)}`;
};

const OrderSummary = ({
  selectedItems,
  setSelectedItems,
  handleQuantityChange,
  handleRemoveItem,
  menuType,
  handleInstoreCategoryChange,
  handleDiscountChange,
  activeSection,
  setActiveSection,
  handleAddNewUnliOrder,
  discounts,
  onPlaceOrder,
  paymentMethods,
  currentUnliOrderNumber,
  inStoreCategories,
  employees,
}) => {
  const [localQuantities, setLocalQuantities] = useState({});
  const [isAlaCarteOpen, setIsAlaCarteOpen] = useState(false);
  const [isUnliWingsOpen, setIsUnliWingsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentButtonText, setPaymentButtonText] =
    useState("Proceed to Payment");
  const loadingIntervalRef = useRef(null);
  const deduction = menuType?.deduction_percentage || 0;
  const navigate = useNavigate();
  const { alert, confirm } = useModal();
  // Get Unli Wings base amount from inStoreCategories
  const unliCategory = inStoreCategories?.find(
    (cat) => cat.name === "Unli Wings" || cat.id === 2
  );
  const UNLI_BASE_AMOUNT = unliCategory && unliCategory.base_amount;

  // Update localQuantities from selectedItems:
  // If a key already exists and its value is an empty string (user cleared it),
  // we preserve the empty string. Otherwise, we update it to match the parent's quantity.
  useEffect(() => {
    const newQuantities = {};
    selectedItems.forEach((item) => {
      const key = getItemKey(item, menuType);
      newQuantities[key] = item.quantity.toString();
    });
    setLocalQuantities(newQuantities);
  }, [selectedItems, menuType]);

  useEffect(() => {
    if (menuType) {
      setIsAlaCarteOpen(true);
    }
  }, [menuType]);

  // Group Unli Wings items
  const unliItems = selectedItems.filter(
    (item) =>
      menuType?.id === 1 &&
      item.instoreCategory === "Unli Wings" &&
      item.orderNumber !== undefined
  );
  const groupedUnliOrders = unliItems.reduce((groups, item) => {
    const orderKey = item.orderNumber;
    if (!groups[orderKey]) groups[orderKey] = [];
    groups[orderKey].push(item);
    return groups;
  }, {});

  // Group Ala Carte items
  const alaCarteItems =
    menuType?.id === 1
      ? selectedItems.filter((item) => item.instoreCategory === "Ala Carte")
      : selectedItems;

  const calculateSubtotal = () => {
    if (!menuType || menuType.id !== 1) {
      return selectedItems.reduce((total, item) => {
        const discountOption = discounts.find((d) => d.id === item.discount);
        const discountDecimal = discountOption ? discountOption.percentage : 0;
        const subtotal = item.price * item.quantity;
        const totalForItem = subtotal - subtotal * discountDecimal;
        return total + totalForItem;
      }, 0);
    } else {
      // For In‑Store orders, similar logic applies for Ala Carte items.
      let subtotal = 0;
      Object.keys(groupedUnliOrders).forEach(() => {
        subtotal += Number(UNLI_BASE_AMOUNT) || 0;
      });
      alaCarteItems.forEach((item) => {
        const discountOption = discounts.find((d) => d.id === item.discount);
        const discountDecimal = discountOption ? discountOption.percentage : 0;
        const sub = item.price * item.quantity;
        subtotal += sub - sub * discountDecimal;
      });
      return subtotal;
    }
  };

  // When the text field is cleared, allow it to remain empty.
  const handleBlur = (id, groupIdentifier, discount) => {
    const isUnli = menuType?.id === 1 && activeSection === "unliWings";
    const key = getKeyFromParams(id, groupIdentifier, discount, isUnli);
    const inputVal = localQuantities[key];
    // If the field is empty, interpret it as 0 (i.e. removal)
    if (inputVal === "") {
      handleQuantityChange(id, groupIdentifier, discount, 0);
      return;
    }
    const newQuantity = parseInt(inputVal, 10);
    if (isNaN(newQuantity)) {
      const currentItem = selectedItems.find((i) => {
        if (menuType?.id === 1 && i.instoreCategory === "Unli Wings") {
          return i.id === id && i.orderNumber === groupIdentifier;
        }
        return i.id === id && i.instoreCategory === groupIdentifier;
      });
      setLocalQuantities((prev) => ({
        ...prev,
        [key]: currentItem ? currentItem.quantity.toString() : "1",
      }));
    } else {
      handleQuantityChange(id, groupIdentifier, discount, newQuantity);
    }
  };

  const onLocalQuantityChange = (key, value) => {
    setLocalQuantities((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const currentOrderKey = currentUnliOrderNumber
    ? String(currentUnliOrderNumber)
    : "1";

  const allOrderKeys = Array.from(
    new Set([...Object.keys(groupedUnliOrders), currentOrderKey])
  ).sort((a, b) => Number(a) - Number(b));

  // Wrapped quantity change: if new quantity is ≤ 0, remove the item.
  const wrappedHandleQuantityChange = (
    id,
    groupIdentifier,
    discount,
    newQuantity
  ) => {
    handleQuantityChange(id, groupIdentifier, discount, newQuantity);
  };

  // Default onPlaceOrder if not provided
  const defaultOnPlaceOrder = (paymentMethod, cashReceived) => {
    console.log("Placing order with:", paymentMethod, cashReceived);
  };

  // Add a new function to check inventory for all items
  const checkInventoryBeforePayment = async () => {
    if (selectedItems.length === 0) {
      await alert(
        "Please add at least one item before proceeding to payment",
        "Error"
      );
      return false;
    }

    // Group items by ID and sum quantities to check total amounts needed
    const itemQuantityMap = {};
    selectedItems.forEach((item) => {
      if (!itemQuantityMap[item.id]) {
        itemQuantityMap[item.id] = 0;
      }
      itemQuantityMap[item.id] += item.quantity;
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
              selectedItems.find((item) => item.id.toString() === menuId)
                ?.name || "Unknown item";

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

  // Add this effect to handle the loading animation
  useEffect(() => {
    if (isPaymentLoading) {
      let dotCount = 0;
      loadingIntervalRef.current = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setPaymentButtonText(`Processing${dots}`);
        dotCount++;
      }, 500);
    } else {
      setPaymentButtonText("Proceed to Payment");
    }

    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isPaymentLoading]);

  // Modify the button click handler
  const handleProceedToPayment = async () => {
    if (selectedItems.length === 0) {
      await alert(
        "Please add at least one item before proceeding to payment",
        "Error"
      );
      return;
    }

    setIsPaymentLoading(true);

    try {
      // Check inventory before opening payment modal
      const canProceed = await checkInventoryBeforePayment();
      if (canProceed) {
        setIsPaymentOpen(true);
      }
    } finally {
      setIsPaymentLoading(false);
    }
  };

  return (
    <div className="w-[30%] bg-white shadow-lg flex flex-col h-full rounded-l-sm relative">
      {/* Title */}
      <div className="text-center font-bold text-xl border-b-[1px] pb-3 pt-4 bg-gray-50">
        Order Summary
      </div>

      {/* Scrollable content container */}
      <div className="flex-grow overflow-y-auto px-4 py-2">
        {menuType?.id !== 1 ? (
          // For non-In-Store orders (Grab/FoodPanda), render product cards immediately.
          <div className="mt-2">
            <div className="space-y-3">
              {selectedItems.length === 0 ? (
                <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-sm mt-4">
                  <p>No Order Details Added</p>
                  <p className="text-xs mt-2">Add items from the menu</p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <OrderProductCard
                    key={getItemKey(item, menuType)}
                    item={item}
                    menuType={menuType}
                    localQuantity={
                      localQuantities[getItemKey(item, menuType)] !== undefined
                        ? localQuantities[getItemKey(item, menuType)]
                        : item.quantity.toString()
                    }
                    onLocalQuantityChange={onLocalQuantityChange}
                    handleBlur={handleBlur}
                    handleQuantityChange={wrappedHandleQuantityChange}
                    handleInstoreCategoryChange={handleInstoreCategoryChange}
                    handleDiscountChange={handleDiscountChange}
                    discounts={discounts}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Ala Carte Accordion for In-Store */}
            <div className="mt-3">
              <button
                onClick={() => {
                  setIsAlaCarteOpen(!isAlaCarteOpen);
                  setActiveSection("alaCarte");
                }}
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-sm transition-all duration-200"
              >
                <span className="font-semibold">Ala Carte</span>
                {isAlaCarteOpen ? (
                  <FaMinus className="text-gray-600" />
                ) : (
                  <FaPlus className="text-gray-600" />
                )}
              </button>
              {isAlaCarteOpen && (
                <div className="p-3 space-y-3 mt-2">
                  {alaCarteItems.length === 0 ? (
                    <div className="text-gray-500 text-center py-6 bg-gray-50 rounded-sm">
                      <p>No Order Details Added</p>
                      <p className="text-xs mt-2">Add items from the menu</p>
                    </div>
                  ) : (
                    alaCarteItems.map((item) => (
                      <OrderProductCard
                        key={getItemKey(item, menuType)}
                        item={item}
                        menuType={menuType}
                        localQuantity={
                          localQuantities[getItemKey(item, menuType)] !==
                          undefined
                            ? localQuantities[getItemKey(item, menuType)]
                            : item.quantity.toString()
                        }
                        onLocalQuantityChange={onLocalQuantityChange}
                        handleBlur={handleBlur}
                        handleQuantityChange={wrappedHandleQuantityChange}
                        handleInstoreCategoryChange={
                          handleInstoreCategoryChange
                        }
                        handleDiscountChange={handleDiscountChange}
                        discounts={discounts}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Unli Wings Accordion for In-Store */}
            {menuType?.id === 1 && (
              <div className="mt-3 mb-4">
                <button
                  onClick={() => {
                    setIsUnliWingsOpen(!isUnliWingsOpen);
                    setActiveSection(
                      isUnliWingsOpen ? "alaCarte" : "unliWings"
                    );
                  }}
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-sm transition-all duration-200"
                >
                  <span className="font-semibold">Unli Wings</span>
                  {isUnliWingsOpen ? (
                    <FaMinus className="text-gray-600" />
                  ) : (
                    <FaPlus className="text-gray-600" />
                  )}
                </button>
                {isUnliWingsOpen && (
                  <div className="p-3 space-y-3 mt-2">
                    {activeSection === "unliWings" && (
                      <button
                        className="w-full py-2 bg-[#CC5500] text-white rounded-sm font-medium hover:bg-[#B34A00] transition-colors duration-200"
                        onClick={handleAddNewUnliOrder}
                      >
                        Add New Unli Order
                      </button>
                    )}
                    {allOrderKeys.map((orderNumber) => (
                      <div
                        key={orderNumber}
                        className="mb-4 border-b-[1px] pb-3 last:border-0"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm mb-2">
                            Unli Wings #{orderNumber}
                          </h4>
                          <div className="px-2 py-1 bg-[#CC5500] bg-opacity-10 text-[#B34A00] text-xs rounded-sm font-medium">
                            ₱{UNLI_BASE_AMOUNT}
                          </div>
                        </div>
                        {groupedUnliOrders[orderNumber] &&
                        groupedUnliOrders[orderNumber].length > 0 ? (
                          <div className="space-y-3 mt-2">
                            {groupedUnliOrders[orderNumber].map((item) => (
                              <OrderProductCard
                                key={getItemKey(item, menuType)}
                                item={item}
                                menuType={menuType}
                                localQuantity={
                                  localQuantities[
                                    getItemKey(item, menuType)
                                  ] !== undefined
                                    ? localQuantities[
                                        getItemKey(item, menuType)
                                      ]
                                    : item.quantity.toString()
                                }
                                onLocalQuantityChange={onLocalQuantityChange}
                                handleBlur={(id, group, discount) =>
                                  handleBlur(id, item.orderNumber, discount)
                                }
                                handleQuantityChange={
                                  wrappedHandleQuantityChange
                                }
                                handleInstoreCategoryChange={
                                  handleInstoreCategoryChange
                                }
                                handleDiscountChange={handleDiscountChange}
                                discounts={discounts}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-center py-4 bg-gray-50 rounded-sm mt-2">
                            <p>No Order Details Added</p>
                            <p className="text-xs mt-1">
                              Add wings to this order
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with totals */}
      <div className="bg-gray-50 p-5 rounded-t-sm shadow-inner">
        <div className="space-y-3 mb-4 border-b-[1px] pb-3">
          <div className="flex justify-between">
            {menuType?.id === 1 ? (
              <span className="text-gray-600">Discount:</span>
            ) : (
              <span className="text-gray-600">
                Deduction ({(deduction * 100).toFixed(0)}%):
              </span>
            )}
            <span className="font-medium">
              {menuType?.id === 1
                ? (() => {
                    // Calculate total discount for in-store orders
                    let totalDiscount = 0;

                    // Calculate discount for ala carte items
                    alaCarteItems.forEach((item) => {
                      const discountOption = discounts.find(
                        (d) => d.id === item.discount
                      );
                      if (discountOption) {
                        const discountAmount =
                          item.price *
                          item.quantity *
                          discountOption.percentage;
                        totalDiscount += discountAmount;
                      }
                    });

                    return `- ₱${totalDiscount.toFixed(2)}`;
                  })()
                : `₱${(calculateSubtotal() * deduction).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {menuType?.id === 1 ? "Subtotal:" : "Total Amount to be Paid:"}
            </span>
            <span className="font-medium">
              ₱{calculateSubtotal().toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>{menuType?.id === 1 ? "Total:" : "Total Sales:"}</span>
          <span className="text-green-500">
            {menuType?.id === 1
              ? `₱${calculateSubtotal().toFixed(2)}`
              : `₱${(
                  calculateSubtotal() -
                  calculateSubtotal() * deduction
                ).toFixed(2)}`}
          </span>
        </div>
        <button
          className={`w-full ${
            isPaymentLoading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
          } text-white py-3 mt-5 rounded-sm font-bold shadow-md transition-colors duration-200`}
          onClick={handleProceedToPayment}
          disabled={isPaymentLoading}
        >
          {paymentButtonText}
        </button>
      </div>

      {/* Render OrderPayment modal */}
      {isPaymentOpen && (
        <OrderPayment
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
          }}
          totalAmount={
            menuType?.id === 1 ? calculateSubtotal() : calculateSubtotal()
          }
          onPlaceOrder={onPlaceOrder || defaultOnPlaceOrder}
          paymentMethods={paymentMethods}
          employees={employees}
        />
      )}
    </div>
  );
};

export default OrderSummary;
