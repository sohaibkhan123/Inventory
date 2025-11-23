export interface User {
  username: string;
  role: 'incharge' | 'store';
  token?: string;
}

export interface UsageEntry {
  id: string;
  projectId: string;
  quantity: number;
  date: string;
  issuedTo: string; 
  issueSlipImage?: string;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  prNumber: string;
  description: string;
  weight: number;
  prQty: number;
  requiredQty: number;
  receivedQty: number;
  projectId: string;
  usage?: UsageEntry[];
}