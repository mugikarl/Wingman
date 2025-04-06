import React, { useState, useEffect } from "react";
import axios from "axios";
import EditTransactionMenu from "../panels/EditTransactionMenu";
import EditTransactionOrderSummary from "../panels/EditTransactionOrderSummary";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";

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
  const originalPaymentAmount = transaction.payment_amount || 0;

  // Local state to handle editing
  const [localOrderDetails, setLocalOrderDetails] =
    useState(initialOrderDetails);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState(null);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  // NEW: state for tracking which Unli Wings group is active for update.
  const [activeUnliWingsGroup, setActiveUnliWingsGroup] = useState(null);

  // Add state for tracking availability update
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [isInitialDataFetched, setIsInitialDataFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const [inventoryWarnings, setInventoryWarnings] = useState({}); // New state for inventory warnings

  // Filter menu items based on the current menu type and selected category.
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesType = menuTypeData ? item.type_id === menuTypeData.id : true;
    const matchesCategory =
      selectedMenuCategory && selectedMenuCategory.id !== 0
        ? item.category_id === selectedMenuCategory.id
        : true;
    return matchesType && matchesCategory;
  });

  const fetchOrderData = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-order-data/"
      );
      console.log("Order data fetched successfully:", response.data);
    } catch (error) {
      console.error("Error fetching order data:", error);
    }
  };

  // Function to check inventory before adding an item
  const handleItemSelect = async (item) => {
    try {
      // First check if this item is already unavailable
      if (item.status_id === 2) {
        alert("This item is currently unavailable!");
        return;
      }

      // Check inventory levels via API
      const response = await axios.get(
        `http://127.0.0.1:8000/check-menu-inventory/${item.id}?quantity=1`
      );

      if (response.data.has_sufficient_inventory === false) {
        const warnings = response.data.warnings || [];

        if (warnings.length > 0) {
          // Format warning message
          const warningItems = warnings
            .map(
              (w) =>
                `${w.inventory_name}: ${w.available_quantity} ${w.unit} available, ${w.required_quantity} ${w.unit} needed`
            )
            .join("\n");

          // Show warning but allow adding
          const proceed = window.confirm(
            `Warning: Adding this item may exceed available inventory!\n\n${warningItems}\n\nDo you want to continue?`
          );

          if (!proceed) {
            return;
          }

          // Store warning for this item
          setInventoryWarnings((prev) => ({
            ...prev,
            [item.id]: warnings,
          }));
        }
      }

      // If we get here, either inventory is sufficient or user confirmed to proceed
      onItemSelect(item);
    } catch (error) {
      console.error("Error checking inventory:", error);
      // Still allow adding if check fails
      onItemSelect(item);
    }
  };

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

  const handleEditOrder = async (payloadWithUpdatedPayment = null) => {
    // Always use localOrderDetails as the base
    const validOrderDetails = localOrderDetails.filter(
      (detail) => detail.menu_item && detail.menu_item.id !== 0
    );

    // Format the order details to match backend expectations
    const orderDetailsPayload = validOrderDetails.map((detail) => ({
      menu_id: detail.menu_item.id,
      quantity: detail.quantity,
      discount_id: detail.discount?.id || null,
      instore_category: detail.instore_category
        ? detail.instore_category.id
        : null,
      unli_wings_group: detail.unli_wings_group || null,
    }));

    console.log("Preparing order payload", {
      originalCount: localOrderDetails.length,
      filteredCount: validOrderDetails.length,
      payload: orderDetailsPayload,
    });

    // Start with either the provided payload or a default one
    const payload = payloadWithUpdatedPayment || {
      employee_id: transaction.employee.id,
      payment_method: transaction.payment_method.id,
      payment_amount: transaction.payment_amount,
      reference_id: transaction.reference_id,
      receipt_image: transaction.receipt_image,
    };

    // Always ensure order_details is set correctly
    payload.order_details = orderDetailsPayload;

    try {
      console.log("Sending final payload:", payload);
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-order/${transaction.id}/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        // Refresh order data before calling onUpdateComplete
        await fetchOrderData();
        onUpdateComplete(response.data);
        onClose();
        return response.data;
      } else {
        console.error("Failed to update order:", response.data);
        throw new Error("Failed to update order");
      }
    } catch (error) {
      console.error(
        "Error updating order:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const newSubtotal = localOrderDetails.reduce((sum, item) => {
    const quantity = item.quantity || 0;
    if (item.instore_category?.id === 2) {
      // For Unli Wings, we only count the base amount once per group
      const groupKey = item.unli_wings_group || "Ungrouped";
      // Check if we're the first item in this group being processed
      const isFirstItemInGroup =
        localOrderDetails.findIndex(
          (detail) =>
            detail.unli_wings_group === groupKey &&
            detail.instore_category?.id === 2
        ) === localOrderDetails.indexOf(item);

      if (isFirstItemInGroup) {
        const baseAmount = item.instore_category?.base_amount || 0;
        return sum + baseAmount;
      }
      return sum; // Skip other items in the same group
    } else {
      const price = item.menu_item?.price || 0;
      const discountPercentage = item.discount ? item.discount.percentage : 0;
      return sum + price * quantity * (1 - discountPercentage);
    }
  }, 0);

  const deductionPercentage =
    menuType === "Grab" || menuType === "FoodPanda"
      ? menuTypeData?.deduction_percentage || 0
      : 0;

  // For payment purposes, we use the full subtotal without any deductions
  const newTotal = newSubtotal;

  // Track deduction separately for reporting only
  const deductionAmount =
    menuType === "Grab" || menuType === "FoodPanda"
      ? newSubtotal * deductionPercentage
      : 0;

  // Function to update menu availability
  const updateMenuAvailability = async () => {
    try {
      setIsLoading(true); // Set loading state to true
      setIsUpdatingAvailability(true);
      setAvailabilityMessage("Checking menu availability...");

      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://127.0.0.1:8000/update-menu-availability/",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update UI with results
      const updatedCount = response.data.updated_items?.length || 0;
      if (updatedCount > 0) {
        setAvailabilityMessage(
          `Updated availability for ${updatedCount} menu items, Loading order items now...`
        );
        // Refresh menu items using the independent fetchOrderData
        await fetchOrderData();
      } else {
        setAvailabilityMessage("All menu items are up to date");
      }
    } catch (error) {
      console.error("Error updating menu availability:", error);
      setAvailabilityMessage("Failed to update menu availability");
    } finally {
      setIsLoading(false); // Set loading state to false
      setIsUpdatingAvailability(false);

      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setAvailabilityMessage("");
      }, 3000);
    }
  };

  // Modify useEffect to handle initial data loading and menu availability update
  useEffect(() => {
    setIsInitialDataFetched(true);
  }, []);

  // Update availability when data is loaded
  useEffect(() => {
    let intervalId;

    if (isInitialDataFetched) {
      // Call the function immediately when the component mounts
      updateMenuAvailability();

      // Set up the interval to call the function every 10 minutes
      intervalId = setInterval(updateMenuAvailability, 10 * 60 * 1000);
    }

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isInitialDataFetched]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-[1280px] h-[680px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium">
              Edit Transaction No.{transaction.id}
            </h2>
            {/* Status message */}
            {availabilityMessage && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3">
                <p>{availabilityMessage}</p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left Panel: Menu */}
            <div
              className={`flex flex-col space-y-6 h-[475px] overflow-y-auto p-4 rounded-lg border ${
                isLoading ? "opacity-50" : ""
              }`}
            >
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
            <div
              className={`flex flex-col space-y-6 h-[475px] overflow-y-auto p-4 rounded-lg border ${
                isLoading ? "opacity-50" : ""
              }`}
            >
              <EditTransactionOrderSummary
                orderDetails={localOrderDetails}
                finalTotal={newTotal}
                totalAmount={originalPaymentAmount}
                transaction={transaction}
                handleEditOrder={handleEditOrder}
                menuType={menuType}
                discounts={discountsData}
                openDropdownId={null}
                onQuantityChange={handleQuantityChange}
                onDiscountChange={handleDiscountChange}
                setOpenDropdownId={() => {}}
                deductionPercentage={deductionPercentage}
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

        {/* Footer */}
        <div className="p-4 border-t flex justify-start">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className={`px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-2 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
