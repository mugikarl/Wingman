import React, { useState, useEffect } from "react";
import Table from "../../components/tables/Table";

const StockIn = () => {
  const columns = ["ID", "PRODUCT NAME", "UNIT", "QUANTITY", "TOTAL COST", "ACTION"];
  const [data, setData] = useState([
    [
      "1",
      "Item A",
      "Kg",
      "2",
      "20.00",
      <button className="bg-[#00BA34] text-white p-2 rounded shadow add-btn">Add</button>
    ],
    [
      "2",
      "Item B",
      "L",
      "3",
      "30.00",
      <button className="bg-[#00BA34] text-white p-2 rounded shadow add-btn">Add</button>
    ]
  ]);

  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      {/* Main Content */}
      <div className="flex-grow">
        {/* Top Section */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <label htmlFor="text1" className="font-bold">Name:</label>
            <input
              type="text"
              id="text1"
              placeholder="Enter text"
              className="p-2 border rounded-lg shadow"
            />
          </div>
          <div className="flex items-center">
            <label className="font-bold mr-4 w-1/4">Date</label>
            <div className="flex-grow relative">
              <input
                type="date"
                className="p-2 border rounded-lg shadow w-full"
                id="calendar"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="text3" className="font-bold">Receipt No:</label>
            <input
              type="text"
              id="text3"
              placeholder="Enter text"
              className="p-2 border rounded-lg shadow"
            />
          </div>
          <button className="bg-[#E88504] text-white px-6 py-2 rounded-lg shadow">Submit</button>
        </div>

        {/* Table */}
        <Table columns={columns} data={data} />
      </div>
    </div>
  );
};

export default StockIn;