import React from "react";

const ItemBox = ({ item, onClick }) => {
  return (
    <div
      className="p-4 bg-[#E2D6D5] rounded-lg shadow cursor-pointer flex flex-col justify-between"
      onClick={() => onClick(item)}
    >
      <img
        src="/images/chicken.jpg"
        alt={item.name}
        className="w-full object-cover mb-2"
      />
      <div className="text-center font-bold mb-2">{item.name}</div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-700">Left Text</span>
        <span className="text-sm text-gray-700">Right Text</span>
      </div>
    </div>
  );
};

export default ItemBox;