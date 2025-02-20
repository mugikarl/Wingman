import React, { useState } from "react";
import axios from "axios";

const NewCategory = ({ isOpen, closeModal, items, setItems }) => {
  const [categoryName, setCategoryName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      const response = await axios.post("http://127.0.0.1:8000/add-category/", { name: categoryName });
      setItems((prevItems) => [...prevItems, { ...response.data, category: categoryName }]);
      setCategoryName("");
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim() || selectedIndex === null) return;
    try {
      const updatedItems = [...items];
      updatedItems[selectedIndex].category = categoryName;
      await axios.put(`http://127.0.0.1:8000/update-category/${updatedItems[selectedIndex].id}/`, { name: categoryName });
      setItems(updatedItems);
      setCategoryName("");
      setIsEditing(false);
      setSelectedIndex(null);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (index) => {
    const confirmDelete = window.confirm("Delete category?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/delete-category/${items[index].id}/`);
      setItems((prevItems) => prevItems.filter((_, i) => i !== index));
      if (index === selectedIndex) {
        setCategoryName("");
        setIsEditing(false);
        setSelectedIndex(null);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
        {/* Close Button */}
        <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          x
        </button>

        <h2 className="text-lg font-bold mb-4">Manage Categories</h2>

        {/* Input & Buttons */}
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            placeholder="Enter category"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-1/2 p-2 border rounded-lg"
          />
          {!isEditing ? (
            <button onClick={handleAddCategory} className="bg-blue-500 text-white px-3 py-2 rounded-lg">
              Add
            </button>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-3 py-2 rounded-lg">
                Cancel
              </button>
              <button onClick={handleEditCategory} className="bg-green-500 text-white px-3 py-2 rounded-lg">
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
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setCategoryName(item.category);
                      setSelectedIndex(index);
                      setIsEditing(true);
                    }}
                  >
                    <td className="p-2">{item.category}</td>
                    <td className="p-2">
                      <button onClick={() => handleDeleteCategory(index)} className="bg-red-500 text-white px-2 py-1 rounded">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="p-2 text-center">No Categories Available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : null;
};

export default NewCategory;
