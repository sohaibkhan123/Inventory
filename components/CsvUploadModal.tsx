
import React, { useState } from 'react';
import { UploadIcon } from './Icons';
import type { InventoryItem } from '../types';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (items: Omit<InventoryItem, 'id'>[]) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [previewData, setPreviewData] = useState<Omit<InventoryItem, 'id'>[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a valid CSV file.');
        return;
      }
      setFile(selectedFile);
      setError('');
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
            setError('CSV file is empty or missing headers.');
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Validation for required headers
        const requiredHeaders = ['project id', 'pr number', 'item code', 'description', 'weight', 'pr qty', 'required qty', 'received qty'];
        const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));

        if (missingHeaders.length > 0) {
            setError(`Missing required headers: ${missingHeaders.join(', ')}`);
            return;
        }

        const parsedItems: Omit<InventoryItem, 'id'>[] = [];

        for (let i = 1; i < lines.length; i++) {
            // Simple regex to split by comma, but handle quotes if Excel adds them
            // This regex matches: "value", value, or value
            const rowData = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
            
            // Clean up quotes from regex match
            const row = rowData.map(val => val.replace(/^"|"$/g, '').trim());

            if (row.length < headers.length) continue; // Skip malformed rows

            const item: any = { usage: [] };
            
            headers.forEach((header, index) => {
                const value = row[index];
                
                switch(header) {
                    case 'project id': item.projectId = value; break;
                    case 'pr number': item.prNumber = value; break;
                    case 'item code': item.itemCode = value; break;
                    case 'description': item.description = value; break;
                    case 'weight': item.weight = parseFloat(value) || 0; break;
                    case 'pr qty': item.prQty = parseFloat(value) || 0; break;
                    case 'required qty': item.requiredQty = parseFloat(value) || 0; break;
                    case 'received qty': item.receivedQty = parseFloat(value) || 0; break;
                }
            });

            if (item.projectId && item.itemCode) {
                parsedItems.push(item);
            }
        }

        setPreviewData(parsedItems);
      } catch (err) {
        setError('Failed to parse CSV file. Please check the format.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = () => {
    if (previewData.length > 0) {
        onUpload(previewData);
        onClose();
        setFile(null);
        setPreviewData([]);
    }
  };

  const downloadTemplate = () => {
    const headers = "Project ID,PR Number,Item Code,Description,Weight,PR Qty,Required Qty,Received Qty";
    const example = "TIS-FAB-576,PR-576-001,BM-200,Beam 200x100,150,10,10,10";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload Inventory CSV</h2>
      
      <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>Your CSV must contain the following headers:</li>
            <li className="font-mono text-xs bg-white inline-block px-1 rounded">Project ID, PR Number, Item Code, Description, Weight, PR Qty, Required Qty, Received Qty</li>
            <li>Ensure quantities and weights are numbers.</li>
            <li>
                <button onClick={downloadTemplate} className="underline font-bold hover:text-blue-900 cursor-pointer">
                    Download Template CSV
                </button>
            </li>
        </ul>
      </div>

      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">CSV files only</p>
            </div>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
        </div>
      )}

      {file && !error && (
        <div className="mb-6">
             <p className="text-sm text-gray-600 mb-2">File selected: <span className="font-medium">{file.name}</span></p>
             <div className="bg-gray-100 rounded p-3 max-h-40 overflow-y-auto text-xs font-mono">
                <p className="font-bold mb-1 text-gray-700">Preview ({previewData.length} items found):</p>
                {previewData.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="truncate border-b border-gray-200 py-1 last:border-0">
                        {item.projectId} | {item.itemCode} | {item.description}
                    </div>
                ))}
                {previewData.length > 5 && <div className="text-gray-500 pt-1">...and {previewData.length - 5} more</div>}
             </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
        </button>
        <button 
            onClick={handleUpload} 
            disabled={!file || previewData.length === 0}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${!file || previewData.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-secondary'}`}
        >
            Import Data
        </button>
      </div>
    </div>
  );
};
