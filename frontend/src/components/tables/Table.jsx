import React, { useEffect, useState } from "react";

const Table = () => {
  const [rows, setRows] = useState([
    { id: 1, name: "Item A", unit: "Kg", quantity: 2, totalCost: 20.0 },
  ]);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    const total = rows.reduce((sum, row) => sum + row.totalCost, 0);
    setGrandTotal(total.toFixed(2));
  }, [rows]);

  const addRow = () => {
    setRows([
      ...rows,
      { id: rows.length + 1, name: "New Product", unit: "Unit", quantity: 1, totalCost: 10.0 },
    ]);
  };

  return (
    <div className="table-container border rounded-lg shadow overflow-y-auto">
      <table className="table-auto w-full text-left">
        <thead className="bg-[#FFCF03] font-bold">
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Product Name</th>
            <th className="p-2">Unit</th>
            <th className="p-2">Quantity</th>
            <th className="p-2">Total Cost</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="bg-[#FFEEA6] border-b">
              <td className="p-2">{row.id}</td>
              <td className="p-2">{row.name}</td>
              <td className="p-2">{row.unit}</td>
              <td className="p-2">{row.quantity}</td>
              <td className="p-2">{row.totalCost.toFixed(2)}</td>
              <td className="p-2">
                <button onClick={addRow} className="bg-[#00BA34] text-white p-2 rounded shadow">
                  Add
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-[#FFCF03] font-bold">
          <tr>
            <td colSpan="4" className="p-2">Total:</td>
            <td colSpan="2" className="p-2">{grandTotal}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default Table;
