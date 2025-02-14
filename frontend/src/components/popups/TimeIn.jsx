import React from 'react'

const TimeIn = ({ closeModal }) => {
    return (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 p-4">
            <div className="bg-white rounded-lg p-6 w-8/10 space-y-4 relative">
                <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-800"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold">Time In</h2>
                {/* Add more modal content here */}
            </div>
        </div>
    )
}

export default TimeIn
