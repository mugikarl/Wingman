import React, { useState } from "react";
import axios from "axios";

const NewMenuModal = ({
  onClose,
  onSave,
  categories,
  menuTypes,
  items,
  units,
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
    item_id: "",
    quantity: "",
    unit_id: "",
  });

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    console.log("Frontend file size:", file.size);
    if (file) {
      console.log("Image file selected:", file);
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

    // Prepare menu_items payload (only include item_id, quantity, and unit_id)
    const menuItemsPayload = recipes.map((recipe) => ({
      item_id: recipe.item_id,
      quantity: recipe.quantity,
      unit_id: recipe.unit_id, // Ensure unit_id is passed here
    }));

    // Log the payload for debugging
    console.log("Menu Items Payload:", menuItemsPayload); // Debugging log

    // Add selected recipes to form data
    formData.append("menu_items", JSON.stringify(menuItemsPayload));

    console.log("FormData contents:", formData);

    const token = localStorage.getItem("access_token");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/add-menu/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Fixed the token string interpolation
            "Content-Type": "multipart/form-data", // Important for handling file uploads
          },
        }
      );

      alert("Menu added successfully!");
      onSave(response.data); // Pass the new item to the parent component
      onClose();
    } catch (error) {
      console.error("Error saving menu item:", error.response?.data || error);
      alert("Failed to add menu item.");
    }
  };

  const handleAddRecipe = () => {
    // Check if item_id, quantity, and unit_id are set
    if (
      !currentRecipe.item_id ||
      !currentRecipe.quantity ||
      !currentRecipe.unit_id
    ) {
      alert("Please enter valid item, quantity, and unit of measurement.");
      return;
    }

    // Find the item name for display purposes
    const selectedItem = items.find(
      (item) => item.id === parseInt(currentRecipe.item_id)
    );

    // Find the unit symbol for display purposes
    const selectedUnit = units.find(
      (unit) => unit.id === parseInt(currentRecipe.unit_id)
    );

    // Check if unit_id is correctly set
    console.log("Selected Unit ID:", currentRecipe.unit_id); // Debugging log

    // Create the new recipe object
    const newRecipe = {
      item_id: currentRecipe.item_id,
      item_name: selectedItem ? selectedItem.name : "", // For display only
      quantity: currentRecipe.quantity,
      unit_id: currentRecipe.unit_id, // Ensure unit_id is part of the new recipe
      unit: selectedUnit ? selectedUnit.symbol : "", // For display only
    };

    // Add the new recipe to the recipes list
    setRecipes([...recipes, newRecipe]);

    // Reset the current recipe state after adding
    setCurrentRecipe({
      item_id: "",
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
      <div className="bg-white p-6 rounded-lg shadow-lg w-2/3 max-w-4xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">New Menu</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex space-x-6">
          {/* First Column */}
          <div className="w-1/2">
            {/* Add Photo Section */}
            <div className="h-64 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-4">
              {image ? (
                <img
                  src={URL.createObjectURL(image)} // Preview the selected image
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">📷</span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="mt-2 text-blue-500 cursor-pointer"
              >
                Upload Photo
              </label>
            </div>

            {/* Item Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Item Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="mt-1 p-2 border rounded-lg w-full"
              />
            </div>

            {/* Availability */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Availability
              </label>
              <div className="flex space-x-4 mt-1">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isAvailable}
                    onChange={() => setIsAvailable(true)}
                    className="mr-2"
                  />
                  Available
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isAvailable}
                    onChange={() => setIsAvailable(false)}
                    className="mr-2"
                  />
                  Unavailable
                </label>
              </div>
            </div>
          </div>

          {/* Second Column */}
          <div className="w-1/2">
            {/* Price */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 p-2 border rounded-lg w-full"
              />
            </div>

            {/* Category Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 p-2 border rounded-lg w-full"
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Menu Type
              </label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="mt-1 p-2 border rounded-lg w-full"
              >
                <option value="">Select Type</option>
                {menuTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipes (Menu Items) */}
            <div className="mb-4 max-h-[300px] overflow-y-auto">
              <label className="block text-sm font-medium text-gray-700">
                Recipe (Select Items)
              </label>
              <div className="grid grid-cols-3 gap-4">
                {/* ITEM */}
                <div>
                  <select
                    className="p-2 border rounded-lg w-full"
                    value={currentRecipe.item_id}
                    onChange={(e) =>
                      setCurrentRecipe({
                        ...currentRecipe,
                        item_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* QUANTITY */}
                <div>
                  <input
                    type="number"
                    className="p-2 border rounded-lg w-full"
                    value={currentRecipe.quantity}
                    onChange={(e) =>
                      setCurrentRecipe({
                        ...currentRecipe,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="Quantity"
                  />
                </div>

                {/* UM (Unit of Measurement) */}
                <div>
                  <select
                    className="p-2 border rounded-lg w-full"
                    value={currentRecipe.unit_id}
                    onChange={(e) =>
                      setCurrentRecipe({
                        ...currentRecipe,
                        unit_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select UM</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ADD BUTTON */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddRecipe}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                  Add Recipe
                </button>
              </div>

              {/* Display Added Recipes */}
              <div className="mt-4">
                {recipes.map((recipe, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <span className="mr-2">{recipe.item_name}</span>
                    <span className="mr-2">{recipe.quantity}</span>
                    <span className="mr-2">{recipe.unit}</span>{" "}
                    {/* Use unit instead of unit_id */}
                    <button
                      onClick={() => handleDeleteRecipe(index)}
                      className="text-red-500 ml-2"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-[#209528] text-white px-4 py-2 rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMenuModal;
