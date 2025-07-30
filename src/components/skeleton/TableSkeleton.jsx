const TableSkeleton = () => {
  return (
    <tbody>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td className="px-2 py-5 whitespace-nowrap">
            <div className="flex flex-row items-start gap-4">
              <div className="w-10 h-10 bg-gray-300 rounded"></div>
              <div className="flex flex-col gap-2">
                <div className="w-48 h-4 bg-gray-300 rounded"></div>
                <div className="w-32 h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          </td>
          <td className="px-2 py-5 whitespace-nowrap">
            <div className="w-24 h-4 bg-gray-300 rounded"></div>
          </td>
          <td className="px-2 py-5 whitespace-nowrap">
            <div className="w-24 h-4 bg-gray-300 rounded"></div>
          </td>
          <td className="px-2 py-5 whitespace-nowrap">
            <div className="w-16 h-4 bg-gray-300 rounded"></div>
          </td>
          <td className="px-2 py-5 whitespace-nowrap">
            <div className="w-16 h-4 bg-gray-300 rounded"></div>
          </td>
          <td className="px-2 py-5 whitespace-nowrap">
            <div className="w-24 h-4 bg-gray-300 rounded"></div>
          </td>
          <td className="px-2 py-5 whitespace-nowrap">
            <div className="w-24 h-4 bg-gray-300 rounded"></div>
          </td>
          <td className="px-2 py-5 whitespace-nowrap">
            <div className="flex flex-row gap-3 items-center">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export default TableSkeleton;
