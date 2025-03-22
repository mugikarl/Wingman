import React, { useState, useEffect } from "react";
import OrderProductCard from "../cards/OrderProductCard";
import OrderPayment from "../popups/OrderPayment";

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
}) => {
  const [localQuantities, setLocalQuantities] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  // New state for base amounts for Unli orders (keyed by orderNumber)
  const [baseAmounts, setBaseAmounts] = useState({});

  // State to control payment modal visibility
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Retrieve deduction percentage from menuType (default to 0)
  const deduction = menuType?.deduction_percentage || 0;

  // Update local quantities whenever selectedItems or menuType changes.
  useEffect(() => {
    const newQuantities = {};
    selectedItems.forEach((item) => {
      // Composite key: id, instoreCategory (or orderNumber for Unli orders), or "default"
      const key = `${item.id}-${
        menuType?.id === 1 && item.instoreCategory === "Unli Order"
          ? item.orderNumber
          : item.instoreCategory || "Ala Carte"
      }-${menuType?.id === 1 ? item.discount || 0 : 0}`;
      newQuantities[key] = item.quantity ? item.quantity.toString() : "1";
    });
    setLocalQuantities(newQuantities);
  }, [selectedItems, menuType]);

  // Group Unli items: those with instoreCategory "Unli Order"
  const unliItems = selectedItems.filter(
    (item) =>
      menuType?.id === 1 &&
      item.instoreCategory === "Unli Order" &&
      item.orderNumber !== undefined
  );
  // Group by orderNumber
  const groupedUnliOrders = unliItems.reduce((groups, item) => {
    const orderKey = item.orderNumber;
    if (!groups[orderKey]) groups[orderKey] = [];
    groups[orderKey].push(item);
    return groups;
  }, {});

  // Determine if there are any Unli items (used for enabling the "Add New Unli Order" button)
  const hasUnliItems = unliItems.length > 0;

  // Ala Carte items: items not in Unli orders.
  const alaCarteItems = selectedItems.filter(
    (item) => !item.instoreCategory || item.instoreCategory !== "Unli Order"
  );

  // Custom subtotal calculation:
  // For In‑Store orders (menuType.id === 1) in Unli mode:
  //   - Each Unli order's total is exactly the user‑entered base amount (ignoring individual item prices/quantities)
  //   - Ala Carte items are summed normally.
  // For non‑In‑Store orders, sum normally.
  const calculateSubtotal = () => {
    if (!menuType || menuType.id !== 1) {
      return selectedItems.reduce((total, item) => {
        const discountFactor = 1 - (item.discount || 0) / 100;
        return total + item.price * item.quantity * discountFactor;
      }, 0);
    } else {
      let subtotal = 0;
      // Sum each Unli order's base amount
      Object.entries(groupedUnliOrders).forEach(([orderNumber]) => {
        subtotal += Number(baseAmounts[orderNumber] || 0);
      });
      // Add Ala Carte items normally.
      alaCarteItems.forEach((item) => {
        const discountFactor = 1 - (item.discount || 0) / 100;
        subtotal += item.price * item.quantity * discountFactor;
      });
      return subtotal;
    }
  };

  const handleBlur = (id, groupIdentifier, discount) => {
    const key = `${id}-${groupIdentifier}-${discount}`;
    const inputVal = localQuantities[key];
    if (inputVal === "") {
      const currentItem = selectedItems.find(
        (i) =>
          i.id === id &&
          (menuType?.id === 1
            ? i.instoreCategory === "Unli Order"
              ? i.orderNumber === groupIdentifier
              : i.instoreCategory === groupIdentifier
            : true) &&
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
          (menuType?.id === 1
            ? i.instoreCategory === "Unli Order"
              ? i.orderNumber === groupIdentifier
              : i.instoreCategory === groupIdentifier
            : true) &&
          (menuType?.id === 1 ? Number(i.discount) === Number(discount) : true)
      );
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

  // Allow Unli mode only when the menu type is In‑Store (ID 1)
  const allowUnli = menuType?.id === 1;

  // Sample onPlaceOrder function if not passed as prop.
  const defaultOnPlaceOrder = (paymentMethod, cashReceived) => {
    console.log("Placing order with:", paymentMethod, cashReceived);
    // Add your order processing logic here.
  };

  return (
    <div className="w-1/4 bg-white p-4 flex flex-col justify-between overflow-hidden">
      <div className="text-center font-bold text-lg border-b pb-2">
        Order Summary
      </div>

      {/* Toggle Row for Active Section */}
      <div className="flex space-x-4 mt-4">
        <button
          className={`flex-1 py-2 rounded ${
            activeSection === "alaCarte"
              ? "bg-[#E88504] text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveSection("alaCarte")}
        >
          Ala Carte
        </button>
        {allowUnli && (
          <button
            className={`flex-1 py-2 rounded ${
              activeSection === "unli"
                ? "bg-[#E88504] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveSection("unli")}
          >
            Unli Order
          </button>
        )}
      </div>

      {/* Button to add a new Unli order, disabled if no Unli items exist yet */}
      {allowUnli && activeSection === "unli" && (
        <div className="mt-4">
          <button
            className={`w-full py-2 bg-[#E88504] text-white rounded ${
              !hasUnliItems ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleAddNewUnliOrder}
            disabled={!hasUnliItems}
          >
            Add New Unli Order
          </button>
        </div>
      )}

      <div className="flex-grow overflow-y-auto mt-4 mb-4 space-y-4">
        {activeSection === "alaCarte" && (
          <div>
            <h3 className="font-bold text-base mb-2">Ala Carte</h3>
            {alaCarteItems.length === 0 ? (
              <p className="text-gray-500 text-center">No items added.</p>
            ) : (
              <div className="space-y-4">
                {alaCarteItems.map((item) => (
                  <OrderProductCard
                    key={`${item.id}-${item.instoreCategory || "Ala Carte"}-${
                      item.discount || 0
                    }`}
                    item={item}
                    menuType={menuType}
                    localQuantity={
                      localQuantities[
                        `${item.id}-${item.instoreCategory || "Ala Carte"}-${
                          item.discount || 0
                        }`
                      ] || "1"
                    }
                    onLocalQuantityChange={onLocalQuantityChange}
                    handleBlur={handleBlur}
                    handleQuantityChange={handleQuantityChange}
                    handleInstoreCategoryChange={handleInstoreCategoryChange}
                    handleDiscountChange={handleDiscountChange}
                    openDropdownId={openDropdownId}
                    setOpenDropdownId={setOpenDropdownId}
                    discounts={discounts} // Pass discount data to OrderProductCard
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === "unli" && (
          <div>
            <h3 className="font-bold text-base mb-2">Unli Orders</h3>
            {Object.entries(groupedUnliOrders).length === 0 ? (
              <p className="text-gray-500 text-center">No Unli orders added.</p>
            ) : (
              Object.entries(groupedUnliOrders).map(([orderNumber, items]) => (
                <div key={orderNumber} className="mb-4">
                  <h4 className="font-bold text-sm mb-2">
                    Unli Order #{orderNumber}
                  </h4>
                  {/* Input for base amount for this Unli order */}
                  <div className="mb-2">
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={baseAmounts[orderNumber] || ""}
                      onChange={(e) =>
                        setBaseAmounts({
                          ...baseAmounts,
                          [orderNumber]: e.target.value,
                        })
                      }
                      placeholder="Enter base amount"
                    />
                  </div>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <OrderProductCard
                        key={`${item.id}-unli-${item.discount || 0}`}
                        item={item}
                        menuType={menuType}
                        localQuantity={
                          localQuantities[
                            `${item.id}-unli-${item.discount || 0}`
                          ] || "1"
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
                        openDropdownId={openDropdownId}
                        setOpenDropdownId={setOpenDropdownId}
                        discounts={discounts} // Pass discount data to OrderProductCard
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

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
