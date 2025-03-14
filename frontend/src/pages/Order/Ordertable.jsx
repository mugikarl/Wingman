import React, { useState, useEffect } from "react";
import axios from "axios";
import ChooseOrder from "../../components/popups/ChooseOrder";
import Table from "../../components/tables/Table";
import OrderEssentials from "../../components/popups/OrderEssentials";

const OrderTable = () => {
  const [isOrderEssentialsOpen, setIsOrderEssentialsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // For ChooseOrder popup if needed
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const openOrderEssentialsModal = () => {
    setIsOrderEssentialsOpen(true);
  };

  const closeOrderEssentialsModal = () => {
    setIsOrderEssentialsOpen(false);
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
      setLoading(false); // ✅ Ensure loading is set to false
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

  // Update the table columns as needed.
  const columns = ["ORDER ID", "Name", "Price", "Actions"];

  // Map the fetched menu items to table data rows.
  const data =
    orderData && orderData.menu_items
      ? orderData.menu_items.map((item) => [
          item.id,
          item.name,
          item.price,
          <select className="border border-gray-300 rounded-md px-2 py-1">
            <option value="edit">Edit</option>
            <option value="delete">Delete</option>
          </select>,
        ])
      : [];

  return (
    <div className="p-4">
      {/* Add New Order Button */}
      <button
        onClick={() => setShowPopup(true)}
        className="bg-orange-500 text-white px-4 py-2 rounded-md shadow hover:bg-orange-600 mb-4"
      >
        Add New Order
      </button>
      <button
        onClick={openOrderEssentialsModal}
        className="flex items-center bg-gradient-to-r from-[#1c4686] to-[#2a5ca7] text-white rounded-md shadow-md hover:from-[#163a6f] hover:to-[#1c4686] transition-colors duration-200 w-48 overflow-hidden mb-4"
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

      {/* Optionally, show the ChooseOrder popup */}
      {showPopup && <ChooseOrder onClose={() => setShowPopup(false)} />}

      {/* Pass menu_types from API as a prop to the modal */}
      <OrderEssentials
        isOpen={isOrderEssentialsOpen}
        onClose={closeOrderEssentialsModal}
        menuTypes={orderData.menu_types}
        discountsData={orderData.discounts}
        paymentMethods={orderData.payment_methods}
        fetchOrderData={fetchOrderData}
      />

      {/* Table Component */}
      <Table columns={columns} data={data} />
    </div>
  );
};

export default OrderTable;
