import React, { useState } from "react";
import Table from "../../components/tables/Table";
import { useNavigate } from "react-router-dom";

const TransactionModal = ({ isOpen, onClose, transaction, menuTypes }) => {
  if (!isOpen || !transaction) return null; // Remove isInStore from here if needed

  const navigate = useNavigate();

  // Local state for managing accordion open/closed status
  const [openAccordion, setOpenAccordion] = useState({});
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

  const orderStatus = transaction.order_status?.name || "Unknown";
  const menuTypeId = transaction.order_details?.[0]?.menu_item?.type_id;
  const menuTypeData = menuTypes.find((type) => type.id === menuTypeId);
  const menuType = menuTypeData ? menuTypeData.name : "Unknown";
  console.log("Retrieved Menu Type:", menuType);

  const isInStore = menuType === "In-Store";
  const isDelivery = menuType === "Grab" || menuType === "FoodPanda";

  // For Unli Wings orders (In‑Store), display only the menu item and quantity.
  const formatUnliWingsTableData = (orders) =>
    orders.length > 0
      ? orders.map((detail) => [
          detail?.menu_item?.name || "N/A",
          detail?.quantity || 0,
        ])
      : [["None", "-"]];

  // For Ala Carte orders (In‑Store), compute subtotal: quantity * price * (1 - discount/100)
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

  // For delivery orders (Grab/FoodPanda), show table with Menu Item, Quantity, Price.
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

  // Separate orders into Unli Wings (id:2) and Ala Carte (id:1) for In‑Store;
  // For delivery orders, we use all order_details.
  const orderDetails = transaction.order_details || [];
  const unliWingsOrders = orderDetails.filter(
    (detail) => Number(detail.instore_category?.id) === 2
  );
  const alaCarteOrders = orderDetails.filter(
    (detail) => Number(detail.instore_category?.id) === 1
  );

  // Group Unli Wings orders by unli_wings_group
  const groupedUnliWingsOrders = unliWingsOrders.reduce((acc, detail) => {
    const groupKey = detail.unli_wings_group || "Ungrouped";
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(detail);
    return acc;
  }, {});

  // Compute total for Unli Wings: for each group, add the group's base amount (once per group)
  const totalUnliWings = Object.keys(groupedUnliWingsOrders).reduce(
    (sum, groupKey) => {
      const groupOrders = groupedUnliWingsOrders[groupKey];
      const baseAmount = groupOrders[0]?.instore_category?.base_amount || 0;
      return sum + baseAmount;
    },
    0
  );

  // Compute total for Ala Carte orders (In‑Store)
  const totalAlaCarte = alaCarteOrders.reduce((sum, detail) => {
    const quantity = detail?.quantity || 0;
    const price = detail?.menu_item?.price || 0;
    const discount = detail?.discount?.percentage
      ? detail.discount.percentage * 100
      : 0;
    return sum + quantity * price * (1 - discount / 100);
  }, 0);

  // For Delivery orders, compute subtotal: sum of (quantity * price) for all order_details.
  const totalDeliverySubtotal = orderDetails.reduce((sum, detail) => {
    const quantity = detail?.quantity || 0;
    const price = detail?.menu_item?.price || 0;
    return sum + quantity * price;
  }, 0);

  // For Delivery orders, retrieve deduction percentage from the menu type (from menuTypeData)
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

  // Handle Edit: store the transaction in localStorage then navigate
  const handleEdit = () => {
    console.log("Editing transaction:", transaction);
    // Save transaction in localStorage
    localStorage.setItem("transaction", JSON.stringify(transaction));
    // Navigate to "/order"
    navigate("/order", { state: { transaction } });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      {/* Modal container with fixed height and relative positioning */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-[1000px] h-[650px] flex flex-col relative">
        {/* Top Controls: Close and Edit Buttons */}
        <div className="absolute top-2 right-2 flex space-x-2">
          <button
            onClick={handleEdit}
            className="p-2 rounded bg-orange-500 text-white hover:bg-orange-700 flex items-center justify-center border"
          >
            Edit
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold mt-4">
            Transaction No. {transaction.id}
          </h2>
          <div className="flex justify-between items-start mt-2">
            <div>
              <p>
                <strong>Date:</strong> {formatDate(transaction.date)}
              </p>
              <p>
                <strong>Time:</strong> {formatTime(transaction.date)}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <div
                className={`text-sm px-3 py-1 rounded-md ${getOrderStatusClass(
                  orderStatus
                )}`}
              >
                <strong>{orderStatus}</strong>
              </div>
              <div
                className={`text-sm px-3 py-1 rounded-md ${getMenuTypeClass(
                  menuType
                )}`}
              >
                <strong>{menuType}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area with extra bottom padding */}
        <div className="flex-1 mt-4">
          {isInStore ? (
            <>
              <h3 className="font-semibold">Order Summary</h3>
              {unliWingsOrders.length > 0 && alaCarteOrders.length > 0 ? (
                <div className="flex flex-row space-x-4">
                  {/* Unli Wings Orders container */}
                  <div className="w-1/2 max-h-[300px] overflow-y-auto">
                    <h4 className="font-semibold">Unli Wings Orders</h4>
                    {Object.keys(groupedUnliWingsOrders).map((groupKey) => {
                      const groupOrders = groupedUnliWingsOrders[groupKey];
                      const baseAmount =
                        groupOrders[0]?.instore_category?.base_amount || 0;
                      return (
                        <div key={groupKey} className="border rounded mb-2">
                          <button
                            onClick={() => toggleAccordion(groupKey)}
                            className="w-full text-left px-3 py-2 bg-gray-200 hover:bg-gray-300"
                          >
                            Unli Wings Order #{groupKey} - ₱
                            {baseAmount.toFixed(2)}
                          </button>
                          {openAccordion[groupKey] && (
                            <div className="max-h-[200px] overflow-y-auto overflow-x-hidden">
                              <Table
                                columns={["Menu Item", "Quantity"]}
                                data={groupOrders.map((detail) => [
                                  detail?.menu_item?.name || "N/A",
                                  detail?.quantity || 0,
                                ])}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Ala Carte Orders container */}
                  <div className="w-1/2 max-h-[300px] overflow-y-auto">
                    <h4 className="font-semibold">Ala Carte Orders</h4>
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
                  </div>
                </div>
              ) : unliWingsOrders.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <h4 className="font-semibold">Unli Wings Orders</h4>
                  {Object.keys(groupedUnliWingsOrders).map((groupKey) => {
                    const groupOrders = groupedUnliWingsOrders[groupKey];
                    const baseAmount =
                      groupOrders[0]?.instore_category?.base_amount || 0;
                    return (
                      <div key={groupKey} className="border rounded mb-2">
                        <button
                          onClick={() => toggleAccordion(groupKey)}
                          className="w-full text-left px-3 py-2 bg-gray-200 hover:bg-gray-300"
                        >
                          Unli Wings Order #{groupKey} - ₱
                          {baseAmount.toFixed(2)}
                        </button>
                        {openAccordion[groupKey] && (
                          <div className="max-h-[200px] overflow-y-auto overflow-x-hidden">
                            <Table
                              columns={["Menu Item", "Quantity"]}
                              data={groupOrders.map((detail) => [
                                detail?.menu_item?.name || "N/A",
                                detail?.quantity || 0,
                              ])}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : alaCarteOrders.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <h4 className="font-semibold">Ala Carte Orders</h4>
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
                </div>
              ) : null}
            </>
          ) : isDelivery ? (
            <>
              <h3 className="font-semibold">Order Summary</h3>
              <div className="max-h-[300px] overflow-y-auto">
                <Table
                  columns={["Menu Item", "Quantity", "Price"]}
                  data={formatDeliveryTableData(orderDetails)}
                />
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
          <div className="mt-2 flex justify-end space-x-2">
            {orderStatus === "Pending" && (
              <>
                <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                  Cancel Order
                </button>
                <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                  Complete Order
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
