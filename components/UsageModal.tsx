
import React, { useState } from 'react';
import type { InventoryItem } from '../types';

interface UsageModalProps {
  item: InventoryItem | null;
  availableProjects: string[];
  onSave: (itemId: string, projectId: string, quantity: number, issuedTo: string, issueSlipImage?: string) => void;
  onDeleteUsage: (itemId: string, usageId: string) => void;
  onCancel: () => void;
}

export const UsageModal: React.FC<UsageModalProps> = ({ item, availableProjects, onSave, onDeleteUsage, onCancel }) => {
  const [projectId, setProjectId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [issuedTo, setIssuedTo] = useState('');
  const [issueSlipImage, setIssueSlipImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string>('');
  const [isReadingFile, setIsReadingFile] = useState(false);

  if (!item) return null;

  const totalUsed = (item.usage || []).reduce((sum, u) => sum + u.quantity, 0);
  const availableQty = item.receivedQty - totalUsed;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Simple validation for image types
        if (!file.type.startsWith('image/')) {
            setError("Please upload an image file.");
            return;
        }
        // Size limit check (e.g. 2MB) to prevent localStorage overflow
        if (file.size > 2 * 1024 * 1024) {
            setError("Image size is too large. Please use an image under 2MB.");
            return;
        }

        setIsReadingFile(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setIssueSlipImage(reader.result as string);
            setIsReadingFile(false);
            setError('');
        };
        reader.onerror = () => {
            setError("Failed to read file.");
            setIsReadingFile(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);

    if (!projectId) {
      setError('Please select a project.');
      return;
    }
    if (qty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (qty > availableQty) {
      setError(`Quantity cannot exceed available balance (${availableQty}).`);
      return;
    }
    if (!issuedTo.trim()) {
        setError('Please enter the name of the person receiving the material.');
        return;
    }

    onSave(item.id, projectId, qty, issuedTo, issueSlipImage);
    
    // Reset form
    setProjectId('');
    setQuantity('');
    setIssuedTo('');
    setIssueSlipImage(undefined);
    setError('');
  };

  const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateString;
    }
  }

  return (
    <div className="w-full max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Manage Usage</h2>
      <p className="text-gray-500 text-sm mb-6">Record new usage or remove existing entries.</p>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Item Code:</span>
            <p className="font-medium text-gray-900">{item.itemCode}</p>
          </div>
          <div>
            <span className="text-gray-500">Description:</span>
            <p className="font-medium text-gray-900">{item.description}</p>
          </div>
          <div>
            <span className="text-gray-500">Total Received:</span>
            <p className="font-medium text-gray-900">{item.receivedQty}</p>
          </div>
          <div>
            <span className="text-gray-500">Available Balance:</span>
            <p className="font-bold text-primary text-lg">{availableQty}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Usage</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="usage-project" className="block text-sm font-medium text-gray-700 mb-1">
                Used In Project <span className="text-red-500">*</span>
                </label>
                <select
                id="usage-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
                >
                <option value="" disabled>Select a project</option>
                {availableProjects.map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
                </select>
            </div>

            <div>
                <label htmlFor="usage-qty" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
                </label>
                <input
                type="number"
                id="usage-qty"
                value={quantity}
                onChange={(e) => {
                    setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value));
                    setError('');
                }}
                max={availableQty}
                min={0.01}
                step="any"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="0.00"
                required
                disabled={availableQty <= 0}
                />
            </div>

            <div>
                <label htmlFor="issued-to" className="block text-sm font-medium text-gray-700 mb-1">
                Issued To (Person Name) <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                id="issued-to"
                value={issuedTo}
                onChange={(e) => setIssuedTo(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="e.g., John Doe"
                required
                />
            </div>

            <div>
                <label htmlFor="ir-upload" className="block text-sm font-medium text-gray-700 mb-1">
                Upload Issue Slip (Image)
                </label>
                <input
                type="file"
                id="ir-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {isReadingFile && <span className="text-xs text-blue-600 mt-1 block">Processing image...</span>}
                {issueSlipImage && <span className="text-xs text-green-600 mt-1 block">Issue slip loaded successfully.</span>}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="submit"
              disabled={availableQty <= 0 || isReadingFile}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${availableQty <= 0 || isReadingFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-secondary'}`}
            >
              Add Usage Record
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Usage History</h3>
        {(!item.usage || item.usage.length === 0) ? (
            <p className="text-gray-500 text-sm italic bg-gray-50 p-4 rounded border border-gray-100 text-center">No usage records found.</p>
        ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issued To</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue Slip</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {item.usage.map((record) => (
                            <tr key={record.id}>
                                <td className="px-4 py-2 text-sm text-gray-900 font-medium">{record.projectId}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{formatDate(record.date)}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{record.issuedTo || '-'}</td>
                                <td className="px-4 py-2 text-sm">
                                    {record.issueSlipImage ? (
                                        <button 
                                            onClick={() => {
                                                const win = window.open();
                                                if(win) {
                                                    win.document.write(`<img src="${record.issueSlipImage}" style="max-width:100%;"/>`);
                                                }
                                            }}
                                            className="text-blue-600 hover:underline text-xs font-medium"
                                        >
                                            View Slip
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-xs">No Slip</span>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right">{record.quantity.toLocaleString()}</td>
                                <td className="px-4 py-2 text-center">
                                    <button 
                                        onClick={() => onDeleteUsage(item.id, record.id)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                        title="Remove this record"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
         <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            Close
          </button>
      </div>
    </div>
  );
};
