import React, { useState } from "react";

const OrderEssentials = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("discounts");
  const [discounts, setDiscounts] = useState([
    { id: 1, type: "PWD", percentage: 0.2 },
    { id: 2, type: "Senior Citizen", percentage: 0.15 },
  ]);
  const [deliveryApps, setDeliveryApps] = useState([
    { id: 1, name: "Foodpanda", percentage: 0.25 },
    { id: 2, name: "Grab", percentage: 0.28 },
  ]);

  // Form states
  const [newDiscountType, setNewDiscountType] = useState("");
  const [newDiscountPercentage, setNewDiscountPercentage] = useState("");
  const [newAppName, setNewAppName] = useState("");
  const [newAppPercentage, setNewAppPercentage] = useState("");

  const handleAddDiscount = () => {
    if (!newDiscountType || !newDiscountPercentage) return;

    const percentage = Number.parseFloat(newDiscountPercentage);
    if (isNaN(percentage)) return;

    setDiscounts([
      ...discounts,
      {
        id: discounts.length + 1,
        type: newDiscountType,
        percentage: percentage,
      },
    ]);

    setNewDiscountType("");
    setNewDiscountPercentage("");
  };

  const handleAddDeliveryApp = () => {
    if (!newAppName || !newAppPercentage) return;

    const percentage = Number.parseFloat(newAppPercentage);
    if (isNaN(percentage)) return;

    setDeliveryApps([
      ...deliveryApps,
      {
        id: deliveryApps.length + 1,
        name: newAppName,
        percentage: percentage,
      },
    ]);

    setNewAppName("");
    setNewAppPercentage("");
  };

  if (!isOpen) return null;

  return (
    <div>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium">Discount Manager</h2>
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
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-4">
                {activeTab === "discounts" ? (
                  <div className="space-y-6">
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
                          {discounts.map((discount) => (
                            <tr key={discount.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {discount.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {(discount.percentage * 100).toFixed(0)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-blue-600 hover:text-blue-800">
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="text-lg font-medium mb-4">
                        Add Delivery App
                      </h3>
                      <div className="flex space-x-4 mb-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            App Name
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="e.g. Foodpanda, Grab"
                            value={newAppName}
                            onChange={(e) => setNewAppName(e.target.value)}
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Percentage
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="e.g. 0.25"
                            value={newAppPercentage}
                            onChange={(e) =>
                              setNewAppPercentage(e.target.value)
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={handleAddDeliveryApp}
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
                          {deliveryApps.map((app) => (
                            <tr key={app.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {(app.percentage * 100).toFixed(2)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-blue-600 hover:text-blue-800">
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 mr-2"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEssentials;
