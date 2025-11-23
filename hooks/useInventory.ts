/// <reference types="vite/client" />
import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, UsageEntry } from '../types';

// VITE_API_URL will be set in Vercel dashboard. 
// Fallback to localhost for development.
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-inv-ll9h.onrender.com/api/inventory';

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInventory(data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addItem = useCallback(async (item: Omit<InventoryItem, 'id'>) => {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        const savedItem = await res.json();
        setInventory(prev => [savedItem, ...prev]);
    } catch (err) {
        console.error(err);
        alert("Failed to add item");
    }
  }, []);

  const addItems = useCallback(async (items: Omit<InventoryItem, 'id'>[]) => {
    try {
        await fetch(`${API_URL}/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });
        // Re-fetch full inventory to ensure sync
        fetchInventory();
    } catch (err) {
        console.error(err);
        alert("Failed to upload batch");
    }
  }, [fetchInventory]);

  const updateItem = useCallback(async (id: string, updates: InventoryItem) => {
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        setInventory(prev => prev.map(item => (item.id === id ? updates : item)));
    } catch (err) {
        console.error(err);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        setInventory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
        console.error(err);
    }
  }, []);

  const addUsage = useCallback(async (itemId: string, usageEntry: Omit<UsageEntry, 'id'>) => {
    try {
        const res = await fetch(`${API_URL}/${itemId}/usage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usageEntry)
        });
        const newUsage = await res.json();
        
        setInventory(prev =>
            prev.map(item => {
                if (item.id === itemId) {
                    const currentUsage = item.usage || [];
                    return { ...item, usage: [...currentUsage, newUsage] };
                }
                return item;
            })
        );
    } catch (err) {
        console.error(err);
    }
  }, []);

  const deleteUsage = useCallback(async (itemId: string, usageId: string) => {
    try {
        await fetch(`${API_URL}/${itemId}/usage/${usageId}`, { method: 'DELETE' });
        setInventory(prev =>
            prev.map(item => {
                if (item.id === itemId) {
                    const currentUsage = item.usage || [];
                    return { ...item, usage: currentUsage.filter(u => u.id !== usageId) };
                }
                return item;
            })
        );
    } catch (err) {
        console.error(err);
    }
  }, []);

  return { inventory, loading, addItem, addItems, updateItem, deleteItem, addUsage, deleteUsage };
};
