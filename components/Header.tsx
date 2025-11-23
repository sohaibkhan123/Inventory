import React from 'react';
import { PlusIcon, UploadIcon } from './Icons';

interface HeaderProps {
  userRole: 'incharge' | 'store';
  username: string;
  onLogout: () => void;
  onAddItemClick: () => void;
  onUploadClick: () => void;
  currentView: 'dashboard' | 'usage' | 'summary';
  onViewChange: (view: 'dashboard' | 'usage' | 'summary') => void;
}

export const Header: React.FC<HeaderProps> = ({ userRole, username, onLogout, onAddItemClick, onUploadClick, currentView, onViewChange }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-10v10M8 7v10m8-10v10m-4-10v10M4 7h16" />
            </svg>
            <div className="ml-3 hidden md:block">
                <h1 className="text-xl font-bold text-gray-800">Steel Inventory</h1>
                <p className="text-xs text-gray-500">Logged in as: <span className="font-semibold">{username}</span> ({userRole})</p>
            </div>
          </div>
          
          <nav className="flex space-x-2 sm:space-x-4 bg-gray-100 p-1 rounded-lg overflow-x-auto mx-2">
             <button
              onClick={() => onViewChange('summary')}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                currentView === 'summary'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                currentView === 'dashboard'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onViewChange('usage')}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                currentView === 'usage'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              Usage
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {userRole === 'incharge' && (
                <>
                    <button
                        onClick={onUploadClick}
                        className="hidden sm:flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-blue-50 rounded-lg shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 shrink-0"
                        title="Upload CSV"
                    >
                        <UploadIcon className="w-5 h-5" />
                        <span className="hidden lg:inline">Import</span>
                    </button>
                    <button
                        onClick={onAddItemClick}
                        className="hidden sm:flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors duration-200 shrink-0"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden lg:inline">Add Item</span>
                    </button>
                </>
            )}
            
            <button 
                onClick={onLogout}
                className="ml-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};