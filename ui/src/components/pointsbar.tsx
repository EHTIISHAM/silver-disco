const PointsDistribution = () => {
  const distributionData = [
    { place: "1st Place", value: 80, max: 100 },
    { place: "2nd Place", value: 70, max: 100 },
    { place: "3rd Place", value: 30, max: 100 },
    { place: "4-10th Place", value: 20, max: 100 },
    { place: "11+ Place", value: 10, max: 100 },
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
