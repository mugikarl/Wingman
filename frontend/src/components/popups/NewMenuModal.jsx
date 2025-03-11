import React, { useState } from "react";
import axios from "axios";

const NewMenuModal = ({
  onClose,
  onSave,
  categories,
  menuTypes,
  inventory,
  units,
  fetchMenus,
}) => {
  // State for form data
  const [image, setImage] = useState(null);
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(""); // For category dropdown
  const [typeId, setTypeId] = useState(""); // For type dropdown
  const [isAvailable, setIsAvailable] = useState(true);

  // State for recipe data (storing added recipes)
  const [recipes, setRecipes] = useState([]); // Stores added recipes with item, quantity, and unit_id
  const [currentRecipe, setCurrentRecipe] = useState({
    inventory_id: "",
    quantity: "",
    unit_id: "",
  });

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file); // Set the selected image file
    }
  };

  // Handle save
  const handleSave = async () => {
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
    formData.append("image", image); // Append the image file
    formData.append("name", itemName);
    formData.append("price", price);
    formData.append("category_id", categoryId); // Category ID
    formData.append("type_id", typeId); // Type ID
    formData.append("status_id", isAvailable ? "1" : "2");

    // Prepare menu_items payload (only include inventory_id, quantity, and unit_id)
    const menuItemsPayload = recipes.map((recipe) => ({
      inventory_id: recipe.inventory_id,
      quantity: recipe.quantity,
      unit_id: recipe.unit_id, // Ensure unit_id is passed here
    }));

    // Add selected recipes to form data
    formData.append("menu_ingredients", JSON.stringify(menuItemsPayload));

    const token = localStorage.getItem("access_token");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/add-menu/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data", // Important for handling file uploads
          },
        }
      );

      alert("Menu added successfully!");
      fetchMenus();
      onClose();
    } catch (error) {
      console.error("Error saving menu item:", error.response?.data || error);
      alert("Failed to add menu item.");
    }
  };

  // Handle adding a new recipe
  const handleAddRecipe = () => {
    if (
      !currentRecipe.inventory_id ||
      !currentRecipe.quantity ||
      !currentRecipe.unit_id
    ) {
      alert("Please enter valid item, quantity, and unit of measurement.");
      return;
    }

    // Find the item name for display purposes
    const selectedItem = inventory.find(
      (inventory) => inventory.id === parseInt(currentRecipe.inventory_id)
    );

    // Find the unit symbol for display purposes
    const selectedUnit = units.find(
      (unit) => unit.id === parseInt(currentRecipe.unit_id)
    );

    // Create the new recipe object
    const newRecipe = {
      inventory_id: currentRecipe.inventory_id,
      inventory_name: selectedItem ? selectedItem.name : "", // For display only
      quantity: currentRecipe.quantity,
      unit_id: currentRecipe.unit_id, // Ensure unit_id is part of the new recipe
      unit: selectedUnit ? selectedUnit.symbol : "", // For display only
      price: selectedItem ? selectedItem.price : 0, // Use item price for cost
    };

    // Add the new recipe to the recipes list
    setRecipes([...recipes, newRecipe]);

    // Reset the current recipe state after adding
    setCurrentRecipe({
      inventory_id: "",
      quantity: "",
      unit_id: "",
    });
  };

  // Handle recipe deletion
  const handleDeleteRecipe = (index) => {
    const updatedRecipes = recipes.filter((_, i) => i !== index);
    setRecipes(updatedRecipes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-lg w-[90%] sm:w-[80%] md:w-[65%] lg:w-[50%] max-w-2xl mx-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">New Menu</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        {/* Modal Content - Restructured */}
        <div className="flex flex-col">
          {/* Upload Photo Section */}
          <div className="relative group h-48 border-2 border-dashed border-gray-300 mb-3 w-full">
            {image ? (
              <>
                <img
                  src={URL.createObjectURL(image)}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
                <div
                  onClick={() =>
                    document.getElementById("image-upload").click()
                  }
                  className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                >
                  <span className="text-white text-lg">Change Picture</span>
                </div>
              </>
            ) : (
              // Initially shows a grey area with "Add Picture" so the user can click to upload.
              <div
                onClick={() => document.getElementById("image-upload").click()}
                className="flex items-center justify-center w-full h-full bg-gray-800 bg-opacity-50 cursor-pointer"
              >
                <span className="text-white text-lg">Add Picture</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
          </div>

          {/* Form Fields - In a grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {/* Item Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Item Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="mt-1 p-1.5 text-sm border rounded-lg w-full"
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
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 p-1.5 text-sm border rounded-lg w-full"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 p-1.5 text-sm border rounded-lg w-full"
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
                onChange={(e) => setTypeId(e.target.value)}
                className="mt-1 p-1.5 text-sm border rounded-lg w-full"
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
                  onChange={() => setIsAvailable(true)}
                  className="mr-1"
                />
                <span className="text-sm">Available</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!isAvailable}
                  onChange={() => setIsAvailable(false)}
                  className="mr-1"
                />
                <span className="text-sm">Unavailable</span>
              </label>
            </div>
          </div>

          {/* Add Recipe Section */}
          <div className="mb-3">
            <h3 className="text-sm font-semibold mb-1">Add Recipe</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Item Dropdown */}
              <select
                value={currentRecipe.inventory_id}
                onChange={(e) =>
                  setCurrentRecipe({
                    ...currentRecipe,
                    inventory_id: e.target.value,
                  })
                }
                className="p-1.5 text-sm border rounded-lg"
              >
                <option value="">Select Item</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              {/* Quantity Input */}
              <input
                type="number"
                value={currentRecipe.quantity}
                onChange={(e) =>
                  setCurrentRecipe({
                    ...currentRecipe,
                    quantity: e.target.value,
                  })
                }
                placeholder="Qty"
                className="p-1.5 text-sm border rounded-lg"
              />

              {/* Unit Dropdown */}
              <select
                value={currentRecipe.unit_id}
                onChange={(e) =>
                  setCurrentRecipe({
                    ...currentRecipe,
                    unit_id: e.target.value,
                  })
                }
                className="p-1.5 text-sm border rounded-lg"
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.symbol}
                  </option>
                ))}
              </select>

              {/* Add Recipe Button */}
              <button
                onClick={handleAddRecipe}
                className="bg-green-500 text-white px-2 py-1 text-sm rounded-lg"
              >
                Add
              </button>
            </div>
          </div>

          {/* Recipe Table with fixed header and scrollable body */}
          <div className="mb-3">
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
              <div className="max-h-12 overflow-y-auto">
                {recipes.length > 0 ? (
                  recipes.map((recipe, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 border-t border-gray-200 hover:bg-gray-100 text-xs"
                    >
                      <div className="px-2 py-1 border-r border-gray-200 truncate">
                        {recipe.inventory_name}
                      </div>
                      <div className="px-2 py-1 border-r border-gray-200">
                        {recipe.quantity}
                      </div>
                      <div className="px-2 py-1 border-r border-gray-200">
                        {recipe.unit}
                      </div>
                      <div className="px-2 py-1">
                        <button
                          onClick={() => handleDeleteRecipe(index)}
                          className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-center text-gray-500 text-xs">
                    No recipes added yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-2">
            <button
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 text-sm rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-[#209528] text-white px-4 py-2 text-sm rounded-lg"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMenuModal;
