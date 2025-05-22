import React, { useState, useEffect } from "react";
import axios from "axios";
import EmployeeVerification from "./EmployeeVerification";

const DisposedInventory = ({
  isOpen,
  closeModal,
  selectedInventory,
  employees,
  units,
  reason,
  refreshInventory,
}) => {
  if (!isOpen) return null;

  console.log("Selected Inventory:", selectedInventory);
  console.log("Available Units:", units);

  // Get values from selectedInventory with nested item structure
  const item = selectedInventory ? selectedInventory.item || {} : {};
  const itemName = item.name || "";
  const currentQuantity = selectedInventory ? selectedInventory.quantity : "";

  // Find the unit based on the item's measurement property
  const measurementId = item.measurement;
  const currentUnitObject = units.find((unit) => unit.id === measurementId);
  const currentUnit = currentUnitObject ? currentUnitObject.symbol : "";

  // Local state for form inputs
  const [disposalQuantity, setDisposalQuantity] = useState("");
  const [selectedDisposalUnit, setSelectedDisposalUnit] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedDisposer, setSelectedDisposer] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isDisposing, setIsDisposing] = useState(false);
  const [loadingDots, setLoadingDots] = useState("");

  // Verification modal state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [adminEmployee, setAdminEmployee] = useState(null);

  // Get the category ID of the current unit
  const currentUnitCategory = currentUnitObject
    ? currentUnitObject.unit_category
    : null;

  // Filter units to only include those that belong to the same category
  // If unit_category doesn't exist, fall back to showing all units
  const filteredUnits = currentUnitCategory
    ? units.filter((unit) => unit.unit_category === currentUnitCategory)
    : units;

  // This function fetches currently logged-in admin data
  const fetchCurrentAdminData = async (token, userEmail) => {
    try {
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

        // Find the employee that matches the logged-in user's email
        const currentAdmin = allEmployees.find(
          (emp) =>
            emp.email && emp.email.toLowerCase() === userEmail.toLowerCase()
        );

        if (currentAdmin) {
          return currentAdmin;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching current admin data:", error);
      return null;
    }
  };

  // Check if user is admin on component mount and set selected disposer
  useEffect(() => {
    if (isOpen) {
      const role = localStorage.getItem("role");
      const token = localStorage.getItem("access_token");
      const userEmail = localStorage.getItem("user_email");
      setCurrentUserEmail(userEmail || "");

      const isAdminUser = role === "Admin" && token;
      setIsAdmin(isAdminUser);

      if (isAdminUser && userEmail) {
        // For admin users, find the logged-in admin in the employees array
        const admin = employees.find(
          (emp) =>
            emp.email && emp.email.toLowerCase() === userEmail.toLowerCase()
        );

        if (admin) {
          // Admin found in the provided employees list
          setSelectedDisposer(admin.id);
          setAdminEmployee(admin);
        } else if (token) {
          // If admin not found in employees list, fetch directly from API
          fetchCurrentAdminData(token, userEmail).then((adminData) => {
            if (adminData) {
              setSelectedDisposer(adminData.id);
              setAdminEmployee(adminData);
            }
          });
        }
      } else {
        // Reset disposer for non-admin users
        setSelectedDisposer("");
        setAdminEmployee(null);
      }
    }
  }, [isOpen, employees]);

  // Loading animation effect
  useEffect(() => {
    let interval;
    if (isDisposing) {
      let dotCount = 0;
      interval = setInterval(() => {
        setLoadingDots(".".repeat(dotCount % 4));
        dotCount++;
      }, 500);
    } else {
      setLoadingDots("");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDisposing]);

  // Handler for reason change
  const handleReasonChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedReason(selectedValue);

    // Clear the other reason text if a different option is selected
    if (selectedValue !== "4") {
      setOtherReason("");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks
    if (!selectedDisposer) {
      alert("Please select a disposer.");
      return;
    }

    if (!disposalQuantity || parseFloat(disposalQuantity) <= 0) {
      alert("Please enter a valid disposal quantity.");
      return;
    }

    if (!selectedDisposalUnit) {
      alert("Please select a unit for disposal.");
      return;
    }

    if (!selectedReason) {
      alert("Please select a reason for disposal.");
      return;
    }

    if (selectedReason === "4" && !otherReason) {
      alert("Please specify the other reason.");
      return;
    }

    // For admin users, process directly
    // For non-admin users, open verification modal
    if (isAdmin) {
      // Admin can dispose items directly without verification
      processDisposal();
    } else {
      // For non-admin, open verification modal
      setIsVerificationModalOpen(true);
    }
  };

  // Handle verification success
  const handleVerificationSuccess = (email, passcode) => {
    // Close verification modal
    setIsVerificationModalOpen(false);

    // Process disposal with verification credentials
    processDisposal(email, passcode);
  };

  // Process the actual disposal
  const processDisposal = async (email, passcode) => {
    setIsDisposing(true);

    // Setup payload
    const payload = {
      inventory_id: selectedInventory.id,
      disposed_quantity: disposalQuantity,
      disposed_unit: selectedDisposalUnit,
      reason_of_disposal: selectedReason,
      other_reason: selectedReason === "4" ? otherReason : "",
      disposer: selectedDisposer,
    };

    // Add verification credentials if provided
    if (email && passcode) {
      payload.email = email;
      payload.passcode = passcode;
    }

    // For admin users, ensure Authorization header is sent
    if (isAdmin) {
      const token = localStorage.getItem("access_token");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/dispose-item/",
        payload
      );

      alert("Item disposed successfully.");
      closeModal();
      refreshInventory();
    } catch (error) {
      console.error("Error disposing item:", error);
      // Extract the error message from the response if available
      const errorMessage =
        error.response?.data?.error ||
        "Failed to dispose item. Please try again.";
      alert(errorMessage);
    } finally {
      setIsDisposing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-96">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-xl font-semibold">Disposal for {itemName}</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          {/* Disposer Display/Selection */}
          <div>
            <label className="block text-sm font-medium">Disposer</label>
            {isAdmin ? (
              // For admin, show their name without dropdown
              <div className="w-full p-2 border rounded-lg bg-gray-50 font-medium text-gray-800">
                {adminEmployee
                  ? `${adminEmployee.first_name || ""} ${
                      adminEmployee.last_name || ""
                    } (Admin)`
                  : "Admin User"}
              </div>
            ) : (
              // For non-admin, show dropdown
              <select
                className="w-full p-2 border rounded-lg"
                value={selectedDisposer}
                onChange={(e) => setSelectedDisposer(e.target.value)}
                disabled={isDisposing}
              >
                <option value="" hidden></option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Current Quantity & Current Unit (Side by Side) */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium">
                Current Quantity
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                value={currentQuantity}
                disabled
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium">Current Unit</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                value={currentUnit}
                disabled
              />
            </div>
          </div>

          {/* Disposal Quantity & Disposal Unit (Side by Side) */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium">
                Disposal Quantity
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                min="1"
                value={disposalQuantity}
                onChange={(e) => setDisposalQuantity(e.target.value)}
                disabled={isDisposing}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium">
                Unit for Disposal
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={selectedDisposalUnit}
                onChange={(e) => setSelectedDisposalUnit(e.target.value)}
                disabled={isDisposing}
              >
                <option value="" hidden></option>
                {filteredUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={selectedReason}
              onChange={handleReasonChange}
              disabled={isDisposing}
            >
              <option value="" hidden></option>
              {reason
                .filter((r) => r.id !== 1 && r.id !== 5) // Exclude "Ordered" (id: 1) and "Complimentary" (id: 5)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>

            {/* Show input field when "Other" (id: 4) is selected */}
            {selectedReason === "4" && (
              <input
                type="text"
                placeholder="Other Reason"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="w-full p-2 mt-2 border rounded-lg"
                disabled={isDisposing}
              />
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={handleSubmit}
            disabled={isDisposing}
            className={`mt-4 w-full p-2 rounded-lg text-white transition-colors ${
              isDisposing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isDisposing ? `Disposing${loadingDots}` : "Dispose Item"}
          </button>
        </div>
      </div>

      {/* Employee Verification Modal */}
      <EmployeeVerification
        isOpen={isVerificationModalOpen}
        closeModal={() => setIsVerificationModalOpen(false)}
        employee={employees.find(
          (emp) => String(emp.id) === String(selectedDisposer)
        )}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
};

export default DisposedInventory;
