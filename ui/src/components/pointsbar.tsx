const PointsDistribution = ( { pointsOverTime }: { pointsOverTime: { [key: string]: number } } ) => {
  const distributionData = [
    { place: "1st Place", value: pointsOverTime["1"] || 0, max: 100 },
    { place: "2nd Place", value: pointsOverTime["2"] || 0, max: 100 },
    { place: "3rd Place", value: pointsOverTime["3"] || 0, max: 100 },
    { place: "4-10th Place", value: pointsOverTime["4-10"] || 0, max: 100 },
    { place: "11+ Place", value: pointsOverTime["11+"] || 0, max: 100 },
  ];

  return (
    <div className="w-full max-w-md bg-[#121212] rounded-xl p-4 shadow-lg">
      <h3 className="text-white font-semibold text-lg mb-4">Points Distribution</h3>

      <div className="space-y-4">
        {distributionData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-300 text-sm font-medium">{item.place}</span>
              <span className="text-white text-sm font-semibold">{item.value}</span>
            </div>

            <div className="w-full bg-[#2b2b36] rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full"
                style={{ width: `${(item.value / item.max) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PointsDistribution;

