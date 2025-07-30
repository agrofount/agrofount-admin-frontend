const OrderDetailSkeleton = () => {
  return (
    <section>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:w-64 flex-1">
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-md p-5 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-5/6"></div>
            </div>

            <div className="bg-white rounded-md p-5 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-4/5"></div>
                <div className="h-6 bg-gray-200 rounded w-3/5"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-md p-5 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-4/5"></div>
              <div className="h-6 bg-gray-200 rounded w-3/5"></div>
              <div className="h-6 bg-gray-200 rounded w-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-md p-5 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>

          <div className="bg-white rounded-md p-5 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-4/5"></div>
              <div className="h-6 bg-gray-200 rounded w-3/5"></div>
              <div className="h-6 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderDetailSkeleton;
