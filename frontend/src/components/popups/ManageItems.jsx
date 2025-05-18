import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { useModal } from "../utils/modalUtils";

const ManageItems = ({
  isOpen,
  onClose,
  categories = [],
  units = [],
  fetchItemData,
  items = [],
}) => {
  const [activeTab, setActiveTab] = useState("items");
  const token = localStorage.getItem("access_token");
  const [filterStatus, setFilterStatus] = useState(1); // 1 = Active, 2 = Archived

  // States for Items tab
  const [itemName, setItemName] = useState("");
  const [stockTrigger, setStockTrigger] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isArchivingItem, setIsArchivingItem] = useState(false);
  const [addingItemText, setAddingItemText] = useState("Add Item");
  const [updatingItemText, setUpdatingItemText] = useState("Update");
  const [deletingItemDots, setDeletingItemDots] = useState("");
  const [archivingItemDots, setArchivingItemDots] = useState("");

  // States for Categories tab
  const [categoryName, setCategoryName] = useState("");
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [addingCategoryText, setAddingCategoryText] = useState("Add");
  const [updatingCategoryText, setUpdatingCategoryText] = useState("Update");
  const [deletingCategoryDots, setDeletingCategoryDots] = useState("");

  const { alert, confirm } = useModal();

  // Filter items based on archive status
  const filteredItems = items.filter((item) =>
    filterStatus === 1 ? !item.is_archived : item.is_archived
  );

  // Sort items and categories alphabetically
  const sortedItems = [...filteredItems].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // Loading animations for Items tab
  useEffect(() => {
    let loadingInterval;

    if (isSubmittingItem || isDeletingItem || isArchivingItem) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);

        if (isSubmittingItem && !isEditingItem) {
          setAddingItemText(`Adding${dots}`);
        } else if (isSubmittingItem && isEditingItem) {
          setUpdatingItemText(`Updating${dots}`);
        }

        if (isDeletingItem) {
          setDeletingItemDots(dots);
        }

        if (isArchivingItem) {
          setArchivingItemDots(dots);
        }

        dotCount++;
      }, 500);
    } else {
      setAddingItemText("Add Item");
      setUpdatingItemText("Update");
      setDeletingItemDots("");
      setArchivingItemDots("");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmittingItem, isEditingItem, isDeletingItem, isArchivingItem]);

  // Loading animations for Categories tab
  useEffect(() => {
    let loadingInterval;

    if (isSubmittingCategory || isDeletingCategory) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);

        if (isSubmittingCategory && !isEditingCategory) {
          setAddingCategoryText(`Adding${dots}`);
        } else if (isSubmittingCategory && isEditingCategory) {
          setUpdatingCategoryText(`Updating${dots}`);
        }

        if (isDeletingCategory) {
          setDeletingCategoryDots(dots);
        }

        dotCount++;
      }, 500);
    } else {
      setAddingCategoryText("Add");
      setUpdatingCategoryText("Update");
      setDeletingCategoryDots("");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmittingCategory, isEditingCategory, isDeletingCategory]);

  // Item Functions
  const handleAddItem = async () => {
    if (!itemName || !stockTrigger || !selectedUnit || !selectedCategory) {
      await alert("Please fill in all fields.", "Error");
      return;
    }

    setIsSubmittingItem(true);

    try {
      const addItemResponse = await axios.post(
        "http://127.0.0.1:8000/add-item/",
        {
          name: itemName,
          stock_trigger: stockTrigger,
          measurement: selectedUnit,
          category: selectedCategory,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newItem = addItemResponse.data.item || addItemResponse.data;
      if (!newItem || !newItem.id) {
        await alert("Item added but no item ID was returned.", "Error");
        return;
      }

      // Create inventory record with initial quantity 0
      await axios.post(
        "http://127.0.0.1:8000/add-inventory/",
        {
          item: newItem.id,
          quantity: 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Item added successfully!", "Success");
      fetchItemData();
      resetItemForm();
    } catch (error) {
      console.error("Error adding item:", error);
      await alert("Failed to add item.", "Error");
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleEditItem = async () => {
    if (
      !itemName ||
      !stockTrigger ||
      !selectedUnit ||
      !selectedCategory ||
      selectedItemIndex === null
    ) {
      await alert("Please fill in all fields.", "Error");
      return;
    }

    setIsSubmittingItem(true);

    const itemId = sortedItems[selectedItemIndex]?.id;

    if (!itemId) {
      console.error("Error: No item ID found!");
      setIsSubmittingItem(false);
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/edit-item/${itemId}/`,
        {
          name: itemName,
          stock_trigger: stockTrigger,
          measurement: selectedUnit,
          category: selectedCategory,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Item updated successfully!", "Success");
      fetchItemData();
      resetItemForm();
    } catch (error) {
      console.error("Error updating item:", error);
      await alert("Failed to update item.", "Error");
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleArchiveItem = async () => {
    if (selectedItemIndex === null) return;

    const item = sortedItems[selectedItemIndex];
    const isArchived = item.is_archived;
    const action = isArchived ? "restore" : "archive";

    const confirmMessage = isArchived
      ? "Are you sure you want to restore this item?"
      : "Are you sure you want to archive this item?";

    const confirmTitle = isArchived ? "Restore Item" : "Archive Item";

    const confirmAction = await confirm(confirmMessage, confirmTitle);
    if (!confirmAction) return;

    setIsArchivingItem(true);
    const itemId = item.id;

    try {
      const endpoint = isArchived
        ? `http://127.0.0.1:8000/unarchive-item/${itemId}/`
        : `http://127.0.0.1:8000/archive-item/${itemId}/`;

      await axios.put(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await alert(`Item ${action}d successfully!`, "Success");
      fetchItemData();
      resetItemForm();
    } catch (error) {
      console.error(`Error ${action}ing item:`, error);
      await alert(`Failed to ${action} item.`, "Error");
    } finally {
      setIsArchivingItem(false);
    }
  };

  const handleDeleteItem = async () => {
    if (selectedItemIndex === null) return;

    const item = sortedItems[selectedItemIndex];

    if (!item.is_archived) {
      await alert("Cannot delete an active item. Archive it first.", "Error");
      return;
    }

    const confirmDelete = await confirm(
      "Are you sure you want to permanently delete this archived item? This action cannot be undone.",
      "Delete Item Permanently"
    );
    if (!confirmDelete) return;

    setIsDeletingItem(true);
    const itemId = item.id;

    try {
      const response = await axios.delete(
        `http://127.0.0.1:8000/delete-item/${itemId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Item deleted permanently!", "Success");
      fetchItemData();
      resetItemForm();
    } catch (error) {
      console.error("Error deleting item:", error);

      // Handle the specific error for menu recipes
      if (error.response && error.response.data && error.response.data.error) {
        if (error.response.data.error.includes("menu recipes")) {
          await alert(error.response.data.error, "Cannot Delete Item");
        } else {
          await alert("Failed to delete item.", "Error");
        }
      } else {
        await alert("Failed to delete item.", "Error");
      }
    } finally {
      setIsDeletingItem(false);
    }
  };

  const resetItemForm = () => {
    setItemName("");
    setStockTrigger("");
    setSelectedUnit("");
    setSelectedCategory("");
    setSelectedItemIndex(null);
    setIsEditingItem(false);
  };

  const selectItem = (item, index) => {
    setItemName(item.name);
    setStockTrigger(item.stock_trigger);
    setSelectedUnit(item.measurement);
    setSelectedCategory(item.category);
    setSelectedItemIndex(index);
    setIsEditingItem(true);
  };

  // Category Functions
  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;

    setIsSubmittingCategory(true);
    try {
      await axios.post(
        "http://127.0.0.1:8000/add-category/",
        { name: categoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchItemData();
      setCategoryName("");
    } catch (error) {
      console.error("Error adding category:", error);
      await alert("Failed to add category.", "Error");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim() || selectedCategoryIndex === null) return;

    setIsSubmittingCategory(true);

    const categoryId = sortedCategories[selectedCategoryIndex]?.id;
    if (!categoryId) {
      console.error("Error: No category ID found!");
      setIsSubmittingCategory(false);
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/edit-category/${categoryId}/`,
        { name: categoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Category updated successfully!", "Success");
      fetchItemData();
      resetCategoryForm();
    } catch (error) {
      console.error("Error updating category:", error);
      await alert("Failed to update category.", "Error");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (selectedCategoryIndex === null) return;

    const confirmDelete = await confirm(
      "Are you sure you want to delete this category?",
      "Delete Category"
    );
    if (!confirmDelete) return;

    setIsDeletingCategory(true);
    try {
      const categoryId = sortedCategories[selectedCategoryIndex].id;
      await axios.delete(
        `http://127.0.0.1:8000/delete-category/${categoryId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Category deleted successfully!", "Success");
      fetchItemData();
      resetCategoryForm();
    } catch (error) {
      console.error("Error deleting category:", error);

      // Handle the specific error for categories assigned to items
      if (error.response && error.response.data && error.response.data.error) {
        if (
          error.response.data.error.includes("assigned to the following items")
        ) {
          await alert(error.response.data.error, "Cannot Delete Category");
        } else {
          await alert("Failed to delete category.", "Error");
        }
      } else {
        await alert("Failed to delete category.", "Error");
      }
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryName("");
    setSelectedCategoryIndex(null);
    setIsEditingCategory(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Item Manager</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 w-8 h-8 flex items-center justify-center"
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
                  activeTab === "items" ? "bg-gray-100 font-medium" : ""
                }`}
                onClick={() => setActiveTab("items")}
              >
                Items
              </button>
              <button
                className={`p-4 text-left hover:bg-gray-100 ${
                  activeTab === "categories" ? "bg-gray-100 font-medium" : ""
                }`}
                onClick={() => setActiveTab("categories")}
              >
                Item Categories
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === "items" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Fixed Input Area for Items */}
                <div className="bg-white p-4 border-b">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-3 py-2 pr-10 border rounded-md"
                          placeholder="Enter item name"
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Trigger
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Enter stock trigger"
                        value={stockTrigger}
                        onChange={(e) => setStockTrigger(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                      >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.symbol}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    {!isEditingItem ? (
                      <button
                        onClick={handleAddItem}
                        disabled={isSubmittingItem || filterStatus === 2}
                        className={`bg-green-500 text-white px-4 py-2 rounded-lg min-w-[120px] ${
                          isSubmittingItem || filterStatus === 2
                            ? "opacity-70 cursor-not-allowed"
                            : "hover:bg-green-600"
                        }`}
                      >
                        {addingItemText}
                      </button>
                    ) : (
                      <div className="w-full flex justify-between">
                        <div className="flex gap-x-2">
                          <button
                            onClick={resetItemForm}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg min-w-[120px]"
                          >
                            Cancel
                          </button>
                          {filterStatus === 2 && (
                            <button
                              onClick={handleDeleteItem}
                              disabled={isDeletingItem}
                              className={`bg-red-500 text-white px-4 py-2 rounded-lg min-w-[120px] ${
                                isDeletingItem
                                  ? "opacity-70 cursor-not-allowed"
                                  : "hover:bg-red-600"
                              }`}
                            >
                              {isDeletingItem
                                ? `Deleting${deletingItemDots}`
                                : "Remove Item"}
                            </button>
                          )}
                          <button
                            onClick={handleArchiveItem}
                            disabled={isArchivingItem}
                            className={`${
                              sortedItems[selectedItemIndex]?.is_archived
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-[#CC5500] hover:bg-[#CC5500]/80"
                            } text-white px-4 py-2 rounded-lg min-w-[140px] ${
                              isArchivingItem
                                ? "opacity-70 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {isArchivingItem
                              ? `${
                                  sortedItems[selectedItemIndex]?.is_archived
                                    ? "Restoring"
                                    : "Archiving"
                                }${archivingItemDots}`
                              : sortedItems[selectedItemIndex]?.is_archived
                              ? "Restore Item"
                              : "Archive Item"}
                          </button>
                        </div>
                        {filterStatus === 1 && (
                          <button
                            onClick={handleEditItem}
                            disabled={isSubmittingItem}
                            className={`bg-green-500 text-white px-4 py-2 rounded-lg min-w-[120px] ${
                              isSubmittingItem
                                ? "opacity-70 cursor-not-allowed"
                                : "hover:bg-green-600"
                            }`}
                          >
                            {updatingItemText}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Scrollable Items Table */}
                <div className="flex-1 overflow-hidden p-4">
                  <div className="h-full overflow-y-auto">
                    {/* Status Filter */}
                    <div className="flex items-center justify-start pt-2">
                      <div className="inline-flex rounded-md shadow-sm">
                        <button
                          className={`flex items-center justify-center p-2 transition-colors duration-200 w-48 rounded-tl-sm rounded-bl-sm ${
                            filterStatus === 1
                              ? "bg-[#CC5500] text-white"
                              : "bg-[#CC5500]/70 text-white"
                          }`}
                          onClick={() => setFilterStatus(1)}
                        >
                          Available
                        </button>

                        <button
                          className={`flex items-center justify-center p-2 transition-colors duration-200 w-48 rounded-tr-sm rounded-br-sm ${
                            filterStatus === 2
                              ? "bg-[#CC5500] text-white"
                              : "bg-[#CC5500]/70 text-white"
                          }`}
                          onClick={() => setFilterStatus(2)}
                        >
                          Archived
                        </button>
                      </div>
                    </div>
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                      <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-6 py-3 font-medium">
                            ITEM NAME
                          </th>
                          <th scope="col" className="px-6 py-3 font-medium">
                            UNIT
                          </th>
                          <th scope="col" className="px-6 py-3 font-medium">
                            CATEGORY
                          </th>
                          <th scope="col" className="px-6 py-3 font-medium">
                            STOCK TRIGGER
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedItems.length > 0 ? (
                          sortedItems.map((item, index) => (
                            <tr
                              key={item.id}
                              className={`${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              } border-b hover:bg-gray-200 group cursor-pointer`}
                              onClick={() => selectItem(item, index)}
                            >
                              <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                                {units.find((u) => u.id === item.measurement)
                                  ?.symbol || "N/A"}
                              </td>
                              <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                                {categories.find((c) => c.id === item.category)
                                  ?.name || "N/A"}
                              </td>
                              <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                                {item.stock_trigger}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="bg-white border-b">
                            <td
                              colSpan="4"
                              className="px-6 py-4 text-center font-normal text-gray-500 italic"
                            >
                              {filterStatus === 1
                                ? "No Available Items"
                                : "No Archived Items"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === "categories" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Fixed Input Area for Categories */}
                <div className="bg-white p-4 border-b">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Category
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter Category"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="w-full p-2 pr-10 border rounded-md"
                      />
                      {categoryName && (
                        <button
                          onClick={resetCategoryForm}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <IoMdClose size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    {!isEditingCategory ? (
                      <button
                        onClick={handleAddCategory}
                        disabled={isSubmittingCategory}
                        className={`bg-green-500 text-white px-4 py-2 rounded-lg min-w-[120px] ${
                          isSubmittingCategory
                            ? "opacity-70 cursor-not-allowed"
                            : "hover:bg-green-600"
                        }`}
                      >
                        {addingCategoryText}
                      </button>
                    ) : (
                      <div className="w-full flex justify-between">
                        <button
                          onClick={handleDeleteCategory}
                          disabled={isDeletingCategory}
                          className={`bg-red-500 text-white px-4 py-2 rounded-lg min-w-[120px] ${
                            isDeletingCategory
                              ? "opacity-70 cursor-not-allowed"
                              : "hover:bg-red-600"
                          }`}
                        >
                          {isDeletingCategory
                            ? `Deleting${deletingCategoryDots}`
                            : "Delete Category"}
                        </button>
                        <button
                          onClick={handleEditCategory}
                          disabled={isSubmittingCategory}
                          className={`bg-green-500 text-white px-4 py-2 rounded-lg min-w-[120px] ${
                            isSubmittingCategory
                              ? "opacity-70 cursor-not-allowed"
                              : "hover:bg-green-600"
                          }`}
                        >
                          {updatingCategoryText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scrollable Categories Table */}
                <div className="flex-1 overflow-hidden p-4">
                  <div className="h-full overflow-y-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                      <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-6 py-3 font-medium">
                            CATEGORY
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCategories.length > 0 ? (
                          sortedCategories.map((category, index) => (
                            <tr
                              key={category.id}
                              className={`${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              } border-b hover:bg-gray-200 group cursor-pointer`}
                              onClick={() => {
                                setCategoryName(category.name);
                                setSelectedCategoryIndex(index);
                                setIsEditingCategory(true);
                              }}
                            >
                              <td className="px-6 py-4 font-normal text-gray-700 group-hover:text-gray-900">
                                {category.name}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="bg-white border-b">
                            <td
                              colSpan="1"
                              className="px-6 py-4 text-center font-normal text-gray-500 italic"
                            >
                              No Categories Available
                            </td>
                          </tr>
                        )}
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
  );
};

export default ManageItems;
