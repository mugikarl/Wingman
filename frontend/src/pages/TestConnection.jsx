import React from "react";
import axios from "axios";

const TestConnection = () => {
  const handleTest = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/test/");
      alert(response.data.message); // Display the response message
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Connection failed!");
    }
  };

  return (
    <div className="flex justify-center mt-4">
      <button
        onClick={handleTest}
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
      >
        Test Backend Connection
      </button>
    </div>
  );
};

export default TestConnection;