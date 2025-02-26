import React, { useEffect, useState } from "react";
import Table from "../../components/tables/Table";

const EditStockInDetails = ({
  isOpen,
  onClose,
  receipt,
  unitMeasurements,
  items,
}) => {
  if (!isOpen || !receipt) return null;

  const [stockInData, setStockInData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReceipt, setEditedReceipt] = useState({ ...receipt });
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    if (receipt.stock_ins) {
      setStockInData(
        receipt.stock_ins.map((stock) => {
          const measurementSymbol =
            unitMeasurements?.find(
              (unit) => unit.id === stock.inventory?.item?.measurement
            )?.symbol || "N/A";

          return {
            id: stock.id,
            name: stock.inventory?.item?.name || "Unknown Item",
            measurement: measurementSymbol,
            price: stock.price,
            quantity: stock.quantity_in,
            totalCost: stock.price * stock.quantity_in,
          };
        })
      );
    }
  }, [receipt, unitMeasurements]);

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setSelectedStock(null); // Clear the selected stock when entering edit mode
  };

  const handleChange = (e) => {
    setEditedReceipt({ ...editedReceipt, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Updated Receipt:", editedReceipt);
    setIsEditing(false);
  };

  const handleStockChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const selectedItem = items.find((item) => item.name === value);
      if (selectedItem) {
        const measurementSymbol =
          unitMeasurements?.find((unit) => unit.id === selectedItem.measurement)
            ?.symbol || "N/A";
        setSelectedStock({
          name: value,
          measurement: measurementSymbol,
          quantity: "",
          price: "",
        });
      }
    } else {
      setSelectedStock((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
        <div className="absolute top-4 right-4 flex space-x-2">
          {isEditing && (
            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600"
            >
              Submit
            </button>
          )}
          <button
            onClick={toggleEditMode}
            className={`px-4 py-2 rounded-lg shadow ${
              isEditing
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {isEditing ? "Cancel Edit" : "Edit"}
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            &times;
          </button>
        </div>
        <h2 className="text-xl font-bold mb-4">
          Edit Stock In - Receipt No. {receipt.receipt_no}
        </h2>

        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Receipt No:</label>
            <input
              type="text"
              name="receipt_no"
              value={editedReceipt.receipt_no}
              onChange={handleChange}
              disabled={!isEditing}
              className={`p-2 border rounded-lg shadow ${
                isEditing ? "bg-white" : "bg-gray-100"
              }`}
            />
          </div>
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Supplier Name:</label>
            <input
              type="text"
              name="supplier_name"
              value={editedReceipt.supplier_name}
              onChange={handleChange}
              disabled={!isEditing}
              className={`p-2 border rounded-lg shadow ${
                isEditing ? "bg-white" : "bg-gray-100"
              }`}
            />
          </div>
          <div className="flex flex-col w-1/4">
            <label className="font-bold">Date:</label>
            <input
              type="date"
              name="date"
              value={editedReceipt.date}
              onChange={handleChange}
              disabled={!isEditing}
              className={`p-2 border rounded-lg shadow ${
                isEditing ? "bg-white" : "bg-gray-100"
              }`}
            />
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <select
            className="p-2 border rounded-lg shadow w-1/3"
            disabled={!isEditing}
            value={selectedStock?.name || ""}
            name="name"
            onChange={handleStockChange}
          >
            <option value="">Select Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Unit"
            className="p-2 border rounded-lg shadow w-1/6 bg-gray-100"
            name="measurement"
            value={selectedStock?.measurement || ""}
            disabled
          />

          <input
            type="number"
            placeholder="Quantity"
            className="p-2 border rounded-lg shadow w-1/6"
            disabled={!isEditing}
            name="quantity"
            value={selectedStock?.quantity || ""}
            onChange={handleStockChange}
          />

          <input
            type="number"
            placeholder="Cost/Unit"
            className="p-2 border rounded-lg shadow w-1/5"
            disabled={!isEditing}
            name="price"
            value={selectedStock?.price || ""}
            onChange={handleStockChange}
          />

          {isEditing && (
            <button
              onClick={() => {
                if (
                  selectedStock &&
                  selectedStock.name &&
                  selectedStock.quantity &&
                  selectedStock.price
                ) {
                  setStockInData([
                    ...stockInData,
                    {
                      ...selectedStock,
                      totalCost: selectedStock.price * selectedStock.quantity,
                    },
                  ]);
                  setSelectedStock(null);
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600"
            >
              Add
            </button>
          )}
        </div>

        <Table
          columns={[
            "ID",
            "PRODUCT NAME",
            "UNIT",
            "COST",
            "QUANTITY",
            "TOTAL COST",
          ]}
          data={stockInData.map((stock) => [
            stock.id,
            stock.name,
            stock.measurement,
            stock.price,
            stock.quantity,
            stock.totalCost,
          ])}
          rowOnClick={(rowIndex) => {
            const selected = stockInData[rowIndex];
            console.log("Row clicked:", selected);
            setSelectedStock({
              id: selected.id,
              name: selected.name,
              measurement: selected.measurement,
              price: selected.price,
              quantity: selected.quantity,
            });
          }}
        />
      </div>
    </div>
  );
};

export default EditStockInDetails;
