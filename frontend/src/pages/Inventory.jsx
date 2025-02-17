import React, { useState } from "react";
import { Link } from "react-router-dom";
import NewProduct from "../components/popups/NewProduct";
import Table from "../components/tables/Table";

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const columns = ["ID", "NAME", "CATEGORY", "UNIT", "QUANTITY"];
  const data = [
    [
      "1",
      "Sample Product",
      "pcs",
      "10",
      "Category A"
    ],
    [
      "2",
      "Another Product",
      "kg",
      "5",
      "Category B"
    ]
  ];

  return (
    <div className="min-h-screen w-full bg-[#E2D6D5] flex">
  {/* Main Content */}
  <div className="flex-grow p-6">
    {/* Top Section */}
    <div className="flex flex-col space-y-4 mb-4">
      {/* Side Buttons with Image and Text (Moved Above Search Bar) */}
      <div className="flex space-x-4">
        {/* New Product Button */}
        <Link to="/inventory">
        <button
          onClick={openModal}
          className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]"
        >
          <img src="/images/stockout/cart.png" alt="New Product" className="w-8 h-8 mr-2" />
          <span className="text-white">Inventory</span>
        </button>
        </Link>
        {/* Other Buttons */}
        <Link to="/items">
          <button className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
            <img src="/images/stockout/menu.png" alt="Menu" className="w-8 h-8 mr-2" />
            <span className="text-white">Items</span>
          </button>
        </Link>

        <Link to="/stockin">
          <button className="flex items-center bg-[#00BA34] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
            <img src="/images/stockout/stock.png" alt="Stock In" className="w-8 h-8 mr-2" />
            <span className="text-white">Stock In</span>
          </button>
        </Link>

        <Link to="/disposeditems">
          <button className="flex items-center bg-[#FF0000] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
            <img src="/images/stockout/trash.png" alt="Disposed" className="w-8 h-8 mr-2" />
            <span className="text-white">Disposed</span>
          </button>
        </Link>
      </div>

      {/* Search Bar and Scrollable Buttons */}
      <div className="w-full">
        {/* Search Bar */}
        <div className="flex items-center space-x-2 mb-4 w-1/2">
          <input
            type="text"
            placeholder="Search..."
            className="flex-grow p-2 border rounded-lg shadow"
          />
        </div>

        {/* Scrollable Buttons */}
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[12%]">
            Button 
          </button>
          <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[12%]">
            Button 2
          </button>
          <button className="flex items-center justify-center bg-yellow-500 text-white p-2 rounded-lg shadow min-w-[11%]">
            Button 3
          </button>
          <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[11%]">
            Button 4
          </button>
        </div>
      </div>
    </div>

    {/* Table */}
    <Table columns={columns} data={data} />

    {/* New Product Modal */}
    <NewProduct isOpen={isModalOpen} closeModal={closeModal} />
  </div>
</div>

  );
};

export default Inventory;