import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoMdClose } from "react-icons/io";
import { FaTrash, FaPencilAlt, FaCheck, FaTimes } from "react-icons/fa";
import { useModal } from "../utils/modalUtils";

const OrderEssentials = ({
  isOpen,
  onClose,
  menuTypes,
  discountsData,
  paymentMethods,
  instore_categories,
  fetchOrderData,
}) => {
  const [activeTab, setActiveTab] = useState("delivery");

  // States for editing an existing delivery row
  const [editingDeliveryId, setEditingDeliveryId] = useState(null);
  const [editingDeliveryPercentage, setEditingDeliveryPercentage] =
    useState("");

  // Discount states
  const [newDiscountType, setNewDiscountType] = useState("");
  const [newDiscountPercentage, setNewDiscountPercentage] = useState("");
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [editedDiscountType, setEditedDiscountType] = useState("");
  const [editedDiscountPercentage, setEditedDiscountPercentage] = useState("");
  const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false);
  const [isDeletingDiscount, setIsDeletingDiscount] = useState(false);
  const [addingDiscountText, setAddingDiscountText] = useState("Add");
  const [updatingDiscountText, setUpdatingDiscountText] = useState("Update");
  const [deletingDiscountDots, setDeletingDiscountDots] = useState("");

  // Delivery states
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [updatingDeliveryText, setUpdatingDeliveryText] = useState("Update");

  // Unli Wings states
  const [editingUnliWingsId, setEditingUnliWingsId] = useState(null);
  const [editingBaseAmount, setEditingBaseAmount] = useState("");
  const [isSubmittingBaseAmount, setIsSubmittingBaseAmount] = useState(false);

  // Sort all data alphabetically
  const sortedDiscounts = [...discountsData].sort((a, b) =>
    a.type.localeCompare(b.type, undefined, { sensitivity: "base" })
  );

  const sortedMenuTypes = [...menuTypes].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const { alert, confirm } = useModal();

  // Loading animations for Discounts tab
  useEffect(() => {
    let loadingInterval;

    if (isSubmittingDiscount || isDeletingDiscount) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);

        if (isSubmittingDiscount && !editingDiscountId) {
          setAddingDiscountText(`Adding${dots}`);
        } else if (isSubmittingDiscount && editingDiscountId) {
          setUpdatingDiscountText(`Updating${dots}`);
        }

        if (isDeletingDiscount) {
          setDeletingDiscountDots(dots);
        }

        dotCount++;
      }, 500);
    } else {
      setAddingDiscountText("Add");
      setUpdatingDiscountText("Update");
      setDeletingDiscountDots("");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmittingDiscount, editingDiscountId, isDeletingDiscount]);

  // Loading animations for Delivery tab
  useEffect(() => {
    let loadingInterval;

    if (isSubmittingDelivery) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setUpdatingDeliveryText(`Updating${dots}`);
        dotCount++;
      }, 500);
    } else {
      setUpdatingDeliveryText("Update");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmittingDelivery]);

  // Unli Wings loading animation
  useEffect(() => {
    let loadingInterval;

    if (isSubmittingBaseAmount) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);
        setUpdatingDeliveryText(`Updating${dots}`);
        dotCount++;
      }, 500);
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmittingBaseAmount]);

  // Discount functions
  const handleAddDiscount = async () => {
    const token = localStorage.getItem("access_token");

    if (!newDiscountType || !newDiscountPercentage) {
      await alert("Both fields are required.", "Error");
      return;
    }

    const percentage = Number.parseFloat(newDiscountPercentage) / 100;
    if (isNaN(percentage)) {
      await alert("Percentage must be a valid number.", "Error");
      return;
    }

    setIsSubmittingDiscount(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/add-discount/",
        {
          type: newDiscountType,
          percentage: percentage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        setNewDiscountType("");
        setNewDiscountPercentage("");
        fetchOrderData(); // Refresh the table
      }
    } catch (error) {
      console.error(
        "Failed to add discount",
        error.response?.data || error.message
      );
      await alert("Failed to add discount.", "Error");
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscountId(discount.id);
    setEditedDiscountType(discount.type);
    setEditedDiscountPercentage((discount.percentage * 100).toFixed(0));
  };

  const handleCancelEdit = () => {
    setEditingDiscountId(null);
    setEditedDiscountType("");
    setEditedDiscountPercentage("");
  };

  const handleSaveEditDiscount = async (discountId) => {
    const percentage = parseFloat(editedDiscountPercentage) / 100;
    const token = localStorage.getItem("access_token");

    if (!editedDiscountType || isNaN(percentage)) {
      await alert("Invalid input.", "Error");
      return;
    }

    setIsSubmittingDiscount(true);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-discount/${discountId}/`,
        {
          type: editedDiscountType,
          percentage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        fetchOrderData();
        handleCancelEdit();
      }
    } catch (error) {
      console.error(
        "Failed to update discount",
        error.response?.data || error.message
      );
      await alert("Failed to update discount.", "Error");
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    const token = localStorage.getItem("access_token");

    const confirmDelete = await confirm(
      "Are you sure you want to delete this discount?",
      "Confirm Delete"
    );

    if (!confirmDelete) return;

    setIsDeletingDiscount(true);
    try {
      await axios.delete(
        `http://127.0.0.1:8000/delete-discount/${discountId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchOrderData();
    } catch (error) {
      console.error("Error deleting discount:", error);
      await alert("Failed to delete discount. Please try again.", "Error");
    } finally {
      setIsDeletingDiscount(false);
    }
  };

  // Delivery percentage functions
  const handleSaveEditDelivery = async (appId) => {
    const updatedPercentage = parseFloat(editingDeliveryPercentage) / 100;
    const token = localStorage.getItem("access_token");

    if (isNaN(updatedPercentage)) {
      console.error("Invalid percentage value.");
      return;
    }

    setIsSubmittingDelivery(true);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-delivery-deduction/${appId}/`,
        { deduction_percentage: updatedPercentage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setEditingDeliveryId(null);
        fetchOrderData();
      }
    } catch (error) {
      console.error(
        "Failed to update delivery deduction",
        error.response?.data || error.message
      );
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  // Unli Wings functions
  const handleSaveUnliWingsBaseAmount = async (categoryId) => {
    const updatedBaseAmount = parseFloat(editingBaseAmount);
    const token = localStorage.getItem("access_token");

    if (isNaN(updatedBaseAmount)) {
      console.error("Invalid base amount value.");
      return;
    }

    setIsSubmittingBaseAmount(true);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-unli-wings-base-amount/${categoryId}/`,
        { base_amount: updatedBaseAmount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setEditingUnliWingsId(null);
        fetchOrderData();
      }
    } catch (error) {
      console.error(
        "Failed to update Unli Wings base amount",
        error.response?.data || error.message
      );
    } finally {
      setIsSubmittingBaseAmount(false);
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
                    activeTab === "delivery" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={() => setActiveTab("delivery")}
                >
                  Delivery Percentage Deduction
                </button>
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
                    activeTab === "unliwings" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={() => setActiveTab("unliwings")}
                >
                  Unli Wings Base Amount
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeTab === "delivery" ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Delivery Deductions Table */}
                  <div className="flex-1 overflow-hidden p-4">
                    <div className="h-full overflow-y-auto">
                      <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-6 py-3 font-medium">
                              APP NAME
                            </th>
                            <th scope="col" className="px-6 py-3 font-medium">
                              PERCENTAGE
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedMenuTypes
                            .filter((app) => app.id !== 1)
                            .map((app, index) => {
                              const isEditing = editingDeliveryId === app.id;
                              return (
                                <tr
                                  key={app.id}
                                  className={`${
                                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  } border-b hover:bg-gray-200 group`}
                                >
                                  <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                                    {app.name}
                                  </td>
                                  <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900 relative">
                                    {isEditing ? (
                                      <div className="flex items-center">
                                        <input
                                          type="text"
                                          className="w-24 px-3 py-2 border rounded-md"
                                          value={editingDeliveryPercentage}
                                          onChange={(e) =>
                                            setEditingDeliveryPercentage(
                                              e.target.value
                                            )
                                          }
                                        />
                                        <div className="ml-2 flex">
                                          <button
                                            onClick={() =>
                                              setEditingDeliveryId(null)
                                            }
                                            className="text-red-500 hover:text-red-700 p-1"
                                          >
                                            <FaTimes />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleSaveEditDelivery(app.id)
                                            }
                                            disabled={isSubmittingDelivery}
                                            className={`text-green-500 hover:text-green-600 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center ${
                                              isSubmittingDelivery
                                                ? "opacity-70 cursor-not-allowed"
                                                : ""
                                            }`}
                                          >
                                            {isSubmittingDelivery &&
                                            editingDeliveryId === app.id ? (
                                              <span className="text-green-500 leading-none">
                                                {".".repeat(
                                                  Math.floor(Date.now() / 500) %
                                                    4
                                                )}
                                              </span>
                                            ) : (
                                              <FaCheck />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <span className="mr-2">
                                          {Math.round(
                                            (app.deduction_percentage ||
                                              app.percentage) * 100
                                          ) + "%"}
                                        </span>
                                        <button
                                          onClick={() => {
                                            setEditingDeliveryId(app.id);
                                            setEditingDeliveryPercentage(
                                              Math.round(
                                                (app.deduction_percentage ||
                                                  app.percentage ||
                                                  0) * 100
                                              ).toString()
                                            );
                                          }}
                                          className="text-[#CC5500] hover:text-[#B34500] ml-2"
                                        >
                                          <FaPencilAlt />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : activeTab === "discounts" ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Fixed Input Area for Discounts */}
                  <div className="bg-white p-4 border-b">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount Type
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full px-3 py-2 pr-10 border rounded-md"
                            placeholder="Enter discount type"
                            value={
                              editingDiscountId
                                ? editedDiscountType
                                : newDiscountType
                            }
                            onChange={(e) =>
                              editingDiscountId
                                ? setEditedDiscountType(e.target.value)
                                : setNewDiscountType(e.target.value)
                            }
                          />
                          {(editingDiscountId
                            ? editedDiscountType
                            : newDiscountType) && (
                            <button
                              onClick={() => {
                                if (editingDiscountId) {
                                  handleCancelEdit();
                                } else {
                                  setNewDiscountType("");
                                  setNewDiscountPercentage("");
                                }
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-white rounded-full w-6 h-6 flex items-center justify-center"
                            >
                              <IoMdClose size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Percentage (%)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Enter percentage"
                          value={
                            editingDiscountId
                              ? editedDiscountPercentage
                              : newDiscountPercentage
                          }
                          onChange={(e) =>
                            editingDiscountId
                              ? setEditedDiscountPercentage(e.target.value)
                              : setNewDiscountPercentage(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      {!editingDiscountId ? (
                        <button
                          onClick={handleAddDiscount}
                          disabled={isSubmittingDiscount}
                          className={`bg-green-500 text-white px-4 py-2 rounded-lg min-w-[120px] ${
                            isSubmittingDiscount
                              ? "opacity-70 cursor-not-allowed"
                              : "hover:bg-green-600"
                          }`}
                        >
                          {addingDiscountText}
                        </button>
                      ) : (
                        <div className="w-full flex justify-between">
                          <button
                            onClick={handleDeleteDiscount.bind(
                              null,
                              editingDiscountId
                            )}
                            disabled={isDeletingDiscount}
                            className={`bg-red-500 text-white px-4 py-2 rounded-lg min-w-[120px] ${
                              isDeletingDiscount
                                ? "opacity-70 cursor-not-allowed"
                                : "hover:bg-red-600"
                            }`}
                          >
                            {isDeletingDiscount
                              ? `Deleting${deletingDiscountDots}`
                              : "Delete"}
                          </button>
                          <button
                            onClick={() =>
                              handleSaveEditDiscount(editingDiscountId)
                            }
                            disabled={isSubmittingDiscount}
                            className={`bg-green-500 text-white px-4 py-2 rounded-lg min-w-[120px] ${
                              isSubmittingDiscount
                                ? "opacity-70 cursor-not-allowed"
                                : "hover:bg-green-600"
                            }`}
                          >
                            {updatingDiscountText}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Discounts Table */}
                  <div className="flex-1 overflow-hidden p-4">
                    <div className="h-full overflow-y-auto">
                      <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-6 py-3 font-medium">
                              DISCOUNT TYPE
                            </th>
                            <th scope="col" className="px-6 py-3 font-medium">
                              PERCENTAGE
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedDiscounts.length > 0 ? (
                            sortedDiscounts.map((discount, index) => (
                              <tr
                                key={discount.id}
                                className={`${
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } border-b hover:bg-gray-200 group cursor-pointer`}
                                onClick={() => handleEditDiscount(discount)}
                              >
                                <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                                  {discount.type}
                                </td>
                                <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                                  {(discount.percentage * 100).toFixed(0) + "%"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="bg-white border-b">
                              <td
                                colSpan="2"
                                className="px-6 py-4 text-center font-normal text-gray-500 italic"
                              >
                                No Discounts Available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : activeTab === "unliwings" ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Unli Wings Base Amount Table */}
                  <div className="flex-1 overflow-hidden p-4">
                    <div className="h-full overflow-y-auto">
                      <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-6 py-3 font-medium">
                              CATEGORY NAME
                            </th>
                            <th scope="col" className="px-6 py-3 font-medium">
                              BASE AMOUNT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {instore_categories
                            ?.filter((category) => category.id === 2)
                            .map((category, index) => {
                              const isEditing =
                                editingUnliWingsId === category.id;
                              return (
                                <tr
                                  key={category.id}
                                  className={`${
                                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  } border-b hover:bg-gray-200 group`}
                                >
                                  <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                                    {category.name}
                                  </td>
                                  <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900 relative">
                                    {isEditing ? (
                                      <div className="flex items-center">
                                        <input
                                          type="text"
                                          className="w-24 px-3 py-2 border rounded-md"
                                          value={editingBaseAmount}
                                          onChange={(e) =>
                                            setEditingBaseAmount(e.target.value)
                                          }
                                        />
                                        <div className="ml-2 flex">
                                          <button
                                            onClick={() =>
                                              setEditingUnliWingsId(null)
                                            }
                                            className="text-red-500 hover:text-red-700 p-1"
                                          >
                                            <FaTimes />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleSaveUnliWingsBaseAmount(
                                                category.id
                                              )
                                            }
                                            disabled={isSubmittingBaseAmount}
                                            className={`text-green-500 hover:text-green-600 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center ${
                                              isSubmittingBaseAmount
                                                ? "opacity-70 cursor-not-allowed"
                                                : ""
                                            }`}
                                          >
                                            {isSubmittingBaseAmount &&
                                            editingUnliWingsId ===
                                              category.id ? (
                                              <span className="text-green-500 leading-none">
                                                {".".repeat(
                                                  Math.floor(Date.now() / 500) %
                                                    4
                                                )}
                                              </span>
                                            ) : (
                                              <FaCheck />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <span className="mr-2">
                                          ₱
                                          {category.base_amount?.toFixed(2) ||
                                            "0.00"}
                                        </span>
                                        <button
                                          onClick={() => {
                                            setEditingUnliWingsId(category.id);
                                            setEditingBaseAmount(
                                              category.base_amount?.toString() ||
                                                "0"
                                            );
                                          }}
                                          className="text-[#CC5500] hover:text-[#B34500] ml-2"
                                        >
                                          <FaPencilAlt />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEssentials;
