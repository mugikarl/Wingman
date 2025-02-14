import React, { useState } from 'react'
import AttendanceSheet from '../../components/tables/AttendanceSheet'
import TimeIn from '../../components/popups/TimeIn';

const Attendance = () => {
    const [isTimeInModalOpen, setIsTimeInModalOpen] = useState(false);

    return (
        <div className='flex-grow p-6 bg-[#E2D6D5] min-h-full'>
            <div className="flex items-start mb-4 space-x-4">
                <button
                    onClick={() => setIsTimeInModalOpen(true)}
                    className="bg-[#E88504] text-white p-2 rounded-lg w-auto shadow"
                >
                    Time In
                </button>
                <button
                    className="bg-[#E88504] text-white p-2 rounded-lg w-auto shadow"
                >
                    Time Out
                </button>
            </div>
            <div className='space-y-4'>
                <AttendanceSheet />
            </div>

            {/* Show modal when isTimeInModalOpen is true */}
            {isTimeInModalOpen && <TimeIn closeModal={() => setIsTimeInModalOpen(false)} />}
        </div>
    )
}

export default Attendance