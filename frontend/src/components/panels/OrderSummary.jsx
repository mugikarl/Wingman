import React from "react";

const OrderSummary = () => {
  return (
    <div className="w-1/4 bg-white p-4 flex flex-col justify-between">
      <div className="text-center font-bold text-lg border-b pb-2">
        Order Summary
      </div>
      <div className="bg-gray-100 p-4 rounded-t-lg">
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>$ {/* Calculation here */}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Discount:</span>
          <span>$0.00</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>$ {/* Calculation here */}</span>
        </div>
        <button className="w-full bg-green-500 text-white py-2 mt-4 rounded">
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
