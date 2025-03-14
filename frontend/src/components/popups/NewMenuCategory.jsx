import React, { useState } from "react";
import axios from "axios";

const NewMenuCategory = ({
  isOpen,
  onClose,
  menuCategories = [],
  fetchItemData,
}) => {
  const [menuCategoryName, setMenuCategoryName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddMenuCategory = async () => {
    if (!menuCategoryName.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://127.0.0.1:8000/add-menu-category/",
        { name: menuCategoryName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchItemData();
      setMenuCategoryName("");
    } catch (error) {
      console.error("Error adding menu category:", error);
    }
  };
  const handleEditMenuCategory = async (e) => {
    e.preventDefault();

    if (!menuCategoryName.trim() || selectedIndex === null) return;

    const menuCategoryId = menuCategories[selectedIndex]?.id; // Get the actual ID
    console.log("Editing Menu Category ID:", menuCategoryId); // ✅ Debugging log

    if (!menuCategoryId) {
      console.error("Error: No Menu Category ID found!");
      return;
    }

    const updatedMenuCategoryData = {
      name: menuCategoryName, // Send the updated category name
    };

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://127.0.0.1:8000/edit-menu-category/${menuCategoryId}/`, // ✅ API endpoint for updating category
        updatedMenuCategoryData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Menu Category updated successfully!");
      fetchItemData((prevMenuCategories) =>
        prevMenuCategories.map((category, index) =>
          index === selectedIndex
            ? { ...category, name: menuCategoryName }
            : category
        )
      ); // Refresh categories
      setMenuCategoryName("");
      setIsEditing(false);
      setSelectedIndex(null); // Close modal if applicable
    } catch (error) {
      console.error("Error updating menu category:", error);
      alert("Failed to update menu category.");
    }
  };

  const handleDeleteMenuCategory = async (index) => {
    const confirmDelete = window.confirm("Delete category?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `http://127.0.0.1:8000/delete-menu-category/${menuCategories[index].id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchItemData((prevItems) => prevItems.filter((_, i) => i !== index));
      if (index === selectedIndex) {
        setMenuCategoryName("");
        setIsEditing(false);
        setSelectedIndex(null);
      }
    } catch (error) {
      console.error("Error deleting menu category:", error);
    }
  };
  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-4">Manage Categories</h2>
        {/* Input & Buttons */}
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            placeholder="Enter category"
            value={menuCategoryName}
            onChange={(e) => setMenuCategoryName(e.target.value)}
            className="w-1/2 p-2 border rounded-lg"
          />
          {!isEditing ? (
            <button
              onClick={handleAddMenuCategory}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg"
            >
              Add
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-3 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditMenuCategory}
                className="bg-green-500 text-white px-3 py-2 rounded-lg"
              >
                Update
              </button>
            </>
          )}
        </div>
        {/* Scrollable Table */}
        <div className="max-h-60 overflow-y-auto border rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-200">
              <tr>
                <th className="p-2">Category</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(menuCategories || []).length > 0 ? (
                menuCategories.map((category, index) => (
                  <tr
                    key={index}
                    className="border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      console.log("Clicked Category:", category); // Debugging log
                      console.log("Category ID:", category.id);
                      setMenuCategoryName(category.name);
                      setSelectedIndex(index);
                      setIsEditing(true);
                    }}
                  >
                    <td className="p-2">{category.name}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDeleteMenuCategory(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="p-2 text-center">
                    No Categories Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : null;
};

export default NewMenuCategory;
