import React, { useEffect } from "react";

const StockIn = () => {
  useEffect(() => {
    const updateTotal = () => {
      const rows = document.querySelectorAll("tbody .table-row");
      let total = 0;
      rows.forEach((row) => {
        const cost = parseFloat(row.querySelector(".total-cost").textContent) || 0;
        total += cost;
      });
      document.getElementById("grandTotal").textContent = total.toFixed(2);
    };

    // Initial calculation
    updateTotal();

    // Add button listener for dynamic rows (example logic)
    document.querySelectorAll(".add-btn").forEach((button) => {
      button.addEventListener("click", () => {
        // Example logic: Add more rows
        const tbody = document.querySelector("tbody");
        const newRow = `
          <tr class="table-row border-b">
            <td class="p-2">New ID</td>
            <td class="p-2">New Product</td>
            <td class="p-2">New Unit</td>
            <td class="p-2">1</td>
            <td class="p-2 total-cost">10.00</td>
            <td class="p-2">
              <button class="bg-[#00BA34] text-white p-2 item-center rounded shadow add-btn">Add</button>
            </td>
          </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", newRow);
        updateTotal();
      });
    });
  }, []);

  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      {/* Main Content */}
      <div className="flex-grow">
        {/* Top Section */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <label htmlFor="text1" className="font-bold">Name:</label>
            <input
              type="text"
              id="text1"
              placeholder="Enter text"
              className="p-2 border rounded-lg shadow"
            />
          </div>
          <div className="flex items-center">
            <label className="font-bold mr-4 w-1/4">Date</label>
            <div className="flex-grow relative">
              <input
                type="date"
                className="p-2 border rounded-lg shadow w-full"
                id="calendar"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="text3" className="font-bold">Receipt No:</label>
            <input
              type="text"
              id="text3"
              placeholder="Enter text"
              className="p-2 border rounded-lg shadow"
            />
          </div>
          <button className="bg-[#E88504] text-white px-6 py-2 rounded-lg shadow">Submit</button>
        </div>

        {/* Table */}
        <div className="table-container border rounded-lg shadow overflow-y-auto">
          <table className="table-auto w-full text-left">
            <thead className="table-header">
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
              {/* Example Rows */}
              <tr className="table-row border-b">
                <td className="p-2">1</td>
                <td className="p-2">Item A</td>
                <td className="p-2">Kg</td>
                <td className="p-2">2</td>
                <td className="p-2 total-cost">20.00</td>
                <td className="p-2">
                  <button className="bg-[#00BA34] text-white p-2 rounded shadow add-btn">Add</button>
                </td>
              </tr>
              <tr className="table-row border-b">
                <td className="p-2">1</td>
                <td className="p-2">Item A</td>
                <td className="p-2">Kg</td>
                <td className="p-2">2</td>
                <td className="p-2 total-cost">20.00</td>
                <td className="p-2">
                  <button className="bg-[#00BA34] text-white p-2 rounded shadow add-btn">Add</button>
                </td>
              </tr>
              <tr className="table-row border-b">
                <td className="p-2">1</td>
                <td className="p-2">Item A</td>
                <td className="p-2">Kg</td>
                <td className="p-2">2</td>
                <td className="p-2 total-cost">20.00</td>
                <td className="p-2">
                  <button className="bg-[#00BA34] text-white p-2 rounded shadow add-btn">Add</button>
                </td>
              </tr>
              {/* Add more rows as needed */}
            </tbody>
            <tfoot className="sticky-footer">
              <tr>
                <td colspan="4" className="p-2 text-left">Total:</td>
                <td colspan="2" id="grandTotal" className="p-2 text-left">0.00</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockIn;
