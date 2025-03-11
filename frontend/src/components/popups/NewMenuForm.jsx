import React, { useState } from "react";
import axios from "axios";

const NewMenuForm = ({
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
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // State for recipe data
  const [recipes, setRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState({
    inventory_id: "",
    quantity: "",
    unit_id: "",
  });

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
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
    formData.append("image", image);
    formData.append("name", itemName);
    formData.append("price", price);
    formData.append("category_id", categoryId);
    formData.append("type_id", typeId);
    formData.append("status_id", isAvailable ? "1" : "2");

    const menuItemsPayload = recipes.map((recipe) => ({
      inventory_id: recipe.inventory_id,
      quantity: recipe.quantity,
      unit_id: recipe.unit_id,
    }));

    formData.append("menu_ingredients", JSON.stringify(menuItemsPayload));

    const token = localStorage.getItem("access_token");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/add-menu/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Menu added successfully!");
      fetchMenus();
      // Reset form
      setImage(null);
      setItemName("");
      setPrice("");
      setCategoryId("");
      setTypeId("");
      setIsAvailable(true);
      setRecipes([]);
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

    const selectedItem = inventory.find(
      (inventory) => inventory.id === parseInt(currentRecipe.inventory_id)
    );

    const selectedUnit = units.find(
      (unit) => unit.id === parseInt(currentRecipe.unit_id)
    );

    const newRecipe = {
      inventory_id: currentRecipe.inventory_id,
      inventory_name: selectedItem ? selectedItem.name : "",
      quantity: currentRecipe.quantity,
      unit_id: currentRecipe.unit_id,
      unit: selectedUnit ? selectedUnit.symbol : "",
      price: selectedItem ? selectedItem.price : 0,
    };

    setRecipes([...recipes, newRecipe]);
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
    <div className="flex flex-col">
      {/* Upload Photo Section */}
      <div className="relative group h-48 border-2 border-dashed border-gray-300 mb-4 w-full">
        {image ? (
          <>
            <img
              src={URL.createObjectURL(image)}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
            <div
              onClick={() => document.getElementById("image-upload").click()}
              className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            >
              <span className="text-white text-lg">Change Picture</span>
            </div>
          </>
        ) : (
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

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
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
        <div>
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
        <div>
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
        <div>
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
            <span className="text-sm">Available</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={!isAvailable}
              onChange={() => setIsAvailable(false)}
              className="mr-2"
            />
            <span className="text-sm">Unavailable</span>
          </label>
        </div>
      </div>

      {/* Add Recipe Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Add Recipe</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select
            value={currentRecipe.inventory_id}
            onChange={(e) =>
              setCurrentRecipe({
                ...currentRecipe,
                inventory_id: e.target.value,
              })
            }
            className="p-2 border rounded-lg"
          >
            <option value="">Select Item</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
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
            className="p-2 border rounded-lg"
          />
          <select
            value={currentRecipe.unit_id}
            onChange={(e) =>
              setCurrentRecipe({
                ...currentRecipe,
                unit_id: e.target.value,
              })
            }
            className="p-2 border rounded-lg"
          >
            <option value="">Select Unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.symbol}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddRecipe}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            Add
          </button>
        </div>
      </div>

      {/* Recipe Table */}
      <div className="mb-4">
        <div className="border border-gray-200 rounded">
          <div className="grid grid-cols-4 bg-[#FFCF03] font-semibold text-gray-700 text-sm">
            <div className="px-2 py-2 border-r border-gray-200">ITEM NAME</div>
            <div className="px-2 py-2 border-r border-gray-200">QTY</div>
            <div className="px-2 py-2 border-r border-gray-200">UNIT</div>
            <div className="px-2 py-2">ACTION</div>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {recipes.length > 0 ? (
              recipes.map((recipe, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 border-t border-gray-200 hover:bg-gray-100 text-sm"
                >
                  <div className="px-2 py-2 border-r border-gray-200 truncate">
                    {recipe.inventory_name}
                  </div>
                  <div className="px-2 py-2 border-r border-gray-200">
                    {recipe.quantity}
                  </div>
                  <div className="px-2 py-2 border-r border-gray-200">
                    {recipe.unit}
                  </div>
                  <div className="px-2 py-2">
                    <button
                      onClick={() => handleDeleteRecipe(index)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2 text-center text-gray-500 text-sm">
                No recipes added yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="bg-[#209528] text-white px-4 py-2 rounded-lg w-full"
      >
        Save
      </button>
    </div>
  );
};

export default NewMenuForm;