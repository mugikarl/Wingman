import React from "react";
import Table from "../../components/tables/Table";

const TransactionModal = ({ isOpen, onClose, transaction, menuTypes }) => {
  if (!isOpen || !transaction) return null;

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

  const getMenuTypeClass = (menuType) => {
    switch (menuType) {
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
  const menuType =
    menuTypes.find((type) => type.id === menuTypeId)?.name || "Unknown";
  console.log("Retrieved Menu Type:", menuType);

  const isInStore = menuType === "In-Store";

  // Separate Unli Wings (id:2) and Ala Carte (id:1) orders
  const orderDetails = transaction.order_details || [];

  const unliWingsOrders = orderDetails.filter(
    (detail) => Number(detail.instore_category?.id) === 2
  );

  const alaCarteOrders = orderDetails.filter(
    (detail) => Number(detail.instore_category?.id) === 1
  );

  const formatTableData = (orders) =>
    orders.length > 0
      ? orders.map((detail) => {
          const quantity = detail?.quantity || 0;
          const price = detail?.menu_item?.price || 0;
          const discount = detail?.discount || 0;
          const total = quantity * price;
          const discountValue = total * (discount / 100);
          const finalTotal = total - discountValue;

          return [
            detail?.menu_item?.name || "N/A",
            quantity,
            `₱${price.toFixed(2)}`,
            `${discount}%`,
            `₱${finalTotal.toFixed(2)}`,
          ];
        })
      : [["None", "-", "-", "-", "-"]];

  const allOrders = transaction.order_details || [];
  const formattedOrders = formatTableData(allOrders);

  const totalPrice = formattedOrders.reduce((sum, row) => {
    const value = parseFloat(row[4].replace("₱", "")) || 0;
    return sum + value;
  }, 0);

  const paymentAmount = transaction.payment_amount || 0;
  const change = paymentAmount - totalPrice;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[500px] relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
        >
          &times;
        </button>

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

        <h3 className="mt-4 font-semibold">Order Summary</h3>
        {isInStore && unliWingsOrders.length > 0 && (
          <>
            <h3 className="mt-4 font-semibold">Unli Wings Orders</h3>
            <Table
              columns={["Menu Item", "Quantity", "Price", "Discounts", "Total"]}
              data={formatTableData(unliWingsOrders)}
            />
          </>
        )}

        {isInStore && alaCarteOrders.length > 0 && (
          <>
            <h3 className="mt-4 font-semibold">Ala Carte Orders</h3>
            <Table
              columns={["Menu Item", "Quantity", "Price", "Discounts", "Total"]}
              data={formatTableData(alaCarteOrders)}
            />
          </>
        )}

        <div className="flex flex-col justify-end space-y-2 mt-4 text-right">
          <p>
            <strong>Payment Amount:</strong> ₱{paymentAmount.toFixed(2)}
          </p>
          <p>
            <strong>Total Price:</strong> ₱{totalPrice.toFixed(2)}
          </p>
          <p>
            <strong>Change:</strong> ₱{change.toFixed(2)}
          </p>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
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
  );
};

export default TransactionModal;
