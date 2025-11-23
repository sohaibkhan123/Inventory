
import React, { useState } from 'react';
import type { InventoryItem } from '../types';
import { Modal } from './Modal';
import { UsageModal } from './UsageModal';

interface UsagePageProps {
  inventory: InventoryItem[];
  onAddUsage: (itemId: string, projectId: string, quantity: number, issuedTo: string, issueSlipImage?: string) => void;
  onDeleteUsage: (itemId: string, usageId: string) => void;
}

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100 z-10">
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode; className?: string; wrap?: boolean }> = ({ children, className = '', wrap = false }) => (
  <td className={`px-6 py-4 text-sm text-gray-900 ${wrap ? 'whitespace-normal' : 'whitespace-nowrap'} ${className}`}>
    {children}
  </td>
);

export const UsagePage: React.FC<UsagePageProps> = ({ inventory, onAddUsage, onDeleteUsage }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract all unique project IDs for the dropdown from the entire inventory
  const allProjects = Array.from(new Set(inventory.map(item => item.projectId))).sort();

  const handleOpenModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const handleSaveUsage = (itemId: string, projectId: string, quantity: number, issuedTo: string, issueSlipImage?: string) => {
    onAddUsage(itemId, projectId, quantity, issuedTo, issueSlipImage);
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Inventory Usage Tracking</h2>
          <p className="text-gray-500 text-sm mt-1">Track item consumption across different projects.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader>Source Project</TableHeader>
                <TableHeader>Item Code</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Weight (kg)</TableHeader>
                <TableHeader>Rec Qty</TableHeader>
                <TableHeader>Usage</TableHeader>
                <TableHeader>Used In / Issued To</TableHeader>
                <TableHeader>Issue Slips</TableHeader>
                <TableHeader>Remaining Qty</TableHeader>
                <TableHeader>Action</TableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map(item => {
                const totalUsed = (item.usage || []).reduce((sum, u) => sum + u.quantity, 0);
                const remainingQty = item.receivedQty - totalUsed;
                const usageDetails = item.usage || [];
                
                // Determine status color based on availability
                let balanceColor = 'text-success font-bold';
                if (remainingQty === 0) balanceColor = 'text-gray-400 font-medium';
                else if (remainingQty < item.receivedQty * 0.2) balanceColor = 'text-warning font-bold';

                const uniqueUsedProjects = Array.from(new Set(usageDetails.map(u => u.projectId)));
                const hasIssueSlips = usageDetails.some(u => !!u.issueSlipImage);

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-semibold text-primary">{item.projectId}</TableCell>
                    <TableCell className="font-medium">{item.itemCode}</TableCell>
                    <TableCell className="text-gray-600 min-w-[350px]" wrap>{item.description}</TableCell>
                    <TableCell className="text-gray-600">{item.weight.toLocaleString()}</TableCell>
                    <TableCell>{item.receivedQty.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={totalUsed > 0 ? "text-gray-900 font-medium" : "text-gray-400"}>
                        {totalUsed.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 max-w-xs whitespace-normal">
                        {usageDetails.length > 0 ? (
                           <div className="space-y-1">
                             {uniqueUsedProjects.map(p => (
                               <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 mr-1">
                                 {p}
                               </span>
                             ))}
                             <div className="text-xs text-gray-500 mt-1">
                               Last issued to: <span className="font-medium">{usageDetails[usageDetails.length - 1].issuedTo || 'Unknown'}</span>
                             </div>
                           </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not used yet</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                        {hasIssueSlips ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Slip Available
                            </span>
                        ) : (
                            <span className="text-gray-400 text-xs">-</span>
                        )}
                    </TableCell>
                    <TableCell>
                      <span className={balanceColor}>{remainingQty.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-accent hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                      >
                        Manage Usage
                      </button>
                    </TableCell>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                 <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        No inventory items available. Add items from the Dashboard first.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <UsageModal 
            item={selectedItem} 
            availableProjects={allProjects} 
            onSave={handleSaveUsage}
            onDeleteUsage={onDeleteUsage}
            onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};
