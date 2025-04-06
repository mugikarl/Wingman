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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddMenuCategory = async () => {
    if (!menuCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMenuCategory = async (e) => {
    e.preventDefault();

    if (!menuCategoryName.trim() || selectedIndex === null) return;

    setIsSubmitting(true);

    const menuCategoryId = menuCategories[selectedIndex]?.id;

    if (!menuCategoryId) {
      console.error("Error: No Menu Category ID found!");
      setIsSubmitting(false);
      return;
    }

    const updatedMenuCategoryData = {
      name: menuCategoryName,
    };

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://127.0.0.1:8000/edit-menu-category/${menuCategoryId}/`,
        updatedMenuCategoryData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Menu Category updated successfully!");
      fetchItemData();
      setMenuCategoryName("");
      setIsEditing(false);
      setSelectedIndex(null);
    } catch (error) {
      console.error("Error updating menu category:", error);
      alert("Failed to update menu category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenuCategory = async () => {
    if (selectedIndex === null) return;

    const confirmDelete = window.confirm("Delete category?");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `http://127.0.0.1:8000/delete-menu-category/${menuCategories[selectedIndex].id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchItemData();
      setMenuCategoryName("");
      setIsEditing(false);
      setSelectedIndex(null);
    } catch (error) {
      console.error("Error deleting menu category:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setMenuCategoryName("");
    setIsEditing(false);
    setSelectedIndex(null);
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Manage Menu Categories</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Fixed Input Area */}
          <div className="flex items-center space-x-2 p-4 bg-white border-b">
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
                disabled={isSubmitting}
                className={`bg-[#CC5500] text-white px-3 py-2 rounded-lg ${
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-[#b34600]"
                }`}
              >
                {isSubmitting ? "Adding..." : "Add"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditMenuCategory}
                  disabled={isSubmitting}
                  className={`bg-[#CC5500] text-white px-3 py-2 rounded-lg ${
                    isSubmitting
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-[#b34600]"
                  }`}
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </button>
                <button
                  onClick={handleDeleteMenuCategory}
                  disabled={isDeleting}
                  className={`bg-red-500 text-white px-3 py-2 rounded-lg ${
                    isDeleting
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-red-600"
                  }`}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </>
            )}
          </div>

          {/* Scrollable Table Area */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-sm flex-1 p-4">
            <div className="overflow-y-auto max-h-[calc(100%_-_80px)]">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(menuCategories || []).length > 0 ? (
                    menuCategories.map((category, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } border-b hover:bg-gray-200 group cursor-pointer`}
                        onClick={() => {
                          setMenuCategoryName(category.name);
                          setSelectedIndex(index);
                          setIsEditing(true);
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
                        colSpan="2"
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
      </div>
    </div>
  ) : null;
};

export default NewMenuCategory;
