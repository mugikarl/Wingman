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
  handleDiscountChange,
  // from Order.jsx
  handleAddNewUnliOrder,
  currentUnliOrderNumber, // current unli order number from parent
  discounts,
  activeSection, // "alaCarte" or "unliWings"
  setActiveSection, // function to update activeSection
}) => {
  const [localQuantities, setLocalQuantities] = useState({});
  const [baseAmounts, setBaseAmounts] = useState({}); // base amounts for Unli orders

  // Accordion open/close states (default closed)
  const [isAlaCarteOpen, setIsAlaCarteOpen] = useState(false);
  const [isUnliWingsOpen, setIsUnliWingsOpen] = useState(false);

  // State to control payment modal visibility
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Deduction percentage (default to 0)
  const deduction = menuType?.deduction_percentage || 0;

  // Build localQuantities using consistent keys
  useEffect(() => {
    const newQuantities = {};
    selectedItems.forEach((item) => {
      const key = getItemKey(item, menuType);
      newQuantities[key] = item.quantity ? item.quantity.toString() : "1";
    });
    setLocalQuantities(newQuantities);
  }, [selectedItems, menuType]);

  // Group Unli Wings items (in-store only)
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
  const alaCarteItems = selectedItems.filter(
    (item) => item.instoreCategory === "Ala Carte"
  );

  // Calculate subtotal
  const calculateSubtotal = () => {
    if (!menuType || menuType.id !== 1) {
      return selectedItems.reduce((total, item) => {
        const discountFactor = 1 - (item.discount || 0) / 100;
        return total + item.price * item.quantity * discountFactor;
      }, 0);
    } else {
      let subtotal = 0;
      // Sum base amounts for all unli groups
      Object.entries(groupedUnliOrders).forEach(([orderNumber]) => {
        subtotal += Number(baseAmounts[orderNumber] || 0);
      });
      // Also add items in the Ala Carte group
      alaCarteItems.forEach((item) => {
        const discountFactor = 1 - (item.discount || 0) / 100;
        subtotal += item.price * item.quantity * discountFactor;
      });
      return subtotal;
    }
  };

  // Handle blur for quantity inputs
  const handleBlur = (id, groupIdentifier, discount) => {
    const isUnli = menuType?.id === 1 && activeSection === "unliWings";
    const key = getKeyFromParams(id, groupIdentifier, discount, isUnli);
    const inputVal = localQuantities[key];
    if (inputVal === "") {
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

  // Current order key as string from parent's currentUnliOrderNumber
  const currentOrderKey = currentUnliOrderNumber
    ? String(currentUnliOrderNumber)
    : "1";

  // Create a sorted array of all order keys (as strings)
  const allOrderKeys = Array.from(
    new Set([
      ...Object.keys(groupedUnliOrders), // order numbers with items
      currentOrderKey, // ensure current order key is included even if empty
    ])
  ).sort((a, b) => Number(a) - Number(b));

  // Sample onPlaceOrder function if not passed as prop.
  const defaultOnPlaceOrder = (paymentMethod, cashReceived) => {
    console.log("Placing order with:", paymentMethod, cashReceived);
    // Add your order processing logic here.
  };

  return (
    <div className="w-1/4 bg-white p-4 flex flex-col h-full">
      {/* Title */}
      <div className="text-center font-bold text-lg border-b pb-2">
        Order Summary
      </div>

      {/* Scrollable content container for accordions */}
      <div className="flex-grow overflow-y-auto">
        {/* -- ALA CARTE ACCORDION -- */}
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
                <p className="text-gray-500 text-center">No items added.</p>
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
                    handleQuantityChange={handleQuantityChange}
                    handleInstoreCategoryChange={handleInstoreCategoryChange}
                    handleDiscountChange={handleDiscountChange}
                    discounts={discounts}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* -- UNLI WINGS ACCORDION (Only if menuType is In-Store) -- */}
        {menuType?.id === 1 && (
          <div className="mt-4">
            <button
              onClick={() => {
                setIsUnliWingsOpen(!isUnliWingsOpen);
                if (!isUnliWingsOpen) {
                  setActiveSection("unliWings");
                } else {
                  setActiveSection("alaCarte");
                }
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
                {/* Render all Unli order groups in sorted order */}
                {allOrderKeys.map((orderNumber) => (
                  <div key={orderNumber} className="mb-4">
                    <h4 className="font-bold text-sm mb-2">
                      Unli Wings #{orderNumber}
                    </h4>
                    <div className="mb-2">
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={baseAmounts[orderNumber] || ""}
                        onChange={(e) =>
                          setBaseAmounts((prev) => ({
                            ...prev,
                            [orderNumber]: e.target.value,
                          }))
                        }
                        placeholder="Enter base amount"
                      />
                    </div>
                    {groupedUnliOrders[orderNumber] &&
                    groupedUnliOrders[orderNumber].length > 0 ? (
                      groupedUnliOrders[orderNumber].map((item) => (
                        <OrderProductCard
                          key={getItemKey(item, menuType)}
                          item={item}
                          menuType={menuType}
                          localQuantity={
                            localQuantities[getItemKey(item, menuType)] || "1"
                          }
                          onLocalQuantityChange={onLocalQuantityChange}
                          handleBlur={(id, group, discount) =>
                            handleBlur(id, item.orderNumber, discount)
                          }
                          handleQuantityChange={handleQuantityChange}
                          handleInstoreCategoryChange={
                            handleInstoreCategoryChange
                          }
                          handleDiscountChange={handleDiscountChange}
                          discounts={discounts}
                        />
                      ))
                    ) : (
                      <p className="text-gray-500 text-center">
                        No items added.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with totals (fixed) */}
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

      {/* Render the OrderPayment modal */}
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
        />
      )}
    </div>
  );
};

export default OrderSummary;
