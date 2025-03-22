import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus } from "react-icons/fa6";
import OrderProductCard from "../cards/OrderProductCard";
import OrderPayment from "../popups/OrderPayment";

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
  const deduction = menuType?.deduction_percentage || 0;

  // Get Unli Wings base amount from inStoreCategories
  const unliCategory = inStoreCategories?.find(
    (cat) => cat.name === "Unli Wings" || cat.id === 2
  );
  const UNLI_BASE_AMOUNT = unliCategory && unliCategory.base_amount;

  // Update localQuantities from selectedItems:
  // If a key already exists and its value is an empty string (user cleared it),
  // we preserve the empty string. Otherwise, we update it to match the parent's quantity.
  useEffect(() => {
    setLocalQuantities((prevQuantities) => {
      const newQuantities = {};
      selectedItems.forEach((item) => {
        const key = getItemKey(item, menuType);
        // If the previous value is "", preserve it; otherwise update.
        newQuantities[key] =
          prevQuantities[key] === "" ? "" : item.quantity.toString();
      });
      return newQuantities;
    });
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
        const discountFactor = 1 - (item.discount || 0) / 100;
        return total + item.price * item.quantity * discountFactor;
      }, 0);
    } else {
      let subtotal = 0;
      Object.keys(groupedUnliOrders).forEach(() => {
        subtotal += Number(UNLI_BASE_AMOUNT) || 0;
      });
      alaCarteItems.forEach((item) => {
        const discountFactor = 1 - (item.discount || 0) / 100;
        subtotal += item.price * item.quantity * discountFactor;
      });
      return subtotal;
    }
  };

  // When the text field is cleared, allow it to remain empty.
  const handleBlur = (id, groupIdentifier, discount) => {
    const isUnli = menuType?.id === 1 && activeSection === "unliWings";
    const key = getKeyFromParams(id, groupIdentifier, discount, isUnli);
    const inputVal = localQuantities[key];
    if (inputVal === "") {
      // Do nothing so that the textbox remains empty.
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
    if (newQuantity <= 0) {
      setSelectedItems((prevItems) =>
        prevItems.filter((item) => {
          if (item.id !== id) return true;
          if (item.instoreCategory === "Unli Wings") {
            return !(
              item.orderNumber === groupIdentifier &&
              Number(item.discount || 0) === Number(discount)
            );
          }
          return !(
            item.instoreCategory === groupIdentifier &&
            Number(item.discount || 0) === Number(discount)
          );
        })
      );
      return;
    }
    handleQuantityChange(id, groupIdentifier, discount, newQuantity);
  };

  // Default onPlaceOrder if not provided
  const defaultOnPlaceOrder = (paymentMethod, cashReceived) => {
    console.log("Placing order with:", paymentMethod, cashReceived);
  };

  return (
    <div className="w-1/4 bg-white p-4 flex flex-col h-full">
      {/* Title */}
      <div className="text-center font-bold text-lg border-b pb-2">
        Order Summary
      </div>

      {/* Scrollable content container */}
      <div className="flex-grow overflow-y-auto">
        {menuType?.id !== 1 ? (
          // For non-In-Store orders (Grab/FoodPanda), render product cards immediately.
          <div className="mt-4">
            <div className="p-3 border border-t-0 border-gray-300 space-y-4">
              {selectedItems.length === 0 ? (
                <p className="text-gray-500 text-center">
                  No Order Details Added
                </p>
              ) : (
                selectedItems.map((item) => (
                  <OrderProductCard
                    key={getItemKey(item, menuType)}
                    item={item}
                    menuType={menuType}
                    localQuantity={
                      localQuantities[getItemKey(item, menuType)] || "1"
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
            <div className="mt-4">
              <button
                onClick={() => {
                  setIsAlaCarteOpen(!isAlaCarteOpen);
                  setActiveSection("alaCarte");
                }}
                className="w-full flex justify-between items-center px-2 py-3 bg-gray-100 hover:bg-gray-200"
              >
                <span className="font-semibold">Ala Carte</span>
                {isAlaCarteOpen ? <FaMinus /> : <FaPlus />}
              </button>
              {isAlaCarteOpen && (
                <div className="p-3 border border-t-0 border-gray-300 space-y-4">
                  {alaCarteItems.length === 0 ? (
                    <p className="text-gray-500 text-center">
                      No Order Details Added
                    </p>
                  ) : (
                    alaCarteItems.map((item) => (
                      <OrderProductCard
                        key={getItemKey(item, menuType)}
                        item={item}
                        menuType={menuType}
                        localQuantity={
                          localQuantities[getItemKey(item, menuType)] || "1"
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
              <div className="mt-4">
                <button
                  onClick={() => {
                    setIsUnliWingsOpen(!isUnliWingsOpen);
                    setActiveSection(
                      isUnliWingsOpen ? "alaCarte" : "unliWings"
                    );
                  }}
                  className="w-full flex justify-between items-center px-2 py-3 bg-gray-100 hover:bg-gray-200"
                >
                  <span className="font-semibold">Unli Wings</span>
                  {isUnliWingsOpen ? <FaMinus /> : <FaPlus />}
                </button>
                {isUnliWingsOpen && (
                  <div className="p-3 border border-t-0 border-gray-300 space-y-4">
                    {activeSection === "unliWings" && (
                      <button
                        className="w-full py-2 bg-[#E88504] text-white rounded"
                        onClick={handleAddNewUnliOrder}
                      >
                        Add New Unli Order
                      </button>
                    )}
                    {allOrderKeys.map((orderNumber) => (
                      <div key={orderNumber} className="mb-4">
                        <h4 className="font-bold text-sm mb-2">
                          Unli Wings #{orderNumber}
                        </h4>
                        <p className="mb-2 text-sm text-gray-600">
                          Base Amount: ₱{UNLI_BASE_AMOUNT}
                        </p>
                        {groupedUnliOrders[orderNumber] &&
                        groupedUnliOrders[orderNumber].length > 0 ? (
                          groupedUnliOrders[orderNumber].map((item) => (
                            <OrderProductCard
                              key={getItemKey(item, menuType)}
                              item={item}
                              menuType={menuType}
                              localQuantity={
                                localQuantities[getItemKey(item, menuType)] ||
                                "1"
                              }
                              onLocalQuantityChange={onLocalQuantityChange}
                              handleBlur={(id, group, discount) =>
                                handleBlur(id, item.orderNumber, discount)
                              }
                              handleQuantityChange={wrappedHandleQuantityChange}
                              handleInstoreCategoryChange={
                                handleInstoreCategoryChange
                              }
                              handleDiscountChange={handleDiscountChange}
                              discounts={discounts}
                            />
                          ))
                        ) : (
                          <p className="text-gray-500 text-center">
                            No Order Details Added
                          </p>
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
      <div className="bg-gray-100 p-4 rounded-t-lg">
        <div className="flex justify-between mb-2">
          {menuType?.id === 1 ? (
            <span>Discount:</span>
          ) : (
            <span>Deduction ({(deduction * 100).toFixed(0)}%):</span>
          )}
          <span>
            {menuType?.id === 1
              ? "₱0.00"
              : `₱${(calculateSubtotal() * deduction).toFixed(2)}`}
          </span>
        </div>
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
                  calculateSubtotal() * deduction
                ).toFixed(2)}`}
          </span>
        </div>
        <button
          className="w-full bg-green-500 text-white py-2 mt-4 rounded"
          onClick={() => {
            if (selectedItems.length === 0) {
              alert(
                "Please add at least one item before proceeding to payment"
              );
              return;
            }
            setIsPaymentOpen(true);
          }}
        >
          Proceed to Payment
        </button>
      </div>

      {/* Render OrderPayment modal */}
      {isPaymentOpen && (
        <OrderPayment
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          totalAmount={
            menuType?.id === 1
              ? calculateSubtotal()
              : calculateSubtotal() - calculateSubtotal() * deduction
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
