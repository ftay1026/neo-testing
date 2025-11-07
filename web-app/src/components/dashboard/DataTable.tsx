import { ReactNode } from "react";

// Column definition type
export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

// Table props type
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  className = "",
  headerClassName = "",
  rowClassName = "",
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const getRowClassName = (row: T, index: number): string => {
    if (typeof rowClassName === "function") {
      return rowClassName(row, index);
    }
    return rowClassName;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className={` ${headerClassName}`}>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`text-left px-4 py-3 text-sm font-medium  ${
                  column.headerClassName || ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8 text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-primary/5 hover:bg-background-bg/50 transition-colors ${getRowClassName(
                  row,
                  rowIndex
                )}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-4 text-sm text-gray-300 ${
                      column.className || ""
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Example Usage Components Below:

// 2. Credits Table Example
export function CreditsTableExample() {
  const creditsData = [
    {
      user: "John Smith",
      email: "john@example.com",
      credits: 5000,
      expiresOn: "2025-01-20",
      daysLeft: 95,
    },
    {
      user: "Sarah Johnson",
      email: "sarah@example.com",
      credits: 8500,
      expiresOn: "2025-02-15",
      daysLeft: 121,
    },
  ];

  const columns: Column<typeof creditsData[0]>[] = [
    { key: "user", header: "User" },
    { key: "email", header: "Email" },
    { key: "credits", header: "Credits" },
    { key: "expiresOn", header: "Expires On" },
    {
      key: "daysLeft",
      header: "Days Left",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded text-xs ${
            value < 90
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-white"
          }`}
        >
          {value} days
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs">
          Extend
        </button>
      ),
    },
  ];

  return (
    <div className="bg-[#1E1E1E] rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Credits</h2>
      <DataTable columns={columns} data={creditsData} />
    </div>
  );
}

// 3. Promo Codes Table Example
export function PromoCodesTableExample() {
  const promoData = [
    {
      code: "WELCOME2025",
      credits: 1000,
      uses: "45 / 100",
      status: "active",
      expiry: "2025-12-31",
    },
    {
      code: "BETA50",
      credits: 5000,
      uses: "23 / 50",
      status: "active",
      expiry: "2025-06-30",
    },
    {
      code: "LAUNCH500",
      credits: 500,
      uses: "150 / 150",
      status: "expired",
      expiry: "2024-10-15",
    },
  ];

  const columns: Column<typeof promoData[0]>[] = [
    { key: "code", header: "Code" },
    { key: "credits", header: "Credits" },
    { key: "uses", header: "Uses" },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded text-xs ${
            value === "active"
              ? "bg-gray-700 text-white"
              : "bg-gray-600 text-gray-400"
          }`}
        >
          {value}
        </span>
      ),
    },
    { key: "expiry", header: "Expiry" },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs">
            Edit
          </button>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs">
            Deactivate
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[#1E1E1E] rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Promo Codes</h2>
      <DataTable columns={columns} data={promoData} />
    </div>
  );
}

// 4. Package Sales Table Example
export function PackageSalesTableExample() {
  const salesData = [
    {
      package: "$20 Package",
      unitsSold: 245,
      revenue: "$4,900",
      apiCost: "$1,633",
      profit: "$3,267",
      margin: "66.7%",
    },
    {
      package: "$200 Package",
      unitsSold: 89,
      revenue: "$17,800",
      apiCost: "$5,933",
      profit: "$11,867",
      margin: "66.7%",
    },
    {
      package: "$500 Package",
      unitsSold: 34,
      revenue: "$17,000",
      apiCost: "$5,667",
      profit: "$11,333",
      margin: "66.7%",
    },
  ];

  const columns: Column<typeof salesData[0]>[] = [
    { key: "package", header: "Package" },
    { key: "unitsSold", header: "Units Sold" },
    { key: "revenue", header: "Revenue" },
    { key: "apiCost", header: "API Cost" },
    {
      key: "profit",
      header: "Profit",
      render: (value) => <span className="text-green-500">{value}</span>,
    },
    { key: "margin", header: "Margin" },
  ];

  return (
    <div className="bg-[#1E1E1E] rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Package Sales</h2>
      <DataTable
        columns={columns}
        data={salesData}
        rowClassName={(row, index) =>
          index === salesData.length - 1 ? "bg-gray-700/50 font-medium" : ""
        }
      />
    </div>
  );
}

// 5. Recent Transactions Table Example
export function TransactionsTableExample() {
  const transactionsData = [
    {
      transactionId: "#12453",
      user: "john@example.com",
      package: "$200 Package",
      credits: "22.5K",
      amount: "$200",
      date: "2025-10-17",
    },
    {
      transactionId: "#12452",
      user: "sarah@example.com",
      package: "$20 Package",
      credits: "2K",
      amount: "$20",
      date: "2025-10-17",
    },
  ];

  const columns: Column<typeof transactionsData[0]>[] = [
    { key: "transactionId", header: "Transaction ID" },
    { key: "user", header: "User" },
    { key: "package", header: "Package" },
    { key: "credits", header: "Credits" },
    { key: "amount", header: "Amount" },
    { key: "date", header: "Date" },
  ];

  return (
    <div className="bg-[#1E1E1E] rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Recent Transactions
      </h2>
      <DataTable columns={columns} data={transactionsData} />
    </div>
  );
}