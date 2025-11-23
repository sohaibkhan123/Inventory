
import React from 'react';
import type { InventoryItem as InventoryItemType } from '../types';
import { EditIcon, DeleteIcon } from './Icons';

interface InventoryItemProps {
  item: InventoryItemType;
  onEdit: (item: InventoryItemType) => void;
  onDelete: (id: string) => void;
}

const TableCell: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <td className={`px-4 py-4 whitespace-nowrap text-sm ${className}`}>{children}</td>
);

export const InventoryItem: React.FC<InventoryItemProps> = ({ item, onEdit, onDelete }) => {
  const totalUsed = (item.usage || []).reduce((sum, u) => sum + u.quantity, 0);
  
  // New Formulas requested
  // Balance Qty = PR Qty - Received Qty (Pending Delivery)
  const balanceQty = item.prQty - item.receivedQty;
  
  // Remaining Qty = Received Qty - Used Qty (Stock On Hand)
  const remainingQty = item.receivedQty - totalUsed;

  const getStatus = () => {
    // Handle edge case where nothing has been received yet
    if (item.receivedQty === 0) {
        // If required > 0 but received 0, it's critical (out of stock/not received)
        return item.requiredQty > 0 
            ? { textColor: 'text-error', dotColor: 'bg-error' } 
            : { textColor: 'text-gray-400', dotColor: 'bg-gray-400' };
    }

    const percentageRemaining = remainingQty / item.receivedQty;

    // Logic:
    // Red for critical (e.g., < 50% of received qty remaining)
    // Yellow for low (50% - 75%)
    // Green for sufficient (> 75%)
    if (percentageRemaining < 0.5) {
      return { textColor: 'text-error', dotColor: 'bg-error' }; // Critical (< 50%)
    } else if (percentageRemaining < 0.75) {
      return { textColor: 'text-warning', dotColor: 'bg-warning' }; // Low (50% - 75%)
    } else {
      return { textColor: 'text-success', dotColor: 'bg-success' }; // Sufficient (> 75%)
    }
  };

  const status = getStatus();

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <TableCell className="font-medium text-gray-900">{item.itemCode}</TableCell>
      <TableCell className="text-gray-500">{item.description}</TableCell>
      <TableCell className="text-gray-500">{item.weight.toLocaleString()}</TableCell>
      <TableCell className="text-gray-500">{item.prQty.toLocaleString()}</TableCell>
      <TableCell className="text-gray-500">{item.requiredQty.toLocaleString()}</TableCell>
      <TableCell className="text-gray-500">{item.receivedQty.toLocaleString()}</TableCell>
      <TableCell className="text-gray-500">{totalUsed.toLocaleString()}</TableCell>
      <TableCell>
         {/* Balance Qty (Pending Delivery) */}
         <span className={`font-medium ${balanceQty > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            {balanceQty.toLocaleString()}
         </span>
      </TableCell>
      <TableCell>
        {/* Remaining Qty (Stock on Hand) */}
        <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${status.dotColor}`} aria-hidden="true"></span>
            <span className={`font-bold ${status.textColor}`}>{remainingQty.toLocaleString()}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          <button onClick={() => onEdit(item)} className="text-accent hover:text-secondary transition-colors" title="Edit item">
            <EditIcon className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-error transition-colors" title="Delete item">
            <DeleteIcon className="w-5 h-5" />
          </button>
        </div>
      </TableCell>
    </tr>
  );
};
