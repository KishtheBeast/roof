import React from 'react';

export default function MeasurementDisplay({ areaSqFt }) {
    if (areaSqFt === null || areaSqFt === 0) return null;

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-8 py-4 rounded-xl shadow-2xl border border-gray-200">
            <div className="text-center">
                <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Total Roof Area</p>
                <div className="flex items-baseline justify-center gap-2 mt-1">
                    <span className="text-4xl font-bold text-gray-900">{Math.round(areaSqFt).toLocaleString()}</span>
                    <span className="text-xl text-gray-600 font-medium">sq ft</span>
                </div>
            </div>
        </div>
    );
}
