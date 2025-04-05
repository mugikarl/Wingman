import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { PiMagnifyingGlass, PiCirclesThreePlusLight } from "react-icons/pi";
import { BiFoodMenu } from "react-icons/bi";
import ChooseOrder from "../../components/popups/ChooseOrder";
import Table from "../../components/tables/Table";
import OrderEssentials from "../../components/popups/OrderEssentials";
import TransactionModal from "../../components/popups/TransactionModal";
import LoadingScreen from "../../components/popups/LoadingScreen";

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
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

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

  // After orderData is fetched:
  const unliWingsCategory = orderData?.instore_categories?.find(
    (cat) => Number(cat.id) === 2
  );
  console.log("Unli Wings Category:", unliWingsCategory);

  const filteredTransactions =
    orderData?.transactions?.filter((order) => {
      if (!orderData) return []; // Ensure orderData is available

      // Search by Transaction ID
      const searchLower = searchQuery.toLowerCase();
      const transactionIdMatch =
        !searchQuery ||
        (order.id && order.id.toString().toLowerCase().includes(searchLower));

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

      return transactionIdMatch && statusMatch && transactionTypeMatch;
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
    setLoading(true);
    console.log("Fetching order data..."); // Debug log
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-order-data/"
      );
      console.log("Order data fetched successfully:", response.data); // Debug log
      setOrderData(response.data);
    } catch (err) {
      console.error("Error fetching order data:", err); // Debug log
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Location state:", location.state); // Debug log
    if (location.state?.refresh) {
      fetchOrderData();
    } else {
      fetchOrderData();
    }
  }, [location.state]);

  if (loading) {
    return <LoadingScreen message={"Loading orders"} />;
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
    <div className="h-screen p-4 bg-[#fcf4dc]">
      <div className="flex mb-4">
        {/* Search Bar with icon and separator */}
        <div className="flex w-[400px]">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <PiMagnifyingGlass className="w-5 h-5 text-gray-500" />
            </div>
            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
              <span className="text-gray-400">|</span>
            </div>
            <input
              type="text"
              placeholder="Search by Transaction ID..."
              className="w-full pl-14 p-2 border rounded-lg shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start">
        <div>
          {/* Status Filters */}
          <div className="flex space-x-2">
            <button
              key="All"
              onClick={() => toggleStatus("All")}
              className={`px-3 py-1 font-normal rounded-md transition-colors w-28 text-center border bg-white hover:bg-gray-200 shadow-s ${
                statusFilters.includes("All")
                  ? "border-l-4 border-[#CC5500] text-[#CC5500] hover:text-[#B34A00]"
                  : "border-gray-300 bg-white hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {orderData?.order_status_types
              ?.slice()
              .sort((a, b) => a.id - b.id)
              .map((status) => {
                let color = "bg-white hover:bg-gray-200";
                if (status.name === "Pending") {
                  color =
                    "border-l-4 border-yellow-400 bg-white text-yellow-400 hover:text-yellow-500";
                } else if (status.name === "Completed") {
                  color =
                    "border-l-4 border-green-500 bg-white text-green-500 hover:text-green-600";
                } else if (status.name === "Cancelled") {
                  color =
                    "border-l-4 border-red-500 bg-white text-red-500 hover:text-red-600";
                }

                return (
                  <button
                    key={status.id}
                    onClick={() => toggleStatus(status.name)}
                    className={`px-3 py-1 rounded-md transition-colors w-28 text-center border-gray-300 shadow-sm ${
                      statusFilters.includes(status.name)
                        ? `${color} text-white border`
                        : "border bg-white hover:bg-gray-200"
                    }`}
                  >
                    {status.name}
                  </button>
                );
              })}
          </div>

          {/* Menu Type Filters */}
          <div className="flex mt-2 space-x-2">
            {orderData?.menu_types?.map((type) => {
              let color = "bg-white hover:bg-gray-200";
              if (type.name === "In-Store") {
                color = "bg-[#CC5500] hover:bg-[#B34A00]";
              } else if (type.name === "Grab") {
                color = "bg-green-500 hover:bg-green-600";
              } else if (type.name === "FoodPanda") {
                color = "bg-pink-500 hover:bg-pink-600";
              }

              return (
                <button
                  key={type.id}
                  onClick={() => toggleFilter(type.name)}
                  className={`px-3 py-1 rounded-md transition-colors w-28 text-center border border-gray-300 shadow-sm ${
                    selectedFilters.includes(type.name)
                      ? `${color} text-white`
                      : "bg-white hover:bg-gray-200"
                  }`}
                >
                  <span>{type.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Link to="/order">
            <button className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden">
              <div className="flex items-center justify-center border-r p-3">
                <BiFoodMenu className="w-5 h-5 text-[#CC5500]" />
              </div>
              <span className="flex-1 text-left pl-3">Add New Order</span>
            </button>
          </Link>
          <button
            onClick={openOrderEssentialsModal}
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <PiCirclesThreePlusLight className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">Order Essentials</span>
          </button>
        </div>
      </div>

      <div className="mt-4">
        {showPopup && <ChooseOrder onClose={() => setShowPopup(false)} />}
        <OrderEssentials
          isOpen={isOrderEssentialsOpen}
          onClose={closeOrderEssentialsModal}
          menuTypes={orderData.menu_types}
          discountsData={orderData.discounts}
          paymentMethods={orderData.payment_methods}
          fetchOrderData={fetchOrderData}
        />

        {/* Table with built-in scrolling */}
        <Table
          columns={[
            "Transaction ID",
            "Date",
            "Order Summary",
            "Total Amount",
            "Order Status",
          ]}
          data={filteredTransactions.map((order) => {
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
          })}
          rowOnClick={(rowIndex) =>
            openTransactionModal(filteredTransactions[rowIndex])
          }
          maxHeight="500px"
        />
      </div>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={closeTransactionModal}
        transaction={selectedTransaction}
        menuTypes={orderData.menu_types}
        discountsData={orderData.discounts}
        menuItems={orderData.menu_items}
        menuCategories={orderData.menu_categories}
        unliWingsCategory={unliWingsCategory}
        employees={orderData.employees}
        fetchOrderData={fetchOrderData}
      />
    </div>
  );
};

export default OrderTable;
