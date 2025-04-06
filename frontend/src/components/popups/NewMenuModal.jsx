import React, { useState } from "react";
import axios from "axios";
import { PiArrowsClockwiseLight } from "react-icons/pi";

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
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Add New Menu Item</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Menu Details Section - Left Column */}
            <div className="h-full">
              <div className="bg-white p-4 rounded-lg border h-full flex flex-col">
                <h3 className="text-lg font-medium mb-4">Menu Item Details</h3>

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
                        onClick={() =>
                          document.getElementById("image-upload").click()
                        }
                        className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      >
                        <span className="text-white text-lg">
                          Change Picture
                        </span>
                      </div>
                    </>
                  ) : (
                    <div
                      onClick={() =>
                        document.getElementById("image-upload").click()
                      }
                      className="flex items-center justify-center w-full h-full bg-gray-100 cursor-pointer"
                    >
                      <span className="text-gray-500 text-lg">Add Picture</span>
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

                {/* Item Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter menu item name"
                  />
                </div>

                {/* Price */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter price"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menu Type
                  </label>
                  <select
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Type</option>
                    {menuTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isAvailable}
                        onChange={() => setIsAvailable(true)}
                        className="hidden"
                      />
                      <div
                        className={`w-5 h-5 border rounded-full flex items-center justify-center 
                          ${
                            isAvailable
                              ? "bg-[#CC5500] border-[#b34600]"
                              : "border-gray-400 bg-white"
                          }`}
                      >
                        {isAvailable && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span>Available</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isAvailable}
                        onChange={() => setIsAvailable(false)}
                        className="hidden"
                      />
                      <div
                        className={`w-5 h-5 border rounded-full flex items-center justify-center 
                          ${
                            !isAvailable
                              ? "bg-[#CC5500] border-[#b34600]"
                              : "border-gray-400 bg-white"
                          }`}
                      >
                        {!isAvailable && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span>Unavailable</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients Section - Right Column */}
            <div className="flex flex-col space-y-4">
              {/* Add Recipe Section */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-medium mb-4">Add Ingredients</h3>
                <div className="grid grid-cols-1 gap-3 mb-3">
                  {/* Item Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item
                    </label>
                    <select
                      value={currentRecipe.inventory_id}
                      onChange={(e) =>
                        setCurrentRecipe({
                          ...currentRecipe,
                          inventory_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select Item</option>
                      {inventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Quantity Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={currentRecipe.quantity}
                        onChange={(e) =>
                          setCurrentRecipe({
                            ...currentRecipe,
                            quantity: e.target.value,
                          })
                        }
                        placeholder="Enter quantity"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    {/* Unit Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        value={currentRecipe.unit_id}
                        onChange={(e) =>
                          setCurrentRecipe({
                            ...currentRecipe,
                            unit_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.symbol}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Add Recipe Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddRecipe}
                      className="bg-[#CC5500] text-white px-4 py-2 rounded-md hover:bg-[#b34600]"
                    >
                      Add Ingredient
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipe Table */}
              <div className="bg-white p-4 rounded-lg border flex-grow overflow-hidden">
                <h3 className="text-lg font-medium mb-4">Ingredients List</h3>
                <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
                  {recipes.length > 0 ? (
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                      <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-medium">ITEM NAME</th>
                          <th className="px-4 py-2 font-medium">QTY</th>
                          <th className="px-4 py-2 font-medium">UNIT</th>
                          <th className="px-4 py-2 text-right font-medium">
                            ACTION
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipes.map((recipe, index) => (
                          <tr
                            key={index}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } 
                                border-b hover:bg-gray-200 group`}
                          >
                            <td className="px-4 py-2 font-normal text-gray-700 group-hover:text-gray-900">
                              {recipe.inventory_name}
                            </td>
                            <td className="px-4 py-2 font-normal text-gray-700 group-hover:text-gray-900">
                              {recipe.quantity}
                            </td>
                            <td className="px-4 py-2 font-normal text-gray-700 group-hover:text-gray-900">
                              {recipe.unit}
                            </td>
                            <td className="px-4 py-2 text-right font-normal text-gray-700 group-hover:text-gray-900">
                              <button
                                onClick={() => handleDeleteRecipe(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-4 text-gray-500 italic">
                      No ingredients added yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with save button */}
        <div className="border-t p-4 flex justify-end space-x-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-[#CC5500] text-white hover:bg-[#b34600]"
          >
            Add Menu Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMenuModal;
