import React from "react";

const Table = ({ columns, data, rowOnClick, maxHeight = "700px" }) => {
  return (
    <div
      className="relative overflow-x-auto shadow-md sm:rounded-sm"
      style={{ maxHeight }}
    >
      <table className="w-full text-sm text-left rtl:text-right text-gray-500">
        <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
          <tr>
            {columns.map((column, index) => (
              <th key={index} scope="col" className="px-6 py-4 font-medium">
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
                className={`
                  ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"} 
                  border-b hover:bg-gray-200 group
                  ${rowOnClick ? "cursor-pointer" : ""}
                `}
                onClick={() => rowOnClick && rowOnClick(rowIndex)}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900"
                    scope={cellIndex === 0 ? "row" : undefined}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className="bg-white border-b">
              <td
                className="px-6 py-4 text-center font-normal text-gray-500 italic"
                colSpan={columns.length}
              >
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
