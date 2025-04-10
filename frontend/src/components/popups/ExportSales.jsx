import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import LoadingScreen from "./LoadingScreen";
import * as XLSX from "xlsx-js-style";

const ExportSales = ({ isOpen, onClose, selectedDate, salesData }) => {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [includeDaily, setIncludeDaily] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [monthData, setMonthData] = useState(null);

  const month = selectedDate.toLocaleString("default", { month: "long" });
  const year = selectedDate.getFullYear();

  useEffect(() => {
    setFileName(`Sales_Report_${month}_${year}`);
  }, [month, year]);

  // Fetch month data if needed
  useEffect(() => {
    if (isOpen && !salesData) {
      fetchMonthlyData();
    } else if (salesData) {
      setMonthData(salesData);
    }
  }, [isOpen, salesData]);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/fetch-sales-data/`
      );
      if (response.data.error) {
        setError(response.data.error);
        setMonthData(null);
        return;
      }
      setMonthData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError(err.message || "Error fetching data");
      setMonthData(null);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = () => {
    if (!monthData) return [];

    const calculateTransactionTotal = (transaction) => {
      if (
        !transaction.order_details ||
        !Array.isArray(transaction.order_details)
      ) {
        return 0;
      }

      const menuTypeId = transaction.order_details?.[0]?.menu_item?.type_id;
      const menuTypeData = monthData.menu_types?.find(
        (type) => type.id === menuTypeId
      );
      const menuType = menuTypeData ? menuTypeData.name : "Unknown";
      const isDelivery = menuType === "Grab" || menuType === "FoodPanda";

      const unliWingsGroups = new Set();

      let subtotal = 0;
      let totalDiscounts = 0;

      transaction.order_details.forEach((detail) => {
        const isUnliWings = detail.instore_category?.name === "Unli Wings";
        const unliWingsGroup = detail.unli_wings_group;

        if (isUnliWings && unliWingsGroup !== undefined) {
          if (unliWingsGroups.has(unliWingsGroup)) {
            return;
          }

          const baseAmount = parseFloat(
            detail.instore_category.base_amount || 0
          );
          subtotal += baseAmount;
          unliWingsGroups.add(unliWingsGroup);
        } else {
          const price = parseFloat(detail.menu_item?.price || 0);
          const quantity = parseInt(detail.quantity || 0);
          const itemTotal = price * quantity;
          subtotal += itemTotal;

          if (detail.discount?.percentage) {
            const discountAmount =
              itemTotal * parseFloat(detail.discount.percentage);
            totalDiscounts += discountAmount;
          }
        }
      });

      const percentageDeduction =
        isDelivery && menuTypeData?.deduction_percentage
          ? subtotal * parseFloat(menuTypeData.deduction_percentage)
          : 0;

      const total = subtotal - totalDiscounts - percentageDeduction;
      return total;
    };

    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();

    const monthTransactions = (monthData.transactions || []).filter(
      (transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getFullYear() === selectedYear &&
          transactionDate.getMonth() === selectedMonth &&
          transaction.order_status === 2
        );
      }
    );

    const monthExpenses = (monthData.expenses || []).filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getFullYear() === selectedYear &&
        expenseDate.getMonth() === selectedMonth
      );
    });

    const dailyTotals = {};

    monthTransactions.forEach((transaction) => {
      const dateStr = new Date(transaction.date).toLocaleDateString();
      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = { date: dateStr, sales: 0, expenses: 0 };
      }
      dailyTotals[dateStr].sales += calculateTransactionTotal(transaction);
    });

    monthExpenses.forEach((expense) => {
      const dateStr = new Date(expense.date).toLocaleDateString();
      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = { date: dateStr, sales: 0, expenses: 0 };
      }
      dailyTotals[dateStr].expenses += parseFloat(expense.cost || 0);
    });

    // Format data showing all transactions and expenses
    const displayData = Object.values(dailyTotals).map((day) => ({
      date: day.date,
      sales: day.sales,
      expenses: day.expenses,
      netIncome: day.sales - day.expenses,
    }));

    // Calculate monthly totals
    const totalValues = displayData.reduce(
      (totals, row) => ({
        sales: totals.sales + row.sales,
        expenses: totals.expenses + row.expenses,
        netIncome: totals.netIncome + row.netIncome,
      }),
      { sales: 0, expenses: 0, netIncome: 0 }
    );

    // Sort by date (ascending)
    const sortedData = displayData.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      dailyData: sortedData,
      monthlyTotal: {
        date: "Total",
        sales: totalValues.sales,
        expenses: totalValues.expenses,
        netIncome: totalValues.netIncome,
      },
    };
  };

  // Format currency for display
  const formatCurrency = (value) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Export handlers for different file types
  // PDF
  const exportToPDF = (processedData) => {
    const { dailyData, monthlyTotal } = processedData;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(`Sales Report: ${month} ${year}`, 14, 22);

    // Generate table data
    let tableData = [];

    // Daily breakdown if includeDaily is true
    if (includeDaily) {
      tableData = dailyData.map((day) => [
        day.date,
        `${formatCurrency(day.sales)}`,
        `${formatCurrency(day.expenses)}`,
        `${formatCurrency(day.netIncome)}`,
      ]);
    }

    // Prepare the footer with color styling
    const footerStyles = [
      {},
      { textColor: [0, 128, 0] },
      { textColor: [255, 0, 0] },
      { textColor: monthlyTotal.netIncome >= 0 ? [0, 128, 0] : [255, 0, 0] },
    ];

    // Generate the table using autoTable
    autoTable(doc, {
      head: [["Date", "Sales", "Expenses", "Net Income"]],
      body: tableData,
      startY: 30,
      theme: "striped",
      headStyles: { fillColor: [204, 85, 0] },
      foot: [
        [
          monthlyTotal.date,
          `${formatCurrency(monthlyTotal.sales)}`,
          `${formatCurrency(monthlyTotal.expenses)}`,
          `${formatCurrency(monthlyTotal.netIncome)}`,
        ],
      ],
      footStyles: {
        fillColor: "#F7F7F7",
        fontStyle: "bold",
        lineWidth: { top: 0.2 },
        lineColor: "#CC5500",
      },
      columnStyles: {
        0: {},
        1: {},
        2: {},
        3: {},
      },
      styles: {
        overflow: "linebreak",
      },
      margin: { top: 30 },
      didParseCell: function (data) {
        // Style footer cells with colors
        if (data.section === "foot") {
          data.cell.styles.textColor = footerStyles[data.column.index]
            .textColor || [0, 0, 0];
        }
      },
    });

    doc.save(`${fileName || "SalesReport"}.pdf`);
  };

  // CSV
  const exportToCSV = (processedData) => {
    const { dailyData, monthlyTotal } = processedData;

    // Prepare data
    let csvData = [["Date", "Sales", "Expenses", "Net Income"]];

    // Add daily data if needed
    if (includeDaily) {
      dailyData.forEach((day) => {
        csvData.push([
          day.date,
          formatCurrency(day.sales),
          formatCurrency(day.expenses),
          formatCurrency(day.netIncome),
        ]);
      });
    }

    // Add monthly total
    csvData.push([
      monthlyTotal.date,
      formatCurrency(monthlyTotal.sales),
      formatCurrency(monthlyTotal.expenses),
      formatCurrency(monthlyTotal.netIncome),
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(csvData);

    // Create workbook with worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

    // Generate and download CSV
    XLSX.writeFile(wb, `${fileName || "SalesReport"}.csv`);
  };

  // Excel
  const exportToExcel = (processedData) => {
    const { dailyData, monthlyTotal } = processedData;

    // Prepare data
    let excelData = [["Date", "Sales", "Expenses", "Net Income"]];

    // Add daily data if needed
    if (includeDaily) {
      dailyData.forEach((day, index) => {
        excelData.push([day.date, day.sales, day.expenses, day.netIncome]);
      });
    }

    // Add monthly total
    excelData.push([
      monthlyTotal.date,
      monthlyTotal.sales,
      monthlyTotal.expenses,
      monthlyTotal.netIncome,
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Add styling
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "CC5500" } },
      alignment: { horizontal: "center" },
    };

    const totalStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "F7F7F7" } },
      border: {
        top: { style: "medium", color: { rgb: "CC5500" } },
      },
    };

    const greenStyle = {
      font: { bold: true, color: { rgb: "008000" } }, // Green text
    };

    const redStyle = {
      font: { bold: true, color: { rgb: "FF0000" } }, // Red text
    };

    const stripedStyle = {
      fill: { fgColor: { rgb: "F0F0F0" } }, // Light gray for striped rows
    };

    // Apply header style
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = headerStyle;
    }

    for (let R = 1; R < excelData.length - 1; ++R) {
      if (R % 2 === 0) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          ws[cellAddress].s = stripedStyle;
        }
      }
    }

    // Apply total row style
    const totalRow = excelData.length - 1;

    // Total label (same style as other total cells, but no color)
    const totalLabelCell = XLSX.utils.encode_cell({ r: totalRow, c: 0 });
    if (ws[totalLabelCell]) {
      ws[totalLabelCell].s = { ...totalStyle, font: { bold: true } };
    }

    // Total Sales (green)
    const totalSalesCell = XLSX.utils.encode_cell({ r: totalRow, c: 1 });
    if (ws[totalSalesCell]) {
      ws[totalSalesCell].s = { ...totalStyle, ...greenStyle };
    }

    // Total Expenses (red)
    const totalExpensesCell = XLSX.utils.encode_cell({ r: totalRow, c: 2 });
    if (ws[totalExpensesCell]) {
      ws[totalExpensesCell].s = { ...totalStyle, ...redStyle };
    }

    // Net Income (green if positive, red if negative)
    const netIncomeCell = XLSX.utils.encode_cell({ r: totalRow, c: 3 });
    if (ws[netIncomeCell]) {
      const netIncomeStyle =
        monthlyTotal.netIncome >= 0 ? greenStyle : redStyle;
      ws[netIncomeCell].s = { ...totalStyle, ...netIncomeStyle };
    }

    // Set column widths
    ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    // Create workbook with worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

    // Generate and download Excel file
    XLSX.writeFile(wb, `${fileName || "SalesReport"}.xlsx`);
  };

  const handleExport = () => {
    if (!fileName.trim()) {
      alert("Please enter a file name");
      return;
    }

    const processedData = processMonthlyData();

    if (processedData.dailyData.length === 0 && !processedData.monthlyTotal) {
      alert("No data available to export");
      return;
    }

    // Handle export based on selected file type
    switch (fileType) {
      case "pdf":
        exportToPDF(processedData);
        break;
      case "csv":
        exportToCSV(processedData);
        break;
      case "excel":
        exportToExcel(processedData);
        break;
      default:
        console.error("Unsupported file type:", fileType);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Export Sales Report</h2>
          <button onClick={onClose} className="text-2xl">
            &times;
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-4">
            {/* Month & Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Month
              </label>
              <input
                type="text"
                value={month}
                disabled
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <input
                type="text"
                value={year}
                disabled
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter file name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              File Type
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="flex flex-row gap-x-2 items-center text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDaily}
                onChange={(e) => setIncludeDaily(e.target.checked)}
                className="hidden"
              />
              <div className="w-5 h-5 border rounded-md flex items-center justify-center border-gray-400 bg-white text-[#CC5500] font-bold">
                {includeDaily && "✓"}
              </div>
              Include daily breakdown (otherwise just monthly totals)
            </label>
          </div>
        </div>

        <div className="flex justify-end p-4 space-x-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-md bg-[#CC5500] text-white hover:bg-[#b34600]"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSales;
