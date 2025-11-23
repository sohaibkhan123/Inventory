import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, UsageEntry } from '../types';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api/inventory';

// Helper to get token
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const useInventory = (isAuthenticated: boolean) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInventory = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
          headers: getAuthHeaders()
      });
      if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('username');
          window.location.reload();
          throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInventory(data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if(isAuthenticated) {
        fetchInventory();
    }
  }, [fetchInventory, isAuthenticated]);

  const addItem = useCallback(async (item: Omit<InventoryItem, 'id'>) => {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(item)
        });
        if (!res.ok) throw new Error("Failed");
        const savedItem = await res.json();
        setInventory(prev => [savedItem, ...prev]);
    } catch (err) {
        console.error(err);
        alert("Failed to add item. You may not have permission.");
    }
  }, []);

  const addItems = useCallback(async (items: Omit<InventoryItem, 'id'>[]) => {
    try {
        await fetch(`${API_URL}/batch`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(items)
        });
        fetchInventory();
    } catch (err) {
        console.error(err);
        alert("Failed to upload batch. You may not have permission.");
    }
  }, [fetchInventory]);

  const updateItem = useCallback(async (id: string, updates: InventoryItem) => {
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updates)
        });
        setInventory(prev => prev.map(item => (item.id === id ? updates : item)));
    } catch (err) {
        console.error(err);
        alert("Failed to update item.");
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
        await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        setInventory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
        console.error(err);
        alert("Failed to delete item.");
    }
  }, []);

  const addUsage = useCallback(async (itemId: string, usageEntry: Omit<UsageEntry, 'id'>) => {
    try {
        const res = await fetch(`${API_URL}/${itemId}/usage`, {
            method: 'POST',
            headers: getAuthHeaders(),
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
        alert("Failed to add usage.");
    }
  }, []);

  const deleteUsage = useCallback(async (itemId: string, usageId: string) => {
    try {
        await fetch(`${API_URL}/${itemId}/usage/${usageId}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
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
        alert("Failed to delete usage.");
    }
  }, []);

  return { inventory, loading, addItem, addItems, updateItem, deleteItem, addUsage, deleteUsage };
};