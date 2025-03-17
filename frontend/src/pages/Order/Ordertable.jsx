import React, { useState, useEffect } from "react";
import axios from "axios";
import ChooseOrder from "../../components/popups/ChooseOrder";
import Table from "../../components/tables/Table";
import OrderEssentials from "../../components/popups/OrderEssentials";
import LoadingScreen from "../../components/popups/LoadingScreen"; // Import the LoadingScreen component
import { FaFileCircleMinus, FaBowlRice } from "react-icons/fa6";

const OrderTable = () => {
  const [isOrderEssentialsOpen, setIsOrderEssentialsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  if (loading) {
    return <LoadingScreen />; // Use the LoadingScreen component here
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  const columns = ["ORDER ID", "Name", "Price", "Actions"];

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
      {/* Buttons Container */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setShowPopup(true)}
          className="flex items-center bg-gradient-to-r from-[#864926] to-[#a95a00] text-white rounded-md shadow-md hover:from-[#864926] hover:to-[#864926] transition-colors duration-200 w-48 overflow-hidden"
        >
          {/* Image Side */}
          <div className="flex items-center justify-center bg-[#864926] p-3">
            <FaBowlRice className="w-5 h-5 text-white" />
          </div>
          <span className="flex-1 text-left pl-3">Add Order</span>
        </button>

        <button
          onClick={openOrderEssentialsModal}
          className="flex items-center bg-gradient-to-r from-[#864926] to-[#a95a00] text-white rounded-md shadow-md hover:from-[#864926] hover:to-[#864926] transition-colors duration-200 w-48 overflow-hidden"
        >
          {/* Image Side */}
          <div className="flex items-center justify-center bg-[#864926] p-3">
            <FaFileCircleMinus className="w-5 h-5 text-white" />
          </div>
          <span className="flex-1 text-left pl-3">Order Essentials</span>
        </button>
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

      <Table columns={columns} data={data} />
    </div>
  );
};

export default OrderTable;