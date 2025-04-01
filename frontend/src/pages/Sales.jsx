import React, { useState, useEffect } from "react";
import LoadingScreen from "../components/popups/LoadingScreen";

const Sales = () => {
  const [month, setMonth] = useState(new Date());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulating data fetching with a loading state
  useEffect(() => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setData([
        { col1: "Item 1", col2: 10, col3: 20, col4: 30 },
        { col1: "Item 2", col2: 15, col3: 25, col4: 35 },
        { col1: "Item 3", col2: 20, col3: 30, col4: 40 },
      ]);
      setLoading(false);
    }, 1000);
  }, [month]);

  const totalValues = data.reduce(
    (totals, row) => ({
      col2: totals.col2 + row.col2,
      col3: totals.col3 + row.col3,
      col4: totals.col4 + row.col4,
    }),
    { col2: 0, col3: 0, col4: 0 }
  );

  const handlePreviousMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setMonth(newMonth);
  };

  const handleMonthChange = (event) => {
    setMonth(new Date(event.target.value));
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4">
      {/* Buttons */}
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <button className="bg-orange-500 text-white px-4 py-2 rounded">
            DAILY
          </button>
          <button
            onClick={() => (window.location.href = "/salescalendar")}
            className="bg-orange-500 text-white px-4 py-2 rounded"
          >
            CALENDAR
          </button>
        </div>
        <button className="bg-green-500 text-white px-4 py-2 rounded">
          Button 3
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-center border-collapse border border-gray-200">
          <thead>
            <tr>
              <th colSpan="4" className="bg-gray-100 border-b border-gray-300">
                <div className="flex items-center justify-center gap-4">
                  <button onClick={handlePreviousMonth}>&lt;</button>
                  <div>
                    <input
                      type="month"
                      value={month.toISOString().slice(0, 7)}
                      onChange={handleMonthChange}
                      className="border border-gray-300 rounded p-1"
                    />
                  </div>
                  <button onClick={handleNextMonth}>&gt;</button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-yellow-200" : "bg-white"}
              >
                <td className="border border-gray-300">{row.col1}</td>
                <td className="border border-gray-300">{row.col2}</td>
                <td className="border border-gray-300">{row.col3}</td>
                <td className="border border-gray-300">{row.col4}</td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300">Total</td>
              <td className="border border-gray-300">{totalValues.col2}</td>
              <td className="border border-gray-300">{totalValues.col3}</td>
              <td className="border border-gray-300">{totalValues.col4}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
