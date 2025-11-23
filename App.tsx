
import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { UsagePage } from './components/UsagePage';
import { SummaryPage } from './components/SummaryPage';
import { InventoryForm } from './components/InventoryForm';
import { Modal } from './components/Modal';
import { CsvUploadModal } from './components/CsvUploadModal';
import { Chatbot } from './components/Chatbot';
import { useInventory } from './hooks/useInventory';
import type { InventoryItem } from './types';

function App() {
  const {
    inventory,
    loading,
    addItem,
    addItems,
    updateItem,
    deleteItem,
    addUsage,
    deleteUsage,
  } = useInventory();

  const [currentView, setCurrentView] = useState<'dashboard' | 'usage' | 'summary'>('summary');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // State to handle navigation from Summary to Dashboard specific PR
  const [navTarget, setNavTarget] = useState<{ projectId: string; prNumber: string; ts: number } | null>(null);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleCloseCsvModal = () => {
    setIsCsvModalOpen(false);
  };

  const handleSaveItem = (item: Omit<InventoryItem, 'id'> | InventoryItem) => {
    if ('id' in item) {
      updateItem(item.id, item);
    } else {
      addItem(item);
    }
    handleCloseModal();
  };

  const handleUploadCsv = (items: Omit<InventoryItem, 'id'>[]) => {
      addItems(items);
  };

  const handleDeleteItem = (id: string) => {
    if(window.confirm('Are you sure you want to delete this item?')) {
      deleteItem(id);
    }
  };

  const handleAddUsage = (itemId: string, projectId: string, quantity: number, issuedTo: string, issueSlipImage?: string) => {
    addUsage(itemId, { 
        projectId, 
        quantity, 
        date: new Date().toISOString(),
        issuedTo,
        issueSlipImage
    });
  };

  const handleDeleteUsage = (itemId: string, usageId: string) => {
    if(window.confirm('Are you sure you want to remove this usage record?')) {
        deleteUsage(itemId, usageId);
    }
  };

  const handleNavigateToPr = (projectId: string, prNumber: string) => {
    setNavTarget({ projectId, prNumber, ts: Date.now() });
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header 
        onAddItemClick={handleOpenAddModal} 
        onUploadClick={() => setIsCsvModalOpen(true)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        )}
        {!loading && (
          <>
            {currentView === 'summary' && (
               <SummaryPage 
                 inventory={inventory} 
                 onPrClick={handleNavigateToPr}
               />
            )}
            {currentView === 'dashboard' && (
              <Dashboard 
                inventory={inventory} 
                onEdit={handleOpenEditModal} 
                onDelete={handleDeleteItem}
                targetProject={navTarget?.projectId}
                targetPr={navTarget?.prNumber}
                targetTs={navTarget?.ts}
              />
            )}
            {currentView === 'usage' && (
              <UsagePage 
                inventory={inventory}
                onAddUsage={handleAddUsage}
                onDeleteUsage={handleDeleteUsage}
              />
            )}
          </>
        )}
      </main>
      
      <Chatbot inventory={inventory} />

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <InventoryForm
          onSubmit={handleSaveItem}
          onCancel={handleCloseModal}
          initialData={editingItem}
        />
      </Modal>

      <Modal isOpen={isCsvModalOpen} onClose={handleCloseCsvModal}>
        <CsvUploadModal
            isOpen={isCsvModalOpen}
            onClose={handleCloseCsvModal}
            onUpload={handleUploadCsv}
        />
      </Modal>
    </div>
  );
}

export default App;
