
import React from 'react';
import type { InventoryItem as InventoryItemType } from '../types';
import { InventoryItem } from './InventoryItem';

interface PrGroupProps {
  prNumber: string;
  items: InventoryItemType[];
  onEdit: (item: InventoryItemType) => void;
  onDelete: (id: string) => void;
}

interface TableHeaderProps {
    children: React.ReactNode;
    className?: string;
}

const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => (
  <th className={`px-4 py-3 text-left text-xs uppercase tracking-wider ${className || 'font-medium text-gray-500'}`}>{children}</th>
);

export const PrGroup: React.FC<PrGroupProps> = ({ prNumber, items, onEdit, onDelete }) => {
  return (
    <div id={`pr-${prNumber}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 transition-all duration-300">
      <h3 className="text-lg font-semibold text-secondary mb-3">PR Number: {prNumber}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <TableHeader>Item Code</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Weight (kg)</TableHeader>
              <TableHeader className="font-bold text-blue-800 bg-blue-50 border-b-2 border-blue-100">PR Qty</TableHeader>
              <TableHeader className="font-bold text-purple-800 bg-purple-50 border-b-2 border-purple-100">Required Qty</TableHeader>
              <TableHeader className="font-bold text-green-800 bg-green-50 border-b-2 border-green-100">Received Qty</TableHeader>
              <TableHeader className="font-bold text-orange-800 bg-orange-50 border-b-2 border-orange-100">Used Qty</TableHeader>
              <TableHeader className="font-bold text-gray-700 bg-gray-50 border-b-2 border-gray-300">Balance Qty</TableHeader>
              <TableHeader className="font-extrabold text-indigo-900 bg-indigo-100 border-b-2 border-indigo-300 shadow-sm">Remaining Qty</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <InventoryItem
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
