import React, { useState } from "react";
import ChooseOrder from "../../components/popups/ChooseOrder";
import Table from "../../components/tables/Table";
import OrderEssentials from "../../components/popups/OrderEssentials";

const OrderTable = () => {
  const [isOrderEssentialsOpen, setIsOrderEssentialsOpen] = useState(false);

  const openOrderEssentialsModal = () => {
    setIsOrderEssentialsOpen(true);
  };

  const closeOrderEssentialsModal = () => {
    setIsOrderEssentialsOpen(false);
  };

  const columns = ["ORDER ID", "Name", "Quantity", "Actions"];
  const data = [
    [
      "1",
      "Item 1",
      "5",
      <select className="border border-gray-300 rounded-md px-2 py-1">
        <option value="edit">Edit</option>
        <option value="delete">Delete</option>
      </select>,
    ],
    [
      "2",
      "Item 2",
      "3",
      <select className="border border-gray-300 rounded-md px-2 py-1">
        <option value="edit">Edit</option>
        <option value="delete">Delete</option>
      </select>,
    ],
    [
      "3",
      "Item 3",
      "8",
      <select className="border border-gray-300 rounded-md px-2 py-1">
        <option value="edit">Edit</option>
        <option value="delete">Delete</option>
      </select>,
    ],
    [
      "4",
      "Item 4",
      "2",
      <select className="border border-gray-300 rounded-md px-2 py-1">
        <option value="edit">Edit</option>
        <option value="delete">Delete</option>
      </select>,
    ],
  ];

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
      {/* Show Popup */}
      {/* {showPopup && <ChooseOrder onClose={() => setShowPopup(false)} />} */}

      <OrderEssentials
        isOpen={isOrderEssentialsOpen}
        onClose={closeOrderEssentialsModal}
      />

      {/* Table Component */}
      <Table columns={columns} data={data} />
    </div>
  );
};

export default OrderTable;
