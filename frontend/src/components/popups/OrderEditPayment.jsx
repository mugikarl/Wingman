import { useState, useEffect } from "react";
import { FaMoneyBill, FaCreditCard } from "react-icons/fa6";

const OrderEditPayment = ({
  isOpen,
  onClose,
  totalAmount, // The initial total (already paid)
  finalTotal, // The new total (final total for the order)
  transaction, // Transaction object; its id will be used in the parent's PUT request
  onUpdateComplete, // Callback when order is updated successfully
  handleEditOrder, // Passed update function
  paymentMethods,
  employees, // Array of employee objects
  fetchOrderData,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [change, setChange] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  // GCash fields
  const [gcashReferenceNo, setGcashReferenceNo] = useState("");
  const [gcashReferenceImage, setGcashReferenceImage] = useState(null);

  // When modal opens, initialize state.
  useEffect(() => {
    if (isOpen) {
      setSelectedPaymentMethod(
        paymentMethods && paymentMethods.length > 0 ? paymentMethods[0] : null
      );
      setCashReceived("");
      setChange(0);
      setGcashReferenceNo("");
      setGcashReferenceImage(null);
    }
  }, [isOpen, paymentMethods]);

  console.log("Transaction:", transaction);
  console.log("Total Amount (original payment):", totalAmount);
  console.log("Final Total (new order total):", finalTotal);

  // Calculate the original order price (without considering payment amount)
  const calculateOriginalOrderPrice = () => {
    // For delivery orders
    if (
      transaction.order_details?.[0]?.menu_item?.type_id === 2 ||
      transaction.order_details?.[0]?.menu_item?.type_id === 3
    ) {
      return transaction.order_details.reduce((sum, detail) => {
        const price = detail.menu_item?.price || 0;
        const quantity = detail.quantity || 0;
        return sum + price * quantity;
      }, 0);
    }
    // For in-store orders
    else {
      // Handle Ala Carte items
      const alaCarteTotal = transaction.order_details
        .filter((detail) => detail.instore_category?.id === 1)
        .reduce((sum, detail) => {
          const price = detail.menu_item?.price || 0;
          const quantity = detail.quantity || 0;
          const discount = detail.discount?.percentage || 0;
          return sum + price * quantity * (1 - discount);
        }, 0);

      // Handle Unli Wings - calculate once per group
      const unliWingsGroups = {};
      transaction.order_details
        .filter((detail) => detail.instore_category?.id === 2)
        .forEach((detail) => {
          const group = detail.unli_wings_group || "default";
          if (!unliWingsGroups[group]) {
            unliWingsGroups[group] = detail.instore_category?.base_amount || 0;
          }
        });

      const unliWingsTotal = Object.values(unliWingsGroups).reduce(
        (sum, amount) => sum + amount,
        0
      );

      return alaCarteTotal + unliWingsTotal;
    }
  };

  const originalOrderPrice = calculateOriginalOrderPrice();

  // Compute extra payment required based on the price difference
  const extraPaymentRequired = Math.max(0, finalTotal - originalOrderPrice);
  // In this update scenario, the final payment the customer must make is ONLY the extra amount
  const finalPayment = extraPaymentRequired;

  useEffect(() => {
    const cashAmt = Number.parseFloat(cashReceived) || 0;
    if (cashAmt >= finalPayment) {
      setChange(cashAmt - finalPayment);
    } else {
      setChange(0);
    }
  }, [cashReceived, finalPayment]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGcashReferenceImage(file);
    }
  };

  const onSubmit = () => {
    // Ensure payment method is selected
    if (!selectedPaymentMethod) {
      alert("Please select a payment method.");
      return;
    }
    if (selectedPaymentMethod.name.toLowerCase() === "cash") {
      if ((Number.parseFloat(cashReceived) || 0) < finalPayment) {
        alert(
          "Cash received must be greater than or equal to the extra payment required."
        );
        return;
      }
    } else if (selectedPaymentMethod.name.toLowerCase() === "gcash") {
      if (!gcashReferenceNo) {
        alert("Please provide GCash Reference No.");
        return;
      }
    }
    setIsProcessing(true);

    // Build payload details for the parent's update function
    // Important: Add the previous payment amount to the new payment
    const newPaymentAmount =
      selectedPaymentMethod.name.toLowerCase() === "cash"
        ? (Number.parseFloat(cashReceived) || 0) - change
        : extraPaymentRequired;

    // Create the payload with payment details but without order_details
    // handleEditOrder will use the localOrderDetails from OrderEditModal
    const payload = {
      employee_id: transaction.employee.id, // Always use the original employee
      payment_method: selectedPaymentMethod.id,
      payment_amount: transaction.payment_amount + newPaymentAmount, // Add to the original payment amount
      reference_id: gcashReferenceNo || transaction.reference_id,
      receipt_image: transaction.receipt_image,
    };

    console.log("Submitting payment with payload:", payload);

    handleEditOrder(payload)
      .then((data) => {
        onUpdateComplete(data);
        onClose();
        fetchOrderData();
      })
      .catch((error) => {
        console.error(
          "Error updating order:",
          error.response ? error.response.data : error.message
        );
      })
      .finally(() => {
        setIsProcessing(false);
      });
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
          {/* Display Current Order Total */}
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-lg font-medium text-gray-700">
              Updated Order Total
            </span>
            <span className="text-xl font-bold">₱{finalTotal.toFixed(2)}</span>
          </div>

          {/* Display Extra Payment Required */}
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-lg font-medium text-gray-700">
              Extra Payment Required
            </span>
            <span className="text-xl font-bold">
              ₱{extraPaymentRequired.toFixed(2)}
            </span>
          </div>
          {/* Employee Display - Read-only */}
          {transaction.employee && (
            <div className="space-y-2 border-b pb-4">
              <label className="text-sm font-medium">Employee</label>
              <div className="w-full p-2 border rounded-md bg-gray-50 text-gray-700">
                {transaction.employee.first_name}{" "}
                {transaction.employee.last_name}
              </div>
            </div>
          )}
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
                      selectedPaymentMethod &&
                      selectedPaymentMethod.id === method.id
                        ? "bg-green-500 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedPaymentMethod(method)}
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
                      selectedPaymentMethod &&
                      selectedPaymentMethod.name.toLowerCase() === "cash"
                        ? "bg-green-500 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setSelectedPaymentMethod({ id: 1, name: "Cash" })
                    }
                  >
                    <FaMoneyBill />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    className={`h-16 flex flex-col items-center justify-center gap-1 rounded-lg border ${
                      selectedPaymentMethod &&
                      selectedPaymentMethod.name.toLowerCase() === "gcash"
                        ? "bg-blue-500 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setSelectedPaymentMethod({ id: 2, name: "GCash" })
                    }
                  >
                    <FaCreditCard />
                    <span>GCash</span>
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Fields for Cash Payment */}
          {selectedPaymentMethod &&
            selectedPaymentMethod.name.toLowerCase() === "cash" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="cash-received"
                    className="text-sm font-medium"
                  >
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
                    className="w-full pl-8 pr-4 py-2 border rounded-md text-right text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                {/* Show total payment amount and change after edit */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Cash Amount
                    </span>
                    <span className="text-sm font-bold">
                      ₱{parseFloat(cashReceived || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Change
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₱{change.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 border-t pt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Total Payment After Edit
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      ₱
                      {(
                        transaction.payment_amount +
                        (Number.parseFloat(cashReceived) || 0) -
                        change
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          {/* Fields for GCash Payment */}
          {selectedPaymentMethod &&
            selectedPaymentMethod.name.toLowerCase() === "gcash" && (
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

                {/* Show total payment amount after edit */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Payment Amount
                    </span>
                    <span className="text-sm font-bold">
                      ₱{extraPaymentRequired.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
        </div>
        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onSubmit}
            className={`w-full py-3 rounded-lg text-white text-lg font-medium transition-colors ${
              isProcessing ||
              (selectedPaymentMethod &&
                selectedPaymentMethod.name.toLowerCase() === "cash" &&
                (Number.parseFloat(cashReceived) || 0) <
                  extraPaymentRequired) ||
              (selectedPaymentMethod &&
                selectedPaymentMethod.name.toLowerCase() === "gcash" &&
                !gcashReferenceNo)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={
              isProcessing ||
              (selectedPaymentMethod &&
                selectedPaymentMethod.name.toLowerCase() === "cash" &&
                (Number.parseFloat(cashReceived) || 0) <
                  extraPaymentRequired) ||
              (selectedPaymentMethod &&
                selectedPaymentMethod.name.toLowerCase() === "gcash" &&
                !gcashReferenceNo)
            }
          >
            {isProcessing ? "Processing..." : "Edit Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEditPayment;
