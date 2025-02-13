import React from 'react'
import AttendanceSheet from '../../components/tables/AttendanceSheet'

const Attendance = () => {
    return (
        <div className='flex-grow p-6 bg-[#E2D6D5] min-h-full'>
        <div className="flex items-start mb-4 space-x-4">
            <button
            //   onClick={openAddModal}
            className="bg-[#E88504] text-white p-2 rounded-lg w-auto shadow"
            >
            Time In
            </button>
            <button
            //   onClick={openAddModal}
            className="bg-[#E88504] text-white p-2 rounded-lg w-auto shadow"
            >
            Time Out
            </button>
        </div>
        <div className='space-y-4'>
            <AttendanceSheet />
        </div>
        </div>
  )
}

export default Attendance
