import React, { useState } from "react";
import { Link } from "react-router-dom";
import NewProduct from "./Newproduct"; // Import NewProduct component

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#E2D6D5] flex">
      {/* Main Content */}
      <div className="flex-grow p-6">
        {/* Top Section */}
        <div className="flex items-start mb-4 space-x-4">
          {/* Search Bar and Scrollable Buttons */}
          <div className="w-1/2">
            {/* Search Bar */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                placeholder="Search..."
                className="flex-grow p-2 border rounded-lg shadow"
              />
            </div>

            {/* Scrollable Buttons */}
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
              <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[25%]">
                Button 1
              </button>
              <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[25%]">
                Button 2
              </button>
              <button className="flex items-center justify-center bg-yellow-500 text-white p-2 rounded-lg shadow min-w-[25%]">
                Button 3
              </button>
              <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[25%]">
                Button 4
              </button>
            </div>
          </div>

          {/* Side Buttons with Image and Text */}
          <div className="w-1/2 grid grid-cols-4 gap-4">
            <button
              onClick={openModal}
              className="flex flex-col items-center bg-[#E88504] p-2 rounded-lg shadow min-w-[25%]"
            >
              <img src="/images/stockout/cart.png" alt="New Product" className="w-10 h-10 mb-2" />
              <span className="text-white">New Product</span>
            </button>
            <Link to="/menu">
              <button className="flex flex-col items-center bg-[#E88504] p-2 rounded-lg shadow min-w-[25%]">
                <img src="/images/stockout/menu.png" alt="Menu" className="w-10 h-10 mb-2" />
                <span className="text-white">Menu</span>
              </button>
            </Link>
            <Link to="/stockin">
              <button className="flex flex-col items-center bg-[#00BA34] p-2 rounded-lg shadow min-w-[25%]">
                <img src="/images/stockout/stock.png" alt="Stock In" className="w-10 h-10 mb-2" />
                <span className="text-white">Stock In</span>
              </button>
            </Link>
            <button className="flex flex-col items-center bg-[#FF0000] p-2 rounded-lg shadow min-w-[25%]">
              <img src="/images/stockout/trash.png" alt="Disposed" className="w-10 h-10 mb-2" />
              <span className="text-white">Disposed</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border rounded-lg shadow">
          <table className="table-auto w-full text-left">
            <thead className="bg-[#FFCF03] font-bold">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">PRODUCT NAME</th>
                <th className="p-2">UNIT</th>
                <th className="p-2">QUANTITY</th>
                <th className="p-2">CATEGORY</th>
                <th className="p-2">STOCK OUT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#FFEEA6]">
                <td className="p-2">Data 1</td>
                <td className="p-2">Data 2</td>
                <td className="p-2">Data 3</td>
                <td className="p-2">Data 4</td>
                <td className="p-2">Data 5</td>
                <td className="p-2">
                  <button className="bg-red-500 text-white p-1 rounded shadow">STOCK OUT</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* New Product Modal */}
      <NewProduct isOpen={isModalOpen} closeModal={closeModal} />
    </div>
  );
};

export default Inventory;
