import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Datepicker } from "flowbite-react";
import NewItem from "../../components/popups/NewItem";
import Table from "../../components/tables/Table";
import axios from "axios";
import EditItem from "../../components/popups/EditItem";
import NewCategory from "../../components/popups/NewCategory";
import LoadingScreen from "../../components/popups/LoadingScreen";
import ManageItems from "../../components/popups/ManageItems";
import { FaBasketShopping, FaRegRectangleList } from "react-icons/fa6";
import { PiBasket, PiMagnifyingGlass } from "react-icons/pi";

const Items = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isManageItemsOpen, setIsManageItemsOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const closeCategoryModal = () => setIsCategoryModalOpen(false);

  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const openEditModal = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedItem(null);
    setIsEditModalOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Fetch item data from the backend API
  const fetchItemData = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-items-page-data/"
      );
      setItems(response.data.items);
      setCategories(response.data.categories || []);
      setUnits(response.data.units || []);
    } catch (error) {
      console.error("Error fetching item data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemData();
  }, []);

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(searchLower)) ||
      (item.id && item.id.toString().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen w-full bg-[#fcf4dc] flex">
      <div className="flex-grow p-6">
        <div className="flex flex-col space-y-4 mb-4">
          {/* Search Bar - Updated to match Order.jsx */}
          <div className="flex w-[400px]">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <PiMagnifyingGlass className="w-5 h-5 text-gray-500" />
              </div>
              <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                <span className="text-gray-400">|</span>
              </div>
              <input
                type="text"
                placeholder="Search by item name..."
                className="w-full pl-14 p-2 border rounded-lg shadow"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full">
            <div className="flex justify-start gap-x-2 items-center w-full">
              {/* <button
                onClick={openModal}
                className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
              >
                <div className="flex items-center justify-center border-r p-3">
                  <FaBasketShopping className="w-5 h-5 text-[#CC5500]" />
                </div>
                <span className="flex-1 text-left pl-3">New Item</span>
              </button>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
              >
                <div className="flex items-center justify-center border-r p-3">
                  <FaRegRectangleList className="w-5 h-5 text-[#CC5500]" />
                </div>
                <span className="flex-1 text-left pl-3">New Category</span>
              </button> */}
              {/* Manage Items Button */}
              <button
                onClick={() => setIsManageItemsOpen(true)}
                className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
              >
                <div className="flex items-center justify-center border-r p-3">
                  <PiBasket className="w-5 h-5 text-[#CC5500]" />
                </div>
                <span className="flex-1 text-left pl-3">Manage Items</span>
              </button>
            </div>
          </div>
        </div>

        {/* Show search results info if searching */}
        {searchQuery && (
          <div className="mb-2 text-sm text-gray-600">
            Showing {filteredItems.length} of {items.length} items for "
            {searchQuery}"
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="w-full flex justify-center items-center">
            <LoadingScreen />
          </div>
        ) : (
          <Table
            columns={["ID", "ITEM NAME", "UNIT", "CATEGORY", "STOCK TRIGGER"]}
            data={filteredItems.map((item) => {
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
            rowOnClick={(rowIndex) => openEditModal(filteredItems[rowIndex])}
          />
        )}

        {/* Modals */}
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
        <ManageItems
          isOpen={isManageItemsOpen}
          onClose={() => setIsManageItemsOpen(false)}
          categories={categories}
          units={units}
          fetchItemData={fetchItemData}
        />
      </div>
    </div>
  );
};

export default Items;
