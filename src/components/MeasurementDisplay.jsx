import React from 'react';

export default function MeasurementDisplay({ areaSqFt }) {
    // Pitch multipliers
    const pitches = [
        { label: 'Flat (0-1/12)', value: 1.00 },
        { label: 'Low Slope (2-4/12)', value: 1.05 },
        { label: 'Medium Slope (5-8/12)', value: 1.12 },
        { label: 'Steep Slope (9-12/12)', value: 1.25 },
        { label: 'Extra Steep (12+/12)', value: 1.40 },
    ];

    const [multiplier, setMultiplier] = React.useState(1.00);

    if (areaSqFt === null || areaSqFt === 0) return null;

    const adjustedArea = areaSqFt * multiplier;

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-8 py-6 rounded-xl shadow-2xl border border-gray-200 min-w-[300px]">
            <div className="text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-2">Estimated Roof Area</p>

                <div className="flex items-baseline justify-center gap-2 mb-4">
                    <span className="text-5xl font-extrabold text-gray-900 tracking-tight">{Math.round(adjustedArea).toLocaleString()}</span>
                    <span className="text-xl text-gray-600 font-medium">sq ft</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <label htmlFor="pitch-select" className="text-sm text-gray-600 font-medium">Roof Pitch / Slope</label>
                    <select
                        id="pitch-select"
                        value={multiplier}
                        onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                        className="w-full text-center bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors hover:bg-gray-100"
                    >
                        {pitches.map((p) => (
                            <option key={p.label} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
