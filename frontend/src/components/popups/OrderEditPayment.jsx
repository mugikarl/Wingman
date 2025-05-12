import { useState, useEffect } from "react";
import { FaMoneyBill, FaCreditCard } from "react-icons/fa6";
import { useModal } from "../utils/modalUtils";
import EmployeeVerification from "./EmployeeVerification";

const OrderEditPayment = ({
  isOpen,
  onClose,
  totalAmount,
  finalTotal,
  transaction,
  onUpdateComplete,
  handleEditOrder,
  paymentMethods,
  employees,
  fetchOrderData,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [change, setChange] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  // GCash fields
  const [gcashReferenceNo, setGcashReferenceNo] = useState("");
  const [gcashReferenceImage, setGcashReferenceImage] = useState(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const { alert } = useModal();

  // When modal opens, initialize state with the original payment method
  useEffect(() => {
    if (isOpen && transaction?.payment_method) {
      // Set the selected payment method from the transaction
      setSelectedPaymentMethod(transaction.payment_method);
      setCashReceived("");
      setChange(0);
      setGcashReferenceNo("");
      setGcashReferenceImage(null);
    }
  }, [isOpen, transaction]);

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

  const handleSubmit = async () => {
    // Validate payment information
    if (selectedPaymentMethod.name.toLowerCase() === "cash") {
      if ((Number.parseFloat(cashReceived) || 0) < finalPayment) {
        await alert(
          "Cash received must be greater than or equal to the extra payment required.",
          "Error"
        );
        return;
      }
    } else if (selectedPaymentMethod.name.toLowerCase() === "gcash") {
      if (!gcashReferenceNo) {
        await alert("Please provide GCash Reference No.", "Error");
        return;
      }
    }

    // Open verification modal to verify the employee
    setIsVerificationModalOpen(true);
  };

  const handleVerificationSuccess = (email, passcode) => {
    // Close verification modal
    setIsVerificationModalOpen(false);

    // Proceed with processing the order
    setIsProcessing(true);

    // Build payload details
    const newPaymentAmount =
      selectedPaymentMethod.name.toLowerCase() === "cash"
        ? (Number.parseFloat(cashReceived) || 0) - change
        : extraPaymentRequired;

    // Create the payload with payment details and verification info
    const payload = {
      employee_id: transaction.employee.id,
      payment_method: selectedPaymentMethod.id,
      payment_amount: transaction.payment_amount + newPaymentAmount,
      reference_id: gcashReferenceNo || transaction.reference_id,
      employee_email: email, // Add employee email for verification
      employee_passcode: passcode, // Add employee passcode for verification
      additional_payment: extraPaymentRequired, // Add the extra payment amount needed
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

  // Get the payment method name
  const paymentMethodName = selectedPaymentMethod?.name || "Unknown";
  const isCash = paymentMethodName.toLowerCase() === "cash";
  const isGcash = paymentMethodName.toLowerCase() === "gcash";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 overflow-hidden max-h-[90vh]">
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
        <div className="p-4">
          {/* Scrollable section */}
          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Display Current Order Total */}
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-lg font-medium text-gray-700">
                Updated Order Total
              </span>
              <span className="text-xl font-bold">
                ₱{finalTotal.toFixed(2)}
              </span>
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

            {/* Payment Method Display (non-editable) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="w-full p-4 border rounded-md bg-gray-50 flex items-center gap-2">
                {isCash ? (
                  <FaMoneyBill className="text-green-600" />
                ) : isGcash ? (
                  <FaCreditCard className="text-blue-600" />
                ) : (
                  <FaCreditCard className="text-gray-600" />
                )}
                <span className="font-medium">{paymentMethodName}</span>
              </div>
            </div>

            {/* Fields for Cash Payment */}
            {isCash && extraPaymentRequired > 0 && (
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
            {isGcash && extraPaymentRequired > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="gcash-reference"
                    className="text-sm font-medium"
                  >
                    GCash Reference No.
                  </label>
                </div>
                <input
                  id="gcash-reference"
                  type="text"
                  value={gcashReferenceNo}
                  onChange={(e) => setGcashReferenceNo(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md text-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter GCash reference number"
                />
                <div className="flex items-center justify-between mt-2 border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">
                    Total Payment After Edit
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    ₱
                    {(
                      transaction.payment_amount + extraPaymentRequired
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Only show the Edit Order button if there is extra payment */}
        <div className="p-4 border-t">
          {extraPaymentRequired > 0 ? (
            <button
              onClick={handleSubmit}
              className={`w-full py-3 rounded-lg text-white text-lg font-medium transition-colors ${
                isProcessing ||
                (isCash &&
                  (Number.parseFloat(cashReceived) || 0) < finalPayment) ||
                (isGcash && !gcashReferenceNo)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
              disabled={
                isProcessing ||
                (isCash &&
                  (Number.parseFloat(cashReceived) || 0) < finalPayment) ||
                (isGcash && !gcashReferenceNo)
              }
            >
              {isProcessing ? "Processing..." : "Edit Order"}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-gray-200 text-gray-700 text-lg font-medium hover:bg-gray-300"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      <EmployeeVerification
        isOpen={isVerificationModalOpen}
        closeModal={() => setIsVerificationModalOpen(false)}
        employee={transaction.employee}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
};

export default OrderEditPayment;
