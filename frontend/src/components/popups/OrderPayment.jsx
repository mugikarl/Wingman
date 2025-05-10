import { useState, useEffect } from "react";
import { FaMoneyBill, FaCreditCard } from "react-icons/fa6";
import { useModal } from "../utils/modalUtils";
import axios from "axios";
import EmployeeVerification from "./EmployeeVerification";

const OrderPayment = ({
  isOpen,
  onClose,
  totalAmount,
  onPlaceOrder,
  paymentMethods,
  employees, // Array of employee objects
}) => {
  // Instead of a string, store the selected payment method object
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [change, setChange] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  // GCash fields
  const [gcashReferenceNo, setGcashReferenceNo] = useState("");
  // Selected employee
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  // Active employees with time in
  const [timedInEmployees, setTimedInEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  // Verification modal
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const { alert } = useModal();

  // Helper to get today's date in YYYY-MM-DD format (in local timezone)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Fetch employees who have timed in for current day
  useEffect(() => {
    if (isOpen) {
      setLoading(true);

      // Get today's date in the format expected by the API
      const todayDate = getTodayDateString();
      const url = `http://127.0.0.1:8000/fetch-attendance-data/?date=${todayDate}`;

      axios
        .get(url)
        .then((response) => {
          // Filter for active employees who have timed in
          const timedIn = response.data.filter(
            (emp) => emp.employeeStatus === "ACTIVE" && emp.timeIn
          );

          setTimedInEmployees(timedIn);
          // Set default to first timed in employee if available
          if (timedIn.length > 0) {
            // Find corresponding employee from the full employees list
            const matchedEmployee = employees?.find(
              (emp) => String(emp.id) === String(timedIn[0].id)
            );
            setSelectedEmployee(matchedEmployee || null);
          } else {
            setSelectedEmployee(null);
          }
        })
        .catch((error) => {
          console.error("Error fetching timed in employees:", error);
        })
        .finally(() => {
          setLoading(false);
        });

      // Set default payment method
      if (paymentMethods && paymentMethods.length > 0) {
        setSelectedPaymentMethod(paymentMethods[0]);
      } else {
        setSelectedPaymentMethod(null);
      }

      // Reset other form fields
      setCashReceived("");
      setChange(0);
      setGcashReferenceNo("");
    }
  }, [isOpen, employees, paymentMethods]);

  useEffect(() => {
    const cashAmount = Number.parseFloat(cashReceived) || 0;
    if (cashAmount >= totalAmount) {
      setChange(cashAmount - totalAmount);
    } else {
      setChange(0);
    }
  }, [cashReceived, totalAmount]);

  // Modified to open verification modal first
  const handleSubmit = async () => {
    if (!selectedPaymentMethod) {
      await alert("Please select a payment method.", "Validation Error");
      return;
    }

    if (!selectedEmployee) {
      await alert(
        "Please select an employee who has timed in today.",
        "Validation Error"
      );
      return;
    }

    if (selectedPaymentMethod.name.toLowerCase() === "cash") {
      if ((Number.parseFloat(cashReceived) || 0) < totalAmount) {
        await alert(
          "Cash received must be greater than or equal to the total amount",
          "Validation Error"
        );
        return;
      }
    } else if (selectedPaymentMethod.name.toLowerCase() === "gcash") {
      if (!gcashReferenceNo) {
        await alert("Please provide GCash Reference No.", "Validation Error");
        return;
      }
    }

    // Open verification modal instead of proceeding directly
    setIsVerificationModalOpen(true);
  };

  // This is called when verification is successful
  const handleVerificationSuccess = (email, passcode) => {
    // Close verification modal
    setIsVerificationModalOpen(false);

    // Proceed with order processing
    setIsProcessing(true);
    setTimeout(() => {
      if (selectedPaymentMethod.name.toLowerCase() === "cash") {
        onPlaceOrder(
          selectedEmployee.id,
          selectedPaymentMethod.id,
          Number.parseFloat(cashReceived) || 0,
          null, // reference id for GCash
          null, // receipt image for GCash
          email, // Add employee email for verification
          passcode // Add employee passcode for verification
        );
      } else if (selectedPaymentMethod.name.toLowerCase() === "gcash") {
        onPlaceOrder(
          selectedEmployee.id,
          selectedPaymentMethod.id,
          totalAmount,
          gcashReferenceNo,
          null, // Removed receipt image for GCash
          email, // Add employee email for verification
          passcode // Add employee passcode for verification
        );
      }
      setIsProcessing(false);
      onClose();
    }, 1000);
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
          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee</label>
            {loading ? (
              <div className="w-full p-2 border rounded-md bg-gray-100">
                Loading...
              </div>
            ) : timedInEmployees.length > 0 ? (
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
                {timedInEmployees.map((emp) => {
                  // Find the corresponding employee in the full employee list
                  const employee = employees.find(
                    (e) => String(e.id) === String(emp.id)
                  );
                  if (!employee) return null;

                  return (
                    <option key={emp.id} value={emp.id}>
                      {employee.first_name} {employee.last_name}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="w-full p-2 border rounded-md bg-gray-100 text-red-500">
                No employees have timed in today. Please have at least one
                employee time in first.
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-lg font-medium text-gray-700">
              Total Amount to be Paid
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
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md text-right text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    min={totalAmount}
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
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleSubmit}
            className={`w-full py-3 rounded-lg text-white text-lg font-medium transition-colors ${
              isProcessing ||
              !selectedEmployee ||
              (selectedPaymentMethod &&
                selectedPaymentMethod.name.toLowerCase() === "cash" &&
                (Number.parseFloat(cashReceived) || 0) < totalAmount) ||
              (selectedPaymentMethod &&
                selectedPaymentMethod.name.toLowerCase() === "gcash" &&
                !gcashReferenceNo)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={
              isProcessing ||
              !selectedEmployee ||
              (selectedPaymentMethod &&
                selectedPaymentMethod.name.toLowerCase() === "cash" &&
                (Number.parseFloat(cashReceived) || 0) < totalAmount) ||
              (selectedPaymentMethod &&
                selectedPaymentMethod.name.toLowerCase() === "gcash" &&
                !gcashReferenceNo)
            }
          >
            {isProcessing ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>

      {/* Employee Verification Modal */}
      <EmployeeVerification
        isOpen={isVerificationModalOpen}
        closeModal={() => setIsVerificationModalOpen(false)}
        employee={selectedEmployee}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
};

export default OrderPayment;
