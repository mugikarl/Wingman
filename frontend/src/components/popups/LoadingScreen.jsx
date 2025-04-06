import React from "react";
import LoadingVideo from "./LoadingScreen.gif";

const LoadingScreen = ({ message }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#fcf4dc]">
      {/* GIF Container */}
      <div className="flex flex-col items-center z-10 relative">
        {/* GIF Image */}
        <img
          src={LoadingVideo}
          alt="Loading..."
          className="w-[150px] h-[150px]"
        />
        <div className="flex text-4xl font-light text-black mt-4 text-center">
          {message ? (
            <p>
              {message}
              <span className="loading-dots"></span>
            </p>
          ) : (
            <span className="loading-dots"></span>
          )}
        </div>
      </div>

      <style jsx>{`
        .loading-dots::after {
          content: ".";
          animation: dots 1.5s steps(3, end) infinite;
          display: inline-block;
          width: 3ch;
          text-align: center;
        }

        @keyframes dots {
          0%,
          20% {
            content: ".";
          }
          40%,
          60% {
            content: "..";
          }
          80%,
          100% {
            content: "...";
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
