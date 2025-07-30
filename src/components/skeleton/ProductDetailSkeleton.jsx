const ProductDetailSkeleton = () => {
  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row animate-pulse">
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            <div className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 bg-gray-300 h-24"></div>
            <div className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 bg-gray-300 h-24"></div>
            <div className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 bg-gray-300 h-24"></div>
          </div>
          <div className="w-full sm:w-[80%] bg-gray-300 h-64"></div>
        </div>

        <div className="flex-1">
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="flex items-center gap-1 mt-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="pl-2 w-10 h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="mt-5 h-8 bg-gray-300 rounded w-1/2"></div>
          <div className="mt-5 h-4 bg-gray-300 rounded w-full md:w-4/5"></div>
          <div className="flex flex-col gap-4 my-8">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="flex gap-2">
              <div className="border py-2 px-4 bg-gray-300 w-12 h-12"></div>
              <div className="border py-2 px-4 bg-gray-300 w-12 h-12"></div>
              <div className="border py-2 px-4 bg-gray-300 w-12 h-12"></div>
            </div>
          </div>
          <div className="bg-gray-300 text-white px-8 py-3 text-sm w-32 h-12"></div>
          <hr className="mt-8 sm:w-3/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          </div>
        </div>
      </div>
      <div className="mt-20">
        <div className="flex">
          <div className="border px-5 py-3 text-sm bg-gray-300 w-32 h-12"></div>
          <div className="border px-5 py-3 text-sm bg-gray-300 w-32 h-12"></div>
        </div>
        <div className="flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
