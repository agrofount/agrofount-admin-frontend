const ReviewListSkeleton = () => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="flex items-center justify-between mb-4" key={index}>
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="flex flex-col">
              <div className="w-24 h-4 bg-gray-300 rounded mb-2"></div>
              <div className="flex items-center gap-1 pb-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 bg-gray-300 rounded"
                  ></div>
                ))}
              </div>
              <div className="w-48 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewListSkeleton;
