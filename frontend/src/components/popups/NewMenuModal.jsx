import React, { useState } from "react";

const NewMenuModal = ({ onClose, onSave }) => {
  // State for image upload
  const [image, setImage] = useState(null);
  const [itemName, setItemName] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [recipeInputs, setRecipeInputs] = useState(["", "", ""]);
  const [recipes, setRecipes] = useState([]);

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
    const newItem = {
      image,
      name: itemName,
      price: parseFloat(price),
      category,
      recipes,
      status: isAvailable ? "Available" : "Unavailable",
    };
    onSave(newItem); // Pass the new item to the parent component
    onClose(); // Close the modal
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-2/3 max-w-4xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">New Menu</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 p-2 border rounded-lg w-full"
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
                  />
                ))}
              </div>
              <button
                onClick={addRecipe}
                className="bg-[#209528] text-white px-4 py-2 rounded-lg mt-2"
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
                    className="text-red-500"
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

export default NewMenuModal;