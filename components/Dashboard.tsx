import React, { useMemo, useState, useEffect } from 'react';
import type { InventoryItem } from '../types';
import { ProjectSection } from './ProjectSection';

interface DashboardProps {
  inventory: InventoryItem[];
  userRole: 'incharge' | 'store';
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  targetProject?: string;
  targetPr?: string;
  targetTs?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, userRole, onEdit, onDelete, targetProject, targetPr, targetTs }) => {
  const groupedByProject = useMemo(() => {
    return inventory.reduce((acc, item) => {
      (acc[item.projectId] = acc[item.projectId] || []).push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);
  }, [inventory]);
  
  const sortedProjectIds = useMemo(() => Object.keys(groupedByProject).sort(), [groupedByProject]);
  
  const [activeProject, setActiveProject] = useState<string | null>(null);

  useEffect(() => {
    if (targetProject && groupedByProject[targetProject]) {
        setActiveProject(targetProject);
    } else if (sortedProjectIds.length > 0 && activeProject === null) {
        setActiveProject(sortedProjectIds[0]);
    }
  }, [targetProject, targetTs, sortedProjectIds, groupedByProject]);

  if (inventory.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm">
        <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No inventory items</h3>
        {userRole === 'incharge' && <p className="mt-2 text-gray-500">Get started by adding a new item via the "Add Item" button.</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-4">
         <h2 className="text-lg font-semibold text-gray-700 mb-3">Select Project</h2>
         <div className="flex flex-wrap gap-2">
            {sortedProjectIds.map(projectId => (
                <button
                    key={projectId}
                    onClick={() => setActiveProject(projectId)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm border ${
                        activeProject === projectId
                            ? 'bg-primary text-white border-primary ring-2 ring-offset-2 ring-primary/50'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                >
                    {projectId}
                </button>
            ))}
         </div>
      </div>

      <div className="animate-fade-in min-h-[500px]">
        {activeProject && groupedByProject[activeProject] ? (
            <ProjectSection
                projectId={activeProject}
                items={groupedByProject[activeProject]}
                userRole={userRole}
                onEdit={onEdit}
                onDelete={onDelete}
                targetPr={targetProject === activeProject ? targetPr : undefined}
                targetTs={targetTs}
            />
        ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400">Select a project to view details</p>
            </div>
        )}
      </div>
    </div>
  );
};