import React, { useState } from "react";
import axios from "axios";

const EditMenuModal = ({
  item,
  onClose,
  onSave,
  categories,
  menuTypes,
  items,
  units,
  fetchMenus,
}) => {
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // State for form data
  const [image, setImage] = useState(item.image || null);
  const [itemName, setItemName] = useState(item.name || "");
  const [price, setPrice] = useState(item.price || "");
  const [categoryId, setCategoryId] = useState(item.category_id || "");
  const [typeId, setTypeId] = useState(item.type_id || "");
  const [isAvailable, setIsAvailable] = useState(item.status_id === 1);

  // State for recipe data
  const [recipes, setRecipes] = useState(item.menu_items || []);

  // State for new recipe row
  const [newRecipe, setNewRecipe] = useState({
    item_id: "",
    quantity: "",
    unit_id: "",
  });

  // Handle image upload
  const handleImageUpload = (e) => {
    if (!isEditMode) return;
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // Reset form data when canceling edit mode
      setImage(item.image || null);
      setItemName(item.name || "");
      setPrice(item.price || "");
      setCategoryId(item.category_id || "");
      setTypeId(item.type_id || "");
      setIsAvailable(item.status_id === 1);
      setRecipes(item.menu_items || []);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!isEditMode) return;

    if (
      !itemName ||
      !price ||
      !categoryId ||
      !typeId ||
      !image ||
      recipes.length === 0
    ) {
      alert("Please fill in all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("image", typeof image === "string" ? image : image);
    formData.append("name", itemName);
    formData.append("price", price);
    formData.append("category_id", categoryId);
    formData.append("type_id", typeId);
    formData.append("status_id", isAvailable ? "1" : "2");

    // Prepare menu_items payload
    const menuItemsPayload = recipes.map((recipe) => ({
      item_id: recipe.item_id,
      quantity: recipe.quantity,
      unit_id: recipe.unit_id,
    }));

    // Add selected recipes to form data
    formData.append("menu_items", JSON.stringify(menuItemsPayload));

    const token = localStorage.getItem("access_token");

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/edit-menu/${item.id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Menu updated successfully!");
      onSave(response.data);
      fetchMenus();
      onClose();
    } catch (error) {
      console.error("Error updating menu item:", error.response?.data || error);
      alert("Failed to update menu item.");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }
    const token = localStorage.getItem("access_token");
    try {
      await axios.delete(`http://127.0.0.1:8000/delete-menu/${item.id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Menu deleted successfully!");
      fetchMenus();
      onClose();
    } catch (error) {
      console.error("Error deleting menu item:", error.response?.data || error);
      alert("Failed to delete menu item.");
    }
  };

  // Handle recipe deletion
  const handleDeleteRecipe = (index) => {
    if (!isEditMode) return;
    const updatedRecipes = recipes.filter((_, i) => i !== index);
    setRecipes(updatedRecipes);
  };

  // Handle adding a new recipe row
  const handleAddRecipe = () => {
    if (!isEditMode) return;
    if (!newRecipe.item_id || !newRecipe.quantity || !newRecipe.unit_id) {
      alert("Please fill in all fields for the new recipe item.");
      return;
    }

    // Find the item name for display
    const selectedItem = items.find(
      (item) => item.id === Number.parseInt(newRecipe.item_id)
    );

    // Find the unit symbol for display
    const selectedUnit = units.find(
      (unit) => unit.id === Number.parseInt(newRecipe.unit_id)
    );

    // Create the new recipe object
    const recipeToAdd = {
      id: null, // New item doesn't have an ID yet
      item_id: newRecipe.item_id,
      item_name: selectedItem ? selectedItem.name : "",
      quantity: newRecipe.quantity,
      unit_id: newRecipe.unit_id,
      unit: selectedUnit ? selectedUnit.symbol : "",
    };

    // Add to recipes array
    setRecipes([...recipes, recipeToAdd]);

    // Reset new recipe form
    setNewRecipe({
      item_id: "",
      quantity: "",
      unit_id: "",
    });
  };

  // Handle recipe field change
  const handleRecipeChange = (index, field, value) => {
    if (!isEditMode) return;

    const updatedRecipes = [...recipes];

    if (field === "item_id") {
      // When item changes, update item_name and reset unit if needed
      const selectedItem = items.find(
        (item) => item.id === Number.parseInt(value)
      );
      updatedRecipes[index] = {
        ...updatedRecipes[index],
        item_id: value,
        item_name: selectedItem ? selectedItem.name : "",
      };
    } else if (field === "unit_id") {
      // When unit changes, update unit display value
      const selectedUnit = units.find(
        (unit) => unit.id === Number.parseInt(value)
      );
      updatedRecipes[index] = {
        ...updatedRecipes[index],
        unit_id: value,
        unit: selectedUnit ? selectedUnit.symbol : "",
      };
    } else {
      // For other fields, just update the value
      updatedRecipes[index] = {
        ...updatedRecipes[index],
        [field]: value,
      };
    }

    setRecipes(updatedRecipes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-lg w-[90%] sm:w-[80%] md:w-[65%] lg:w-[50%] max-w-2xl mx-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Edit Menu</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleEditMode}
              className={`text-xs px-3 py-1 rounded-lg ${
                isEditMode ? "bg-red-500 text-white" : "bg-blue-500 text-white"
              }`}
            >
              {isEditMode ? "Cancel Edit" : "Edit"}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex flex-col">
          {/* Upload Photo Section */}
          <div className="relative group h-48 border-2 border-dashed border-gray-300 mb-3 w-full">
            {image ? (
              <>
                <img
                  src={
                    typeof image === "string"
                      ? image
                      : URL.createObjectURL(image)
                  }
                  alt="Menu Item"
                  className="w-full h-full object-cover"
                />
                {isEditMode && (
                  <div
                    onClick={() =>
                      document.getElementById("image-upload").click()
                    }
                    className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                  >
                    <span className="text-white text-lg">Change Pic</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={!isEditMode}
                />
              </>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-2xl">📷</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={!isEditMode}
                />
                <label
                  htmlFor="image-upload"
                  className={`text-sm ${
                    isEditMode
                      ? "text-blue-500 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Upload Photo
                </label>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {/* Item Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Item Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => isEditMode && setItemName(e.target.value)}
                className={`mt-1 p-1.5 text-sm border rounded-lg w-full ${
                  !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={!isEditMode}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Price
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => isEditMode && setPrice(e.target.value)}
                className={`mt-1 p-1.5 text-sm border rounded-lg w-full ${
                  !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={!isEditMode}
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => isEditMode && setCategoryId(e.target.value)}
                className={`mt-1 p-1.5 text-sm border rounded-lg w-full ${
                  !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={!isEditMode}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Menu Type
              </label>
              <select
                value={typeId}
                onChange={(e) => isEditMode && setTypeId(e.target.value)}
                className={`mt-1 p-1.5 text-sm border rounded-lg w-full ${
                  !isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={!isEditMode}
              >
                <option value="">Select Type</option>
                {menuTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Availability */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700">
              Availability
            </label>
            <div className="flex space-x-4 mt-1">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={isAvailable}
                  onChange={() => isEditMode && setIsAvailable(true)}
                  className="mr-1"
                  disabled={!isEditMode}
                />
                <span className="text-sm">Available</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!isAvailable}
                  onChange={() => isEditMode && setIsAvailable(false)}
                  className="mr-1"
                  disabled={!isEditMode}
                />
                <span className="text-sm">Unavailable</span>
              </label>
            </div>
          </div>

          {/* Recipe Table with inline editing */}
          <div className="mb-3">
            <h3 className="text-sm font-semibold mb-1">Recipe Items</h3>
            <div className="border border-gray-200 rounded">
              {/* Table Header */}
              <div className="grid grid-cols-4 bg-[#FFCF03] font-semibold text-gray-700 text-xs">
                <div className="px-2 py-1 border-r border-gray-200">
                  ITEM NAME
                </div>
                <div className="px-2 py-1 border-r border-gray-200">QTY</div>
                <div className="px-2 py-1 border-r border-gray-200">UNIT</div>
                <div className="px-2 py-1">ACTION</div>
              </div>

              {/* Table Body - Scrollable */}
              <div className="max-h-20 overflow-y-auto">
                {recipes.length > 0 ? (
                  recipes.map((recipe, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 border-t border-gray-200 hover:bg-gray-100 text-xs"
                    >
                      <div className="px-2 py-1 border-r border-gray-200">
                        {isEditMode ? (
                          <select
                            value={recipe.item_id}
                            onChange={(e) =>
                              handleRecipeChange(
                                index,
                                "item_id",
                                e.target.value
                              )
                            }
                            className="w-full p-1 text-xs border rounded"
                          >
                            <option value="">Select Item</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          items.find((i) => i.id === Number(recipe.item_id))
                            ?.name || "Unknown"
                        )}
                      </div>
                      <div className="px-2 py-1 border-r border-gray-200">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={recipe.quantity}
                            onChange={(e) =>
                              handleRecipeChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="w-full p-1 text-xs border rounded"
                          />
                        ) : (
                          recipe.quantity
                        )}
                      </div>
                      <div className="px-2 py-1 border-r border-gray-200">
                        {isEditMode ? (
                          <select
                            value={recipe.unit_id}
                            onChange={(e) =>
                              handleRecipeChange(
                                index,
                                "unit_id",
                                e.target.value
                              )
                            }
                            className="w-full p-1 text-xs border rounded"
                          >
                            <option value="">Select Unit</option>
                            {units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.symbol}
                              </option>
                            ))}
                          </select>
                        ) : (
                          units.find((i) => i.id === Number(recipe.unit_id))
                            ?.symbol || "Unknown"
                        )}
                      </div>
                      <div className="px-2 py-1">
                        {isEditMode && (
                          <button
                            onClick={() => handleDeleteRecipe(index)}
                            className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-center text-gray-500 text-xs">
                    No recipes added yet
                  </div>
                )}

                {/* Add new recipe row - only visible in edit mode */}
                {isEditMode && (
                  <div className="grid grid-cols-4 border-t border-gray-200 bg-gray-50 text-xs">
                    <div className="px-2 py-1 border-r border-gray-200">
                      <select
                        value={newRecipe.item_id}
                        onChange={(e) =>
                          setNewRecipe({
                            ...newRecipe,
                            item_id: e.target.value,
                          })
                        }
                        className="w-full p-1 text-xs border rounded"
                      >
                        <option value="">Select Item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="px-2 py-1 border-r border-gray-200">
                      <input
                        type="number"
                        value={newRecipe.quantity}
                        onChange={(e) =>
                          setNewRecipe({
                            ...newRecipe,
                            quantity: e.target.value,
                          })
                        }
                        placeholder="Qty"
                        className="w-full p-1 text-xs border rounded"
                      />
                    </div>
                    <div className="px-2 py-1 border-r border-gray-200">
                      <select
                        value={newRecipe.unit_id}
                        onChange={(e) =>
                          setNewRecipe({
                            ...newRecipe,
                            unit_id: e.target.value,
                          })
                        }
                        className="w-full p-1 text-xs border rounded"
                      >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.symbol}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="px-2 py-1">
                      <button
                        onClick={handleAddRecipe}
                        className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditMode ? (
            <div className="flex justify-between mt-2">
              <div className="flex space-x-2">
                <button
                  onClick={onClose}
                  className="bg-gray-400 text-white px-4 py-2 text-sm rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-4 py-2 text-sm rounded-lg"
                >
                  Delete
                </button>
              </div>
              <button
                onClick={handleSave}
                className="bg-[#209528] text-white px-4 py-2 text-sm rounded-lg"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex justify-between mt-2">
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 text-sm rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={handleSave}
                className="bg-[#209528] text-white px-4 py-2 text-sm rounded-lg"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditMenuModal;
