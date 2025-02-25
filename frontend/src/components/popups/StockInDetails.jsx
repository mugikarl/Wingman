import React, { useEffect, useState } from "react";
import Table from "../../components/tables/Table";

const StockInDetails = ({
  isOpen,
  onClose,
  receipt,
  unitMeasurements,
  items,
  isReadOnly, // Receive the flag
}) => {
  if (!isOpen || !receipt) return null;

  const [selectedItem, setSelectedItem] = useState(null);
  const [unit, setUnit] = useState("");
  const [stockInData, setStockInData] = useState([]);

  useEffect(() => {
    if (receipt.stock_ins) {
      setStockInData(
        receipt.stock_ins.map((stock) => {
          const measurementSymbol =
            unitMeasurements?.find(
              (unit) => unit.id === stock.inventory?.item?.measurement
            )?.symbol || "N/A";

          return [
            stock.id,
            stock.inventory?.item?.name || "Unknown Item",
            measurementSymbol,
            stock.price,
            stock.quantity_in,
            stock.price * stock.quantity_in,
          ];
        })
      );
    }
  }, [receipt, unitMeasurements]);

  // Handle item selection from dropdown
  const handleItemChange = (e) => {
    const itemId = Number(e.target.value);
    const selected = items.find((item) => Number(item.id) === itemId);
    setSelectedItem(selected);

    if (selected) {
      const measurementSymbol =
        unitMeasurements.find(
          (unit) => Number(unit.id) === Number(selected.measurement)
        )?.symbol || "N/A";
      setUnit(measurementSymbol);
    } else {
      setUnit("");
    }
  };

  // Handle row click in stock-in table (Populate item fields)
  const handleStockInRowClick = (rowIndex) => {
    const stock = receipt.stock_ins[rowIndex];
    if (!stock) return;

    const selected = items.find(
      (item) => Number(item.id) === Number(stock.inventory?.item?.id)
    );
    setSelectedItem(selected);

    if (selected) {
      const measurementSymbol =
        unitMeasurements.find(
          (unit) => Number(unit.id) === Number(selected.measurement)
        )?.symbol || "N/A";
      setUnit(measurementSymbol);
    } else {
      setUnit("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>

        <h2 className="text-xl font-bold mb-4">
          Stock In Details - Receipt No. {receipt.receipt_no}
        </h2>

        {/* Receipt Details */}
        <div className="mb-4 flex flex-wrap gap-4 place-items-end">
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Receipt No:</label>
            <input
              type="text"
              value={receipt.receipt_no}
              disabled
              className="p-2 border rounded-lg shadow bg-gray-100"
            />
          </div>
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Supplier Name:</label>
            <input
              type="text"
              value={receipt.supplier_name}
              disabled
              className="p-2 border rounded-lg shadow bg-gray-100"
            />
          </div>
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Date:</label>
            <input
              type="date"
              value={receipt.date}
              disabled
              className="p-2 border rounded-lg shadow bg-gray-100"
            />
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          {/* Item Dropdown */}
          <select
            className="p-2 border rounded-lg shadow w-1/3"
            onChange={handleItemChange}
            value={selectedItem?.id || ""}
            disabled={isReadOnly} // Disable when read-only
          >
            <option value="">Select Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* Unit Input (Readonly) */}
          <input
            type="text"
            value={unit}
            readOnly
            className="p-2 border rounded-lg shadow w-1/6 bg-gray-100"
          />

          {/* Quantity Input */}
          <input
            type="number"
            placeholder="Quantity"
            className="p-2 border rounded-lg shadow w-1/6"
            disabled={isReadOnly}
          />

          {/* Cost per Unit Input */}
          <input
            type="number"
            placeholder="Cost/Unit"
            className="p-2 border rounded-lg shadow w-1/5"
            disabled={isReadOnly}
          />

          {/* Add Button */}
          {!isReadOnly && (
            <button className="bg-[#00BA34] text-white px-6 py-2 rounded-lg shadow">
              Add
            </button>
          )}
        </div>

        {/* Stock-in Table */}
        <Table
          columns={[
            "ID",
            "PRODUCT NAME",
            "UNIT",
            "COST",
            "QUANTITY",
            "TOTAL COST",
          ]}
          data={stockInData}
          rowOnClick={handleStockInRowClick} // Row click will populate item details
        />
      </div>
    </div>
  );
};

export default StockInDetails;
