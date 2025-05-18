import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";

const StockInExpense = ({
  isOpen,
  onClose,
  receipt,
  unitMeasurements,
  items,
  suppliers = [],
}) => {
  if (!isOpen || !receipt) return null;

  // Local state for the stock-in data
  const [stockInData, setStockInData] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [supplierName, setSupplierName] = useState("Not specified");

  // On mount or when receipt or unitMeasurements change, initialize local state from props
  useEffect(() => {
    console.log("StockInExpense props:", {
      receipt: receipt,
      hasStockIns: receipt?.stock_ins?.length > 0,
      unitMeasurementsCount: unitMeasurements?.length || 0,
      itemsCount: items?.length || 0,
      suppliersCount: suppliers?.length || 0,
    });

    // Determine supplier name based on available data
    if (receipt) {
      console.log("Receipt structure:", {
        id: receipt.id,
        receipt_no: receipt.receipt_no,
        date: receipt.date,
        supplier: receipt.supplier,
        supplierType: typeof receipt.supplier,
        stockInsCount: receipt.stock_ins?.length || 0,
      });

      // Determine supplier name from available data
      if (receipt.supplier) {
        if (typeof receipt.supplier === "object" && receipt.supplier !== null) {
          // If supplier is an object with name property
          if (receipt.supplier.name) {
            setSupplierName(receipt.supplier.name);
          }
          // If supplier object without name but with id, try to find in suppliers array
          else if (receipt.supplier.id && suppliers && suppliers.length > 0) {
            const foundSupplier = suppliers.find(
              (s) => s.id === receipt.supplier.id
            );
            if (foundSupplier && foundSupplier.name) {
              setSupplierName(foundSupplier.name);
            } else {
              setSupplierName(`Supplier ID: ${receipt.supplier.id}`);
            }
          }
        }
        // If supplier is just an ID (number or string)
        else if (
          typeof receipt.supplier === "number" ||
          (typeof receipt.supplier === "string" && !isNaN(receipt.supplier))
        ) {
          const supplierId =
            typeof receipt.supplier === "number"
              ? receipt.supplier
              : parseInt(receipt.supplier);
          if (suppliers && suppliers.length > 0) {
            const foundSupplier = suppliers.find((s) => s.id === supplierId);
            if (foundSupplier && foundSupplier.name) {
              setSupplierName(foundSupplier.name);
            } else {
              setSupplierName(`Supplier ID: ${supplierId}`);
            }
          } else {
            setSupplierName(`Supplier ID: ${supplierId}`);
          }
        }
        // If supplier is some other non-null value
        else {
          setSupplierName(String(receipt.supplier));
        }
      } else {
        setSupplierName("Not specified");
      }

      // Format stock entries if available
      if (receipt.stock_ins && Array.isArray(receipt.stock_ins)) {
        console.log("Stock-ins data:", receipt.stock_ins);

        const formattedStock = receipt.stock_ins.map((stock) => {
          console.log("Processing stock item:", stock);

          // Handle different possible data structures
          let itemName = "Unknown Item";
          let measurementSymbol = "N/A";

          // Try to get item details from the nested structure
          if (stock.inventory && stock.inventory.item) {
            const item = stock.inventory.item;
            itemName = item.name || "Unknown Item";
            const measurementId = item.measurement || null;

            // Find the unit measurement
            if (measurementId && unitMeasurements) {
              const unit = unitMeasurements.find((u) => u.id === measurementId);
              measurementSymbol = unit ? unit.symbol : "N/A";
            }
          }
          // If no nested item, try to find from the items prop
          else if (stock.item_id) {
            const item = items.find((i) => i.id === stock.item_id);
            if (item) {
              itemName = item.name;
              const measurementId = item.measurement;

              // Find the unit measurement
              if (measurementId && unitMeasurements) {
                const unit = unitMeasurements.find(
                  (u) => u.id === measurementId
                );
                measurementSymbol = unit ? unit.symbol : "N/A";
              }
            }
          }

          return {
            id: stock.id,
            name: itemName,
            measurement: measurementSymbol,
            price: stock.price || 0,
            quantity: stock.quantity_in || 0,
            totalCost: (stock.price || 0) * (stock.quantity_in || 0),
          };
        });

        console.log("Formatted stock data:", formattedStock);
        setStockInData(formattedStock);

        // Calculate total cost
        const total = formattedStock.reduce(
          (sum, item) => sum + item.totalCost,
          0
        );
        setTotalCost(total);
      } else {
        console.warn("No stock_ins array found in receipt:", receipt);
        setStockInData([]);
        setTotalCost(0);
      }
    }
  }, [receipt, unitMeasurements, items, suppliers]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl h-[550px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">
            Stock In Expense - Receipt No. {receipt.receipt_no}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column: Receipt Details and Computations (1/3 width) */}
            <div className="h-full flex flex-col space-y-6">
              {/* Receipt Details */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-medium mb-4">Receipt Details</h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="font-medium mb-1">Receipt No.:</label>
                    <div className="p-2 border rounded-lg bg-gray-200">
                      {receipt.receipt_no}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="font-medium mb-1">Supplier:</label>
                    <div className="p-2 border rounded-lg bg-gray-200">
                      {supplierName}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="font-medium mb-1">Date:</label>
                    <div className="p-2 border rounded-lg bg-gray-200">
                      {formatDate(receipt.date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Computations */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex flex-col">
                  <p className="font-medium text-xl mt-1">
                    <span>Total Receipt Cost: </span>
                    <span className="font-bold">
                      ₱{" "}
                      {totalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Items Table (2/3 width) */}
            <div className="col-span-2 flex flex-col w-full h-full">
              <div className="bg-white p-4 rounded-lg border w-full h-full">
                <h3 className="text-lg font-medium mb-4">Stock Items</h3>
                <div className="overflow-y-auto h-[350px]">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium w-[10%]"
                        >
                          ID
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium w-[30%]"
                        >
                          ITEM NAME
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium w-[10%]"
                        >
                          UNIT
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium w-[15%]"
                        >
                          QUANTITY
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium w-[15%]"
                        >
                          COST
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium w-[20%]"
                        >
                          TOTAL COST
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockInData.length > 0 ? (
                        stockInData.map((stock, index) => (
                          <tr
                            key={index}
                            className={`
                              ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} 
                              border-b hover:bg-gray-200 group
                            `}
                          >
                            <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                              {stock.id}
                            </td>
                            <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900 break-words">
                              {stock.name}
                            </td>
                            <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                              {stock.measurement}
                            </td>
                            <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                              {stock.quantity}
                            </td>
                            <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                              {stock.price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 py-3 font-normal text-gray-700 group-hover:text-gray-900">
                              {stock.totalCost.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="bg-white border-b">
                          <td
                            className="px-4 py-3 text-center font-normal text-gray-500 italic"
                            colSpan={6}
                          >
                            No Stock Data Available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockInExpense;
