
import React, { useMemo, useEffect } from 'react';
import type { InventoryItem } from '../types';
import { PrGroup } from './PrGroup';

interface ProjectSectionProps {
  projectId: string;
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  targetPr?: string;
  targetTs?: number;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({ projectId, items, onEdit, onDelete, targetPr, targetTs }) => {
  const groupedByPR = useMemo(() => {
    return items.reduce((acc, item) => {
      (acc[item.prNumber] = acc[item.prNumber] || []).push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);
  }, [items]);
  
  const sortedPrNumbers = useMemo(() => Object.keys(groupedByPR).sort(), [groupedByPR]);

  // Auto-scroll to target PR when navigation occurs
  useEffect(() => {
    if (targetPr) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        const element = document.getElementById(`pr-${targetPr}`);
        if (element) {
          // Scroll to element
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Apply a temporary highlight effect
          element.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-50');
          setTimeout(() => {
             element.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-50');
          }, 2500);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [targetPr, targetTs, projectId]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-shadow duration-300 hover:shadow-xl">
      <h2 className="text-2xl font-bold text-primary mb-4 border-b-2 border-gray-100 pb-2">
        Project: <span className="text-gray-700">{projectId}</span>
      </h2>
      <div className="space-y-6">
        {sortedPrNumbers.map(prNumber => (
          <PrGroup
            key={prNumber}
            prNumber={prNumber}
            items={groupedByPR[prNumber]}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
