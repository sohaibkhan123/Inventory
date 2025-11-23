
import React, { useState, useEffect } from 'react';
import type { InventoryItem } from '../types';

interface InventoryFormProps {
  onSubmit: (item: Omit<InventoryItem, 'id'> | InventoryItem) => void;
  onCancel: () => void;
  initialData: InventoryItem | null;
}

type FormData = Omit<InventoryItem, 'id' | 'balanceQty'>;

export const InventoryForm: React.FC<InventoryFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<FormData>({
    itemCode: '',
    prNumber: '',
    description: '',
    weight: 0,
    prQty: 0,
    requiredQty: 0,
    receivedQty: 0,
    projectId: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
       setFormData({
        itemCode: '', prNumber: '', description: '', weight: 0,
        prQty: 0, requiredQty: 0, receivedQty: 0, projectId: ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      onSubmit({ ...formData, id: initialData.id });
    } else {
      onSubmit(formData);
    }
  };
  
  // Balance Qty = PR Qty - Received Qty
  const balanceQty = formData.prQty - formData.receivedQty;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Edit Item' : 'Add New Item'}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Project ID" name="projectId" value={formData.projectId} onChange={handleChange} required />
        <InputField label="PR Number" name="prNumber" value={formData.prNumber} onChange={handleChange} required />
        <InputField label="Item Code" name="itemCode" value={formData.itemCode} onChange={handleChange} required />
        <InputField label="Description" name="description" value={formData.description} onChange={handleChange} required />
        <InputField label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} required />
        <InputField label="PR Qty" name="prQty" type="number" value={formData.prQty} onChange={handleChange} required />
        <InputField label="Required Qty" name="requiredQty" type="number" value={formData.requiredQty} onChange={handleChange} required />
        <InputField label="Received Qty" name="receivedQty" type="number" value={formData.receivedQty} onChange={handleChange} required />
      </div>
      
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-sm font-medium text-gray-600">Calculated Balance Quantity (Pending Delivery):</p>
        <p className="text-2xl font-bold text-primary">{balanceQty.toLocaleString()}</p>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
          {initialData ? 'Save Changes' : 'Add Item'}
        </button>
      </div>
    </form>
  );
};

interface InputFieldProps {
    label: string;
    name: keyof FormData;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = 'text', required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
    </div>
);
