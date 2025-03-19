import React from "react";

const Table = ({ columns, data, rowOnClick }) => {
  return (
    <div className="table-container border rounded-lg shadow overflow-x-auto">
      <table className="table-auto w-full text-left">
        <thead className="bg-[#f4d47c] h-12 font-bold">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="p-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${
                  rowIndex % 2 === 0
                    ? "bg-[#fdf6e3] hover:bg-[#fdf6e3]/70"
                    : "bg-[#f4d47c]/70 hover:bg-[#f4d47c]/50"
                } border-b cursor-pointer`}
                onClick={() => rowOnClick && rowOnClick(rowIndex)}
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="p-2 text-center" colSpan={columns.length}>
                No Data Available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
