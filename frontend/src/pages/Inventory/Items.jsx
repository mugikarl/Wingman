import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Datepicker } from "flowbite-react";
import NewItem from "../../components/popups/NewItem";
import Table from "../../components/tables/Table";
import axios from "axios";
import EditItem from "../../components/popups/EditItem";
import NewCategory from "../../components/popups/NewCategory";
import LoadingScreen from "../../components/popups/LoadingScreen"; // Import the LoadingScreen component
import { FaBasketShopping, FaRegRectangleList  } from "react-icons/fa6";

const Items = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const closeCategoryModal = () => setIsCategoryModalOpen(false);

  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const openEditModal = (item) => {
    setSelectedItem(item); // Set the selected item
    setIsEditModalOpen(true); // Open the edit modal
  };

  const closeEditModal = () => {
    setSelectedItem(null); // Clear the selected item
    setIsEditModalOpen(false); // Close the edit modal
  };

  // Fetch item data from the backend API
  const fetchItemData = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-item-data/"
      );
      setItems(response.data.items); // ✅ Correctly access items
      setCategories(response.data.categories || []);
      setUnits(response.data.units || []);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemData();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#E2D6D5] flex">
      <div className="flex-grow p-6">
        <div className="flex flex-col space-y-4 mb-4">
          
          <div className="w-full">
            <div className="flex justify-between items-center w-full space-x-4">
              <div className="flex w-[400px]">
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-grow p-2 border rounded-lg shadow"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={openModal}
                  className="flex items-center bg-gradient-to-r from-[#864926] to-[#a95a00] text-white rounded-md shadow-md hover:from-[#864926] hover:to-[#864926] transition-colors duration-200 w-48 overflow-hidden"
            >
              {/* Image Side */}
              <div className="flex items-center justify-center bg-[#864926] p-3">
                    <FaBasketShopping className="w-5 h-5 text-white" />
              </div>
                  <span className="flex-1 text-left pl-3">New Item</span>
                </button>
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="flex justify-between items-center w-full">
              <div className="flex space-x-4">
                <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[12%]">
                  Meat
                </button>
                <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[12%]">
                  Beverages
                </button>
                <button className="flex items-center justify-center bg-yellow-500 text-white p-2 rounded-lg shadow min-w-[11%]">
                  Spices
                </button>
                <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[11%]">
                  Blabla
                </button>
              </div>
              {/* New Category button */}
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center bg-gradient-to-r from-[#864926] to-[#a95a00] text-white rounded-md shadow-md hover:from-[#864926] hover:to-[#864926] transition-colors duration-200 w-48 overflow-hidden"
            >
              {/* Image Side */}
              <div className="flex items-center justify-center bg-[#864926] p-3">
                 <FaRegRectangleList className="w-5 h-5 text-white" />
              </div>
                <span className="flex-1 text-left pl-3">New Category</span>
              </button>
            </div>
          </div>
        </div>
        {/* Table */}
        {loading ? (
          <div className="w-full flex justify-center items-center">
            <LoadingScreen /> {/* Display the LoadingScreen component */}
          </div>
        ) : (
          <Table
            columns={["ID", "ITEM NAME", "UNIT", "CATEGORY", "STOCK TRIGGER"]}
            data={items.map((item) => {
              const unit = units.find((u) => u.id === item.measurement);
              const category = categories.find((c) => c.id === item.category);

              return [
                item.id,
                item.name,
                unit ? unit.symbol : "",
                category ? category.name : "",
                item.stock_trigger,
              ];
            })}
            rowOnClick={(rowIndex) => openEditModal(items[rowIndex])}
          />
        )}

        {/* New Item Modal */}
        <NewItem
          isOpen={isModalOpen}
          closeModal={closeModal}
          fetchItemData={fetchItemData}
          categories={categories}
          units={units}
        />
        <EditItem
          isOpen={isEditModalOpen}
          closeModal={closeEditModal}
          item={selectedItem}
          fetchItemData={fetchItemData}
          units={units}
          categories={categories}
        />
        <NewCategory
          isOpen={isCategoryModalOpen}
          closeModal={closeCategoryModal}
          fetchItemData={fetchItemData}
          categories={categories}
        />
      </div>
    </div>
  );
};

export default Items;