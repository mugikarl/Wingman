import React, { useState } from "react";

const EditMenuModal = ({ item, onClose, onSave }) => {
  // State for editable fields
  const [isEditable, setIsEditable] = useState(false);
  const [image, setImage] = useState(item.image || null);
  const [itemName, setItemName] = useState(item.name || "");
  const [isAvailable, setIsAvailable] = useState(item.status === "Available");
  const [price, setPrice] = useState(item.price || "");
  const [category, setCategory] = useState(item.category || "");
  const [recipeInputs, setRecipeInputs] = useState(["", "", ""]);
  const [recipes, setRecipes] = useState(item.recipes || []);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle recipe input change
  const handleRecipeInputChange = (index, value) => {
    const newInputs = [...recipeInputs];
    newInputs[index] = value;
    setRecipeInputs(newInputs);
  };

  // Add recipe
  const addRecipe = () => {
    if (recipeInputs.some((input) => input.trim() === "")) return; // Ensure all fields are filled
    setRecipes([...recipes, recipeInputs.join(", ")]);
    setRecipeInputs(["", "", ""]); // Reset inputs
  };

  // Delete recipe
  const deleteRecipe = (index) => {
    const newRecipes = recipes.filter((_, i) => i !== index);
    setRecipes(newRecipes);
  };

  // Handle save
  const handleSave = () => {
    const updatedItem = {
      ...item,
      image,
      name: itemName,
      price: parseFloat(price),
      category,
      recipes,
      status: isAvailable ? "Available" : "Unavailable",
    };
    onSave(updatedItem); // Pass the updated item to the parent component
    onClose(); // Close the modal
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-2/3 max-w-4xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Menu Item</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsEditable(!isEditable)}
              className="bg-[#209528] text-white px-4 py-2 rounded-lg"
            >
              {isEditable ? "Cancel Edit" : "Edit"}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex space-x-6">
          {/* First Column */}
          <div className="w-1/2">
            {/* Add Photo Section */}
            <div className="h-64 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-4">
              {image ? (
                <img
                  src={image}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <span className="text-4xl">📷</span>
                  <span className="text-gray-500">Add Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={!isEditable}
              />
              <label
                htmlFor="image-upload"
                className={`mt-2 text-blue-500 cursor-pointer ${
                  !isEditable ? "opacity-50 cursor-not-allowed" : ""
                }`}
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
                disabled={!isEditable}
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
                    disabled={!isEditable}
                  />
                  Available
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isAvailable}
                    onChange={() => setIsAvailable(false)}
                    className="mr-2"
                    disabled={!isEditable}
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
                disabled={!isEditable}
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 p-2 border rounded-lg w-full"
                disabled={!isEditable}
              >
                <option value="">Select Category</option>
                <option value="Ala Carte">Ala Carte</option>
                <option value="Combo">Combo</option>
              </select>
            </div>

            {/* Recipe */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Recipe
              </label>
              <div className="flex space-x-2">
                {recipeInputs.map((input, index) => (
                  <input
                    key={index}
                    type="text"
                    value={input}
                    onChange={(e) =>
                      handleRecipeInputChange(index, e.target.value)
                    }
                    className="mt-1 p-2 border rounded-lg w-full"
                    placeholder={`Ingredient ${index + 1}`}
                    disabled={!isEditable}
                  />
                ))}
              </div>
              <button
                onClick={addRecipe}
                className={`bg-[#209528] text-white px-4 py-2 rounded-lg mt-2 ${
                  !isEditable ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!isEditable}
              >
                Add Recipe
              </button>
            </div>

            {/* Display Recipes */}
            <div className="mb-4">
              {recipes.map((recipe, index) => (
                <div key={index} className="flex justify-between items-center mb-2">
                  <span>{recipe}</span>
                  <button
                    onClick={() => deleteRecipe(index)}
                    className={`text-red-500 ${
                      !isEditable ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={!isEditable}
                  >
                    Delete
                  </button>
                </div>
              ))}
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

export default EditMenuModal;