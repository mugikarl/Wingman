import React, { useState } from "react";

const ExportSales = ({ isOpen, onClose, selectedDate }) => {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("csv");

  const month = selectedDate.toLocaleString("default", { month: "long" });
  const year = selectedDate.getFullYear();

  const handleExport = () => {
    // Export logic (e.g., generate file based on selected options)
    alert(`Exporting ${fileType.toUpperCase()} for ${month} ${year} as ${fileName}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Export Data</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-4">
          {/* Month & Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Month</label>
            <input
              type="text"
              value={month}
              disabled
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Year</label>
            <input
              type="text"
              value={year}
              disabled
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">File Name</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter file name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">File Type</label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleExport} className="px-4 py-2 rounded-md bg-[#CC5500] text-white hover:bg-[#b34600]">
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSales;
