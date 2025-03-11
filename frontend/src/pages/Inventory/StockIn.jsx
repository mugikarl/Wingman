import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Table from "../../components/tables/Table";
import AddStockInDetails from "../../components/popups/AddStockInDetails";
import EditStockInDetails from "../../components/popups/EditStockInDetails";
import NewSupplier from "../../components/popups/NewSupplier"; // Updated import

const StockIn = () => {
  const [isAddStockInOpen, setIsAddStockInOpen] = useState(false);
  const [isEditStockInOpen, setIsEditStockInOpen] = useState(false);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false); // New supplier modal state
  const [items, setItems] = useState([]);
  const [inventory, setInvetory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [unitMeasurements, setUnitMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);

  const openAddStockInModal = () => {
    setSelectedReceipt(null);
    setIsAddStockInOpen(true);
  };

  const openEditStockInModal = (receipt) => {
    console.log("Selected Receipt ID:", receipt.receipt_id);
    setSelectedReceipt(receipt);
    setIsEditStockInOpen(true);
  };

  // New Supplier modal functions
  const openNewSupplierModal = () => {
    setIsNewSupplierOpen(true);
  };

  const closeNewSupplierModal = () => {
    setIsNewSupplierOpen(false);
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
      setSuppliers(response.data.supplier || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setReceipts([]);
      setItems([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchReceipts();
  }, []);

  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      {/* Navigation Buttons */}
      <div className="flex flex-col space-y-4 mb-4">
        <div className="grid grid-cols-6">
          <Link to="/inventory">
            <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
              <div className="flex items-center justify-center bg-[#D87A03] p-3">
                <img
                  src="/images/stockout/trolley.png"
                  alt="Inventory"
                  className="w-6 h-6"
                />
              </div>
              <span className="flex-1 text-left pl-3">Inventory</span>
            </button>
          </Link>

          {/* Items Button (Admin Only) */}
          {role === "Admin" && (
            <Link to="/dashboard-admin/items">
              <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
                <div className="flex items-center justify-center bg-[#D87A03] p-3">
                  <img
                    src="/images/stockout/menu.png"
                    alt="Items"
                    className="w-6 h-6"
                  />
                </div>
                <span className="flex-1 text-left pl-3">Items</span>
              </button>
            </Link>
          )}

          {role === "Admin" && (
            <Link to="/dashboard-admin/menu">
              <button className="flex items-center bg-gradient-to-r from-[#D87A03] to-[#E88504] text-white rounded-md shadow-md hover:from-[#C66E02] hover:to-[#D87A03] transition-colors duration-200 w-48 overflow-hidden">
                <div className="flex items-center justify-center bg-[#D87A03] p-3">
                  <img
                    src="/images/restaurant.png"
                    alt="Stock In"
                    className="w-6 h-6"
                  />
                </div>
                <span className="flex-1 text-left pl-3">Menu</span>
              </button>
            </Link>
          )}

          {/* Stock In Button */}
          <Link to="/stockin">
            <button className="flex items-center bg-gradient-to-r from-[#009E2A] to-[#00BA34] text-white rounded-md shadow-md hover:from-[#008C25] hover:to-[#009E2A] transition-colors duration-200 w-48 overflow-hidden">
              <div className="flex items-center justify-center bg-[#009E2A] p-3">
                <img
                  src="/images/stockout/stock.png"
                  alt="Stock In"
                  className="w-6 h-6"
                />
              </div>
              <span className="flex-1 text-left pl-3">Stock In</span>
            </button>
          </Link>

          {/* Disposed Button */}
          <Link to="/stockout">
            <button className="flex items-center bg-gradient-to-r from-[#E60000] to-[#FF0000] text-white rounded-md shadow-md hover:from-[#CC0000] hover:to-[#E60000] transition-colors duration-200 w-48 overflow-hidden">
              <div className="flex items-center justify-center bg-[#E60000] p-3">
                <img
                  src="/images/stockout/trash-can.png"
                  alt="Disposed"
                  className="w-6 h-6"
                />
              </div>
              <span className="flex-1 text-left pl-3">Disposed</span>
            </button>
          </Link>
        </div>
        {/* Inventory Button */}
      </div>
      <div className="h-4"></div>
      {/* Search Bar and New Receipt/New Supplier Buttons */}
      <div className="w-full">
        <div className="flex items-center justify-between space-x-2 mb-4">
          <div className="w-[400px]">
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-2 border rounded-lg shadow"
            />
          </div>
          {/* Button Group */}
          <div className="space-y-2">
            {/* New Receipt Button */}
            <button
              onClick={openAddStockInModal}
              className="flex items-center bg-gradient-to-r from-[#1c4686] to-[#2a5ca7] text-white rounded-md shadow-md hover:from-[#163a6f] hover:to-[#1c4686] transition-colors duration-200 w-48 overflow-hidden"
            >
              <div className="flex items-center justify-center bg-[#1c4686] p-3">
                <img
                  src="/images/stockout/trash.png"
                  alt="New Receipt"
                  className="w-6 h-6"
                />
              </div>
              <span className="flex-1 text-left pl-3">New Receipt</span>
            </button>
            {/* New Supplier Button */}
            <button
              onClick={openNewSupplierModal}
              className="flex items-center bg-gradient-to-r from-[#5930b2] to-[#6b3dcc] text-white rounded-md shadow-md hover:from-[#4a2699] hover:to-[#5930b2] transition-colors duration-200 w-48 overflow-hidden"
            >
              <div className="flex items-center justify-center bg-[#5930b2] p-3">
                <img
                  src="/images/stockout/trash.png"
                  alt="New Supplier"
                  className="w-6 h-6"
                />
              </div>
              <span className="flex-1 text-left pl-3">New Supplier</span>
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-grow">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <Table
            columns={["RECEIPT NO.", "SUPPLIER NAME", "DATE"]}
            data={
              loading
                ? [["", "Loading...", ""]]
                : receipts.map((receipt) => {
                    // Find the supplier object from the suppliers array based on receipt.supplier (the supplier id)
                    const supplierObj =
                      suppliers.find((s) => s.id === receipt.supplier) || {};
                    return [
                      receipt.receipt_no,
                      supplierObj.name || "",
                      receipt.date,
                    ];
                  })
            }
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
        suppliers={suppliers}
      />
      <EditStockInDetails
        isOpen={isEditStockInOpen}
        onClose={closeEditStockInModal}
        receipt={selectedReceipt}
        unitMeasurements={unitMeasurements}
        items={items}
        inventory={inventory}
        onUpdate={fetchReceipts}
        suppliers={suppliers}
      />
      <NewSupplier
        isOpen={isNewSupplierOpen}
        onClose={closeNewSupplierModal}
        suppliers={suppliers}
        fetchItemData={fetchReceipts}
      />
    </div>
  );
};

export default StockIn;
