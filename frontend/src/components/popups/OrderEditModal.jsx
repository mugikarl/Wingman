import React, { useState, useEffect } from "react";
import axios from "axios";
import EditTransactionMenu from "../panels/EditTransactionMenu";
import EditTransactionOrderSummary from "../panels/EditTransactionOrderSummary";
import { FaChevronUp, FaChevronDown, FaArrowLeft } from "react-icons/fa";
import { useModal } from "../utils/modalUtils";

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
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryWarnings, setInventoryWarnings] = useState({});

  // Add this to the existing component
  const [isAddingUnliWings, setIsAddingUnliWings] = useState(false);
  const [pendingUnliGroupNumber, setPendingUnliGroupNumber] = useState(null);

  // Filter menu items based on the current menu type and selected category.
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesType = menuTypeData ? item.type_id === menuTypeData.id : true;
    const matchesCategory =
      selectedMenuCategory && selectedMenuCategory.id !== 0
        ? item.category_id === selectedMenuCategory.id
        : true;
    return matchesType && matchesCategory;
  });

  const { alert, confirm } = useModal();

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

  // When a menu item is clicked in the menu panel, either add it to or update the local order details.
  // We now directly call onItemSelect without checking inventory first
  const onItemSelect = (menuItem) => {
    // Early return if the item is unavailable.
    if (menuItem.status_id === 2) {
      alert("This item is unavailable!");
      return;
    }

    // Check if we're in "Add Unli Wings" mode
    if (isAddingUnliWings && pendingUnliGroupNumber) {
      // For Unli mode, only allow items in allowed category IDs: 1 (Wings), 4 (Sides), 5 (Drinks)
      if (
        menuItem.category_id === 1 ||
        menuItem.category_id === 5 ||
        menuItem.category_id === 4
      ) {
        // For Sides, only allow Rice items
        if (
          menuItem.category_id === 4 &&
          !menuItem.name.toLowerCase().includes("rice")
        ) {
          alert("Only Rice items can be added for Sides in the Unli section.");
          return;
        }

        // Get the base_amount for Unli Wings
        const baseAmount = unliWingsCategory?.base_amount || 0;

        // Create a new detail for the new Unli Wings group
        const newDetail = {
          id: Date.now(),
          menu_item: menuItem,
          quantity: 1,
          discount: { id: 0, type: "None", percentage: 0 },
          unli_wings_group: pendingUnliGroupNumber,
          instore_category: { id: 2, base_amount: baseAmount },
          base_amount: baseAmount,
        };

        // Add the item to the order
        setLocalOrderDetails((prev) => [...prev, newDetail]);

        // Set the active group to the new group
        setActiveUnliWingsGroup(pendingUnliGroupNumber);

        // Exit "Add Unli Wings" mode
        setIsAddingUnliWings(false);
        setPendingUnliGroupNumber(null);

        return;
      } else {
        // Show error if item type isn't allowed
        alert(
          "Only Wings, Drinks, or Rice items can be added to the Unli section."
        );
        return;
      }
    }

    // Default discount ID (usually 0 or None)
    const defaultDiscountId = 0;

    setLocalOrderDetails((prevDetails) => {
      // If there is an active Unli Wings group, add the item to that group.
      if (activeUnliWingsGroup) {
        // Validate the menu item type for Unli Wings
        // For Unli mode, only allow items in allowed category IDs: 1 (Wings), 4 (Sides), 5 (Drinks)
        if (
          menuItem.category_id === 1 ||
          menuItem.category_id === 5 ||
          menuItem.category_id === 4
        ) {
          // For Sides, only allow Rice items
          if (
            menuItem.category_id === 4 &&
            !menuItem.name.toLowerCase().includes("rice")
          ) {
            alert(
              "Only Rice items can be added for Sides in the Unli section."
            );
            return prevDetails; // Return unchanged details
          }

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
              )?.base_amount ||
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
              base_amount: groupBaseAmount, // Also store directly on the detail
            };
            return [...prevDetails, newDetail];
          }
        } else {
          // Show error if item type isn't allowed
          alert(
            "Only Wings, Drinks, or Sides items can be added to the Unli section."
          );
          return prevDetails; // Return unchanged details
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
    console.log(
      "handleQuantityChange called with item:",
      changedItem,
      "newQty:",
      newQty
    );

    const quantity = Number(newQty);

    // Special handling for container items - we keep these with minimal quantity
    if (changedItem.is_container === true) {
      console.log("Handling special container item");

      if (changedItem.unli_wings_group) {
        // Set the active group
        setActiveUnliWingsGroup(changedItem.unli_wings_group);

        // Add or update the container in localOrderDetails
        setLocalOrderDetails((prevDetails) => {
          // Look for existing container with this group
          const existingContainer = prevDetails.find(
            (item) =>
              item.is_container === true &&
              item.unli_wings_group === changedItem.unli_wings_group
          );

          if (existingContainer) {
            // Already exists, make sure it has the minimal quantity
            return prevDetails.map((item) =>
              item.id === existingContainer.id
                ? { ...item, quantity: 0.01 }
                : item
            );
          }

          // Add new container
          return [...prevDetails, { ...changedItem, quantity: 0.01 }];
        });
      }
      return; // Don't continue with regular item processing
    }

    // Special handling for Unli Wings orders
    if (
      changedItem.instore_category?.id === 2 &&
      changedItem.unli_wings_group
    ) {
      // If this is a new Unli Wings group, make sure the activeUnliWingsGroup is set
      if (activeUnliWingsGroup !== changedItem.unli_wings_group) {
        console.log(
          "Setting active unli wings group to:",
          changedItem.unli_wings_group
        );
        setActiveUnliWingsGroup(changedItem.unli_wings_group);
      }
    }

    // Normal handling for regular items
    setLocalOrderDetails((prevDetails) => {
      if (quantity <= 0) {
        // Remove the item if quantity is zero or less
        return prevDetails.filter((item) => item.id !== changedItem.id);
      }

      // Look for an existing identical item first
      const existingItem = prevDetails.find(
        (item) => item.id === changedItem.id
      );

      if (existingItem) {
        // Update existing item
        return prevDetails.map((item) =>
          item.id === changedItem.id ? { ...item, quantity } : item
        );
      } else {
        // Add new item
        console.log("Adding new item to localOrderDetails:", changedItem);
        return [...prevDetails, changedItem];
      }
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

  // Function to check inventory before saving changes
  const checkInventoryBeforeSave = async () => {
    if (localOrderDetails.length === 0) {
      await alert(
        "Please add at least one item before saving changes",
        "Error"
      );
      return false;
    }

    // Group items by ID and sum quantities to check total amounts needed
    const itemQuantityMap = {};
    localOrderDetails.forEach((item) => {
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
              localOrderDetails.find(
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

  const handleEditOrder = async (payloadWithUpdatedPayment = null) => {
    setIsLoading(true);
    try {
      // Check inventory before proceeding
      const canProceed = await checkInventoryBeforeSave();
      if (!canProceed) {
        setIsLoading(false);
        return;
      }

      // Always use localOrderDetails as the base, but filter more carefully
      // Keep Unli Wings placeholder/container items even with id 0
      const validOrderDetails = localOrderDetails.filter(
        (detail) =>
          // Keep items with real menu items
          (detail.menu_item && detail.menu_item.id > 0) ||
          // Or keep Unli Wings container items (keep the group structure)
          (detail.instore_category?.id === 2 &&
            detail.unli_wings_group &&
            !detail.is_container)
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
      await alert(
        `Error updating order: ${
          error.response?.data?.message || error.message
        }`,
        "Error"
      );
    } finally {
      setIsLoading(false);
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
        <div className="flex-1 p-6 relative">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left Panel: Menu - Highlighted with orange border when adding unli wings */}
            <div
              className={`flex flex-col space-y-6 h-[475px] overflow-y-auto p-4 rounded-lg ${
                isLoading ? "opacity-50" : ""
              } ${
                isAddingUnliWings
                  ? "border-2 border-orange-500 shadow-lg z-20 bg-white"
                  : "border"
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
                isHighlighted={isAddingUnliWings}
              />
            </div>

            {/* Right Panel: Order Summary - Contains the Unli Wings instruction */}
            <div
              className={`flex flex-col space-y-6 h-[475px] overflow-y-auto p-4 rounded-lg border ${
                isLoading ? "opacity-50" : ""
              }`}
            >
              {/* Display instruction overlay inside the right panel when adding Unli Wings */}
              {isAddingUnliWings ? (
                <div className="bg-white p-4 rounded-lg border-gray-200 border shadow-sm">
                  <h3 className="text-lg font-bold mb-3">
                    Creating New Unli Wings Order
                  </h3>
                  <p className="mb-4">
                    Please select a Wings, Rice, or Drink item from the menu to
                    start your Unli Wings Order #{pendingUnliGroupNumber}.
                  </p>
                  <button
                    onClick={() => {
                      setIsAddingUnliWings(false);
                      setPendingUnliGroupNumber(null);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
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
                  isAddingUnliWings={isAddingUnliWings}
                  setIsAddingUnliWings={setIsAddingUnliWings}
                  pendingUnliGroupNumber={pendingUnliGroupNumber}
                  setPendingUnliGroupNumber={setPendingUnliGroupNumber}
                />
              )}
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
