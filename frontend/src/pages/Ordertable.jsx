import React, { useState } from "react";
import ChooseOrder from "../components/popups/ChooseOrder";
import Table from "../components/tables/Table";

const OrderTable = () => {
  const [showPopup, setShowPopup] = useState(false);

  const columns = ["ORDER ID", "Name", "Quantity", "Actions"];
  const data = [
    ["1", "Item 1", "5", <select className="border border-gray-300 rounded-md px-2 py-1"><option value="edit">Edit</option><option value="delete">Delete</option></select>],
    ["2", "Item 2", "3", <select className="border border-gray-300 rounded-md px-2 py-1"><option value="edit">Edit</option><option value="delete">Delete</option></select>],
    ["3", "Item 3", "8", <select className="border border-gray-300 rounded-md px-2 py-1"><option value="edit">Edit</option><option value="delete">Delete</option></select>],
    ["4", "Item 4", "2", <select className="border border-gray-300 rounded-md px-2 py-1"><option value="edit">Edit</option><option value="delete">Delete</option></select>]
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
      
      {/* Show Popup */}
      {showPopup && <ChooseOrder onClose={() => setShowPopup(false)} />}

      {/* Table Component */}
      <Table columns={columns} data={data} />
    </div>
  );
};

export default OrderTable;