import React, { useState } from "react";
import axios from "axios";

const OrderEssentials = ({
  isOpen,
  onClose,
  menuTypes,
  discountsData,
  paymentMethods,
  fetchOrderData,
}) => {
  const [activeTab, setActiveTab] = useState("discounts");
  // Form states for adding new entries (for discounts and payments)

  // States for editing an existing delivery row.
  // We use the parent's menuTypes directly (filtered in the render).
  const [editingDeliveryId, setEditingDeliveryId] = useState(null);
  const [editingDeliveryPercentage, setEditingDeliveryPercentage] =
    useState("");

  const [newDiscountType, setNewDiscountType] = useState("");
  const [newDiscountPercentage, setNewDiscountPercentage] = useState("");
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [editedDiscountType, setEditedDiscountType] = useState("");
  const [editedDiscountPercentage, setEditedDiscountPercentage] = useState("");

  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editedPaymentName, setEditedPaymentName] = useState("");

  const handleAddDiscount = async () => {
    if (!newDiscountType || !newDiscountPercentage) {
      alert("Both fields are required.");
      return;
    }

    const percentage = Number.parseFloat(newDiscountPercentage);
    if (isNaN(percentage)) {
      alert("Percentage must be a valid number.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/add-discount/", {
        type: newDiscountType,
        percentage: percentage,
      });

      if (response.status === 201) {
        alert("Discount added successfully.");
        setNewDiscountType("");
        setNewDiscountPercentage("");
        fetchOrderData(); // Refresh the table
      }
    } catch (error) {
      console.error(
        "Failed to add discount",
        error.response?.data || error.message
      );
      alert("Failed to add discount.");
    }
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscountId(discount.id);
    setEditedDiscountType(discount.type);
    setEditedDiscountPercentage(discount.percentage);
  };

  const handleCancelEdit = () => {
    setEditingDiscountId(null);
    setEditedDiscountType("");
    setEditedDiscountPercentage("");
  };

  const handleSaveEditDiscount = async (discountId) => {
    const percentage = parseFloat(editedDiscountPercentage) / 100;
    if (!editedDiscountType || isNaN(percentage)) {
      alert("Invalid input.");
      return;
    }

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-discount/${discountId}/`,
        { type: editedDiscountType, percentage }
      );

      if (response.status === 200) {
        alert("Discount updated successfully.");
        fetchOrderData();
        handleCancelEdit();
      }
    } catch (error) {
      console.error(
        "Failed to update discount",
        error.response?.data || error.message
      );
      alert("Failed to update discount.");
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this discount?"
    );

    if (!confirmDelete) return; // Stop if user cancels

    try {
      await axios.delete(
        `http://127.0.0.1:8000/delete-discount/${discountId}/`
      );

      fetchOrderData();
      alert("Discount deleted successfully!");
    } catch (error) {
      console.error("Error deleting discount:", error);
      alert("Failed to delete discount. Please try again.");
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.trim()) return; // Prevent adding empty names

    try {
      // Send request to the backend
      await axios.post("http://127.0.0.1:8000/add-payment-method/", {
        name: newPaymentMethod,
      });

      // Refresh the payment methods list
      fetchOrderData();

      // Clear the input field
      setNewPaymentMethod("");

      alert("Payment method added successfully!");
    } catch (error) {
      console.error("Error adding payment method:", error);
      alert("Failed to add payment method. Please try again.");
    }
  };

  // Function to handle clicking "Edit"
  const handleEditPayment = (method) => {
    setEditingPaymentId(method.id);
    setEditedPaymentName(method.name);
  };

  // Function to cancel editing
  const handleCancelEditPayment = () => {
    setEditingPaymentId(null);
    setEditedPaymentName("");
  };

  // Function to save edited payment method
  const handleSaveEditPayment = async (paymentId) => {
    if (!editedPaymentName.trim()) {
      alert("Payment method name cannot be empty.");
      return;
    }

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-payment-method/${paymentId}/`,
        { name: editedPaymentName }
      );

      if (response.status === 200) {
        alert("Payment method updated successfully.");
        fetchOrderData(); // Refresh the list
        handleCancelEditPayment(); // Exit edit mode
      }
    } catch (error) {
      console.error("Failed to update payment method", error);
      alert("Failed to update payment method.");
    }
  };

  // Function to delete payment method
  const handleDeletePayment = async (paymentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this payment method?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/delete-payment-method/${paymentId}/`
      );

      alert("Payment method deleted successfully.");
      fetchOrderData(); // Refresh the list
    } catch (error) {
      console.error("Error deleting payment method:", error);
      alert("Failed to delete payment method.");
    }
  };
  const handleSaveEditDelivery = async (appId) => {
    const updatedPercentage = parseFloat(editingDeliveryPercentage);

    if (isNaN(updatedPercentage)) {
      console.error("Invalid percentage value.");
      return;
    }

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-delivery-deduction/${appId}/`,
        { deduction_percentage: updatedPercentage }
      );

      if (response.status === 200) {
        alert("Percentage deduction has been updated successfully.");
        setEditingDeliveryId(null);
        fetchOrderData();
      }
    } catch (error) {
      console.error(
        "Failed to update delivery deduction",
        error.response?.data || error.message
      );
    }
  };
  if (!isOpen) return null;

  return (
    <div>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium">Details Manager</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
            >
              &times;
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 border-r bg-gray-50">
              <nav className="flex flex-col">
                <button
                  className={`p-4 text-left hover:bg-gray-100 ${
                    activeTab === "discounts" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={() => setActiveTab("discounts")}
                >
                  Discounts
                </button>
                <button
                  className={`p-4 text-left hover:bg-gray-100 ${
                    activeTab === "delivery" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={() => setActiveTab("delivery")}
                >
                  Delivery Percentage Deduction
                </button>
                <button
                  className={`p-4 text-left hover:bg-gray-100 ${
                    activeTab === "payments" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={() => setActiveTab("payments")}
                >
                  Payment Methods
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto p-4">
                {activeTab === "discounts" ? (
                  <div className="space-y-6">
                    {/* Discounts Form and Table (unchanged) */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="text-lg font-medium mb-4">Add Discount</h3>
                      <div className="flex space-x-4 mb-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Discount Type
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="e.g. PWD, Senior Citizen"
                            value={newDiscountType}
                            onChange={(e) => setNewDiscountType(e.target.value)}
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Percentage
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="e.g. 0.20"
                            value={newDiscountPercentage}
                            onChange={(e) =>
                              setNewDiscountPercentage(e.target.value)
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={handleAddDiscount}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Discount Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Percentage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {discountsData.map((discount) => (
                            <tr key={discount.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingDiscountId === discount.id ? (
                                  <input
                                    type="text"
                                    className="border rounded-md px-2 py-1"
                                    value={editedDiscountType}
                                    onChange={(e) =>
                                      setEditedDiscountType(e.target.value)
                                    }
                                  />
                                ) : (
                                  discount.type
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingDiscountId === discount.id ? (
                                  <input
                                    type="text"
                                    className="border rounded-md px-2 py-1"
                                    value={editedDiscountPercentage}
                                    onChange={(e) =>
                                      setEditedDiscountPercentage(
                                        e.target.value
                                      )
                                    }
                                  />
                                ) : (
                                  (discount.percentage * 100).toFixed(0) + "%"
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {editingDiscountId === discount.id ? (
                                  <>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-red-600 hover:text-red-800 p-1"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleSaveEditDiscount(discount.id)
                                      }
                                      className="text-green-600 hover:text-green-800 p-1"
                                    >
                                      Save
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleDeleteDiscount(discount.id)
                                      }
                                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleEditDiscount(discount)
                                      }
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                    >
                                      Edit
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : activeTab === "delivery" ? (
                  <div className="space-y-6">
                    {/* Delivery Deductions Table using parent's menuTypes */}
                    <div className="bg-white rounded-lg border overflow-hidden mb-4">
                      <h3 className="text-lg font-medium p-4">
                        Modify Delivery Percentage Deduction
                      </h3>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              App Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Percentage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {menuTypes
                            .filter((app) => app.id !== 1)
                            .map((app) => {
                              const isEditing = editingDeliveryId === app.id;
                              return (
                                <tr key={app.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {app.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        className="border rounded-md px-2 py-1"
                                        value={editingDeliveryPercentage}
                                        onChange={(e) =>
                                          setEditingDeliveryPercentage(
                                            e.target.value
                                          )
                                        }
                                        placeholder={(
                                          (app.deduction_percentage ||
                                            app.percentage) * 100
                                        ).toFixed(2)}
                                      />
                                    ) : (
                                      (
                                        (app.deduction_percentage ||
                                          app.percentage) * 100
                                      ).toFixed(2) + "%"
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            setEditingDeliveryId(null)
                                          }
                                          className="text-red-600 hover:text-red-800 p-1"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleSaveEditDelivery(app.id)
                                          }
                                          className="text-green-600 hover:text-green-800 p-1"
                                        >
                                          Save
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => {
                                            setEditingDeliveryId(app.id);
                                            setEditingDeliveryPercentage(
                                              (
                                                app.deduction_percentage ??
                                                app.percentage ??
                                                0
                                              ).toString()
                                            ); // Ensure it's a valid string
                                          }}
                                          className="text-blue-600 hover:text-blue-800 p-1"
                                        >
                                          Edit
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : activeTab === "payments" ? (
                  <div className="space-y-6">
                    {/* Payment Methods Form and Table (unchanged) */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="text-lg font-medium mb-4">
                        Add Payment Method
                      </h3>
                      <div className="flex space-x-4 mb-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="e.g. Cash, Credit Card"
                            value={newPaymentMethod}
                            onChange={(e) =>
                              setNewPaymentMethod(e.target.value)
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={handleAddPaymentMethod}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paymentMethods.map((method) => (
                            <tr key={method.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingPaymentId === method.id ? (
                                  <input
                                    type="text"
                                    className="border rounded-md px-2 py-1"
                                    placeholder={method.name}
                                    value={editedPaymentName}
                                    onChange={(e) =>
                                      setEditedPaymentName(e.target.value)
                                    }
                                  />
                                ) : (
                                  method.name
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {editingPaymentId === method.id ? (
                                  <>
                                    <button
                                      onClick={handleCancelEditPayment}
                                      className="text-red-600 hover:text-red-800 p-1"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleSaveEditPayment(method.id)
                                      }
                                      className="text-green-600 hover:text-green-800 p-1 ml-2"
                                    >
                                      Save
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleDeletePayment(method.id)
                                      }
                                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => handleEditPayment(method)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                    >
                                      Edit
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEssentials;
