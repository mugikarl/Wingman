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
  employees,
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
  // Add a new state to track if the user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  // State to store the current user's email
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // Helper to get today's date in YYYY-MM-DD format (in local timezone)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // This function fetches currently logged-in admin data
  const fetchCurrentAdminData = async (token, userEmail) => {
    try {
      console.log("Fetching admin data for email:", userEmail);
      // Use the token to fetch employee data (which includes roles)
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-employee-data/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.employees) {
        const allEmployees = response.data.employees;
        console.log("All employees from admin API:", allEmployees);

        // Find the employee that matches the logged-in user's email
        const currentAdmin = allEmployees.find(
          (emp) =>
            emp.email && emp.email.toLowerCase() === userEmail.toLowerCase()
        );

        if (currentAdmin) {
          console.log("Found current admin:", currentAdmin);
          return currentAdmin;
        } else {
          console.log("Current admin not found in employee list");
          return null;
        }
      }
    } catch (error) {
      console.error("Error fetching current admin data:", error);
      return null;
    }
  };

  // Fetch employees who have timed in for current day
  useEffect(() => {
    if (isOpen) {
      const role = localStorage.getItem("role");
      const token = localStorage.getItem("access_token");
      const userEmail = localStorage.getItem("user_email");
      setCurrentUserEmail(userEmail || "");

      // Check if user is admin
      const isAdminUser = role === "Admin" && token;
      setIsAdmin(isAdminUser);

      // Log what we have
      console.log("User is admin:", isAdminUser);
      console.log("User email from localStorage:", userEmail);

      setLoading(true);

      // Get today's date in the format expected by the API
      const todayDate = getTodayDateString();
      const url = `http://127.0.0.1:8000/fetch-attendance-data/?date=${todayDate}`;

      // Define async function to handle both API calls
      const fetchData = async () => {
        try {
          // First fetch attendance data
          const attendanceResponse = await axios.get(url);

          // Filter for active employees who have timed in
          const timedIn = attendanceResponse.data.filter(
            (emp) =>
              emp.employeeStatus === "ACTIVE" &&
              emp.timeIn &&
              emp.timeIn !== "-"
          );

          // Set timed in employees for display in dropdown
          setTimedInEmployees(timedIn);

          if (isAdminUser && userEmail) {
            // For admin users, we want to find the logged-in admin in the employees array

            // First check if the admin is in the provided employees list
            let adminEmployee = employees?.find(
              (emp) =>
                // Check if this employee has the admin role
                emp.employee_role?.some((role) => role.role_id === 1) &&
                // Check if this employee is active
                emp.status_id === 1
            );

            if (!adminEmployee && token) {
              // If admin not found in employees list, fetch directly from API
              adminEmployee = await fetchCurrentAdminData(token, userEmail);
            }

            if (adminEmployee) {
              console.log("Setting admin employee:", adminEmployee);
              setSelectedEmployee(adminEmployee);
            } else {
              console.log("No admin employee found");
            }
          } else {
            // For non-admin, only show employees who have timed in
            if (timedIn.length > 0) {
              const matchedEmployee = employees?.find(
                (emp) => String(emp.id) === String(timedIn[0].id)
              );
              setSelectedEmployee(matchedEmployee || null);
            } else {
              setSelectedEmployee(null);
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };

      // Call the async function
      fetchData();

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

  // Add debugging to see what's causing the button to remain disabled
  useEffect(() => {
    console.log("Button conditions:", {
      isProcessing,
      selectedEmployee: selectedEmployee ? selectedEmployee.id : null,
      selectedPaymentMethod: selectedPaymentMethod
        ? selectedPaymentMethod.id
        : null,
      paymentMethods: paymentMethods ? paymentMethods.length : 0,
      cashReceived,
      gcashReferenceNo,
      disabledCondition:
        isProcessing ||
        !selectedEmployee ||
        !selectedPaymentMethod ||
        (selectedPaymentMethod &&
          selectedPaymentMethod.name.toLowerCase() === "cash" &&
          (Number.parseFloat(cashReceived) || 0) < totalAmount) ||
        (selectedPaymentMethod &&
          selectedPaymentMethod.name.toLowerCase() === "gcash" &&
          !gcashReferenceNo),
    });
  }, [
    isProcessing,
    selectedEmployee,
    selectedPaymentMethod,
    cashReceived,
    gcashReferenceNo,
    totalAmount,
  ]);

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

    // Check if user is admin
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("access_token");
    const userEmail = localStorage.getItem("user_email");

    if (role === "Admin" && token) {
      // Admin can place order directly without verification
      setIsProcessing(true);

      // For admin users, ensure the Authorization header is sent
      // This requires modifying the axios configuration in your app
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      if (selectedPaymentMethod.name.toLowerCase() === "cash") {
        onPlaceOrder(
          selectedEmployee.id,
          selectedPaymentMethod.id,
          Number.parseFloat(cashReceived) || 0,
          null, // reference id for GCash
          null // receipt image for GCash
        );
      } else if (selectedPaymentMethod.name.toLowerCase() === "gcash") {
        onPlaceOrder(
          selectedEmployee.id,
          selectedPaymentMethod.id,
          totalAmount,
          gcashReferenceNo,
          null // receipt image for GCash
        );
      }
      onClose();
    } else {
      setIsVerificationModalOpen(true);
    }
  };

  // This is called when verification is successful
  const handleVerificationSuccess = (email, passcode) => {
    // Close verification modal
    setIsVerificationModalOpen(false);

    // Proceed with order processing
    setIsProcessing(true);

    // Call onPlaceOrder without setTimeout and without setting isProcessing to false or closing
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

    // Close the payment modal but don't set isProcessing to false
    // Let the loading screen in the Order component handle the visual feedback
    onClose();
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
            ) : isAdmin ? (
              // For Admin, display the admin name directly (not a dropdown)
              <div className="w-full p-2 border rounded-md bg-gray-50 font-medium text-gray-800">
                {selectedEmployee
                  ? `${selectedEmployee.first_name || ""} ${
                      selectedEmployee.last_name || ""
                    } (Admin)`
                  : "Admin User"}
              </div>
            ) : timedInEmployees.length > 0 ? (
              // For non-admin, show only employees who have timed in
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
                <option value="" disabled>
                  Select an employee
                </option>
                {timedInEmployees.map((emp) => {
                  // Find the corresponding employee in the full employee list
                  const employee = employees.find(
                    (e) => String(e.id) === String(emp.id)
                  );
                  if (!employee) return null;

                  return (
                    <option key={emp.id} value={emp.id}>
                      {employee.first_name || ""} {employee.last_name || ""}
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
              isProcessing || !selectedPaymentMethod
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={isProcessing || !selectedPaymentMethod}
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
