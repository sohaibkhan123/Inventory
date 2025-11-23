
import React, { useMemo } from 'react';
import type { InventoryItem } from '../types';

interface SummaryPageProps {
  inventory: InventoryItem[];
  onPrClick: (projectId: string, prNumber: string) => void;
}

export const SummaryPage: React.FC<SummaryPageProps> = ({ inventory, onPrClick }) => {
  const projectStats = useMemo(() => {
    const stats: Record<string, { 
        prNumbers: Set<string>, 
        totalItems: number, 
        completedPrs: number,
        itemsByPr: Record<string, InventoryItem[]>
    }> = {};

    // Group data
    inventory.forEach(item => {
        if (!stats[item.projectId]) {
            stats[item.projectId] = {
                prNumbers: new Set(),
                totalItems: 0,
                completedPrs: 0,
                itemsByPr: {}
            };
        }
        stats[item.projectId].prNumbers.add(item.prNumber);
        stats[item.projectId].totalItems += 1;
        
        if (!stats[item.projectId].itemsByPr[item.prNumber]) {
            stats[item.projectId].itemsByPr[item.prNumber] = [];
        }
        stats[item.projectId].itemsByPr[item.prNumber].push(item);
    });

    // Calculate Completed PRs (This logic remains for the top level stat)
    Object.keys(stats).forEach(projectId => {
        const prs = stats[projectId].itemsByPr;
        let completedCount = 0;
        
        Object.keys(prs).forEach(pr => {
            const items = prs[pr];
            const isComplete = items.every(item => item.receivedQty >= item.requiredQty);
            if (isComplete) {
                completedCount++;
            }
        });
        
        stats[projectId].completedPrs = completedCount;
    });

    return stats;
  }, [inventory]);

  const projectIds = Object.keys(projectStats).sort();

  if (projectIds.length === 0) {
      return (
        <div className="text-center py-20">
            <h3 className="text-lg font-semibold text-gray-600">No project data available.</h3>
        </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Project Summary</h2>
          <p className="text-gray-500 mt-2">High-level overview of Purchase Requests (PRs) status per project.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {projectIds.map(projectId => {
            const stat = projectStats[projectId];
            const totalPrs = stat.prNumbers.size;
            const completionRate = totalPrs > 0 ? Math.round((stat.completedPrs / totalPrs) * 100) : 0;
            const prList = Array.from(stat.prNumbers).sort();

            return (
                <div key={projectId} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col">
                    <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-bold text-white">{projectId}</h3>
                        <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/30">
                            {stat.totalItems} Total Items
                        </span>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col">
                        {/* Top Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                <p className="text-xs text-gray-500 font-medium uppercase">Total PRs</p>
                                <p className="text-2xl font-bold text-gray-800">{totalPrs}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                                <p className="text-xs text-green-600 font-medium uppercase">Completed</p>
                                <p className="text-2xl font-bold text-green-700">{stat.completedPrs}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-medium mb-1">
                                <span className="text-gray-600">Project Completion</span>
                                <span className="text-blue-600">{completionRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${completionRate}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* PR Details Table */}
                        <div className="mt-auto">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">PR Details</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-600">
                                            <th className="px-3 py-2 text-left font-semibold rounded-l-md">PR Number</th>
                                            <th className="px-3 py-2 text-center font-semibold">Elements</th>
                                            <th className="px-3 py-2 text-center font-semibold">Delivered</th>
                                            <th className="px-3 py-2 text-right font-semibold rounded-r-md">View</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {prList.map(pr => {
                                            const items = stat.itemsByPr[pr];
                                            const totalElements = items.length;
                                            // Delivered = items fully received
                                            const deliveredElements = items.filter(i => i.receivedQty >= i.requiredQty).length;
                                            const isFullyDelivered = totalElements === deliveredElements && totalElements > 0;
                                            
                                            return (
                                                <tr 
                                                    key={pr} 
                                                    onClick={() => onPrClick(projectId, pr)}
                                                    className="group hover:bg-blue-50 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-3 py-3 font-medium text-blue-700 group-hover:text-blue-900">
                                                        {pr}
                                                    </td>
                                                    <td className="px-3 py-3 text-center text-gray-600">
                                                        {totalElements}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                            isFullyDelivered 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : deliveredElements === 0 
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {isFullyDelivered ? "Delivered" : `${deliveredElements} / ${totalElements}`}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-gray-400 group-hover:text-blue-600">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
