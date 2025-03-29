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
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [change, setChange] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  // GCash fields
  const [gcashReferenceNo, setGcashReferenceNo] = useState("");
  const [gcashReferenceImage, setGcashReferenceImage] = useState(null);
  // Selected employee
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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
      setSelectedEmployee(
        employees && employees.length > 0 ? employees[0] : null
      );
    }
  }, [isOpen, paymentMethods, employees]);

  // Compute extra payment required automatically.
  const extraPaymentRequired = finalTotal - totalAmount;
  // In this update scenario, the final payment the customer must make is ONLY the extra amount.
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
    // Ensure an employee is selected.
    if (!selectedEmployee) {
      alert("Please select an employee.");
      return;
    }
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

    // For cash payments, add the extra payment to the initial total.
    // For non-cash payments (e.g., GCash), assume the full final total is paid.
    const paymentAmount =
      selectedPaymentMethod.name.toLowerCase() === "cash"
        ? totalAmount + Number.parseFloat(cashReceived)
        : finalTotal;

    // Build payload details for the parent's update function.
    const payload = {
      employee_id: selectedEmployee.id,
      payment_method: selectedPaymentMethod.id,
      payment_amount: paymentAmount,
      reference_id: transaction.reference_id,
      receipt_image: transaction.receipt_image,
      order_details: transaction.order_details,
    };

    handleEditOrder(payload)
      .then((data) => {
        onUpdateComplete(data);
        onClose();
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
          {/* Display Initial Total */}
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-lg font-medium text-gray-700">
              Initial Total
            </span>
            <span className="text-xl font-bold">₱{totalAmount.toFixed(2)}</span>
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
          {/* Employee Selection */}
          {employees && employees.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <select
                value={selectedEmployee ? selectedEmployee.id : ""}
                onChange={(e) => {
                  const emp = employees.find(
                    (employee) => employee.id.toString() === e.target.value
                  );
                  setSelectedEmployee(emp);
                }}
                className="w-full p-2 border rounded-md focus:outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
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
