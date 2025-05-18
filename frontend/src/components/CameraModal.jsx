import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const CameraModal = ({ name, employeeId, onClose, onCapture }) => {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Capture an image from the webcam.
  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
  };

  // Submit the captured image by calling the API endpoint.
  const handleSubmit = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Call your register-time-in endpoint using Axios.
      const response = await axios.post(
        "http://127.0.0.1:8000/register-time-in/",
        {
          employee_id: employeeId,
          image: image,
        }
      );

      if (response.data.success) {
        setSubmitted(true);
        // Optionally, call onCapture to pass the image back to the parent.
        onCapture(image);
        onClose(); // Close the modal after successful registration.
      } else {
        alert(response.data.error || "Failed to register attendance.");
      }
    } catch (err) {
      console.error("Error submitting image:", err);
      alert("Failed to register attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Allow the user to retake the image.
  const retake = () => {
    setImage(null);
    setSubmitted(false);
  };

  // Prevent closing if the image has been captured but not submitted.
  const handleClose = () => {
    if (image && !submitted) {
      alert("Please submit your picture before closing.");
      return;
    }
    onClose();
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
          {/* Show Capture button if no image has been captured */}
          {!image && (
            <button
              onClick={capture}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Capture
            </button>
          )}
          {/* Show Retake and Submit buttons if an image has been captured but not submitted */}
          {image && !submitted && (
            <>
              <button
                onClick={retake}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
              >
                Retake
              </button>
              <button
                onClick={handleSubmit}
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </>
          )}
          {/* Always show the Close button */}
          <button
            onClick={handleClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
