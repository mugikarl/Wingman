import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Table from "../../components/tables/Table";
import AddStockInDetails from "../../components/popups/AddStockInDetails";
import EditStockInDetails from "../../components/popups/EditStockInDetails";

const StockIn = () => {
  const [isAddStockInOpen, setIsAddStockInOpen] = useState(false);
  const [isEditStockInOpen, setIsEditStockInOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [inventory, setInvetory] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [unitMeasurements, setUnitMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);

  const openAddStockInModal = () => {
    setSelectedReceipt(null);
    setIsAddStockInOpen(true);
  };

  const openEditStockInModal = (receipt) => {
    setSelectedReceipt(receipt);
    setIsEditStockInOpen(true);
  };

  const closeAddStockInModal = () => {
    setIsAddStockInOpen(false);
  };

  const closeEditStockInModal = () => {
    setIsEditStockInOpen(false);
    setSelectedReceipt(null);
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-item-data/"
      );
      setReceipts(response.data.receipts || []);
      setUnitMeasurements(response.data.units || []);
      setItems(response.data.items || []);
      setInvetory(response.data.inventory || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setReceipts([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const columns = ["RECEIPT NO.", "SUPPLIER NAME", "DATE"];
  const tableData = receipts.map((receipt) => [
    receipt.receipt_no,
    receipt.supplier_name,
    receipt.date,
  ]);

  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      {/* Navigation Buttons */}
      <div className="flex space-x-4 mb-4">
        <Link to="/inventory">
          <button className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
            <img
              src="/images/stockout/cart.png"
              alt="Inventory"
              className="w-8 h-8 mr-2"
            />
            <span className="text-white">Inventory</span>
          </button>
        </Link>
        <Link to="/items">
          <button className="flex items-center bg-[#E88504] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
            <img
              src="/images/stockout/menu.png"
              alt="Menu"
              className="w-8 h-8 mr-2"
            />
            <span className="text-white">Items</span>
          </button>
        </Link>
        <Link to="/stockin">
          <button className="flex items-center bg-[#00BA34] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
            <img
              src="/images/stockout/stock.png"
              alt="Stock In"
              className="w-8 h-8 mr-2"
            />
            <span className="text-white">Stock In</span>
          </button>
        </Link>
        <Link to="/disposeditems">
          <button className="flex items-center bg-[#FF0000] p-2 rounded-lg shadow hover:shadow-lg min-w-[25%]">
            <img
              src="/images/stockout/trash.png"
              alt="Disposed"
              className="w-8 h-8 mr-2"
            />
            <span className="text-white">Disposed</span>
          </button>
        </Link>
      </div>

      {/* New Receipt Button */}
      <div className="w-full">
        <div className="flex items-center justify-between space-x-2 mb-4">
          <input
            type="text"
            placeholder="Search..."
            className="w-1/2 p-2 border rounded-lg shadow"
          />
          <button
            onClick={openAddStockInModal}
            className="flex items-center bg-[#1c4686] p-2 rounded-lg shadow hover:shadow-lg min-w-[15%]"
          >
            <img
              src="/images/stockout/trash.png"
              alt="New Item"
              className="w-8 h-8 mr-2"
            />
            <span className="text-white">New Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <Table
            columns={columns}
            data={tableData}
            rowOnClick={(rowIndex) => openEditStockInModal(receipts[rowIndex])}
          />
        )}
      </div>

      {/* Modals */}
      <AddStockInDetails
        isOpen={isAddStockInOpen}
        onClose={closeAddStockInModal}
        unitMeasurements={unitMeasurements}
        fetchReceipts={fetchReceipts}
        items={items}
        inventory={inventory}
      />
      <EditStockInDetails
        isOpen={isEditStockInOpen}
        onClose={closeEditStockInModal}
        receipt={selectedReceipt}
        unitMeasurements={unitMeasurements}
        items={items}
      />
    </div>
  );
};

export default StockIn;
