import React from "react";

const NewProduct = ({ isOpen, closeModal }) => {
  if (!isOpen) return null; // Don't render the modal if it's not open

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
      <div className="bg-white rounded-lg p-6 w-1/4 space-y-4">
        {/* Modal Header */}
        <h2 className="text-2xl font-bold text-center">New Product</h2>

        {/* Product Name */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="productName" className="text-sm font-medium">
            Product Name
          </label>
          <input
            type="text"
            id="productName"
            placeholder="Product Name"
            className="p-2 border rounded-lg shadow-sm focus:outline-none"
          />
        </div>

        {/* Unit Dropdown & Add New Unit Button */}
        <div className="flex space-x-2">
          <div className="w-1/2">
            <label htmlFor="unit" className="text-sm font-medium">
              Unit
            </label>
            <select
              id="unit"
              className="w-full p-2 border rounded-lg shadow-sm focus:outline-none"
            >
              <option value="">Select Unit</option>
              <option value="kg">Kg</option>
              <option value="liter">Liter</option>
              <option value="box">Box</option>
            </select>
          </div>
          <div className="w-1/2">
            <button className="w-full bg-[#E88504] text-white p-2 rounded-lg shadow hover:shadow-lg">
              Add New Unit
            </button>
          </div>
        </div>

        {/* Stock Trigger */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="stockTrigger" className="text-sm font-medium">
            Stock Trigger
          </label>
          <input
            type="text"
            id="stockTrigger"
            placeholder="Stock Trigger"
            className="p-2 border rounded-lg shadow-sm focus:outline-none"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between mt-4">
          <button
            onClick={closeModal}
            className="bg-red-500 text-white p-2 rounded-lg shadow hover:shadow-lg"
          >
            Cancel
          </button>
          <button className="bg-[#E88504] text-white p-2 rounded-lg shadow hover:shadow-lg">
            Add New Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProduct;
