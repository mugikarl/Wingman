import React, { useState, useEffect } from "react";
import ItemBox from "../../components/tables/ItemBox";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import OrderSummary from "../../components/panels/OrderSummary";
import { useLocation } from "react-router-dom";

const Order = () => {
  // Modal and dropdown states
  const [selectedItems, setSelectedItems] = useState([]); // starts empty
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [selectedMenuType, setSelectedMenuType] = useState(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState(null);
  // Active section: "alaCarte" or "unliWings"
  const [activeSection, setActiveSection] = useState("alaCarte");
  // For Unli orders, track the current order number (starts at 1)
  const [currentUnliOrderNumber, setCurrentUnliOrderNumber] = useState(1);

  // Data states (menu data only)
  const [menuItems, setMenuItems] = useState([]);
  const [menuTypes, setMenuTypes] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuStatuses, setMenuStatuses] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [inStoreCategories, setInStoreCategories] = useState([]);
  const [employees, setEmployees] = useState([]);

  const location = useLocation();

  // Fetch menu data only.
  const fetchMenuData = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/fetch-order-data/"
      );
      setMenuItems(response.data.menu_items || []);
      setMenuTypes(response.data.menu_types || []);
      setMenuCategories(response.data.menu_categories || []);
      setMenuStatuses(response.data.menu_statuses || []);
      setDiscounts(response.data.discounts || []);
      setPaymentMethods(response.data.paymentMethods || []);
      setInStoreCategories(response.data.instore_categories || []);
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.log("Error fetching menu data: ", error);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  // Set default selected menu type to "In‑Store" when menuTypes are loaded.
  useEffect(() => {
    if (menuTypes.length > 0 && !selectedMenuType) {
      const inStoreType = menuTypes.find((type) => type.id === 1);
      setSelectedMenuType(inStoreType);
    }
  }, [menuTypes, selectedMenuType]);

  // When menu type changes to a non‑In‑Store type, clear order details.
  useEffect(() => {
    if (selectedMenuType && selectedMenuType.id !== 1) {
      setSelectedItems([]);
      setActiveSection("alaCarte");
    }
  }, [selectedMenuType]);

  const handleTypeFilter = (type) => {
    if (
      selectedMenuType &&
      selectedMenuType.id !== type.id &&
      selectedItems.length > 0
    ) {
      const ok = window.confirm(
        "Changing types will remove the current items in the order summary. Proceed?"
      );
      if (!ok) return;
      setSelectedItems([]);
    }
    setSelectedMenuType(type);
    if (type.id !== 1) {
      setActiveSection("alaCarte");
    }
  };

  const handleCategoryFilter = (cat) => {
    setSelectedMenuCategory(cat);
    setIsCatDropdownOpen(false);
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesType = selectedMenuType
      ? item.type_id === selectedMenuType.id
      : true;
    const matchesCategory =
      selectedMenuCategory && selectedMenuCategory.id !== 0
        ? item.category_id === selectedMenuCategory.id
        : true;
    return matchesType && matchesCategory;
  });

  const sortedFilteredMenuItems = filteredMenuItems.slice().sort((a, b) => {
    if (a.status_id === 1 && b.status_id !== 1) return -1;
    if (a.status_id !== 1 && b.status_id === 1) return 1;
    return 0;
  });

  const getMenuTypeButtonStyles = (type) => {
    switch (type.id) {
      case 1:
        return "bg-[#E88504] text-white";
      case 2:
        return "bg-green-500 text-white";
      case 3:
        return "bg-pink-500 text-white";
      default:
        return "bg-[#E88504] text-white";
    }
  };

  const getMenuLeftContainerBg = (type) => {
    switch (type.id) {
      case 1:
        return "bg-[#D87A03]";
      case 2:
        return "bg-green-600";
      case 3:
        return "bg-pink-600";
      default:
        return "bg-[#D87A03]";
    }
  };

  const handleAddItem = (item) => {
    if (item.status_id === 2) {
      return alert("This item is unavailable!");
    }

    if (selectedMenuType?.id === 1) {
      let defaultCategory, defaultDiscount;
      if (activeSection === "unliWings") {
        if (
          item.category_id === 1 ||
          item.category_id === 5 ||
          item.category_id === 4
        ) {
          if (
            item.category_id === 4 &&
            !item.name.toLowerCase().includes("rice")
          ) {
            return alert(
              "Only Rice items can be added for Sides in the Unli section."
            );
          }
          defaultCategory = "Unli Wings";
          defaultDiscount = 0;
        } else {
          return alert(
            "Only Wings, Drinks, or Sides items can be added to the Unli section."
          );
        }
      } else {
        defaultCategory = "Ala Carte";
        defaultDiscount = 0;
      }

      const existingItem = selectedItems.find((i) => {
        if (activeSection === "unliWings") {
          return (
            i.id === item.id &&
            i.instoreCategory === defaultCategory &&
            i.discount === defaultDiscount &&
            i.orderNumber === currentUnliOrderNumber
          );
        }
        return (
          i.id === item.id &&
          i.instoreCategory === defaultCategory &&
          i.discount === defaultDiscount
        );
      });

      if (existingItem) {
        setSelectedItems(
          selectedItems.map((i) => {
            if (activeSection === "unliWings") {
              return i.id === item.id &&
                i.instoreCategory === defaultCategory &&
                i.discount === defaultDiscount &&
                i.orderNumber === currentUnliOrderNumber
                ? { ...i, quantity: i.quantity + 1 }
                : i;
            }
            return i.id === item.id &&
              i.instoreCategory === defaultCategory &&
              i.discount === defaultDiscount
              ? { ...i, quantity: i.quantity + 1 }
              : i;
          })
        );
      } else {
        const newItem =
          activeSection === "unliWings"
            ? {
                ...item,
                quantity: 1,
                instoreCategory: defaultCategory,
                discount: defaultDiscount,
                orderNumber: currentUnliOrderNumber,
              }
            : {
                ...item,
                quantity: 1,
                instoreCategory: defaultCategory,
                discount: defaultDiscount,
              };
        setSelectedItems([...selectedItems, newItem]);
      }
    } else {
      const existingItem = selectedItems.find((i) => i.id === item.id);
      if (existingItem) {
        setSelectedItems(
          selectedItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        );
      } else {
        setSelectedItems([
          ...selectedItems,
          { ...item, quantity: 1, instoreCategory: "default", discount: 0 },
        ]);
      }
    }
  };

  const handleAddNewUnliOrder = () => {
    const hasItemsInCurrentOrder = selectedItems.some(
      (i) =>
        i.orderNumber === currentUnliOrderNumber &&
        i.instoreCategory === "Unli Wings"
    );
    if (!hasItemsInCurrentOrder) {
      return alert(
        "Please add at least one item to the current Unli Order before adding a new order."
      );
    }
    setCurrentUnliOrderNumber(currentUnliOrderNumber + 1);
  };

  // Removed transaction fetching and mapping logic—OrderSummary now solely depends on selectedItems

  return (
    <div className="h-screen w-full flex bg-[#E2D6D5]">
      <div className="flex-grow p-6 flex flex-col">
        <div>
          <div className="flex flex-col space-y-4 mb-4">
            <div className="w-full">
              <div className="flex justify-between items-center w-full space-x-4">
                <div className="flex w-[430px]">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="flex-grow p-2 border rounded-lg shadow"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <div className="flex gap-4">
                {menuTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeFilter(type)}
                    className={`flex items-center ${getMenuTypeButtonStyles(
                      type
                    )} ${
                      selectedMenuType && selectedMenuType.id === type.id
                        ? "filter brightness-90"
                        : ""
                    } rounded-md shadow-md hover:opacity-90 active:scale-95 transition-transform duration-150 w-56 overflow-hidden`}
                  >
                    <div
                      className={`flex items-center justify-center ${getMenuLeftContainerBg(
                        type
                      )} p-3`}
                    >
                      <img
                        src="/images/stockout/menu.png"
                        alt="Menu"
                        className="w-6 h-6"
                      />
                    </div>
                    <span className="flex-1 text-left px-3 text-white">
                      {type.name}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="flex items-center bg-[#E88504] rounded-md shadow-md hover:opacity-90 active:scale-95 transition-transform duration-150 w-56 overflow-hidden"
                >
                  <div className="flex items-center justify-center bg-[#D87A03] p-3">
                    <img
                      src="/images/groceries.png"
                      alt="Menu"
                      className="w-6 h-6"
                    />
                  </div>
                  <span className="flex-1 text-left px-3 text-white">
                    {selectedMenuCategory
                      ? selectedMenuCategory.name
                      : "Select Category"}
                  </span>
                  <div className="flex items-center justify-center p-3">
                    {isCatDropdownOpen ? (
                      <FaChevronUp className="h-6 text-white" />
                    ) : (
                      <FaChevronDown className="h-6 text-white" />
                    )}
                  </div>
                </button>
                {isCatDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg z-10">
                    <div className="bg-white rounded-md py-2">
                      <button
                        onClick={() =>
                          handleCategoryFilter({ id: 0, name: "Overall" })
                        }
                        className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                      >
                        Overall
                      </button>
                      {menuCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryFilter(cat)}
                          className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto pb-2">
          <div className="grid grid-cols-4 gap-x-4 gap-y-4">
            {sortedFilteredMenuItems.map((item) => (
              <ItemBox
                key={item.id}
                item={item}
                image={item.image || "/placeholder.svg"}
                name={item.name}
                price={item.price}
                currency="₱"
                status={item.status_id}
                onClick={() => handleAddItem(item)}
              />
            ))}
          </div>
        </div>
      </div>
      <OrderSummary
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        // Pass down necessary handlers and data
        handleQuantityChange={() => {}}
        handleRemoveItem={() => {}}
        menuType={selectedMenuType}
        handleInstoreCategoryChange={() => {}}
        handleDiscountChange={() => {}}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleAddNewUnliOrder={handleAddNewUnliOrder}
        currentUnliOrderNumber={currentUnliOrderNumber}
        discounts={discounts}
        paymentMethods={paymentMethods}
        inStoreCategories={inStoreCategories}
        employees={employees}
        onPlaceOrder={() => {}}
      />
    </div>
  );
};

export default Order;
