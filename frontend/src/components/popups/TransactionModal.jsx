import React, { useState } from "react";
import Table from "../../components/tables/Table";
import { useNavigate } from "react-router-dom";
import { FaAngleUp, FaAngleDown } from "react-icons/fa6";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa";

const TransactionModal = ({ isOpen, onClose, transaction, menuTypes }) => {
  if (!isOpen || !transaction) return null;

  const navigate = useNavigate();

  // Local state for managing accordion open/closed status
  const [openAccordion, setOpenAccordion] = useState({});
  const [unliOverallOpen, setUnliOverallOpen] = useState(true);
  const [alaCarteOverallOpen, setAlaCarteOverallOpen] = useState(true);

  // State for order status, starting with "Pending"
  const [orderStatus, setOrderStatus] = useState("Pending");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

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
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Helper to style the left container of the dropdown (for status)
  const getStatusLeftBg = (status) => {
    switch (status) {
      case "Pending":
        return "bg-orange-600";
      case "Completed":
        return "bg-green-600";
      case "Cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getMenuTypeClass = (menuTypeName) => {
    switch (menuTypeName) {
      case "In-Store":
        return "bg-orange-500 text-white";
      case "Grab":
        return "bg-green-500 text-white";
      case "FoodPanda":
        return "bg-pink-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const menuTypeId = transaction.order_details?.[0]?.menu_item?.type_id;
  const menuTypeData = menuTypes.find((type) => type.id === menuTypeId);
  const menuType = menuTypeData ? menuTypeData.name : "Unknown";
  console.log("Retrieved Menu Type:", menuType);

  const isInStore = menuType === "In-Store";
  const isDelivery = menuType === "Grab" || menuType === "FoodPanda";

  // For Unli Wings orders (In‑Store)
  const formatUnliWingsTableData = (orders) =>
    orders.length > 0
      ? orders.map((detail) => [
          detail?.menu_item?.name || "N/A",
          detail?.quantity || 0,
        ])
      : [["None", "-"]];

  // For Ala Carte orders (In‑Store)
  const formatAlaCarteTableData = (orders) =>
    orders.length > 0
      ? orders.map((detail) => {
          const quantity = detail?.quantity || 0;
          const price = detail?.menu_item?.price || 0;
          const discount = detail?.discount?.percentage
            ? detail.discount.percentage * 100
            : 0;
          const computedTotal = quantity * price * (1 - discount / 100);
          return [
            detail?.menu_item?.name || "N/A",
            quantity,
            `₱${price.toFixed(2)}`,
            `${discount}%`,
            `₱${computedTotal.toFixed(2)}`,
          ];
        })
      : [["None", "-", "-", "-", "-"]];

  // For Delivery orders (Grab/FoodPanda)
  const formatDeliveryTableData = (orders) =>
    orders.length > 0
      ? orders.map((detail) => {
          const quantity = detail?.quantity || 0;
          const price = detail?.menu_item?.price || 0;
          return [
            detail?.menu_item?.name || "N/A",
            quantity,
            `₱${price.toFixed(2)}`,
          ];
        })
      : [["None", "-", "-"]];

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

  const totalUnliWings = Object.keys(groupedUnliWingsOrders).reduce(
    (sum, groupKey) => {
      const groupOrders = groupedUnliWingsOrders[groupKey];
      const baseAmount = groupOrders[0]?.instore_category?.base_amount || 0;
      return sum + baseAmount;
    },
    0
  );

  const totalAlaCarte = alaCarteOrders.reduce((sum, detail) => {
    const quantity = detail?.quantity || 0;
    const price = detail?.menu_item?.price || 0;
    const discount = detail?.discount?.percentage
      ? detail.discount.percentage * 100
      : 0;
    return sum + quantity * price * (1 - discount / 100);
  }, 0);

  const totalDeliverySubtotal = orderDetails.reduce((sum, detail) => {
    const quantity = detail?.quantity || 0;
    const price = detail?.menu_item?.price || 0;
    return sum + quantity * price;
  }, 0);

  const deductionPercentage = isDelivery
    ? menuTypeData?.deduction_percentage || 0
    : 0;
  const finalTotal = isDelivery
    ? totalDeliverySubtotal - totalDeliverySubtotal * deductionPercentage
    : totalUnliWings + totalAlaCarte;

  const totalPrice = isDelivery
    ? totalDeliverySubtotal
    : totalUnliWings + totalAlaCarte;
  const paymentAmount = transaction.payment_amount || 0;
  const change = paymentAmount - finalTotal;

  // Placeholder update and add handlers
  const handleUpdate = (type, groupKey) => {
    console.log(`Update ${type}, ${groupKey ? `Group: ${groupKey}` : ""}`);
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    console.log("Add a new Unli Order");
  };

  // Handler for updating status via dropdown selection
  const updateStatus = (newStatus) => {
    if (newStatus === "Cancelled") {
      if (window.confirm("Switching to Cancelled. Are you sure?")) {
        setOrderStatus(newStatus);
      }
    } else if (newStatus === "Completed") {
      if (
        window.confirm(
          "Switching to Completed. This will deduct the quantity from the inventory. Are you sure?"
        )
      ) {
        setOrderStatus(newStatus);
      }
    } else {
      setOrderStatus(newStatus);
    }
    setIsStatusDropdownOpen(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      {/* Modal container */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-[500px] h-[650px] flex flex-col relative">
        {/* Close Button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Header */}
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold mt-4">
            Transaction No. {transaction.id}
          </h2>
          <div className="mt-2">
            <div className="flex justify-between items-start">
              <div>
                <p>
                  <strong>Date:</strong> {formatDate(transaction.date)}
                </p>
                <p>
                  <strong>Time:</strong> {formatTime(transaction.date)}
                </p>
              </div>
            </div>
            {/* Horizontal row for Menu Type (left) and Status Dropdown (right) */}
            <div className="flex justify-between items-center">
              <p>
                <strong>Menu Type:</strong> {menuType}
              </p>
              {/* Custom Order Status Dropdown */}
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`flex items-center ${getOrderStatusClass(
                    orderStatus
                  )} rounded-md shadow-md hover:opacity-90 active:scale-95 transition-transform duration-150 w-40 overflow-hidden`}
                >
                  <div
                    className={`flex items-center justify-center ${getStatusLeftBg(
                      orderStatus
                    )} p-2`}
                  >
                    <FaClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left px-2 text-white text-sm">
                    {orderStatus}
                  </span>
                  <div className="flex items-center justify-center p-2">
                    {isStatusDropdownOpen ? (
                      <FaChevronUp className="w-4 h-4 text-white" />
                    ) : (
                      <FaChevronDown className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>
                {isStatusDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg z-10">
                    <div className="bg-white rounded-md py-2">
                      <button
                        onClick={() => updateStatus("Pending")}
                        className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                      >
                        Pending
                      </button>
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <h3 className="font-semibold text-xl mt-2">Order Summary</h3>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 mt-4 overflow-y-auto">
          {isInStore ? (
            <>
              {/* Unli Wings Overall Accordion Header */}
              <div
                className="flex items-center justify-between mb-2 cursor-pointer border hover:bg-gray-100 px-3 py-5 rounded-lg"
                onClick={() => setUnliOverallOpen(!unliOverallOpen)}
              >
                <h4 className="font-semibold">Unli Wings Orders</h4>
                <div>{unliOverallOpen ? <FaAngleUp /> : <FaAngleDown />}</div>
              </div>
              {unliOverallOpen && (
                <div className="w-full max-h-[300px] overflow-y-auto">
                  {/* Full-width Add button inside the accordion */}
                  <button
                    onClick={handleAdd}
                    className="w-full mb-3 px-3 py-2 bg-[#E88504] text-white rounded hover:bg-[#E88504]/70"
                  >
                    Add a new Unli Order
                  </button>
                  {Object.keys(groupedUnliWingsOrders).map((groupKey) => {
                    const groupOrders = groupedUnliWingsOrders[groupKey];
                    const baseAmount =
                      groupOrders[0]?.instore_category?.base_amount || 0;
                    return (
                      <div key={groupKey} className="border rounded mb-2">
                        <div
                          className="flex justify-between items-center bg-gray-200 hover:bg-gray-300 px-3 py-2 cursor-pointer"
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
                          <div className="px-3 py-2">
                            <div className="max-h-[200px] overflow-y-auto overflow-x-hidden">
                              <Table
                                columns={["Menu Item", "Quantity"]}
                                data={groupOrders.map((detail) => [
                                  detail?.menu_item?.name || "N/A",
                                  detail?.quantity || 0,
                                ])}
                              />
                              <button
                                onClick={() => handleUpdate("unli", groupKey)}
                                className="w-full mt-3 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Update
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ala Carte Overall Accordion Header */}
              <div
                className="flex items-center justify-between mb-2 mt-4 cursor-pointer border hover:bg-gray-100 px-3 py-5 rounded-lg"
                onClick={() => setAlaCarteOverallOpen(!alaCarteOverallOpen)}
              >
                <h4 className="font-semibold">
                  Ala Carte Orders - ₱{totalAlaCarte.toFixed(2)}
                </h4>
                <div>
                  {alaCarteOverallOpen ? <FaAngleUp /> : <FaAngleDown />}
                </div>
              </div>
              {alaCarteOverallOpen && (
                <div className="w-full max-h-[300px] overflow-y-auto">
                  <Table
                    columns={[
                      "Menu Item",
                      "Quantity",
                      "Price",
                      "Discounts",
                      "Total",
                    ]}
                    data={formatAlaCarteTableData(alaCarteOrders)}
                  />
                  <button
                    onClick={() => handleUpdate("alaCarte")}
                    className="w-full mt-3 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Update
                  </button>
                </div>
              )}
            </>
          ) : isDelivery ? (
            <>
              <h3 className="font-semibold">Order Summary</h3>
              <div className="max-h-[300px] overflow-y-auto">
                <Table
                  columns={["Menu Item", "Quantity", "Price"]}
                  data={formatDeliveryTableData(orderDetails)}
                />
                <button
                  onClick={() => handleUpdate("delivery")}
                  className="w-full mt-3 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Update
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Fixed Footer */}
        <div className="border-t pt-4 mt-4">
          <div className="flex flex-col text-right">
            {isDelivery ? (
              <>
                <p>
                  <strong>Subtotal:</strong> ₱{totalDeliverySubtotal.toFixed(2)}
                </p>
                <p>
                  <strong>Percentage Deduction:</strong>{" "}
                  {(deductionPercentage * 100).toFixed(2)}%
                </p>
                <p>
                  <strong>Total:</strong> ₱{finalTotal.toFixed(2)}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Payment Amount:</strong> ₱{paymentAmount.toFixed(2)}
                </p>
                <p>
                  <strong>Total Price:</strong> ₱{totalPrice.toFixed(2)}
                </p>
                <p>
                  <strong>Change:</strong> ₱{change.toFixed(2)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
