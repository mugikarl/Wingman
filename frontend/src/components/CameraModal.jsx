import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

const CameraModal = ({ name, onClose, onCapture }) => {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
    onCapture(imageSrc); // Pass the captured image back to the parent component
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Hello, {name}</h2>
        <div className="mb-4">
          {image ? (
            <img src={image} alt="Captured" className="w-full rounded-lg" />
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full rounded-lg"
            />
          )}
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>
          {!image && (
            <button
              onClick={capture}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;