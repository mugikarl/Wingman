import React from "react";
import LoadingVideo from "./LoadingScreen.mp4"; // Import the video file

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent">
      {/* Video Container */}
      <div className="flex items-center">
        {/* Video */}
        <video
          autoPlay
          loop
          muted
          className="w-[100px] h-[100px] mr-4" // Ensure the video has a transparent background
        >
          <source src={LoadingVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Animated ... */}
        <div className="flex space-x-1">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce delay-100">.</span>
          <span className="animate-bounce delay-200">.</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;