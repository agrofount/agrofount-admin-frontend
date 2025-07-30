export const DashboardOrderListSkeleton = () => {
  return (
    <tbody className="bg-white divide-y divide-gray-200 animate-pulse">
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td className="px-6 py-5 whitespace-nowrap">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-lg"></div>
              <div className="ml-4">
                <div className="w-48 h-4 bg-gray-300 rounded mb-2"></div>
              </div>
            </div>
          </td>
          <td className="px-6 py-5 whitespace-nowrap">
            <div className="w-32 h-4 bg-gray-300 rounded mb-1"></div>
            <div className="w-24 h-4 bg-gray-300 rounded"></div>
          </td>
          <td className="px-6 py-5 whitespace-nowrap">
            <div className="w-8 h-4 bg-gray-300 rounded"></div>
          </td>
          <td className="px-6 py-5 whitespace-nowrap">
            <div className="w-20 h-4 bg-gray-300 rounded"></div>
          </td>
          <td className="px-6 py-5 whitespace-nowrap">
            <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};
