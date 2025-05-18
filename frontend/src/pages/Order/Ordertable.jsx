import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  PiMagnifyingGlass,
  PiCirclesThreePlusLight,
  PiCaretDown,
} from "react-icons/pi";
import { BiFoodMenu } from "react-icons/bi";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
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
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const statusDropdownRef = useRef(null);
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
    const role = localStorage.getItem("role");
    setIsAdmin(role === "Admin");
    console.log("Location state:", location.state);
    if (location.state?.refresh) {
      fetchOrderData();
    } else {
      fetchOrderData();
    }
  }, [location.state]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log("Status filters changed:", statusFilters);
  }, [statusFilters, selectedFilters, searchQuery]);

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

  const getSelectedStatusesText = () => {
    if (statusFilters.includes("All")) {
      return "All";
    }
    if (statusFilters.length === 1) {
      return statusFilters[0];
    }
    return `${statusFilters.length} selected`;
  };

  const filteredTransactions =
    orderData?.transactions?.filter((order) => {
      if (!orderData) return false;

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

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    // Define status priority
    const getStatusPriority = (status) => {
      if (status === "Pending") return 1;
      if (status === "Completed") return 2;
      if (status === "Cancelled") return 3;
      if (status === "Complimentary") return 4;
      return 5; // Any other status
    };

    const statusA = a.order_status?.name || "";
    const statusB = b.order_status?.name || "";

    // Compare by status priority first
    const priorityDiff =
      getStatusPriority(statusA) - getStatusPriority(statusB);
    if (priorityDiff !== 0) return priorityDiff;

    // If same status, sort by date
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    // For Pending and Cancelled: earliest to latest
    if (statusA === "Pending" || statusA === "Cancelled") {
      return dateA - dateB;
    }
    // For Completed: latest to earliest
    else if (statusA === "Completed") {
      return dateB - dateA;
    }

    // Default sort by date ascending
    return dateA - dateB;
  });

  const tableData = sortedTransactions.map((order) => {
    // Calculate order summary
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

    // Get status color
    let statusColor = "text-gray-700";
    const status = order.order_status?.name || "N/A";

    if (status === "Pending") {
      statusColor = "text-yellow-400 font-medium";
    } else if (status === "Completed") {
      statusColor = "text-green-500 font-medium";
    } else if (status === "Cancelled") {
      statusColor = "text-red-500 font-medium";
    } else if (status === "Complimentary") {
      statusColor = "text-blue-500 font-medium";
    }

    // Determine order type
    const orderTypeId = order.order_details?.[0]?.menu_item?.type_id;
    const orderTypeObj = orderData.menu_types.find(
      (type) => type.id === orderTypeId
    );
    const orderType = orderTypeObj?.name || "Unknown";

    // Set color based on order type
    let orderTypeColor = "text-gray-700";
    if (orderType === "In-Store") {
      orderTypeColor = "text-[#CC5500] font-medium";
    } else if (orderType === "Grab") {
      orderTypeColor = "text-green-500 font-medium";
    } else if (orderType === "FoodPanda") {
      orderTypeColor = "text-pink-500 font-medium";
    }

    // Calculate total with discount
    const calculateTotalWithDiscount = () => {
      const orderDetails = order.order_details || [];

      // For In-Store orders
      if (orderDetails.length > 0 && orderDetails[0].menu_item?.type_id === 1) {
        // Group by unli wings orders
        const unliWingsOrders = orderDetails.filter(
          (detail) => Number(detail.instore_category?.id) === 2
        );
        const alaCarteOrders = orderDetails.filter(
          (detail) =>
            Number(detail.instore_category?.id) === 1 ||
            !detail.instore_category
        );

        // Calculate ala carte total with discounts
        const alaCarteTotal = alaCarteOrders.reduce((sum, detail) => {
          const quantity = detail?.quantity || 0;
          const price = detail?.menu_item?.price || 0;
          const discountPercentage = detail?.discount?.percentage || 0;
          return sum + quantity * price * (1 - discountPercentage);
        }, 0);

        // Get unique unli wings groups to calculate base amount
        const uniqueGroups = [
          ...new Set(unliWingsOrders.map((d) => d.unli_wings_group)),
        ];

        const unliWingsCategory = orderData?.instore_categories?.find(
          (cat) => Number(cat.id) === 2
        );

        const unliWingsTotal =
          uniqueGroups.length * (unliWingsCategory?.base_amount || 0);

        return (alaCarteTotal + unliWingsTotal).toFixed(2);
      }
      // For delivery orders (Grab/FoodPanda)
      else {
        const subtotal = orderDetails.reduce((sum, detail) => {
          const quantity = detail?.quantity || 0;
          const price = detail?.menu_item?.price || 0;
          return sum + quantity * price;
        }, 0);

        // Find the menu type for deduction percentage
        const menuTypeId = orderDetails[0]?.menu_item?.type_id;
        const menuTypeData = orderData.menu_types.find(
          (type) => type.id === menuTypeId
        );
        const deductionPercentage = menuTypeData?.deduction_percentage || 0;

        // Only deduct for delivery apps
        const total =
          menuTypeId !== 1 ? subtotal * (1 - deductionPercentage) : subtotal;

        return total.toFixed(2);
      }
    };

    // Return a row array with the data
    return [
      order.id || "N/A",
      formatDate(order.date) || "N/A",
      <span className={orderTypeColor}>{orderType}</span>,
      formattedOrderSummary,
      `₱${calculateTotalWithDiscount()}`,
      <span className={statusColor}>{status}</span>,
    ];
  });

  return (
    <div className="h-screen p-4 bg-[#fcf4dc]">
      <div className="flex justify-between mb-4">
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

        {/* Add New Order button aligned with search bar */}
        <Link to="/order">
          <button className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden">
            <div className="flex items-center justify-center border-r p-3">
              <BiFoodMenu className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">Add New Order</span>
          </button>
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          {/* Filters Row - Status dropdown and Transaction Type buttons in same row */}
          <div className="flex space-x-2 flex-wrap">
            {/* Status Filters Dropdown */}
            <div className="justify-between" ref={statusDropdownRef}>
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="px-3 py-1 font-normal rounded-md transition-colors w- text-center border mb-2 mr-1 bg-white hover:bg-gray-200 shadow-sm flex justify-between items-center"
              >
                <span>
                  {statusFilters.includes("All")
                    ? "All"
                    : statusFilters.length > 1
                    ? `${statusFilters.length} selected`
                    : statusFilters[0]}
                </span>
                <PiCaretDown
                  className={`transform ${
                    isStatusDropdownOpen ? "rotate-180" : ""
                  } transition-transform`}
                />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute z-10 w-56 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="p-2 border-b">
                    <div
                      className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                      onClick={() => {
                        toggleStatus("All");
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      {statusFilters.includes("All") ? (
                        <MdCheckBox className="mr-2 text-[#CC5500]" />
                      ) : (
                        <MdCheckBoxOutlineBlank className="mr-2 text-gray-400" />
                      )}
                      <span>All</span>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-auto">
                    {orderData?.order_status_types
                      ?.slice()
                      .sort((a, b) => a.id - b.id)
                      .map((status) => {
                        let textColor = "text-gray-700";

                        if (status.name === "Pending") {
                          textColor = "text-yellow-400";
                        } else if (status.name === "Completed") {
                          textColor = "text-green-500";
                        } else if (status.name === "Cancelled") {
                          textColor = "text-red-500";
                        } else if (status.name === "Complimentary") {
                          textColor = "text-blue-500";
                        }

                        return (
                          <div
                            key={status.id}
                            className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md mx-2"
                            onClick={() => toggleStatus(status.name)}
                          >
                            {statusFilters.includes(status.name) ? (
                              <MdCheckBox className={`mr-2 ${textColor}`} />
                            ) : (
                              <MdCheckBoxOutlineBlank className="mr-2 text-gray-400" />
                            )}
                            <span
                              className={
                                statusFilters.includes(status.name)
                                  ? textColor
                                  : ""
                              }
                            >
                              {status.name}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Menu Type Filters - Now in the same row as status dropdown */}
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
                  className={`px-3 py-1 rounded-md transition-colors w-28 text-center border border-gray-300 shadow-sm mb-2 ${
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

        {/* Order Essentials*/}
        {isAdmin && (
          <button
            onClick={openOrderEssentialsModal}
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <PiCirclesThreePlusLight className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">Order Essentials</span>
          </button>
        )}
      </div>

      <div className="mt-4">
        {showPopup && <ChooseOrder onClose={() => setShowPopup(false)} />}

        {/* Table with built-in scrolling */}
        <Table
          columns={[
            "Transaction ID",
            "Date",
            "Order Type",
            "Order Summary",
            "Total Amount",
            "Order Status",
          ]}
          data={tableData}
          rowOnClick={(rowIndex) =>
            openTransactionModal(sortedTransactions[rowIndex])
          }
          maxHeight="500px"
          sortableColumns={[0, 1]}
        />
      </div>

      <OrderEssentials
        isOpen={isOrderEssentialsOpen}
        onClose={closeOrderEssentialsModal}
        menuTypes={orderData.menu_types}
        discountsData={orderData.discounts}
        paymentMethods={orderData.payment_methods}
        instore_categories={orderData.instore_categories}
        fetchOrderData={fetchOrderData}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={closeTransactionModal}
        transaction={selectedTransaction}
        menuTypes={orderData.menu_types}
        discountsData={orderData.discounts}
        menuItems={orderData.menu_items}
        menuCategories={orderData.menu_categories}
        unliWingsCategory={orderData?.instore_categories?.find(
          (cat) => Number(cat.id) === 2
        )}
        employees={orderData.employees}
        fetchOrderData={fetchOrderData}
        payment_methods={orderData.payment_methods}
      />
    </div>
  );
};

export default OrderTable;
