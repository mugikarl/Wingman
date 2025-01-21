import React from "react";

const Menu = () => {
  return (
    <div className="h-screen bg-[#E2D6D5] flex flex-col p-6">
      {/* Top Section */}
      <div className="flex flex-col space-y-8 mb-8">
        {/* Search Bar and Buttons Section */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="w-1/2">
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-2 border rounded-lg shadow"
            />
          </div>
        </div>

        {/* Scrollable Buttons */}
        <div className="scrollable-buttons flex-grow flex space-x-4 w-3/4 overflow-x-auto">
          <button className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Button 1
          </button>
          <button className="flex items-center justify-center bg-green-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Button 2
          </button>
          <button className="flex items-center justify-center bg-yellow-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Button 3
          </button>
          <button className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Button 4
          </button>
          <button className="flex items-center justify-center bg-purple-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Button 5
          </button>
          <button className="flex items-center justify-center bg-pink-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Button 6
          </button>
          <button className="flex items-center justify-center bg-gray-500 text-white p-2 rounded-lg shadow min-w-[15%] text-sm">
            Button 7
          </button>
        </div>

        {/* Single Button */}
        <div className="w-1/4 grid grid-cols-4 gap-4">
          <button className="flex flex-col items-center bg-[#FF0000] p-4 rounded-lg shadow h-full">
            <img
              src="/images/stockout/trash.png"
              alt="Disposed"
              className="w-16 h-16 mb-2"
            />
            <span className="text-white font-bold">Disposed</span>
          </button>
        </div>
      </div>

      {/* Rectangles Section */}
      <div className="flex space-x-4 overflow-x-auto">
        <div className="bg-white content-rectangle shadow p-4 relative">
          <img
            src="/images/rectangle1.png"
            alt="Rectangle Image"
            className="w-full h-3/5 object-cover rounded-t-md mb-2"
          />
          <div>
            <p className="text-base font-medium">Title 1</p>
            <p className="text-sm text-gray-600">Subtitle 1</p>
          </div>
        </div>
        <div className="bg-white content-rectangle shadow p-4 relative">
          <img
            src="/images/rectangle2.png"
            alt="Rectangle Image"
            className="w-full h-3/5 object-cover rounded-t-md mb-2"
          />
          <div>
            <p className="text-base font-medium">Title 2</p>
            <p className="text-sm text-gray-600">Subtitle 2</p>
          </div>
        </div>
        <div className="bg-white content-rectangle shadow p-4 relative">
          <img
            src="/images/rectangle3.png"
            alt="Rectangle Image"
            className="w-full h-3/5 object-cover rounded-t-md mb-2"
          />
          <div>
            <p className="text-base font-medium">Title 3</p>
            <p className="text-sm text-gray-600">Subtitle 3</p>
          </div>
        </div>
        <div className="bg-white content-rectangle shadow p-4 relative">
          <img
            src="/images/rectangle4.png"
            alt="Rectangle Image"
            className="w-full h-3/5 object-cover rounded-t-md mb-2"
          />
          <div>
            <p className="text-base font-medium">Title 4</p>
            <p className="text-sm text-gray-600">Subtitle 4</p>
          </div>
        </div>
        <div className="bg-white content-rectangle shadow p-4 relative">
          <img
            src="/images/rectangle5.png"
            alt="Rectangle Image"
            className="w-full h-3/5 object-cover rounded-t-md mb-2"
          />
          <div>
            <p className="text-base font-medium">Title 5</p>
            <p className="text-sm text-gray-600">Subtitle 5</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
