import React, { useState, useEffect } from "react";
import axios from "axios";
import EditTransactionMenu from "../panels/EditTransactionMenu";
import EditTransactionOrderSummary from "../panels/EditTransactionOrderSummary";

const OrderEditModal = ({
  isOpen,
  onClose, // Called when editing is cancelled (to go back to TransactionModal)
  transaction,
  totalAmount, // Original transaction data passed from TransactionModal
  menuCategories,
  menuItems,
  discountsData,
  menuTypes,
  onUpdateComplete, // Callback when editing is finished and updated order details should be saved
  unliWingsCategory,
  employees,
}) => {
  if (!isOpen) return null;

  // Extract the current order details and menu type from transaction.
  const initialOrderDetails = transaction.order_details || [];
  const menuTypeId = transaction.order_details?.[0]?.menu_item?.type_id;
  const menuTypeData = menuTypes.find((type) => type.id === menuTypeId);
  const menuType = menuTypeData ? menuTypeData.name : "Unknown";

  // Local state to handle editing
  const [localOrderDetails, setLocalOrderDetails] =
    useState(initialOrderDetails);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState(null);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  // NEW: state for tracking which Unli Wings group is active for update.
  const [activeUnliWingsGroup, setActiveUnliWingsGroup] = useState(null);

  // Filter menu items based on the current menu type and selected category.
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesType = menuTypeData ? item.type_id === menuTypeData.id : true;
    const matchesCategory =
      selectedMenuCategory && selectedMenuCategory.id !== 0
        ? item.category_id === selectedMenuCategory.id
        : true;
    return matchesType && matchesCategory;
  });

  // When a menu item is clicked in the menu panel, either add it to or update the local order details.
  const onItemSelect = (menuItem) => {
    setLocalOrderDetails((prevDetails) => {
      const defaultDiscountId = 0;
      // If there is an active Unli Wings group, add the item to that group.
      if (activeUnliWingsGroup) {
        // Look for an existing item in the same group with the same menu item and default discount.
        const existingIndex = prevDetails.findIndex(
          (detail) =>
            detail.menu_item.id === menuItem.id &&
            detail.unli_wings_group === activeUnliWingsGroup &&
            (detail.discount?.id ?? 0) === defaultDiscountId
        );
        if (existingIndex !== -1) {
          const updated = [...prevDetails];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
          return updated;
        } else {
          // Get the base_amount from the existing group.
          const groupBaseAmount =
            prevDetails.find(
              (detail) =>
                detail.unli_wings_group === activeUnliWingsGroup &&
                detail.instore_category?.id === 2
            )?.instore_category?.base_amount ||
            unliWingsCategory?.base_amount ||
            0;

          // Create a new detail for Unli Wings group using the group's base amount.
          const newDetail = {
            id: Date.now(),
            menu_item: menuItem,
            quantity: 1,
            discount: { id: 0, type: "None", percentage: 0 },
            // Assign the active Unli Wings group and use the group's base_amount.
            unli_wings_group: activeUnliWingsGroup,
            instore_category: { id: 2, base_amount: groupBaseAmount },
          };
          return [...prevDetails, newDetail];
        }
      }

      // Otherwise, proceed as before.
      let existingIndex = -1;
      if (menuType === "In-Store") {
        existingIndex = prevDetails.findIndex(
          (detail) =>
            detail.menu_item.id === menuItem.id &&
            detail.instore_category?.id === 1 &&
            (detail.discount?.id ?? 0) === defaultDiscountId
        );
      } else if (menuType === "Grab" || menuType === "FoodPanda") {
        existingIndex = prevDetails.findIndex(
          (detail) =>
            detail.menu_item.id === menuItem.id &&
            (detail.discount?.id ?? 0) === defaultDiscountId
        );
      }

      if (existingIndex !== -1) {
        const updated = [...prevDetails];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      } else {
        const newDetail = {
          id: Date.now(),
          menu_item: menuItem,
          quantity: 1,
          discount: { id: 0, type: "None", percentage: 0 },
        };
        if (menuType === "In-Store") {
          newDetail.instore_category = { id: 1, base_amount: menuItem.price };
        }
        return [...prevDetails, newDetail];
      }
    });
  };

  // Handlers for changes inside the EditTransactionOrderSummary component.
  const handleQuantityChange = (changedItem, newQty) => {
    const quantity = Number(newQty);
    setLocalOrderDetails((prevDetails) => {
      if (quantity <= 0) {
        // Remove the item if quantity is zero or less.
        return prevDetails.filter((item) => item.id !== changedItem.id);
      }
      // Otherwise update the quantity.
      return prevDetails.map((item) =>
        item.id === changedItem.id ? { ...item, quantity } : item
      );
    });
  };

  const handleDiscountChange = (changedItem, newDiscountId) => {
    // (The merging logic remains unchanged.)
    const newDiscountObj = discountsData.find(
      (disc) => disc.id === newDiscountId
    ) || {
      id: 0,
      type: "None",
      percentage: 0,
    };

    setLocalOrderDetails((prevDetails) => {
      const duplicateIndex = prevDetails.findIndex((item) => {
        if (item.id === changedItem.id) return false;
        const sameMenuItem = item.menu_item.id === changedItem.menu_item.id;
        const sameDiscount = (item.discount?.id ?? 0) === newDiscountId;
        const sameCategory =
          changedItem.instore_category?.id === 1
            ? item.instore_category?.id === 1
            : true;
        return sameMenuItem && sameDiscount && sameCategory;
      });

      if (duplicateIndex !== -1) {
        const duplicateItem = prevDetails[duplicateIndex];
        const mergedQuantity = duplicateItem.quantity + changedItem.quantity;
        return prevDetails
          .filter((item) => item.id !== changedItem.id)
          .map((item) =>
            item.id === duplicateItem.id
              ? { ...item, quantity: mergedQuantity }
              : item
          );
      } else {
        return prevDetails.map((item) =>
          item.id === changedItem.id
            ? { ...item, discount: newDiscountObj }
            : item
        );
      }
    });
  };

  // Build and send the PUT request to update the order.
  const handleEditOrder = async () => {
    // Convert local order details into the format expected by your backend.
    const orderDetailsPayload = localOrderDetails.map((detail) => ({
      menu_id: detail.menu_item.id,
      quantity: detail.quantity,
      discount_id: detail.discount?.id || null,
      instore_category: detail.instore_category
        ? detail.instore_category.id
        : null,
      unli_wings_group: detail.unli_wings_group || null,
    }));

    const payload = {
      employee_id: transaction.employee.id,
      payment_method: transaction.payment_method.id,
      payment_amount: transaction.payment_amount,
      reference_id: transaction.reference_id,
      receipt_image: transaction.receipt_image,
      order_details: orderDetailsPayload,
    };

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-order/${transaction.id}/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        onUpdateComplete(response.data);
        onClose();
      } else {
        console.error("Failed to update order:", response.data);
      }
    } catch (error) {
      console.error(
        "Error updating order:",
        error.response ? error.response.data : error.message
      );
    }
  };

  // When the user clicks "Save", call our edit function.
  const handleAddOrderDetails = () => {
    handleEditOrder();
  };

  const handleCancel = () => {
    onClose();
  };

  const newSubtotal = localOrderDetails.reduce((sum, item) => {
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

  const newTotal = newSubtotal;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      {/* Modal Container */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-[800px] h-[650px] flex">
        {/* Left Panel: Menu */}
        <div className="w-1/2">
          <EditTransactionMenu
            menuCategories={menuCategories}
            isCatDropdownOpen={isCatDropdownOpen}
            setIsCatDropdownOpen={setIsCatDropdownOpen}
            selectedMenuCategory={selectedMenuCategory}
            setSelectedMenuCategory={setSelectedMenuCategory}
            filteredMenuItems={filteredMenuItems}
            onItemSelect={onItemSelect}
          />
        </div>
        {/* Right Panel: Order Summary */}
        <div className="w-1/2 border-l border-gray-300 pl-4">
          <EditTransactionOrderSummary
            orderDetails={localOrderDetails}
            finalTotal={newTotal}
            totalAmount={totalAmount}
            transaction={transaction}
            onCancelUpdate={handleCancel}
            handleEditOrder={handleEditOrder}
            menuType={menuType}
            discounts={discountsData}
            openDropdownId={null}
            onQuantityChange={handleQuantityChange}
            onDiscountChange={handleDiscountChange}
            setOpenDropdownId={() => {}}
            deductionPercentage={
              menuType === "Grab" || menuType === "FoodPanda"
                ? menuTypeData?.deduction_percentage || 0
                : 0
            }
            // Pass down the active Unli Wings group and its setter
            activeUnliWingsGroup={activeUnliWingsGroup}
            setActiveUnliWingsGroup={setActiveUnliWingsGroup}
            alaCarteOrders={localOrderDetails.filter(
              (detail) => detail.instore_category?.id === 1
            )}
            unliWingsCategory={unliWingsCategory}
            employees={employees}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
