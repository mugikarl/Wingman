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
      className="w-48 h-full rounded-lg pb-3 overflow-hidden shadow-md bg-white hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="px-3 pt-3">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="w-full h-32 shadow-md object-cover rounded-lg"
        />
      </div>
      <div className="px-3 pt-2">
        <h3 className="text-base font-medium text-gray-900">{name}</h3>
        <div className="flex justify-between items-center">
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
