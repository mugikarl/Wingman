import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Table from "../../components/tables/Table";
import AddStockInDetails from "../../components/popups/AddStockInDetails";
import EditStockInDetails from "../../components/popups/EditStockInDetails";
import NewSupplier from "../../components/popups/NewSupplier"; // Updated import
import LoadingScreen from "../../components/popups/LoadingScreen"; // Import the LoadingScreen component
import { FaBoxOpen, FaRegFileLines } from "react-icons/fa6";
import { PiMagnifyingGlass } from "react-icons/pi";

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
  // Add search state
  const [searchTerm, setSearchTerm] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  const openAddStockInModal = () => {
    setSelectedReceipt(null);
    setIsAddStockInOpen(true);
  };

  const openEditStockInModal = (receipt) => {
    // Find the full receipt object with all details
    if (receipt) {
      console.log("Selected Receipt:", receipt);

      // Make sure we're passing the complete receipt object including stock_ins
      // If the receipt doesn't have stock_ins array, log a warning
      if (!receipt.stock_ins) {
        console.warn("Receipt is missing stock_ins data:", receipt);
      } else {
        console.log(`Receipt has ${receipt.stock_ins.length} stock-in items`);
      }

      setSelectedReceipt(receipt);
      setIsEditStockInOpen(true);
    } else {
      console.error("No receipt data found for this row");
    }
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
        "http://127.0.0.1:8000/fetch-stockin-page-data/"
      );

      // Detailed logging for debugging
      console.log("API Response:", response.data);

      if (response.data.receipts && response.data.receipts.length > 0) {
        const firstReceipt = response.data.receipts[0];
        console.log(
          "First receipt structure:",
          JSON.stringify(firstReceipt, null, 2)
        );

        // Check if stock_ins are present
        if (firstReceipt.stock_ins) {
          console.log(
            `First receipt has ${firstReceipt.stock_ins.length} stock-in items`
          );
          if (firstReceipt.stock_ins.length > 0) {
            console.log(
              "First stock-in item:",
              JSON.stringify(firstReceipt.stock_ins[0], null, 2)
            );
          }
        } else {
          console.warn("Receipt is missing stock_ins data");
        }
      }

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

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "Admin");
  }, []);

  // For debugging: display the relationship between receipts and suppliers
  useEffect(() => {
    if (receipts.length > 0 && suppliers.length > 0) {
      console.log("Receipt-Supplier Mapping:");
      receipts.forEach((receipt) => {
        const supplierObj = suppliers.find(
          (s) =>
            // Compare as strings to handle potential type mismatches
            String(s.id) === String(receipt.supplier)
        );
        console.log(
          `Receipt ${receipt.receipt_no}: Supplier ID=${receipt.supplier}, Found Supplier:`,
          supplierObj
        );
      });
    }
  }, [receipts, suppliers]);

  const calculatedHeight = "calc(100vh - 140px)";

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter the receipts based on search term
  const filteredReceipts = receipts.filter((receipt) => {
    if (!searchTerm) return true;

    // Get supplier name from the nested supplier object
    const supplierName =
      receipt.supplier && receipt.supplier.name
        ? receipt.supplier.name
        : "Unknown Supplier";

    // Format date for searching
    let formattedDate = receipt.date;
    try {
      if (receipt.date) {
        const dateObj = new Date(receipt.date);
        formattedDate = dateObj.toLocaleDateString();
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }

    // Check if search term is in receipt number, supplier name, or date
    return (
      (receipt.receipt_no &&
        receipt.receipt_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
      supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (formattedDate &&
        formattedDate.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Add this function to sort receipts by date in descending order
  const sortByDateDescending = (a, b) => {
    // Convert dates to timestamps for comparison
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    // Handle invalid dates (sort to bottom)
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;

    // Sort in descending order (newest first)
    return dateB - dateA;
  };

  // Apply sorting to filteredReceipts before mapping to tableData
  const sortedReceipts = [...filteredReceipts].sort(sortByDateDescending);

  // Update the tableData mapping to use sortedReceipts
  const tableData = sortedReceipts.map((receipt) => {
    // Get supplier info from the nested supplier object
    const supplierName =
      receipt.supplier && receipt.supplier.name
        ? receipt.supplier.name
        : "Unknown Supplier";

    // Format the date - assuming it's in ISO format
    let formattedDate = receipt.date;
    try {
      // Try to convert to a nicer format if possible
      if (receipt.date) {
        const dateObj = new Date(receipt.date);
        formattedDate = dateObj.toLocaleDateString();
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }

    return [receipt.receipt_no || "N/A", supplierName, formattedDate || "N/A"];
  });

  return (
    <div className="h-screen bg-[#fcf4dc] flex flex-col p-6">
      {/* Search Bar and Buttons */}
      <div className="flex justify-between items-center mb-4">
        {/* Search Bar - Updated to match Order.jsx */}
        <div className="w-[400px]">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <PiMagnifyingGlass className="w-5 h-5 text-gray-500" />
            </div>
            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
              <span className="text-gray-400">|</span>
            </div>
            <input
              type="text"
              placeholder="Search by Receipt No., Supplier, or Date..."
              className="w-full pl-14 p-2 border rounded-lg shadow"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-2">
          {/* New Receipt Button */}
          <button
            onClick={openAddStockInModal}
            className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
          >
            <div className="flex items-center justify-center border-r p-3">
              <FaRegFileLines className="w-5 h-5 text-[#CC5500]" />
            </div>
            <span className="flex-1 text-left pl-3">New Receipt</span>
          </button>

          {/* New Supplier Button */}
          {isAdmin && (
            <button
              onClick={openNewSupplierModal}
              className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
            >
              <div className="flex items-center justify-center border-r p-3">
                <FaBoxOpen className="w-5 h-5 text-[#CC5500]" />
              </div>
              <span className="flex-1 text-left pl-3">New Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-2 text-sm text-gray-600">
          Showing {sortedReceipts.length} of {receipts.length} receipts for "
          {searchTerm}"
        </div>
      )}

      {/* Main Content - Table container with margin-bottom for padding */}
      <div className="flex-1" style={{ height: calculatedHeight }}>
        {loading ? (
          <div className="w-full h-full flex justify-center items-center">
            <LoadingScreen message="Loading stock in receipts" />
          </div>
        ) : (
          <Table
            columns={["RECEIPT NO.", "SUPPLIER NAME", "DATE"]}
            data={tableData}
            rowOnClick={(rowIndex) => {
              if (sortedReceipts[rowIndex]) {
                openEditStockInModal(sortedReceipts[rowIndex]);
              }
            }}
            maxHeight={calculatedHeight}
            sortableColumns={[0, 1, 2]}
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
