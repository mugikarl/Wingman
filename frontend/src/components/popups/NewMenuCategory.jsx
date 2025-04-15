import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { useModal } from "../utils/modalUtils";

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
  const [addingText, setAddingText] = useState("Add");
  const [updatingText, setUpdatingText] = useState("Update");
  const [deletingDots, setDeletingDots] = useState("");
  const [localCategories, setLocalCategories] = useState([]);

  const { alert, confirm } = useModal();

  // Copy menuCategories to localCategories for local management
  useEffect(() => {
    if (menuCategories.length > 0) {
      setLocalCategories([...menuCategories]);
    }
  }, [menuCategories]);

  // Sort categories alphabetically by name
  const sortedCategories = [...localCategories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // Handle loading text animations
  useEffect(() => {
    let loadingInterval;

    if (isSubmitting || isDeleting) {
      let dotCount = 0;
      loadingInterval = setInterval(() => {
        const dots = ".".repeat(dotCount % 4);

        if (isSubmitting && !isEditing) {
          setAddingText(`Adding${dots}`);
        } else if (isSubmitting && isEditing) {
          setUpdatingText(`Updating${dots}`);
        }

        if (isDeleting) {
          setDeletingDots(dots);
        }

        dotCount++;
      }, 500);
    } else {
      setAddingText("Add");
      setUpdatingText("Update");
      setDeletingDots("");
    }

    return () => {
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [isSubmitting, isEditing, isDeleting]);

  const handleAddMenuCategory = async () => {
    if (!menuCategoryName.trim()) return;

    setIsSubmitting(true);
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

      // Add new category to local state immediately
      if (response.data && response.data.id) {
        const newCategory = response.data;
        setLocalCategories((prev) => [...prev, newCategory]);
      }

      // Reset form
      setMenuCategoryName("");

      // Trigger background fetch without waiting for it
      setTimeout(() => {
        fetchItemData();
      }, 0);
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

    const menuCategoryId = sortedCategories[selectedIndex]?.id;

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

      // Update category in local state immediately
      const updatedCategories = localCategories.map((cat) =>
        cat.id === menuCategoryId ? { ...cat, name: menuCategoryName } : cat
      );
      setLocalCategories(updatedCategories);

      // Reset form
      setMenuCategoryName("");
      setIsEditing(false);
      setSelectedIndex(null);

      alert("Menu Category updated successfully!", "Success");

      // Trigger background fetch without waiting for it
      setTimeout(() => {
        fetchItemData();
      }, 0);
    } catch (error) {
      console.error("Error updating menu category:", error);
      await alert("Failed to update menu category.", "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenuCategory = async () => {
    if (selectedIndex === null) return;

    const confirmDelete = await confirm(
      "Are you sure you want to delete this category?",
      "Delete Category"
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access_token");
      const categoryId = sortedCategories[selectedIndex].id;

      await axios.delete(
        `http://127.0.0.1:8000/delete-menu-category/${categoryId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Remove category from local state immediately
      const updatedCategories = localCategories.filter(
        (cat) => cat.id !== categoryId
      );
      setLocalCategories(updatedCategories);

      // Reset form
      setMenuCategoryName("");
      setIsEditing(false);
      setSelectedIndex(null);

      // Trigger background fetch without waiting for it
      setTimeout(() => {
        fetchItemData();
      }, 0);
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
      <div className="bg-white rounded-lg shadow-lg w-[480px] h-[500px] flex flex-col">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Input Area */}
          <div className="flex items-center space-x-2 p-4 bg-white border-b">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Enter Category"
                value={menuCategoryName}
                onChange={(e) => setMenuCategoryName(e.target.value)}
                className="w-full p-2 pr-10 border rounded-lg"
                style={{ paddingRight: "2.5rem" }}
              />
              {menuCategoryName && (
                <button
                  onClick={handleCancelEdit}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <IoMdClose size={16} />
                </button>
              )}
            </div>
            {!isEditing ? (
              <button
                onClick={handleAddMenuCategory}
                disabled={isSubmitting}
                className={`bg-green-500 text-white px-3 py-2 rounded-lg h-10 w-24 flex-shrink-0 ${
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-green-600"
                }`}
              >
                {addingText}
              </button>
            ) : (
              <>
                <button
                  onClick={handleEditMenuCategory}
                  disabled={isSubmitting}
                  className={`bg-green-500 text-white px-3 py-2 rounded-lg h-10 w-28 flex-shrink-0 ${
                    isSubmitting
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-green-600"
                  }`}
                >
                  {updatingText}
                </button>
                <button
                  onClick={handleDeleteMenuCategory}
                  disabled={isDeleting}
                  className={`bg-red-500 text-white w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDeleting
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-red-600"
                  }`}
                  title="Delete"
                >
                  {isDeleting ? deletingDots : <FaTrash className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>

          {/* Scrollable Table Area */}
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full overflow-y-auto">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-sm text-white uppercase bg-[#CC5500] sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.length > 0 ? (
                    sortedCategories.map((category, index) => (
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
                        colSpan="1"
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
