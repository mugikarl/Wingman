import React from "react";

const ItemBox = ({
  item,
  image,
  name,
  price,
  currency = "₱",
  inStock,
  onClick,
}) => {
  return (
    <div
      className="w-full max-w-xs rounded-lg overflow-hidden shadow-md bg-white hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900">{name}</h3>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center">
            <span className="text-gray-700">{currency}</span>
            <p className="text-gray-900 font-bold ml-1">{price}</p>
          </div>
          <span
            className={`text-sm ${inStock ? "text-green-500" : "text-red-500"}`}
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ItemBox;
