import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/navigations/Sidebar";
import axios from "axios";
import LoadingScreen from "../components/popups/LoadingScreen";
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
    inventory: {
      low_stock: [],
      recent_stockin: [],
      recent_stockout: [],
    },
    sales_by_month: {
      current_year: Array(12).fill(0),
      previous_year: Array(12).fill(0),
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch dashboard data from our new endpoint
        const response = await axios.get(
          "http://127.0.0.1:8000/fetch-dashboard-data/"
        );

        if (response.data) {
          setDashboardData(response.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate percentage change compared to previous period
  const calculatePercentageChange = () => {
    const currentYearTotal = dashboardData.sales_by_month.current_year.reduce(
      (sum, val) => sum + val,
      0
    );
    const previousYearTotal = dashboardData.sales_by_month.previous_year.reduce(
      (sum, val) => sum + val,
      0
    );

    if (previousYearTotal === 0) return 0;
    return Math.round(
      ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100
    );
  };

  const percentChange = calculatePercentageChange();
  const currentYear = new Date().getFullYear();

  // Prepare chart data to match the reference style
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData = {
    labels: months,
    datasets: [
      {
        label: `${currentYear}`,
        data: dashboardData.sales_by_month.current_year,
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
        label: `${currentYear - 1}`,
        data: dashboardData.sales_by_month.previous_year,
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
            return value;
          },
          stepSize: 100,
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

  if (loading) {
    return <LoadingScreen message={"Loading dashboard"} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col p-6 bg-[#fcf4dc] overflow-hidden">
      {/* Dashboard content */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#CC5500] h-32 rounded-[15px] p-4 flex flex-col justify-between shadow-xl">
          <span className="text-white text-lg">Orders Today</span>
          <div className="text-white text-3xl font-bold flex items-end">
            {dashboardData.orders.today}
          </div>
        </div>
        <div className="bg-[#CC5500] h-32 rounded-[15px] p-4 flex flex-col justify-between">
          <span className="text-white text-lg">Total Orders</span>
          <div className="text-white text-3xl font-bold flex items-end">
            {dashboardData.orders.total}
          </div>
        </div>
        {isAdmin && (
          <>
            <div className="bg-[#CC5500] h-32 rounded-[15px] p-4 flex flex-col justify-between">
              <span className="text-white text-lg">Sales Today</span>
              <div className="text-white text-3xl font-bold flex items-end">
                ₱
                {dashboardData.sales.today.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="bg-[#CC5500] h-32 rounded-[15px] p-4 flex flex-col justify-between">
              <span className="text-white text-lg">Total Sales</span>
              <div className="text-white text-3xl font-bold flex items-end">
                ₱
                {dashboardData.sales.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
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
                <span className="text-gray-500 ml-1">in {currentYear}</span>
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
