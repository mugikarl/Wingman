import { useState, useEffect } from "react";
import { FaMoneyBill, FaCreditCard } from "react-icons/fa6";

const OrderPayment = ({
  isOpen,
  onClose,
  totalAmount,
  onPlaceOrder,
  paymentMethods,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [change, setChange] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // New state for GCash fields
  const [gcashReferenceNo, setGcashReferenceNo] = useState("");
  const [gcashReferenceImage, setGcashReferenceImage] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod(
        paymentMethods && paymentMethods.length > 0
          ? paymentMethods[0].name
          : "Cash"
      );
      setCashReceived("");
      setChange(0);
      setGcashReferenceNo("");
      setGcashReferenceImage(null);
    }
  }, [isOpen, paymentMethods]);

  useEffect(() => {
    const cashAmount = Number.parseFloat(cashReceived) || 0;
    if (cashAmount >= totalAmount) {
      setChange(cashAmount - totalAmount);
    } else {
      setChange(0);
    }
  }, [cashReceived, totalAmount]);

  // Handle image upload for GCash Reference Image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGcashReferenceImage(file);
    }
  };

  const handleSubmit = () => {
    if (paymentMethod.toLowerCase() === "cash") {
      if ((Number.parseFloat(cashReceived) || 0) < totalAmount) {
        alert(
          "Cash received must be greater than or equal to the total amount"
        );
        return;
      }
      setIsProcessing(true);
      // Simulate processing delay for Cash
      setTimeout(() => {
        onPlaceOrder(paymentMethod, Number.parseFloat(cashReceived) || 0);
        setIsProcessing(false);
        onClose();
      }, 1000);
    } else if (paymentMethod.toLowerCase() === "gcash") {
      if (!gcashReferenceNo) {
        alert("Please provide GCash Reference No.");
        return;
      }
      setIsProcessing(true);
      // Simulate processing delay for GCash
      setTimeout(() => {
        // Pass the GCash-specific fields along with payment method
        onPlaceOrder(paymentMethod, 0, gcashReferenceNo, gcashReferenceImage);
        setIsProcessing(false);
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Total Amount */}
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-lg font-medium text-gray-700">
              Total Amount
            </span>
            <span className="text-xl font-bold">₱{totalAmount.toFixed(2)}</span>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <div className="grid grid-cols-2 gap-4">
              {paymentMethods && paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={`h-16 flex flex-col items-center justify-center gap-1 rounded-lg border ${
                      paymentMethod === method.name
                        ? "bg-green-500 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod(method.name)}
                  >
                    {method.name.toLowerCase() === "cash" ? (
                      <FaMoneyBill />
                    ) : method.name.toLowerCase() === "gcash" ? (
                      <FaCreditCard />
                    ) : (
                      <FaCreditCard />
                    )}
                    <span>{method.name}</span>
                  </button>
                ))
              ) : (
                <>
                  <button
                    type="button"
                    className={`h-16 flex flex-col items-center justify-center gap-1 rounded-lg border ${
                      paymentMethod.toLowerCase() === "cash"
                        ? "bg-green-500 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("Cash")}
                  >
                    <FaMoneyBill />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    className={`h-16 flex flex-col items-center justify-center gap-1 rounded-lg border ${
                      paymentMethod.toLowerCase() === "gcash"
                        ? "bg-blue-500 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("GCash")}
                  >
                    <FaCreditCard />
                    <span>GCash</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Fields for Cash Payment */}
          {paymentMethod.toLowerCase() === "cash" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="cash-received" className="text-sm font-medium">
                  Cash Received
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₱
                </span>
                <input
                  id="cash-received"
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md text-right text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  min={totalAmount}
                  step="0.01"
                />
              </div>
              {/* Always show change for Cash */}
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-lg font-medium text-gray-700">
                  Change
                </span>
                <span className="text-xl font-bold text-green-600">
                  ₱{change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Fields for GCash Payment */}
          {paymentMethod.toLowerCase() === "gcash" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference No.
                </label>
                <input
                  type="text"
                  value={gcashReferenceNo}
                  onChange={(e) => setGcashReferenceNo(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reference number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Image (optional)
                </label>
                <div
                  onClick={() =>
                    document.getElementById("gcash-image-upload").click()
                  }
                  className="flex-1 py-2 rounded bg-blue-500 text-white cursor-pointer text-center"
                >
                  Choose File
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="gcash-image-upload"
                />
                {gcashReferenceImage && (
                  <p className="mt-1 text-xs text-gray-500">
                    {gcashReferenceImage.name}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleSubmit}
            className={`w-full py-3 rounded-lg text-white text-lg font-medium transition-colors ${
              isProcessing ||
              (paymentMethod.toLowerCase() === "cash" &&
                (Number.parseFloat(cashReceived) || 0) < totalAmount) ||
              (paymentMethod.toLowerCase() === "gcash" && !gcashReferenceNo)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={
              isProcessing ||
              (paymentMethod.toLowerCase() === "cash" &&
                (Number.parseFloat(cashReceived) || 0) < totalAmount) ||
              (paymentMethod.toLowerCase() === "gcash" && !gcashReferenceNo)
            }
          >
            {isProcessing ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPayment;
