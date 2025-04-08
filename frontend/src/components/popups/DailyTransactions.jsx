import React, { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import TableWithDatePicker from "../tables/TablewithDatePicker";
import LoadingScreen from "./LoadingScreen";
import TransactionModal from "../popups/TransactionModal"; // Adjust the import path as needed

const DailyTransactions = ({ isOpen, onClose, date, transactionsData }) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const [loading, setLoading] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  // New state for the selected transaction to be shown in TransactionModal
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Update selectedDate when date prop changes
  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    // Filter transactions for the selected date
    const dateTransactions =
      transactionsData?.filter((transaction) => {
        if (!transaction?.date) return false;

        // Convert transaction date to MM/DD/YYYY format
        const transactionDate = new Date(transaction.date);
        const transactionString = transactionDate.toLocaleDateString();

        return (
          transactionString === selectedDate && transaction.order_status === 1 // Completed transactions only
        );
      }) || [];

    setFilteredTransactions(dateTransactions);
    setLoading(false);
  }, [selectedDate, transactionsData, isOpen]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  // New row click handler that receives the row index from TableWithDatePicker
  const handleRowClick = (rowIndex) => {
    const transaction = filteredTransactions[rowIndex];
    if (transaction) {
      setSelectedTransaction(transaction);
    }
  };

  if (!isOpen) return null;

  // Format table data and keep correspondence with filtered transactions array
  const formatTableData = () => {
    return filteredTransactions.map((transaction) => {
      // Format order summary
      const orderSummary =
        transaction.order_details?.map(
          (detail) => `${detail.quantity}x - ${detail.menu_item?.name}`
        ) || [];

      let formattedOrderSummary;
      if (orderSummary.length === 1) {
        formattedOrderSummary = orderSummary[0];
      } else if (orderSummary.length === 2) {
        formattedOrderSummary = (
          <>
            {orderSummary[0]} <br />
            {orderSummary[1]}
          </>
        );
      } else if (orderSummary.length > 2) {
        formattedOrderSummary = (
          <>
            {orderSummary[0]} <br />
            {orderSummary[1]} ...
          </>
        );
      } else {
        formattedOrderSummary = "N/A";
      }

      // Determine order type and its color
      const orderTypeId = transaction.order_details?.[0]?.menu_item?.type_id;
      let orderType = "Unknown";
      let orderTypeColor = "text-gray-700";

      if (orderTypeId === 1) {
        orderType = "In-Store";
        orderTypeColor = "text-[#CC5500] font-medium";
      } else if (orderTypeId === 2) {
        orderType = "Grab";
        orderTypeColor = "text-green-500 font-medium";
      } else if (orderTypeId === 3) {
        orderType = "FoodPanda";
        orderTypeColor = "text-pink-500 font-medium";
      }

      // Calculate total amount from order_details, applying discounts
      const calculateTotal = () => {
        return (
          transaction.order_details?.reduce((sum, detail) => {
            const quantity = detail.quantity || 0;
            const price = detail.menu_item?.price || 0;
            // Convert discount percentage to fraction (if a 10% discount, discountFraction becomes 0.10)
            const discountFraction = (detail.discount?.percentage || 0) / 100;
            return sum + quantity * price * (1 - discountFraction);
          }, 0) || 0
        );
      };

      const total = calculateTotal();

      return [
        transaction.id || "N/A",
        <span className={orderTypeColor}>{orderType}</span>,
        formattedOrderSummary,
        `₱${parseFloat(total).toFixed(2)}`,
      ];
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg w-4/5 max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold text-[#CC5500]">
              Daily Transactions
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <MdClose size={24} />
            </button>
          </div>

          <div className="flex-grow p-4 overflow-hidden">
            {loading ? (
              <LoadingScreen message="Loading transactions" />
            ) : (
              <TableWithDatePicker
                columns={[
                  "Transaction ID",
                  "Order Type",
                  "Order Summary",
                  "Total Amount",
                ]}
                data={formatTableData()}
                maxHeight="calc(90vh - 150px)"
                initialDate={new Date(selectedDate)}
                onDateChange={handleDateChange}
                emptyMessage="No transactions for this date"
                tableClassName="w-full text-left"
                headerClassName="px-6 py-4 text-left font-medium text-white bg-[#CC5500]"
                cellClassName="px-6 py-4 text-left"
                // Pass the new row click handler
                rowOnClick={handleRowClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* Render TransactionModal if a transaction is selected */}
      {selectedTransaction && (
        <TransactionModal
          isOpen={true}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          // Pass additional props as required by TransactionModal,
          // for example, menuTypes, discountsData, menuItems, etc.
        />
      )}
    </>
  );
};

export default DailyTransactions;
