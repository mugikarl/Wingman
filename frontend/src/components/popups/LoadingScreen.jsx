import React from "react";
// Import the GIF file
import LoadingVideo from "./LoadingScreen.gif";
import "./loadingAnimation.css"; // Import CSS file for animations

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      {/* GIF Container */}
      <div className="flex flex-col items-center">
        {/* GIF Image */}
        <img
          src={LoadingVideo}
          alt="Loading..."
          className="w-[150px] h-[150px]"
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
