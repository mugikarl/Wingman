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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold ml-2"
          >
            &times;
          </button>
        </div>
        <h2 className="text-xl font-bold mb-4">
          Stock In Expense - Receipt No. {receipt.receipt_no}
        </h2>

        {/* Receipt Details */}
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Receipt No.:</label>
            <div className="p-2 border rounded-lg shadow bg-gray-200">
              {receipt.receipt_no}
            </div>
          </div>
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Supplier:</label>
            <div className="p-2 border rounded-lg shadow bg-gray-200">
              {supplierName}
            </div>
          </div>
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Date:</label>
            <div className="p-2 border rounded-lg shadow bg-gray-200">
              {formatDate(receipt.date)}
            </div>
          </div>
        </div>

        {/* Table with Items */}
        <div className="relative overflow-x-auto shadow-md sm:rounded-sm">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
              <tr>
                {[
                  "ID",
                  "ITEM NAME",
                  "UNIT",
                  "QUANTITY",
                  "COST",
                  "TOTAL COST",
                ].map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-4 font-medium text-left"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockInData.length > 0 ? (
                stockInData.map((stock, index) => (
                  <tr
                    key={index}
                    className={`
                      ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} 
                      border-b hover:bg-gray-200
                    `}
                  >
                    <td
                      className="px-6 py-4 font-normal text-gray-700 text-left"
                      scope="row"
                    >
                      {stock.id}
                    </td>
                    <td className="px-6 py-4 font-normal text-gray-700 text-left">
                      {stock.name}
                    </td>
                    <td className="px-6 py-4 font-normal text-gray-700 text-left">
                      {stock.measurement}
                    </td>
                    <td className="px-6 py-4 font-normal text-gray-700 text-left">
                      {stock.quantity}
                    </td>
                    <td className="px-6 py-4 font-normal text-gray-700 text-left">
                      {stock.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 font-normal text-gray-700 text-left">
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
                    className="px-6 py-4 text-center font-normal text-gray-500 italic"
                    colSpan={7}
                  >
                    No Stock Data Available
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold border-t-2 border-gray-400">
                <td colSpan={5} className="px-6 py-4 text-gray-900 text-right">
                  TOTAL:
                </td>
                <td className="px-6 py-4 text-gray-900 text-left">
                  {totalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockInExpense;
