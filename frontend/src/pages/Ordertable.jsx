import React, { useState } from "react";
import ChooseOrder from "../components/popups/ChooseOrder"; 

const OrderTable = () => {
  const [showPopup, setShowPopup] = useState(false);

  const tableData = [
    { id: 1, name: "Item 1", quantity: 5, price: "$10" },
    { id: 2, name: "Item 2", quantity: 3, price: "$15" },
    { id: 3, name: "Item 3", quantity: 8, price: "$20" },
    { id: 4, name: "Item 4", quantity: 2, price: "$25" },
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

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2 w-1/6">ORDER ID</th>
            <th className="px-4 py-2 w-1/6">Name</th>
            <th className="px-4 py-2 w-1/2">Quantity</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr
              key={row.id}
              className={index % 2 === 0 ? "bg-yellow-100" : "bg-white"}
            >
              <td className="px-4 py-2">{row.id}</td>
              <td className="px-4 py-2">{row.name}</td>
              <td className="px-4 py-2 w-1/2">{row.quantity}</td>
              <td className="px-4 py-2 text-center">
                <select className="border border-gray-300 rounded-md px-2 py-1">
                  <option value="edit">Edit</option>
                  <option value="delete">Delete</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
