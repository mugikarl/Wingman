import React, { useState, useEffect } from "react";
import EditTransactionMenu from "../panels/EditTransactionMenu";
import EditTransactionOrderSummary from "../panels/EditTransactionOrderSummary";

const OrderEditModal = ({
  isOpen,
  onClose, // Called when editing is cancelled (to go back to TransactionModal)
  transaction, // Original transaction data passed from TransactionModal
  menuCategories,
  menuItems,
  discountsData,
  menuTypes,
  onUpdateComplete, // Callback when editing is finished and updated order details should be saved
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
    setLocalOrderDetails((prevDetails) =>
      prevDetails.map((item) =>
        item.id === changedItem.id ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleDiscountChange = (changedItem, newDiscountId) => {
    const newDiscountObj = discountsData.find(
      (disc) => disc.id === newDiscountId
    ) || { id: 0, type: "None", percentage: 0 };
    setLocalOrderDetails((prevDetails) =>
      prevDetails.map((item) =>
        item.id === changedItem.id
          ? { ...item, discount: newDiscountObj }
          : item
      )
    );
  };

  const handleAddOrderDetails = () => {
    onUpdateComplete(localOrderDetails);
    onClose(); // Close this modal once update is complete.
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

  const newTotal =
    menuType === "Grab" || menuType === "FoodPanda"
      ? newSubtotal - newSubtotal * (menuTypeData?.deduction_percentage || 0)
      : newSubtotal;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      {/* Modal Container with overall width reduced by 100px (from 1200px to 1100px) */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-[800px] h-[650px] flex">
        {/* Left Panel: Menu (full width without left divider) */}
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
        {/* Right Panel: Order Summary with left divider */}
        <div className="w-1/2 border-l border-gray-300 pl-4">
          <EditTransactionOrderSummary
            orderDetails={localOrderDetails}
            finalTotal={newTotal}
            onCancelUpdate={handleCancel}
            onAddOrderDetails={handleAddOrderDetails}
            menuType={menuType}
            discounts={discountsData}
            openDropdownId={null}
            onQuantityChange={handleQuantityChange} // NEW PROP
            onDiscountChange={handleDiscountChange}
            setOpenDropdownId={() => {}}
            deductionPercentage={
              menuType === "Grab" || menuType === "FoodPanda"
                ? menuTypeData?.deduction_percentage || 0
                : 0
            }
            groupedUnliWingsOrders={{}} // Provide as needed.
            alaCarteOrders={localOrderDetails.filter(
              (detail) => detail.instore_category?.id === 1
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
