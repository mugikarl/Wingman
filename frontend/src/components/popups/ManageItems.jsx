import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageItems = ({
  isOpen,
  onClose,
  categories = [],
  units = [],
  fetchItemData,
}) => {
  const [activeTab, setActiveTab] = useState("items");
  const token = localStorage.getItem("access_token");

  // States for Items tab
  const [itemName, setItemName] = useState("");
  const [stockTrigger, setStockTrigger] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedItemName, setEditedItemName] = useState("");
  const [editedStockTrigger, setEditedStockTrigger] = useState("");
  const [editedUnit, setEditedUnit] = useState("");
  const [editedCategory, setEditedCategory] = useState("");

  // States for Categories tab
  const [categoryName, setCategoryName] = useState("");
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  // Fetch items for the Items tab
  const fetchItems = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-items-page-data/"
      );
      setItems(response.data.items || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      fetchItemData();
    }
  }, [isOpen]);

  // Item Functions
  const handleAddItem = async () => {
    if (!itemName || !stockTrigger || !selectedUnit || !selectedCategory) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

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
        alert("Item added but no item ID was returned.");
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

      alert("Item added successfully!");
      setItemName("");
      setStockTrigger("");
      setSelectedUnit("");
      setSelectedCategory("");
      fetchItems();
      fetchItemData();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setEditedItemName(item.name);
    setEditedStockTrigger(item.stock_trigger);
    setEditedUnit(item.measurement);
    setEditedCategory(item.category);
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditedItemName("");
    setEditedStockTrigger("");
    setEditedUnit("");
    setEditedCategory("");
  };

  const handleSaveEditItem = async (itemId) => {
    if (
      !editedItemName ||
      !editedStockTrigger ||
      !editedUnit ||
      !editedCategory
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/edit-item/${itemId}/`,
        {
          name: editedItemName,
          stock_trigger: editedStockTrigger,
          measurement: editedUnit,
          category: editedCategory,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Item updated successfully!");
      handleCancelEditItem();
      fetchItems();
      fetchItemData();
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/delete-item/${itemId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Item deleted successfully!");
      fetchItems();
      fetchItemData();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    }
  };

  // Category Functions
  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;

    try {
      await axios.post(
        "http://127.0.0.1:8000/add-category/",
        { name: categoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategoryName("");
      fetchItemData();
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category.");
    }
  };

  const handleEditCategory = (category, index) => {
    setCategoryName(category.name);
    setSelectedCategoryIndex(index);
    setIsEditingCategory(true);
  };

  const handleCancelEditCategory = () => {
    setCategoryName("");
    setSelectedCategoryIndex(null);
    setIsEditingCategory(false);
  };

  const handleSaveEditCategory = async () => {
    if (!categoryName.trim() || selectedCategoryIndex === null) return;

    const categoryId = categories[selectedCategoryIndex]?.id;
    if (!categoryId) {
      console.error("Error: No category ID found!");
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/edit-category/${categoryId}/`,
        { name: categoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Category updated successfully!");
      setCategoryName("");
      setIsEditingCategory(false);
      setSelectedCategoryIndex(null);
      fetchItemData();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category.");
    }
  };

  const handleDeleteCategory = async (index) => {
    const confirmDelete = window.confirm("Delete category?");
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/delete-category/${categories[index].id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (index === selectedCategoryIndex) {
        setCategoryName("");
        setIsEditingCategory(false);
        setSelectedCategoryIndex(null);
      }
      fetchItemData();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Item Manager</h2>
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
                Categories
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-4">
              {activeTab === "items" ? (
                <div className="space-y-6">
                  {/* Items Form */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-lg font-medium mb-4">Add Item</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Enter item name"
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                        />
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
                      <div className="col-span-2 flex justify-end">
                        <button
                          onClick={handleAddItem}
                          className="px-4 py-2 bg-[#E88504] text-white rounded-md hover:bg-[#D87A03]"
                          disabled={loading}
                        >
                          {loading ? "Adding..." : "Add Item"}
                        </button>
                      </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                  </div>

                  {/* Items Table */}
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Trigger
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingItemId === item.id ? (
                                <input
                                  type="text"
                                  className="border rounded-md px-2 py-1 w-full"
                                  value={editedItemName}
                                  onChange={(e) =>
                                    setEditedItemName(e.target.value)
                                  }
                                />
                              ) : (
                                item.name
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingItemId === item.id ? (
                                <input
                                  type="number"
                                  className="border rounded-md px-2 py-1 w-full"
                                  value={editedStockTrigger}
                                  onChange={(e) =>
                                    setEditedStockTrigger(e.target.value)
                                  }
                                />
                              ) : (
                                item.stock_trigger
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingItemId === item.id ? (
                                <select
                                  className="border rounded-md px-2 py-1 w-full"
                                  value={editedUnit}
                                  onChange={(e) =>
                                    setEditedUnit(e.target.value)
                                  }
                                >
                                  {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                      {unit.symbol}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                units.find((u) => u.id === item.measurement)
                                  ?.symbol || "N/A"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingItemId === item.id ? (
                                <select
                                  className="border rounded-md px-2 py-1 w-full"
                                  value={editedCategory}
                                  onChange={(e) =>
                                    setEditedCategory(e.target.value)
                                  }
                                >
                                  {categories.map((category) => (
                                    <option
                                      key={category.id}
                                      value={category.id}
                                    >
                                      {category.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                categories.find((c) => c.id === item.category)
                                  ?.name || "N/A"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {editingItemId === item.id ? (
                                <>
                                  <button
                                    onClick={handleCancelEditItem}
                                    className="text-red-600 hover:text-red-800 p-1"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditItem(item.id)}
                                    className="text-green-600 hover:text-green-800 p-1 ml-2"
                                  >
                                    Save
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditItem(item)}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-red-600 hover:text-red-800 p-1 ml-2"
                                  >
                                    Delete
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
              ) : activeTab === "categories" ? (
                <div className="space-y-6">
                  {/* Categories Form */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-lg font-medium mb-4">
                      {isEditingCategory ? "Edit" : "Add"} Category
                    </h3>
                    <div className="flex space-x-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Enter category name"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        {!isEditingCategory ? (
                          <button
                            onClick={handleAddCategory}
                            className="px-4 py-2 bg-[#E88504] text-white rounded-md hover:bg-[#D87A03]"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={handleCancelEditCategory}
                              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEditCategory}
                              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                              Update
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Categories Table */}
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map((category, index) => (
                          <tr key={category.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {category.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() =>
                                  handleEditCategory(category, index)
                                }
                                className="text-blue-600 hover:text-blue-800 p-1"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(index)}
                                className="text-red-600 hover:text-red-800 p-1 ml-2"
                              >
                                Delete
                              </button>
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
  );
};

export default ManageItems;
