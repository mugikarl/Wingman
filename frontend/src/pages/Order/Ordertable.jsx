import React, { useState, useEffect } from "react";
import axios from "axios";
import ChooseOrder from "../../components/popups/ChooseOrder";
import Table from "../../components/tables/Table";
import OrderEssentials from "../../components/popups/OrderEssentials";
import TransactionModal from "../../components/popups/TransactionModal";

const OrderTable = () => {
  const [isOrderEssentialsOpen, setIsOrderEssentialsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState(["All"]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const openOrderEssentialsModal = () => {
    setIsOrderEssentialsOpen(true);
  };

  const closeOrderEssentialsModal = () => {
    setIsOrderEssentialsOpen(false);
  };

  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setSelectedTransaction(null);
  };

  const toggleFilter = (filter) => {
    setSelectedFilters((prevFilters) =>
      prevFilters.includes(filter)
        ? prevFilters.filter((f) => f !== filter)
        : [...prevFilters, filter]
    );
  };

  const filteredTransactions =
    orderData?.transactions?.filter((order) => {
      if (!orderData) return []; // Ensure orderData is available

      // Filter by order status
      const statusMatch =
        statusFilters.includes("All") ||
        statusFilters.includes(order.order_status?.name);

      // Map type_id to its corresponding name using orderData.menu_types
      const transactionTypes = order.order_details?.map((order_details) => {
        const typeId = order_details.menu_item?.type_id;
        return orderData.menu_types.find((type) => type.id === typeId)?.name;
      });

      // Filter by transaction type
      const transactionTypeMatch =
        selectedFilters.length === 0 || // If no filter is selected, show all
        transactionTypes?.some((type) => selectedFilters.includes(type));

      return statusMatch && transactionTypeMatch;
    }) || [];

  const toggleStatus = (status) => {
    setStatusFilters((prev) => {
      if (status === "All") {
        return ["All"];
      } else {
        const updatedFilters = prev.includes(status)
          ? prev.filter((s) => s !== status)
          : [...prev.filter((s) => s !== "All"), status];
        return updatedFilters.length ? updatedFilters : ["All"];
      }
    });
  };

  const fetchOrderData = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-order-data/"
      );
      setOrderData(response.data);
    } catch (err) {
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const formattedDate = date.toISOString().split("T")[0];
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return (
      <>
        {formattedDate} <br /> {formattedTime}
      </>
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold">Order List</h2>
          <div className="flex space-x-2 mt-2">
            {["All", "Pending", "Completed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilters.includes(status)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex mt-2 space-x-2">
            <input
              type="text"
              placeholder="Search..."
              className="border border-gray-300 px-3 py-1 rounded-md flex-1"
            />
            {["In-Store", "Grab", "FoodPanda"].map((option) => (
              <button
                key={option}
                onClick={() => toggleFilter(option)}
                className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                  selectedFilters.includes(option)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setShowPopup(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-md shadow hover:bg-orange-600"
          >
            Add New Order
          </button>
          <button
            onClick={openOrderEssentialsModal}
            className="flex items-center bg-gradient-to-r from-[#1c4686] to-[#2a5ca7] text-white rounded-md shadow-md hover:from-[#163a6f] hover:to-[#1c4686] transition-colors duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center bg-[#1c4686] p-3">
              <img
                src="/images/stockout/trash.png"
                alt="New Receipt"
                className="w-6 h-6"
              />
            </div>
            <span className="flex-1 text-left pl-3">Order Essentials</span>
          </button>
        </div>
      </div>
      {showPopup && <ChooseOrder onClose={() => setShowPopup(false)} />}
      <OrderEssentials
        isOpen={isOrderEssentialsOpen}
        onClose={closeOrderEssentialsModal}
        menuTypes={orderData.menu_types}
        discountsData={orderData.discounts}
        paymentMethods={orderData.payment_methods}
        fetchOrderData={fetchOrderData}
      />
      <Table
        columns={[
          "Transaction ID",
          "Date",
          "Order Summary",
          "Total Amount",
          "Order Status",
        ]}
        data={
          loading
            ? [["", "", "Loading...", "", ""]]
            : filteredTransactions.map((order) => {
                const orderSummary =
                  order.order_details?.map(
                    (order_details) =>
                      `${order_details.quantity}x - ${order_details.menu_item?.name}`
                  ) || [];

                let formattedOrderSummary;
                if (orderSummary.length === 1) {
                  formattedOrderSummary = orderSummary[0];
                } else if (orderSummary.length === 2) {
                  formattedOrderSummary = (
                    <>
                      {orderSummary[0]} <br />
                      {orderSummary[1]}
                    </>
                  );
                } else if (orderSummary.length > 2) {
                  formattedOrderSummary = (
                    <>
                      {orderSummary[0]} <br />
                      {orderSummary[1]} ...
                    </>
                  );
                } else {
                  formattedOrderSummary = "N/A";
                }

                return [
                  order.id || "N/A",
                  formatDate(order.date) || "N/A",
                  formattedOrderSummary,
                  `₱${
                    order.order_details
                      ?.reduce(
                        (total, order_details) =>
                          total +
                          order_details.quantity *
                            (order_details.menu_item?.price || 0),
                        0
                      )
                      .toFixed(2) || "0.00"
                  }`,
                  order.order_status?.name || "N/A",
                ];
              })
        }
        rowOnClick={(rowIndex) =>
          openTransactionModal(filteredTransactions[rowIndex])
        }
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={closeTransactionModal}
        transaction={selectedTransaction}
        menuTypes={orderData.menu_types}
      />
    </div>
  );
};

export default OrderTable;
