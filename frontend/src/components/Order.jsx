import React, { useState } from "react";

const Order = () => {
  const [selectedItems, setSelectedItems] = useState([]);

  const handleAddItem = (item) => {
    const existingItem = selectedItems.find((i) => i.id === item.id);
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    setSelectedItems(
      selectedItems.map((i) =>
        i.id === id ? { ...i, quantity: newQuantity } : i
      )
    );
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== id));
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="w-3/4 bg-[#F9F9F9] p-4">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
        />

        {/* Scrollable Buttons */}
        <div className="flex space-x-4 overflow-x-auto scrollbar scrollbar-thumb-gray-400 scrollbar-track-gray-200 scrollbar-thin mb-6">
          <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[15%]">
            Button 1
          </button>
          <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[15%]">
            Button 2
          </button>
          <button className="flex items-center justify-center bg-yellow-500 text-white p-2 rounded-lg shadow min-w-[15%]">
            Button 3
          </button>
          <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[15%]">
            Button 4
          </button>
          <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[15%]">
            Button 4
          </button>
          <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[15%]">
            Button 4
          </button>
          <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[15%]">
            Button 4
          </button>
        </div>

        {/* Grab/Foodpanda Buttons */}
        <div className="flex space-x-4 mb-4">
          <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[25%]">
            Grab
          </button>
          <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[25%]">
            Foodpanda
          </button>
        </div>

         {/* Scrollable Item Boxes */}
         <div className="grid grid-cols-4 gap-4 h-[calc(100vh-200px)] overflow-y-auto scrollbar scrollbar-thumb-gray-400 scrollbar-track-gray-200 scrollbar-thin">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
            <div
              key={item}
              className="p-4 bg-[#E2D6D5] rounded-lg shadow cursor-pointer flex flex-col justify-between"
              onClick={() =>
                handleAddItem({ id: item, name: `Item ${item}`, price: 10 })
              }
            >
              <img
                src="/images/chicken.jpg"
                alt={`Item ${item}`}
                className="w-full object-cover mb-2"
              />
              <div className="text-center font-bold mb-2">Item {item}</div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Left Text</span>
                <span className="text-sm text-gray-700">Right Text</span>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Summary Panel */}
      <div className="w-1/4 bg-white p-4 flex flex-col justify-between">
        {/* Header */}
        <div className="text-center font-bold text-lg border-b pb-2">
          Order Summary
        </div>

        {/* Selected Items */}
        <div className="flex-grow overflow-y-auto mt-4">
          {selectedItems.map((item) => (
            <div key={item.id} className="mb-4">
              <div className="flex justify-between">
                <span>{item.name}</span>
                <span>${item.price * item.quantity}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-sm text-red-500"
                >
                  Remove
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.id, Number(e.target.value))
                  }
                  className="w-16 p-1 border rounded text-center"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 rounded-t-lg">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>${selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Discount:</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>${selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}</span>
          </div>
          <button className="w-full bg-green-500 text-white py-2 mt-4 rounded">
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Order;
