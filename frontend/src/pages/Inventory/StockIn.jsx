import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Table from "../../components/tables/Table";
import AddStockInDetails from "../../components/popups/AddStockInDetails";
import EditStockInDetails from "../../components/popups/EditStockInDetails";
import NewSupplier from "../../components/popups/NewSupplier"; // Updated import
import LoadingScreen from "../../components/popups/LoadingScreen"; // Import the LoadingScreen component

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

  const calculatedHeight = "calc(100vh - 140px)";

  return (
    <div className="h-screen bg-[#F5F5F5] flex flex-col p-6">
      {/* Search Bar and Buttons */}
      <div className="flex justify-between items-center mb-4">
        {/* Search Bar */}
        <div className="w-[400px]">
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-2 border rounded-sm shadow"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-2">
          {/* New Receipt Button */}
          <button
            onClick={openAddStockInModal}
            className="flex items-center bg-gradient-to-r from-[#864926] to-[#a95a00] text-white rounded-sm shadow-md hover:from-[#864926] hover:to-[#864926] transition-colors duration-200 w-48 overflow-hidden"
          >
            {/* Image Side */}
            <div className="flex items-center justify-center bg-[#864926] p-3">
              <img
                src="/images/bill.png"
                alt="New Receipt"
                className="w-6 h-6"
              />
            </div>
            <span className="flex-1 text-left pl-3">New Receipt</span>
          </button>

          {/* New Supplier Button */}
          <button
            onClick={openNewSupplierModal}
            className="flex items-center bg-gradient-to-r from-[#864926] to-[#a95a00] text-white rounded-sm shadow-md hover:from-[#864926] hover:to-[#864926] transition-colors duration-200 w-48 overflow-hidden"
          >
            {/* Image Side */}
            <div className="flex items-center justify-center bg-[#864926] p-3">
              <img
                src="/images/delivery-box.png"
                alt="New Supplier"
                className="w-6 h-6"
              />
            </div>

            {/* Text Side */}
            <span className="flex-1 text-left pl-3">New Supplier</span>
          </button>
        </div>
      </div>

      {/* Main Content - Table container with margin-bottom for padding */}
      <div className="flex-1" style={{ height: calculatedHeight }}>
        {loading ? (
          <div className="w-full h-full flex justify-center items-center">
            <LoadingScreen /> {/* Display the LoadingScreen component */}
          </div>
        ) : (
          <Table
            columns={["RECEIPT NO.", "SUPPLIER NAME", "DATE"]}
            data={receipts.map((receipt) => {
              // Find the supplier object from the suppliers array based on receipt.supplier (the supplier id)
              const supplierObj =
                suppliers.find((s) => s.id === receipt.supplier) || {};
              return [receipt.receipt_no, supplierObj.name || "", receipt.date];
            })}
            rowOnClick={(rowIndex) => openEditStockInModal(receipts[rowIndex])}
            maxHeight={calculatedHeight}
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
