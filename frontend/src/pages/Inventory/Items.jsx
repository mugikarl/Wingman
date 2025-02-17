import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Datepicker } from "flowbite-react";
import NewProduct from "../../components/popups/NewProduct";
import Table from "../../components/tables/Table";

const getLocalDateString = (date) => {
  return date.toLocaleDateString("en-CA");
};

const Items = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [showDatepicker, setShowDatepicker] = useState(false);
  const displayDate = new Date(selectedDate).toDateString();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const decrementDate = () => {
    const dateObj = new Date(selectedDate);
    dateObj.setDate(dateObj.getDate() - 1);
    setSelectedDate(getLocalDateString(dateObj));
  };

  const incrementDate = () => {
    const dateObj = new Date(selectedDate);
    dateObj.setDate(dateObj.getDate() + 1);
    setSelectedDate(getLocalDateString(dateObj));
  };

  const columns = ["ID", "NAME", "CATEGORY", "UNIT", "QUANTITY"];
  const data = [
    ["1", "Sample Product", "pcs", "10", "Category A"],
    ["2", "Another Product", "kg", "5", "Category B"]
  ];

  return (
    <div className="min-h-screen w-full bg-[#E2D6D5] flex">
      <div className="flex-grow p-6">
        <div className="flex flex-col space-y-4 mb-4">
          
          <div className="flex space-x-4">
            <Link to="/inventory">
              <button onClick={openModal} className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
                <img src="/images/stockout/cart.png" alt="New Product" className="w-8 h-8 mr-2" />
                <span className="text-white">Inventory</span>
              </button>
            </Link>
            <Link to="">
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
          <div className="w-full">
          <div className="flex items-center justify-between space-x-2 mb-4">
            <input type="text" 
                   placeholder="Search..." 
                   className="w-1/2 p-2 border rounded-lg shadow" 
            />
            <Link to="">
              <button className="flex items-center bg-[#1c4686] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
                <img src="/images/stockout/trash.png" alt="Disposed" className="w-8 h-8 mr-2" />
                <span className="text-white">New Item</span>
              </button>
            </Link>
          </div>
          
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
        <div className="relative bg-[#c27100] text-lg font-semibold w-full rounded flex justify-between items-center">
            <button className="px-4 py-2 text-white hover:bg-white hover:text-[#c27100] border-r border-white" onClick={decrementDate}>
              &lt;
            </button>
            <div className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer px-2 bg-[#c27100] text-white" onClick={() => setShowDatepicker(!showDatepicker)}>
              {displayDate}
            </div>
            <button className="px-4 py-2 text-white hover:bg-white hover:text-[#c27100] border-l border-white" onClick={incrementDate}>
              &gt;
            </button>
            {showDatepicker && (
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-white shadow-lg rounded-lg">
                <Datepicker
                  inline
                  value={new Date(selectedDate)}
                  onChange={(date) => {
                    if (date instanceof Date) {
                      setSelectedDate(getLocalDateString(date));
                      setShowDatepicker(false);
                    } else if (Array.isArray(date) && date.length > 0) {
                      setSelectedDate(getLocalDateString(date[0]));
                      setShowDatepicker(false);
                    }
                  }}
                />
              </div>
            )}
          </div>
        <Table columns={columns} data={data} />
        <NewProduct isOpen={isModalOpen} closeModal={closeModal} />
      </div>
    </div>
  );
};

export default Items;
