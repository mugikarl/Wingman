import React, { useState, useEffect } from "react";
import Table from "../../components/tables/Table";
import { useNavigate } from "react-router-dom";
import { FaAngleUp, FaAngleDown } from "react-icons/fa6";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa";
import EditTransactionMenu from "../panels/EditTransactionMenu";
import EditTransactionOrderSummary from "../panels/EditTransactionOrderSummary";
import OrderEditModal from "./OrderEditModal";
import axios from "axios";
import { useModal } from "../utils/modalUtils";

const TransactionModal = ({
  isOpen,
  onClose,
  transaction,
  menuTypes,
  discountsData,
  menuItems, // Passed from OrderTable
  menuCategories, // Passed from OrderTable
  employees,
  unliWingsCategory,
  fetchOrderData,
  payment_methods,
  inventoryData,
  fetchInventoryData,
}) => {
  if (!isOpen || !transaction) return null;

  const navigate = useNavigate();
  const { alert, confirm } = useModal();

  // State to track expansion
  const [isExpanded, setIsExpanded] = useState(false);

  // States for category dropdown
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState(null);

  // States for accordion groups
  const [openAccordion, setOpenAccordion] = useState({});
  const [unliOverallOpen, setUnliOverallOpen] = useState(true);
  const [alaCarteOverallOpen, setAlaCarteOverallOpen] = useState(true);

  // Order status and its dropdown
  const [orderStatus, setOrderStatus] = useState(() => {
    // Always prioritize getting status from transaction.order_status.name
    if (transaction.order_status?.name) {
      return transaction.order_status.name;
    }

    // Fall back to numeric status if needed
    const statusId = Number(transaction.status || transaction.order_status);
    switch (statusId) {
      case 1:
        return "Pending";
      case 2:
        return "Completed";
      case 3:
        return "Cancelled";
      case 4:
        return "Complimentary";
      default:
        console.log("Unknown status ID:", statusId);
        return "Pending"; // Default to Pending if status is missing or unknown
    }
  });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Dropdown state for OrderProductCard
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // New state to control the editing modal visibility.
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Add this to the state variables at the top of the TransactionModal component
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [loadingDots, setLoadingDots] = useState("");

  // Add this useEffect for the loading animation
  useEffect(() => {
    let loadingInterval;

    if (isUpdatingStatus) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setLoadingDots(dots);
        dotCount++;
      }, 500);
    } else {
      setLoadingDots("");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isUpdatingStatus]);

  // Add this effect to update orderStatus when transaction changes
  useEffect(() => {
    if (transaction) {
      console.log("Transaction for status:", transaction);

      // First check if order_status is an object with a name property
      if (transaction.order_status?.name) {
        setOrderStatus(transaction.order_status.name);
      }
      // Check if order_status is a numeric value
      else if (typeof transaction.order_status === "number") {
        const statusId = transaction.order_status;
        console.log("Status ID from transaction.order_status:", statusId);

        switch (statusId) {
          case 1:
            setOrderStatus("Pending");
            break;
          case 2:
            setOrderStatus("Completed");
            break;
          case 3:
            setOrderStatus("Cancelled");
            break;
          case 4:
            setOrderStatus("Complimentary");
            break;
          default:
            setOrderStatus("Pending");
        }
      }
      // Last resort - check status property
      else if (transaction.status) {
        const statusId = Number(transaction.status);
        console.log("Status ID from transaction.status:", statusId);

        switch (statusId) {
          case 1:
            setOrderStatus("Pending");
            break;
          case 2:
            setOrderStatus("Completed");
            break;
          case 3:
            setOrderStatus("Cancelled");
            break;
          case 4:
            setOrderStatus("Complimentary");
            break;
          default:
            setOrderStatus("Pending");
        }
      }

      // For debugging
      console.log("Final status set to:", orderStatus);
    }
  }, [transaction]);

  const toggleAccordion = (groupKey) => {
    setOpenAccordion((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getOrderStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-orange-500 text-white";
      case "Completed":
        return "bg-green-500 text-white";
      case "Cancelled":
        return "bg-red-500 text-white";
      case "Complimentary":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusLeftBg = (status) => {
    switch (status) {
      case "Pending":
        return "bg-orange-600";
      case "Completed":
        return "bg-green-600";
      case "Cancelled":
        return "bg-red-600";
      case "Complimentary":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const getMenuTypeClass = (menuTypeName) => {
    switch (menuTypeName) {
      case "In-Store":
        return "text-orange-500";
      case "Grab":
        return "text-green-500";
      case "FoodPanda":
        return "text-pink-500";
      default:
        return "text-gray-500";
    }
  };

  const menuTypeId = transaction.order_details?.[0]?.menu_item?.type_id;
  const menuTypeData = menuTypes.find((type) => type.id === menuTypeId);
  const menuType = menuTypeData ? menuTypeData.name : "Unknown";
  console.log("Retrieved Menu Type:", menuType);

  const isInStore = menuType === "In-Store";
  const isDelivery = menuType === "Grab" || menuType === "FoodPanda";

  // Filter items based on menu type and selected category (if any)
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesType = menuTypeData ? item.type_id === menuTypeData.id : true;
    const matchesCategory =
      selectedMenuCategory && selectedMenuCategory.id !== 0
        ? item.category_id === selectedMenuCategory.id
        : true;
    return matchesType && matchesCategory;
  });

  // --- Original Left Side: Transaction Details ---
  const orderDetails = transaction.order_details || [];
  const unliWingsOrders = orderDetails.filter(
    (detail) => Number(detail.instore_category?.id) === 2
  );
  const alaCarteOrders = orderDetails.filter(
    (detail) => Number(detail.instore_category?.id) === 1
  );

  const groupedUnliWingsOrders = unliWingsOrders.reduce((acc, detail) => {
    const groupKey = detail.unli_wings_group || "Ungrouped";
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(detail);
    return acc;
  }, {});

  // Calculate totals
  const totalDeliverySubtotal = orderDetails.reduce(
    (sum, detail) =>
      sum + (detail?.quantity || 0) * (detail?.menu_item?.price || 0),
    0
  );

  const totalAlaCarteBeforeDiscount = alaCarteOrders.reduce((sum, detail) => {
    const quantity = detail?.quantity || 0;
    const price = detail?.menu_item?.price || 0;
    return sum + quantity * price;
  }, 0);

  const totalAlaCarteDiscountAmount = alaCarteOrders.reduce((sum, detail) => {
    const quantity = detail?.quantity || 0;
    const price = detail?.menu_item?.price || 0;
    const discount = detail?.discount?.percentage || 0;
    return sum + quantity * price * discount;
  }, 0);

  const totalAlaCarte =
    totalAlaCarteBeforeDiscount - totalAlaCarteDiscountAmount;

  const totalUnliWings = unliWingsOrders.reduce((sum, detail) => {
    const groupKey = detail.unli_wings_group || "Ungrouped";
    const isFirstItemInGroup =
      unliWingsOrders.findIndex((d) => d.unli_wings_group === groupKey) ===
      unliWingsOrders.indexOf(detail);

    if (isFirstItemInGroup) {
      return sum + (detail.instore_category?.base_amount || 0);
    }
    return sum;
  }, 0);

  const totalBeforeDiscount = totalAlaCarteBeforeDiscount + totalUnliWings;
  const totalDiscountAmount = totalAlaCarteDiscountAmount;
  const totalInStore = totalAlaCarte + totalUnliWings;

  const deductionPercentage = isDelivery
    ? menuTypeData?.deduction_percentage || 0
    : 0;

  // For delivery, display the deduction but don't apply it to payment amount
  const displayTotal = isDelivery
    ? totalDeliverySubtotal * (1 - deductionPercentage)
    : totalInStore;

  // The full price should be used for payment purposes
  const actualTotal = isDelivery ? totalDeliverySubtotal : totalInStore;
  const paymentAmount = transaction.payment_amount || 0;
  const change = paymentAmount - actualTotal;

  // Check if order is non-editable (Completed or Cancelled)
  const isOrderNonEditable =
    orderStatus.toLowerCase() === "completed" ||
    orderStatus.toLowerCase() === "cancelled" ||
    orderStatus.toLowerCase() === "complimentary" ||
    transaction.order_status === 2 || // Completed
    transaction.order_status === 3 || // Cancelled
    transaction.order_status === 4; // Complimentary

  // When an Update button is clicked:
  const handleUpdateClick = () => {
    if (isOrderNonEditable) return;
    setIsEditModalOpen(true);
    // Do not call onClose() here so that OrderEditModal (rendered below) remains in the tree.
  };

  // Callback for when OrderEditModal completes update
  const handleUpdateComplete = (updatedOrderDetails) => {
    console.log("Updated order details:", updatedOrderDetails);
    // Refresh the order data and close the transaction modal
    fetchOrderData();
    onClose();
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    console.log("Create new Unli Wings Order Group");
  };

  // Update the updateStatus function to use the loading state
  const updateStatus = async (newStatus) => {
    // Map status names to their IDs in the database
    const getStatusId = (statusName) => {
      switch (statusName) {
        case "Pending":
          return 1;
        case "Completed":
          return 2;
        case "Cancelled":
          return 3;
        case "Complimentary":
          return 4;
        default:
          return 1;
      }
    };

    if (newStatus === "Cancelled") {
      const isConfirmed = await confirm(
        "Switching to Cancelled. Are you sure?",
        "Confirm Status Change"
      );
      if (isConfirmed) {
        setIsUpdatingStatus(true);
        setOrderStatus(newStatus);
        // Call API to update backend
        await updateOrderStatus(transaction.id, getStatusId(newStatus));
        setIsUpdatingStatus(false);
        if (success) onClose(); // Close modal after successful update
      }
    } else if (newStatus === "Completed") {
      const isConfirmed = await confirm(
        "Switching to Completed. This will deduct the quantity from the inventory. Are you sure?",
        "Confirm Status Change"
      );
      if (isConfirmed) {
        setIsUpdatingStatus(true);
        setOrderStatus(newStatus);
        await updateOrderStatus(transaction.id, getStatusId(newStatus));
        setIsUpdatingStatus(false);
      }
    } else if (newStatus === "Complimentary") {
      const isConfirmed = await confirm(
        "Switching to Complimentary. This order will not contribute to sales totals. Are you sure?",
        "Confirm Status Change"
      );
      if (isConfirmed) {
        setIsUpdatingStatus(true);
        setOrderStatus(newStatus);
        const success = await updateOrderStatus(
          transaction.id,
          getStatusId(newStatus)
        );
        setIsUpdatingStatus(false);
        if (success) onClose(); // Close modal after successful update
      }
    } else {
      // For Pending status
      setIsUpdatingStatus(true);
      setOrderStatus(newStatus);
      // Call API to update backend
      await updateOrderStatus(transaction.id, getStatusId(newStatus));
      setIsUpdatingStatus(false);
      if (success) onClose(); // Close modal after successful update
    }
    setIsStatusDropdownOpen(false);
  };

  // const handleCancelUpdate = () => {
  //   if (window.confirm("Are you sure you want to cancel updating the order?")) {
  //     onClose();
  //   }
  // };

  // const handleAddOrderDetails = () => {
  //   console.log("Add Order Details triggered");
  // };

  // API call to update order status in the backend
  const updateOrderStatus = async (transactionId, statusId) => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/update-order-status/${transactionId}/`,
        { status_id: statusId }
      );

      // Handle success
      console.log("Order status updated:", response.data);

      // Show detailed inventory information for completed orders
      if (statusId === 2 || statusId === 4) {
        // Completed or Complimentary
        // Extract deducted ingredients information from the response
        const deductedIngredients = response.data.deducted_ingredients || [];
        const statusName = statusId === 2 ? "Completed" : "Complimentary";

        if (deductedIngredients.length > 0 && inventoryData) {
          // Create lookup maps for items and units
          const itemsMap = {};
          const unitsMap = {};

          // Process items data
          if (inventoryData.items) {
            inventoryData.items.forEach((item) => {
              if (item.id) {
                itemsMap[item.id] = {
                  name: item.name,
                  unit_symbol: item.unit_of_measurement?.symbol || "units",
                  measurement: item.measurement,
                };
              }
            });
          }

          // Process units data
          if (inventoryData.units) {
            inventoryData.units.forEach((unit) => {
              if (unit.id) {
                unitsMap[unit.id] = unit;
              }
            });
          }

          // Format the inventory information message
          let inventoryMessage =
            statusId === 2
              ? "Order completed successfully. Inventory updated:\n\n"
              : "Complimentary order processed. Inventory updated:\n\n";

          deductedIngredients.forEach((item, index) => {
            // Get the item details
            const itemData = itemsMap[item.item_id];

            // Get item name
            const itemName = itemData ? itemData.name : `Item #${item.item_id}`;

            // Get unit symbol
            const unitSymbol = itemData ? itemData.unit_symbol : "units";

            const deductedAmount = parseFloat(item.deducted_amount).toFixed(2);
            const newQuantity = parseFloat(item.new_quantity).toFixed(2);

            inventoryMessage += `${
              index + 1
            }. ${itemName}: -${deductedAmount} ${unitSymbol} (Remaining: ${newQuantity} ${unitSymbol})\n`;
          });

          // Display the detailed inventory alert
          await alert(inventoryMessage, "Inventory Updated");
        } else {
          // Fallback to generic message
          const message =
            statusId === 2
              ? "Order status updated to Completed. Ingredients have been deducted from inventory."
              : "Order status updated to Complimentary. Ingredients have been deducted from inventory (no sales recorded).";

          await alert(message, "Status Updated");
        }
      } else if (statusId === 3) {
        // Cancelled
        await alert("Order has been cancelled.", "Status Updated");
      }

      // Refresh both inventory and order data
      await Promise.all([
        fetchOrderData(),
        fetchInventoryData && fetchInventoryData(),
      ]);

      // Close the modal after data refresh is complete
      onClose();

      return true;
    } catch (error) {
      // Handle error
      console.error("Error updating order status:", error);
      await alert(
        "Failed to update order status: " +
          (error.response?.data?.error || error.message || "Unknown error"),
        "Error"
      );
      return false;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-[1280px] h-[680px] flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">
            Transaction No.{transaction.id}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column: Order Summary and Computations */}
            <div className="h-full flex flex-col space-y-6">
              <div
                className={`bg-white p-4 h-full rounded-lg border ${
                  isOrderNonEditable ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <h3 className="text-lg font-medium mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Date:</strong> {formatDate(transaction.date)}
                  </p>
                  <p>
                    <strong>Time:</strong> {formatTime(transaction.date)}
                  </p>
                  <p>
                    <strong>Menu Type:</strong>{" "}
                    <span
                      className={`font-medium ${getMenuTypeClass(menuType)}`}
                    >
                      {menuType}
                    </span>
                  </p>
                  <p>
                    <strong>Payment Method:</strong>{" "}
                    <span
                      className={`font-medium ${
                        transaction.payment_method?.id === 1
                          ? "text-green-800"
                          : "text-blue-600"
                      }`}
                    >
                      {transaction.payment_method?.name || "Cash"}
                    </span>
                  </p>
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() => {
                        if (!isOrderNonEditable && !isUpdatingStatus) {
                          setIsStatusDropdownOpen(!isStatusDropdownOpen);
                        }
                      }}
                      className={`flex items-center ${getOrderStatusClass(
                        orderStatus
                      )} rounded-md shadow-md ${
                        !isOrderNonEditable && !isUpdatingStatus
                          ? "hover:opacity-90 active:scale-95"
                          : "opacity-90 cursor-default"
                      } transition-transform duration-150 w-40 overflow-hidden`}
                      disabled={isOrderNonEditable || isUpdatingStatus}
                    >
                      <div
                        className={`flex items-center justify-center ${getStatusLeftBg(
                          orderStatus
                        )} p-2`}
                      >
                        <FaClipboardList className="w-5 h-5 text-white" />
                      </div>
                      <span className="flex-1 text-left px-2 text-white text-sm">
                        {isUpdatingStatus ? loadingDots : orderStatus}
                      </span>
                      <div className="flex items-center justify-center p-2">
                        {!isOrderNonEditable &&
                          !isUpdatingStatus &&
                          (isStatusDropdownOpen ? (
                            <FaChevronUp className="w-4 h-4 text-white" />
                          ) : (
                            <FaChevronDown className="w-4 h-4 text-white" />
                          ))}
                      </div>
                    </button>
                    {isStatusDropdownOpen && !isOrderNonEditable && (
                      <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg z-20">
                        <div className="bg-white rounded-md py-2">
                          {(transaction.status === 1 ||
                            transaction.order_status === 1 ||
                            transaction.status === null ||
                            transaction.status === undefined) && (
                            <>
                              <button
                                onClick={() => updateStatus("Completed")}
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                              >
                                Completed
                              </button>
                              <button
                                onClick={() => updateStatus("Cancelled")}
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                              >
                                Cancelled
                              </button>
                              <button
                                onClick={() => updateStatus("Complimentary")}
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                              >
                                Complimentary
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Computations */}
              <div
                className={`bg-white p-4 rounded-lg border ${
                  isOrderNonEditable ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <h3 className="text-lg font-medium mb-4">Computations</h3>
                <div className="flex flex-col">
                  {isDelivery ? (
                    <>
                      <p>
                        <strong>Subtotal:</strong> ₱
                        {(totalDeliverySubtotal || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-500">
                        <strong>
                          Platform Deduction (
                          {(deductionPercentage * 100).toFixed(2)}%):
                        </strong>{" "}
                        -₱
                        {(totalDeliverySubtotal * deductionPercentage).toFixed(
                          2
                        )}
                      </p>
                      <p className="font-bold mt-1">
                        <strong>Total Amount:</strong> ₱
                        {(displayTotal || 0).toFixed(2)}
                      </p>
                      <p className="font-bold mt-1">
                        <strong>Amount Paid:</strong> ₱
                        {(paymentAmount || 0).toFixed(2)}
                      </p>
                      <p className="font-bold mt-1">
                        <strong>Total Sales:</strong>
                        <span className="text-green-500 ml-1">
                          ₱{(displayTotal || 0).toFixed(2)}
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Subtotal:</strong> ₱
                        {(totalBeforeDiscount || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-500">
                        <strong>Discount Amount:</strong> -₱
                        {(totalDiscountAmount || 0).toFixed(2)}
                      </p>
                      <p className="font-bold mt-1">
                        <strong>Total Amount:</strong> ₱
                        {(totalInStore || 0).toFixed(2)}
                      </p>
                      <p className="font-bold mt-1">
                        <strong>Amount Paid:</strong> ₱
                        {(paymentAmount || 0).toFixed(2)}
                      </p>
                      {change > 0 && (
                        <p className="text-gray-500">
                          <strong>Change:</strong> ₱{change.toFixed(2)}
                        </p>
                      )}
                      <p className="font-bold mt-1">
                        <strong>Total Sales:</strong>
                        <span className="text-green-500 ml-1">
                          {(totalInStore || 0).toFixed(2)}
                        </span>
                      </p>
                    </>
                  )}
                  {transaction.payment_method?.id === 2 &&
                    transaction.gcash_references &&
                    transaction.gcash_references.length > 0 && (
                      <div className="mt-4 pt-2 border-t">
                        <h4 className="font-medium mb-2">
                          GCash Payment History:
                        </h4>
                        <div className="space-y-2">
                          {transaction.gcash_references.map((ref, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-1 px-2 bg-blue-50 rounded"
                            >
                              <span className="text-blue-600">
                                Ref: {ref.name}
                              </span>
                              <span className="font-medium">
                                ₱{(ref.paid_amount || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Right Column: Combined Orders or Delivery Orders */}
            <div className="flex flex-col space-y-6 w-full h-full">
              {isInStore ? (
                <div className="bg-white p-4 rounded-lg border w-full h-full overflow-y-auto">
                  <h3 className="text-lg font-medium mb-4">Orders</h3>
                  <div className="space-y-4 h-[400px] overflow-y-auto">
                    {/* Unli Wings Orders Accordion */}
                    <div>
                      <h4 className="text-md font-medium mb-2">
                        Unli Wings Orders
                      </h4>
                      {/* {!isOrderNonEditable && (
                        <button
                          onClick={handleAdd}
                          className="w-full mb-3 px-3 py-2 bg-[#CC5500] text-white rounded hover:bg-[#B34C00]"
                        >
                          Add a new Unli Order
                        </button>
                      )} */}
                      {Object.keys(groupedUnliWingsOrders).length > 0 ? (
                        Object.keys(groupedUnliWingsOrders).map((groupKey) => {
                          const groupOrders = groupedUnliWingsOrders[groupKey];
                          const baseAmount =
                            groupOrders[0]?.instore_category?.base_amount || 0;
                          return (
                            <div key={groupKey} className="border rounded mb-2">
                              <div
                                className="flex justify-between items-center border bg-white hover:bg-gray-200 px-3 py-2 cursor-pointer"
                                onClick={() => toggleAccordion(groupKey)}
                              >
                                <span className="flex-1 text-left">
                                  Unli Wings Order #{groupKey} - ₱
                                  {baseAmount.toFixed(2)}
                                </span>
                                <span>
                                  {openAccordion[groupKey] ? (
                                    <FaAngleUp />
                                  ) : (
                                    <FaAngleDown />
                                  )}
                                </span>
                              </div>
                              {openAccordion[groupKey] && (
                                <div className="px-3 py-2 w-full">
                                  <div className="h-[200px] overflow-y-auto overflow-x-hidden w-full">
                                    <Table
                                      columns={["Menu Item", "Quantity"]}
                                      data={groupOrders.map((detail) => [
                                        detail?.menu_item?.name || "N/A",
                                        detail?.quantity || 0,
                                      ])}
                                      maxHeight="100%"
                                    />
                                    {/* {!isOrderNonEditable && (
                                      <button
                                        onClick={handleUpdateClick}
                                        className="w-full mt-3 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                      >
                                        Update
                                      </button>
                                    )} */}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="bg-gray-100 p-4 rounded-lg text-gray-500 text-center">
                          No Orders added
                        </div>
                      )}
                    </div>

                    {/* Ala Carte Orders Accordion */}
                    <div>
                      <h4 className="text-md font-medium mb-2">
                        Ala Carte Orders
                      </h4>
                      <div className="w-full overflow-y-auto overflow-x-hidden">
                        {alaCarteOrders.length > 0 ? (
                          <Table
                            columns={[
                              "Menu Item",
                              "Quantity",
                              "Price",
                              "Discounts",
                              "Total",
                            ]}
                            data={alaCarteOrders.map((detail) => {
                              const quantity = detail?.quantity || 0;
                              const price = detail?.menu_item?.price || 0;
                              const discount =
                                detail?.discount?.percentage || 0;
                              const computedTotal =
                                quantity * price * (1 - discount);
                              return [
                                detail?.menu_item?.name || "N/A",
                                detail?.quantity || 0,
                                `₱${price.toFixed(2)}`,
                                `${(discount * 100).toFixed(0)}%`,
                                `₱${computedTotal.toFixed(2)}`,
                              ];
                            })}
                          />
                        ) : (
                          <div className="bg-gray-100 p-4 rounded-lg text-gray-500 text-center">
                            No Orders added
                          </div>
                        )}
                        {/* {!isOrderNonEditable && (
                          <button
                            onClick={handleUpdateClick}
                            className="w-full mt-3 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Update
                          </button>
                        )} */}
                      </div>
                    </div>
                  </div>
                </div>
              ) : isDelivery ? (
                <div className="bg-white p-4 rounded-lg border w-full h-full overflow-y-auto">
                  <h3 className="text-lg font-medium mb-4">{menuType} Order</h3>
                  <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                    {orderDetails.length > 0 ? (
                      <Table
                        columns={["Menu Item", "Quantity", "Price"]}
                        data={orderDetails.map((detail) => {
                          const quantity = detail?.quantity || 0;
                          const price = detail?.menu_item?.price || 0;
                          return [
                            detail?.menu_item?.name || "N/A",
                            quantity,
                            `₱${price.toFixed(2)}`,
                          ];
                        })}
                      />
                    ) : (
                      <div className="bg-gray-100 p-4 rounded-lg text-gray-500 text-center">
                        No Orders added
                      </div>
                    )}
                    {/* {!isOrderNonEditable && (
                      <button
                        onClick={handleUpdateClick}
                        className="w-full mt-3 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Update
                      </button>
                    )} */}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {/* Footer */}
        {!isOrderNonEditable && (
          <div className="p-4 border-t flex justify-end">
            <button
              onClick={handleUpdateClick}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Update
            </button>
          </div>
        )}
        {isEditModalOpen && (
          <OrderEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            transaction={transaction}
            totalAmount={transaction.payment_amount}
            menuCategories={menuCategories}
            menuItems={menuItems}
            discountsData={discountsData}
            menuTypes={menuTypes}
            onUpdateComplete={handleUpdateComplete}
            employees={employees}
            unliWingsCategory={unliWingsCategory}
            fetchOrderData={fetchOrderData}
            payment_methods={payment_methods}
          />
        )}
      </div>
    </div>
  );
};
export default TransactionModal;
