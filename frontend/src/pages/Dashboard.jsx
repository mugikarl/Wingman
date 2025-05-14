import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/navigations/Sidebar";
import axios from "axios";
import LoadingScreen from "../components/popups/LoadingScreen";
import { HiChevronRight, HiChevronDown } from "react-icons/hi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ isAdmin, setIsAdmin }) => {
  const [dashboardData, setDashboardData] = useState({
    orders: {
      total: 0,
      today: 0,
    },
    sales: {
      total: 0,
      today: 0,
    },
    expenses: {
      total: 0,
      today: 0,
    },
    inventory: {
      low_stock: [],
      recent_stockin: [],
      recent_stockout: [],
    },
    sales_by_month: {
      current_month: Array(31).fill(0),
      previous_month: Array(31).fill(0),
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date());
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // Generate last 7 days for dropdown
  const getLast7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date,
        formatted: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  useEffect(() => {
    if (!isFetching) {
      fetchDashboardData();
    }
  }, [filterDate]);

  const fetchDashboardData = async () => {
    if (isFetching) return;

    setIsFetching(true);
    setLoading(true);
    try {
      // Format date for API request
      const formattedDate = filterDate.toISOString().split("T")[0];

      // Fetch dashboard data with date filter
      const response = await axios.get(
        `http://127.0.0.1:8000/fetch-dashboard-data/?date=${formattedDate}`
      );

      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Handle date selection
  const handleDateChange = (date) => {
    setFilterDate(date);
    setDropdownVisible(false);
  };

  // Toggle dropdown visibility
  const toggleDropdown = (dropdown) => {
    if (activeDropdown === dropdown && dropdownVisible) {
      setDropdownVisible(false);
    } else {
      setActiveDropdown(dropdown);
      setDropdownVisible(true);
    }
  };

  // Calculate percentage change compared to previous period
  const calculatePercentageChange = () => {
    const currentMonthTotal = dashboardData.sales_by_month.current_month.reduce(
      (sum, val) => sum + val,
      0
    );
    const previousMonthTotal =
      dashboardData.sales_by_month.previous_month.reduce(
        (sum, val) => sum + val,
        0
      );

    if (previousMonthTotal === 0) return 0;
    return Math.round(
      ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    );
  };

  const percentChange = calculatePercentageChange();
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const previousMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1
  ).toLocaleString("default", { month: "long" });

  // Generate day labels for the month (1-31)
  const generateDayLabels = () => {
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  };

  // Prepare chart data to match the reference style
  const dayLabels = generateDayLabels();

  // Add this function to get the month name from a date object
  const getMonthName = (date) => {
    return date.toLocaleString("default", { month: "long" });
  };

  const chartData = {
    labels: dayLabels,
    datasets: [
      {
        label: currentMonth,
        data: dashboardData.sales_by_month.current_month.slice(
          0,
          dayLabels.length
        ),
        borderColor: "#CC5500",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, "rgba(204, 85, 0, 0.6)");
          gradient.addColorStop(1, "rgba(204, 85, 0, 0)");
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
      },
      {
        label: previousMonth,
        data: dashboardData.sales_by_month.previous_month.slice(
          0,
          dayLabels.length
        ),
        borderColor: "#F2B705",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, "rgba(242, 183, 5, 0.4)");
          gradient.addColorStop(1, "rgba(242, 183, 5, 0)");
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            return `${
              context.dataset.label
            }: ₱${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: function (value) {
            return `₱${value}`;
          },
          stepSize: 100,
        },
        title: {
          display: true,
          text: "Sales (₱)",
          font: {
            size: 14,
          },
          padding: {
            top: 5,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
        },
        title: {
          display: true,
          text: `Days (Month of ${getMonthName(filterDate)})`,
          font: {
            size: 14,
          },
          padding: {
            top: 5,
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
  };

  // Generate notifications based on inventory and recent activities
  const generateNotifications = () => {
    const notifications = [];

    // Low stock notifications
    dashboardData.inventory.low_stock.forEach((item) => {
      if (item.quantity === 0) {
        notifications.push({
          type: "danger", // New type for zero stock
          message: `NO STOCK: ${item.name} (0/${item.stock_trigger} ${
            item.measurement || "units"
          })`,
        });
      } else {
        notifications.push({
          type: "warning",
          message: `Low inventory: ${item.name} (${item.quantity}/${
            item.stock_trigger
          } ${item.measurement || "units"} left)`,
        });
      }
    });

    // Recent stock in notifications
    dashboardData.inventory.recent_stockin.forEach((item) => {
      notifications.push({
        type: "info",
        message: `Stock in: ${item.quantity_in} ${
          item.measurement || "units"
        } of ${item.item_name}`,
        date: item.date ? item.date : undefined,
      });
    });

    // Recent stock out notifications
    dashboardData.inventory.recent_stockout.forEach((item) => {
      notifications.push({
        type: "info",
        message: `Stock out: ${item.quantity_out} ${
          item.measurement || "units"
        } of ${item.item_name}`,
        date: item.date ? item.date : undefined,
      });
    });

    return notifications;
  };

  const notifications = generateNotifications();

  // Update the card label texts to reflect the selected date
  const getDateLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filterDateCopy = new Date(filterDate);
    filterDateCopy.setHours(0, 0, 0, 0);

    // Check if selected date is today
    if (filterDateCopy.getTime() === today.getTime()) {
      return "Today";
    }

    // Check if selected date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (filterDateCopy.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }

    // Return date in short format for other dates
    return filterDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const dateLabel = getDateLabel();

  if (loading) {
    return <LoadingScreen message={"Loading dashboard"} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col p-6 bg-[#fcf4dc] overflow-hidden">
      {/* Dashboard content */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#CC5500] h-32 rounded-[15px] p-4 flex flex-col justify-between shadow-xl relative">
          <div className="flex justify-between items-center">
            <span className="text-white text-lg">Orders {dateLabel}</span>
            <button
              onClick={() => toggleDropdown("orders")}
              className="text-white hover:text-yellow-200 flex items-center"
            >
              {dropdownVisible && activeDropdown === "orders" ? (
                <HiChevronDown size={24} />
              ) : (
                <HiChevronRight size={24} />
              )}
            </button>
          </div>
          <div className="text-white text-3xl font-bold flex items-end">
            {dashboardData.orders.today}
          </div>
          <div className="text-white/80 text-sm mt-1">
            All Time Orders: {dashboardData.orders.total}
          </div>
          {dropdownVisible && activeDropdown === "orders" && (
            <div className="absolute top-32 right-0 z-50 bg-white rounded-md shadow-lg py-1 w-48">
              {last7Days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateChange(day.date)}
                  className={`w-full text-left px-4 py-2 hover:bg-[#fceee8] ${
                    day.date.toDateString() === filterDate.toDateString()
                      ? "bg-[#fceee8] text-[#CC5500] font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {day.formatted}
                </button>
              ))}
            </div>
          )}
        </div>

        {isAdmin ? (
          <>
            <div className="bg-[#CC5500] h-32 rounded-[15px] p-4 flex flex-col justify-between relative">
              <div className="flex justify-between items-center">
                <span className="text-white text-lg">Sales {dateLabel}</span>
                <button
                  onClick={() => toggleDropdown("sales")}
                  className="text-white hover:text-yellow-200 flex items-center"
                >
                  {dropdownVisible && activeDropdown === "sales" ? (
                    <HiChevronDown size={24} />
                  ) : (
                    <HiChevronRight size={24} />
                  )}
                </button>
              </div>
              <div className="text-white text-3xl font-bold flex items-end">
                ₱
                {dashboardData.sales.today.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-white/80 text-sm mt-1">
                All Time Sales: ₱
                {dashboardData.sales.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              {dropdownVisible && activeDropdown === "sales" && (
                <div className="absolute top-32 right-0 z-50 bg-white rounded-md shadow-lg py-1 w-48">
                  {last7Days.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateChange(day.date)}
                      className={`w-full text-left px-4 py-2 hover:bg-[#fceee8] ${
                        day.date.toDateString() === filterDate.toDateString()
                          ? "bg-[#fceee8] text-[#CC5500] font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {day.formatted}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#CC5500] h-32 rounded-[15px] p-4 flex flex-col justify-between shadow-xl relative">
              <div className="flex justify-between items-center">
                <span className="text-white text-lg">Expenses {dateLabel}</span>
                <button
                  onClick={() => toggleDropdown("expenses")}
                  className="text-white hover:text-yellow-200 flex items-center"
                >
                  {dropdownVisible && activeDropdown === "expenses" ? (
                    <HiChevronDown size={24} />
                  ) : (
                    <HiChevronRight size={24} />
                  )}
                </button>
              </div>
              <div className="text-white text-3xl font-bold flex items-end">
                ₱
                {dashboardData.expenses.today.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-white/80 text-sm mt-1">
                All Time Expenses: ₱
                {dashboardData.expenses.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              {dropdownVisible && activeDropdown === "expenses" && (
                <div className="absolute top-32 right-0 z-50 bg-white rounded-md shadow-lg py-1 w-48">
                  {last7Days.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateChange(day.date)}
                      className={`w-full text-left px-4 py-2 hover:bg-[#fceee8] ${
                        day.date.toDateString() === filterDate.toDateString()
                          ? "bg-[#fceee8] text-[#CC5500] font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {day.formatted}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // For non-admin, fill the remaining space with empty columns
          <>
            <div className="col-span-2"></div>
          </>
        )}
      </div>

      {/* Bottom Section */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="bg-white w-3/4 rounded-[15px] shadow flex flex-col">
          <div className="border-b mb-4">
            <div className="flex justify-between items-center px-6 py-4">
              <span className="text-black font-semibold text-lg">
                Sales Overview
              </span>
              <div className="text-sm">
                <span
                  className={`font-medium ${
                    percentChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  ({percentChange >= 0 ? "+" : ""}
                  {percentChange}%)
                </span>
                <span className="text-gray-500 ml-1">vs {previousMonth}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 px-6 pb-6">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white w-1/4 rounded-[15px] shadow flex flex-col overflow-hidden">
          <div className="border-b mb-4">
            <div className="flex justify-start items-center px-6 py-4">
              <span className="text-black font-semibold text-lg">
                Notifications
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md text-sm ${
                      notif.type === "warning"
                        ? "bg-amber-100 border-l-4 border-amber-500"
                        : notif.type === "danger"
                        ? "bg-red-100 border-l-4 border-red-600"
                        : "bg-blue-100 border-l-4 border-blue-500"
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        notif.type === "danger" ? "text-red-700" : ""
                      }`}
                    >
                      {notif.message}
                    </p>
                    {notif.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
