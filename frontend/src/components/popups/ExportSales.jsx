import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import LoadingScreen from "./LoadingScreen";
import * as XLSX from "xlsx-js-style";
import { useModal } from "../utils/modalUtils";

const ExportSales = ({ isOpen, onClose, selectedDate, salesData }) => {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [includeDaily, setIncludeDaily] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [monthsToInclude, setMonthsToInclude] = useState(1);

  const { alert } = useModal();

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

  const processMultiMonthData = () => {
    if (!monthData) return { monthlyData: [], totalData: null };

    const months = [];
    const startDate = new Date(selectedDate);

    // Generate data for each month going backward from selected date
    for (let i = 0; i < monthsToInclude; i++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() - i);

      const monthName = currentDate.toLocaleString("default", {
        month: "long",
      });
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      // Process this month's data
      const processedMonth = processMonthData(currentYear, currentMonth);

      months.push({
        monthName,
        year: currentYear,
        ...processedMonth,
      });
    }

    // Calculate overall totals across all months
    const totalData = months.reduce(
      (total, month) => {
        return {
          sales: total.sales + month.monthlyTotal.sales,
          expenses: total.expenses + month.monthlyTotal.expenses,
          netIncome: total.netIncome + month.monthlyTotal.netIncome,
        };
      },
      { sales: 0, expenses: 0, netIncome: 0 }
    );

    return {
      monthlyData: months,
      totalData,
    };
  };

  const processMonthData = (year, month) => {
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

    const monthTransactions = (monthData.transactions || []).filter(
      (transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getFullYear() === year &&
          transactionDate.getMonth() === month &&
          transaction.order_status === 2
        );
      }
    );

    const monthExpenses = (monthData.expenses || []).filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getFullYear() === year && expenseDate.getMonth() === month
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
    const { monthlyData, totalData } = processedData;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    const titleText =
      monthsToInclude > 1
        ? `Sales Report: ${monthsToInclude} Month${
            monthsToInclude > 1 ? "s" : ""
          } (${monthlyData[monthlyData.length - 1].monthName} ${
            monthlyData[monthlyData.length - 1].year
          } - ${monthlyData[0].monthName} ${monthlyData[0].year})`
        : `Sales Report: ${month} ${year}`;

    doc.text(titleText, 14, 22);

    let yPosition = 30;

    // For each month in our data
    monthlyData.forEach((monthData, index) => {
      // Add month header
      doc.setFontSize(14);
      doc.text(`${monthData.monthName} ${monthData.year}`, 14, yPosition);
      yPosition += 10;

      // Generate table data for this month
      if (includeDaily) {
        const tableData = monthData.dailyData.map((day) => [
          day.date,
          `${formatCurrency(day.sales)}`,
          `${formatCurrency(day.expenses)}`,
          `${formatCurrency(day.netIncome)}`,
        ]);

        // Prepare the footer with color styling
        const footerStyles = [
          {},
          { textColor: [0, 128, 0] },
          { textColor: [255, 0, 0] },
          {
            textColor:
              monthData.monthlyTotal.netIncome >= 0 ? [0, 128, 0] : [255, 0, 0],
          },
        ];

        // Generate the table for this month
        autoTable(doc, {
          head: [["Date", "Sales", "Expenses", "Net Income"]],
          body: tableData,
          startY: yPosition,
          theme: "striped",
          headStyles: { fillColor: [204, 85, 0] },
          foot: [
            [
              monthData.monthlyTotal.date,
              `${formatCurrency(monthData.monthlyTotal.sales)}`,
              `${formatCurrency(monthData.monthlyTotal.expenses)}`,
              `${formatCurrency(monthData.monthlyTotal.netIncome)}`,
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

        // Update Y position for next table
        yPosition = doc.lastAutoTable.finalY + 20;
      } else {
        // If we're not including daily data, just show monthly total
        const tableData = [];

        // Prepare the footer with color styling
        const footerStyles = [
          {},
          { textColor: [0, 128, 0] },
          { textColor: [255, 0, 0] },
          {
            textColor:
              monthData.monthlyTotal.netIncome >= 0 ? [0, 128, 0] : [255, 0, 0],
          },
        ];

        // Generate the table for this month
        autoTable(doc, {
          head: [["Month", "Sales", "Expenses", "Net Income"]],
          body: tableData,
          startY: yPosition,
          theme: "striped",
          headStyles: { fillColor: [204, 85, 0] },
          foot: [
            [
              `${monthData.monthName} ${monthData.year}`,
              `${formatCurrency(monthData.monthlyTotal.sales)}`,
              `${formatCurrency(monthData.monthlyTotal.expenses)}`,
              `${formatCurrency(monthData.monthlyTotal.netIncome)}`,
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

        // Update Y position for next table
        yPosition = doc.lastAutoTable.finalY + 20;
      }
    });

    // Add overall summary if multiple months
    if (monthsToInclude > 1) {
      doc.setFontSize(14);
      doc.text("Overall Summary", 14, yPosition);
      yPosition += 10;

      const overallFooterStyles = [
        {},
        { textColor: [0, 128, 0] },
        { textColor: [255, 0, 0] },
        { textColor: totalData.netIncome >= 0 ? [0, 128, 0] : [255, 0, 0] },
      ];

      // Generate overall summary table
      autoTable(doc, {
        head: [["Period", "Sales", "Expenses", "Net Income"]],
        body: [],
        startY: yPosition,
        theme: "striped",
        headStyles: { fillColor: [204, 85, 0] },
        foot: [
          [
            `Total (${monthsToInclude} Month${monthsToInclude > 1 ? "s" : ""})`,
            `${formatCurrency(totalData.sales)}`,
            `${formatCurrency(totalData.expenses)}`,
            `${formatCurrency(totalData.netIncome)}`,
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
            data.cell.styles.textColor = overallFooterStyles[data.column.index]
              .textColor || [0, 0, 0];
          }
        },
      });
    }

    doc.save(`${fileName || "SalesReport"}.pdf`);
  };

  // CSV
  const exportToCSV = (processedData) => {
    const { monthlyData, totalData } = processedData;

    // Prepare data
    let csvData = [];

    // Add headers
    csvData.push(["Date", "Sales", "Expenses", "Net Income"]);

    // Add data for each month
    monthlyData.forEach((monthData) => {
      // Add month header
      csvData.push([`${monthData.monthName} ${monthData.year}`, "", "", ""]);

      // Add daily data if includeDaily is true
      if (includeDaily) {
        monthData.dailyData.forEach((day) => {
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
        `${monthData.monthName} Total`,
        formatCurrency(monthData.monthlyTotal.sales),
        formatCurrency(monthData.monthlyTotal.expenses),
        formatCurrency(monthData.monthlyTotal.netIncome),
      ]);

      // Add blank line between months
      csvData.push(["", "", "", ""]);
    });

    // Add overall total if multiple months
    if (monthsToInclude > 1) {
      csvData.push([
        `Overall Total (${monthsToInclude} Months)`,
        formatCurrency(totalData.sales),
        formatCurrency(totalData.expenses),
        formatCurrency(totalData.netIncome),
      ]);
    }

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
    const { monthlyData, totalData } = processedData;

    // Prepare data
    let excelData = [];
    let rowIndex = 0;
    let monthHeaders = [];

    // For each month in the data
    monthlyData.forEach((monthData, monthIndex) => {
      // Add month header
      excelData.push([`${monthData.monthName} ${monthData.year}`, "", "", ""]);
      monthHeaders.push(rowIndex);
      rowIndex++;

      // Add column headers
      excelData.push(["Date", "Sales", "Expenses", "Net Income"]);
      rowIndex++;

      // Add daily data if needed
      if (includeDaily) {
        monthData.dailyData.forEach((day) => {
          excelData.push([day.date, day.sales, day.expenses, day.netIncome]);
          rowIndex++;
        });
      }

      // Add monthly total
      excelData.push([
        `${monthData.monthName} Total`,
        monthData.monthlyTotal.sales,
        monthData.monthlyTotal.expenses,
        monthData.monthlyTotal.netIncome,
      ]);
      rowIndex++;

      // Add blank row between months
      if (monthIndex < monthlyData.length - 1) {
        excelData.push(["", "", "", ""]);
        rowIndex++;
      }
    });

    // Add overall total if multiple months
    if (monthsToInclude > 1) {
      excelData.push(["", "", "", ""]);
      rowIndex++;

      excelData.push([
        `Overall Total (${monthsToInclude} Months)`,
        totalData.sales,
        totalData.expenses,
        totalData.netIncome,
      ]);
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Styling
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "CC5500" } },
      alignment: { horizontal: "center" },
    };

    const monthHeaderStyle = {
      font: { bold: true, sz: 14 },
      fill: { fgColor: { rgb: "EEEEEE" } },
    };

    const totalStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "F7F7F7" } },
      border: {
        top: { style: "medium", color: { rgb: "CC5500" } },
      },
    };

    const greenStyle = { font: { bold: true, color: { rgb: "008000" } } };
    const redStyle = { font: { bold: true, color: { rgb: "FF0000" } } };
    const stripedStyle = { fill: { fgColor: { rgb: "F0F0F0" } } };

    // Apply styles
    const range = XLSX.utils.decode_range(ws["!ref"]);

    // Apply month header styles
    monthHeaders.forEach((headerRow) => {
      for (let C = 0; C <= 3; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = monthHeaderStyle;
      }
    });

    // Create workbook with worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

    // Generate and download Excel file
    XLSX.writeFile(wb, `${fileName || "SalesReport"}.xlsx`);
  };

  const handleExport = async () => {
    if (!fileName.trim()) {
      await alert("Please enter a file name", "Error");
      return;
    }

    const processedData = processMultiMonthData();

    if (processedData.monthlyData.length === 0) {
      await alert("No data available to export", "Error");
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

          {/* Number of months to include */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Number of Months to Include
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={monthsToInclude}
              onChange={(e) =>
                setMonthsToInclude(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              {monthsToInclude > 1
                ? `Will include data from ${monthsToInclude} months, from ${month} ${year} going back.`
                : `Will include only ${month} ${year}.`}
            </p>
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
