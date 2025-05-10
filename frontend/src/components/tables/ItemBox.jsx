import React from "react";

const ItemBox = ({
  item,
  image,
  name,
  price,
  currency = "₱",
  status,
  onClick,
}) => {
  const isAvailable = status === 1;
  return (
    <div
      onClick={onClick}
      className={`relative w-54 h-full rounded-lg pb-3 overflow-hidden border transition-shadow duration-300 bg-white cursor-pointer hover:shadow-lg"`}
    >
      <div className="px-3 pt-3">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="w-full h-32 object-cover rounded-lg shadow-md"
        />
      </div>
      <div className="px-3 pt-2">
        <h3 className="text-base font-medium text-gray-900">{name}</h3>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-gray-700">{currency}</span>
            <p className="ml-1 font-bold text-gray-900">{price}</p>
          </div>
          <span
            className={`text-sm ${
              isAvailable ? "text-green-500" : "text-red-500"
            }`}
          >
            {isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>
      {/* Grey overlay for unavailable items */}
      {!isAvailable && (
        <div className="absolute inset-0 bg-gray-400 opacity-50 pointer-events-none"></div>
      )}
    </div>
  );
};

export default ItemBox;
