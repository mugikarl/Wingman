import React, { useState, useEffect } from "react";
import ItemBox from "../../components/tables/ItemBox";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { PiMagnifyingGlass, PiBasket } from "react-icons/pi";
import OrderSummary from "../../components/panels/OrderSummary";
import LoadingScreen from "../../components/popups/LoadingScreen";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../components/utils/modalUtils";

const Order = () => {
  const navigate = useNavigate();

  // Modal and dropdown states
  const [selectedItems, setSelectedItems] = useState([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [selectedMenuType, setSelectedMenuType] = useState(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState(null);
  // Active section: "alaCarte" or "unli"
  const [activeSection, setActiveSection] = useState("alaCarte");
  // For Unli orders, track the current order number (starts at 1)
  const [currentUnliOrderNumber, setCurrentUnliOrderNumber] = useState(1);
  // Loading state
  const [loading, setLoading] = useState(true);

  // Data states
  const [menuItems, setMenuItems] = useState([]);
  const [menuTypes, setMenuTypes] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuStatuses, setMenuStatuses] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [inStoreCategories, setInStoreCategories] = useState([]);
  const [employees, setEmployees] = useState([]); // New state for employees

  // Add new state variables for availability tracking
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [isInitialDataFetched, setIsInitialDataFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Add new state variables for inventory tracking
  const [lowInventoryWarnings, setLowInventoryWarnings] = useState({});
  const { alert, confirm } = useModal();

  // Add to state variables at the top
  const [isCheckingMenuAvailability, setIsCheckingMenuAvailability] =
    useState(false);

  const fetchMenuOrders = async () => {
    setLoading(true);
    try {
      // First fetch the initial data
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

      // Then update menu availability
      setAvailabilityMessage("Checking menu availability...");
      const token = localStorage.getItem("access_token");
      const availabilityResponse = await axios.post(
        "http://127.0.0.1:8000/update-menu-availability/",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update UI with results
      const updatedCount = availabilityResponse.data.updated_items.length;
      if (updatedCount > 0) {
        setAvailabilityMessage(
          `Updated availability for ${updatedCount} menu items`
        );

        // Re-fetch menu items if any updates occurred
        const refreshResponse = await axios.get(
          "http://127.0.0.1:8000/fetch-order-data/"
        );
        setMenuItems(refreshResponse.data.menu_items || []);
      } else {
        setAvailabilityMessage("All menu items are up to date");
      }

      setIsInitialDataFetched(true);
    } catch (error) {
      console.log("Error fetching menu data: ", error);
      setAvailabilityMessage("Failed to update menu availability");
    } finally {
      setLoading(false);

      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setAvailabilityMessage("");
      }, 3000);
    }
  };

  // Function to update menu availability
  const updateMenuAvailability = async () => {
    try {
      setIsUpdatingAvailability(true);
      setIsCheckingMenuAvailability(true); // Add gray overlay
      setAvailabilityMessage("Checking menu availability...");

      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://127.0.0.1:8000/update-menu-availability/",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update UI with results
      const updatedCount = response.data.updated_items.length;
      if (updatedCount > 0) {
        setAvailabilityMessage(
          `Updated availability for ${updatedCount} menu items`
        );
        // Refresh menu items if any updates occurred
        fetchMenuOrders();
      } else {
        setAvailabilityMessage("All menu items are up to date");
      }
    } catch (error) {
      console.error("Error updating menu availability:", error);
      setAvailabilityMessage("Failed to update menu availability");
    } finally {
      setIsUpdatingAvailability(false);
      setIsCheckingMenuAvailability(false); // Remove gray overlay

      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setAvailabilityMessage("");
      }, 3000);
    }
  };

  // Effect for initial data fetch
  useEffect(() => {
    fetchMenuOrders();
  }, []);

  // Modify the useEffect for menu availability updates
  // Remove the initial check since it's now done during fetchMenuOrders
  useEffect(() => {
    let intervalId;

    // Only start the interval after initial data is fetched
    if (isInitialDataFetched) {
      // Set up interval to check availability every 10 minutes
      intervalId = setInterval(updateMenuAvailability, 10 * 60 * 1000);
      // No need to run initial check here anymore
    }

    // Clean up interval on component unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isInitialDataFetched]);

  // Set default selected menu type to "In‑Store" immediately
  useEffect(() => {
    if (menuTypes.length > 0 && !selectedMenuType) {
      // Assuming the "In‑Store" type has id 1
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

  if (loading) {
    return <LoadingScreen message="Checking menu availability" />;
  }

  // Handle filter selection for type
  const handleTypeFilter = async (type) => {
    if (
      selectedMenuType &&
      selectedMenuType.id !== type.id &&
      selectedItems.length > 0
    ) {
      // Replace window.confirm with custom confirm
      const ok = await confirm(
        "Changing types will remove the current items in the order summary. Proceed?",
        "Confirm Type Change"
      );

      if (!ok) return;
      setSelectedItems([]);
    }
    setSelectedMenuType(type);
    if (type.id !== 1) {
      setActiveSection("alaCarte");
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter items based on selected type and category
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesType = selectedMenuType
      ? item.type_id === selectedMenuType.id
      : true;
    const matchesCategory =
      selectedMenuCategory && selectedMenuCategory.id !== 0
        ? item.category_id === selectedMenuCategory.id
        : true;
    const matchesSearch =
      !searchQuery ||
      (item.name &&
        item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesCategory && matchesSearch;
  });

  // Sort items so that available (status_id === 1) come first
  const sortedFilteredMenuItems = filteredMenuItems.slice().sort((a, b) => {
    if (a.status_id === 1 && b.status_id !== 1) return -1;
    if (a.status_id !== 1 && b.status_id === 1) return 1;
    return 0;
  });

  // Helper functions for button styles
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

  // Modify the handleAddItem function to use custom alert
  const handleAddItem = async (item) => {
    if (item.status_id === 2) {
      await alert("This item is unavailable!", "Unavailable Item");
      return;
    }

    // Original handleAddItem logic without inventory checking
    if (selectedMenuType?.id === 1) {
      let defaultCategory, defaultDiscount;
      if (activeSection === "unliWings") {
        // For Unli mode, only allow items in allowed category IDs: 1 (Wings), 4 (Sides), 5 (Drinks)
        if (
          item.category_id === 1 ||
          item.category_id === 5 ||
          item.category_id === 4
        ) {
          if (
            item.category_id === 4 &&
            !item.name.toLowerCase().includes("rice")
          ) {
            await alert(
              "Only Rice items can be added for Sides in the Unli section.",
              "Invalid Selection"
            );
            return;
          }
          defaultCategory = "Unli Wings";
          defaultDiscount = 0;
        } else {
          await alert(
            "Only Wings, Drinks, or Sides items can be added to the Unli section.",
            "Invalid Selection"
          );
          return;
        }
      } else {
        // For Ala Carte mode.
        defaultCategory = "Ala Carte";
        defaultDiscount = 0;
      }

      // Merge if same product, same instoreCategory, same discount, and for unli items, same orderNumber.
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
      // For non‑In‑Store types, use the existing behavior.
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

  // Prevent adding a new Unli order if the current Unli order is empty.
  const handleAddNewUnliOrder = async () => {
    const hasItemsInCurrentOrder = selectedItems.some(
      (i) =>
        i.orderNumber === currentUnliOrderNumber &&
        i.instoreCategory === "Unli Wings"
    );

    if (!hasItemsInCurrentOrder) {
      await alert(
        "Please add at least one item to the current Unli Order before adding a new order.",
        "Empty Order"
      );
      return;
    }

    setCurrentUnliOrderNumber(currentUnliOrderNumber + 1);
  };

  // Update discount only for the targeted card.
  const handleDiscountChange = (id, category, newDiscount, targetKey) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        const key = `${item.id}-${item.instoreCategory || "default"}-${
          item.discount || 0
        }`;
        if (item.id.toString() === id.toString() && key === targetKey) {
          return { ...item, discount: Number(newDiscount) };
        }
        return item;
      })
    );
  };

  // Similarly, simplify the handleQuantityChange function to skip inventory checking
  const handleQuantityChange = (id, groupIdentifier, discount, newQuantity) => {
    if (newQuantity <= 0) {
      setSelectedItems((prevItems) =>
        prevItems.filter((item) => {
          if (item.id !== id) return true;
          if (item.instoreCategory === "Unli Wings") {
            return !(
              item.orderNumber === groupIdentifier &&
              Number(item.discount || 0) === Number(discount)
            );
          }
          return !(
            item.instoreCategory === groupIdentifier &&
            Number(item.discount || 0) === Number(discount)
          );
        })
      );
      return;
    }

    // Just update quantity without checking inventory
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id && Number(item.discount || 0) === Number(discount)) {
          if (item.instoreCategory === "Unli Wings") {
            if (item.orderNumber === groupIdentifier) {
              return { ...item, quantity: newQuantity };
            }
          } else if (item.instoreCategory === groupIdentifier) {
            return { ...item, quantity: newQuantity };
          }
        }
        return item;
      })
    );
  };

  // Remove item from the order
  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== id));
  };

  // Update instore category for a product
  const handleInstoreCategoryChange = (id, category) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.id === id ? { ...item, instoreCategory: category } : item
      )
    );
  };

  // NEW: Function to post the transaction to the backend.
  // This function builds a payload from the current order state and calls the add_order API.
  const handlePlaceOrder = async (
    employeeId,
    paymentMethod,
    cashReceived,
    gcashReferenceNo,
    gcashReferenceImage,
    employeeEmail,
    employeePasscode
  ) => {
    // Construct order_details from selectedItems:
    const orderDetails = selectedItems.map((item) => {
      if (selectedMenuType && selectedMenuType.id === 1) {
        // For In‑Store orders, include instore_category and unli_wings_group.
        return {
          menu_id: item.id,
          quantity: item.quantity,
          discount_id: item.discount || null,
          instore_category: item.instoreCategory === "Unli Wings" ? 2 : 1,
          unli_wings_group:
            item.instoreCategory === "Unli Wings" ? item.orderNumber : null,
        };
      } else {
        // For non‑In‑Store orders (FoodPanda/Grab), do not include instore_category.
        return {
          menu_id: item.id,
          quantity: item.quantity,
          discount_id: item.discount || null,
        };
      }
    });

    const payload = {
      employee_id: employeeId,
      email: employeeEmail,
      passcode: employeePasscode,
      payment_method: paymentMethod,
      payment_amount: Number(cashReceived) || 0,
      reference_id: gcashReferenceNo || null,
      receipt_image: gcashReferenceImage,
      order_details: orderDetails,
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/add-order/",
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Order placed successfully:", response.data);

      // Clear selected items after placing the order
      setSelectedItems([]);

      // Navigate to OrderTable with refresh flag
      navigate("/ordertable", { state: { refresh: true } });
    } catch (error) {
      console.error(
        "Error placing order:",
        error.response ? error.response.data : error.message
      );
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#fcf4dc] relative">
      {/* Disabled overlay for menu availability check */}
      {isCheckingMenuAvailability && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 z-10 flex items-center justify-center">
          <div className="bg-white p-6 rounded-sm shadow-md flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC5500] mb-3"></div>
            <p className="text-gray-700 font-medium text-center">
              Checking menu availability...
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-grow p-6 flex flex-col">
        {/* Fixed Header: Search Bar and Filters */}
        <div>
          <div className="flex flex-col space-y-4 mb-4">
            {/* Add availability message display */}
            {availabilityMessage && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2">
                <p>{availabilityMessage}</p>
              </div>
            )}

            {/* Search Bar - Updated to match OrderTable style */}
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
                  placeholder="Search by menu items..."
                  className="w-full pl-14 p-2 border rounded-lg shadow"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col space-y-4">
              {/* Menu Type Buttons - Updated to match OrderTable style */}
              <div className="flex gap-2">
                {menuTypes.map((type) => {
                  let color = "bg-white hover:bg-gray-200";
                  if (type.id === 1) {
                    color = "bg-[#CC5500] hover:bg-[#B34A00]";
                  } else if (type.id === 2) {
                    color = "bg-green-500 hover:bg-green-600";
                  } else if (type.id === 3) {
                    color = "bg-pink-500 hover:bg-pink-600";
                  }

                  return (
                    <button
                      key={type.id}
                      onClick={() => handleTypeFilter(type)}
                      className={`px-3 py-1 rounded-md transition-colors w-28 text-center border border-gray-300 shadow-sm ${
                        selectedMenuType && selectedMenuType.id === type.id
                          ? `${color} text-white`
                          : "bg-white hover:bg-gray-200"
                      }`}
                    >
                      {type.name}
                    </button>
                  );
                })}
              </div>

              {/* Select Category Dropdown */}
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="flex items-center bg-white border hover:bg-gray-200 text-[#CC5500] shadow-sm rounded-sm duration-200 w-48 overflow-hidden"
                >
                  <div className="flex items-center justify-center border-r p-3">
                    <PiBasket className="w-5 h-5 text-[#CC5500]" />
                  </div>
                  <span className="flex-1 text-left pl-3">
                    {selectedMenuCategory ? selectedMenuCategory.name : "All"}
                  </span>
                  <div className="flex items-center justify-center pr-3">
                    {isCatDropdownOpen ? (
                      <FaChevronUp className="h-4 w-4 text-[#CC5500]" />
                    ) : (
                      <FaChevronDown className="h-4 w-4 text-[#CC5500]" />
                    )}
                  </div>
                </button>
                {isCatDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg z-10">
                    <div className="bg-white rounded-md py-2">
                      <button
                        onClick={() => {
                          setSelectedMenuCategory({ id: 0, name: "All" });
                          setIsCatDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                      >
                        All
                      </button>
                      {menuCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedMenuCategory(cat);
                            setIsCatDropdownOpen(false);
                          }}
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

        {/* Scrollable Grid Layout for Sorted Menu Items */}
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
      {/* Summary Panel (Fixed) */}
      <OrderSummary
        selectedItems={selectedItems}
        handleQuantityChange={handleQuantityChange}
        handleRemoveItem={handleRemoveItem}
        menuType={selectedMenuType}
        handleInstoreCategoryChange={handleInstoreCategoryChange}
        handleDiscountChange={handleDiscountChange}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleAddNewUnliOrder={handleAddNewUnliOrder}
        currentUnliOrderNumber={currentUnliOrderNumber}
        discounts={discounts}
        paymentMethods={paymentMethods}
        inStoreCategories={inStoreCategories}
        employees={employees}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
};

export default Order;
