
export interface UsageEntry {
  id: string;
  projectId: string;
  quantity: number;
  date: string;
  issuedTo: string; // Name of the person who received the material
  issueSlipImage?: string; // Base64 string of the Issue Slip
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
