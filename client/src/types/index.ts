export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface AuthUser { id: string; name: string; email: string; role: UserRole; }

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';

export interface Customer {
  id: string;
  customerName: string;
  mobileNumber: string;
  email: string | null;
  businessName: string | null;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
  propertyType: PropertyType | null;
  averageMonthlyElectricityBill: string | null;
  estimatedSystemCapacityKw: string | null;
  roofType: string | null;
  siteSurveyDate: string | null;
  installationAddress: string | null;
  leadSource: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUp[];
  challans?: ChallanSummary[];
}

export interface FollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpType: string | null;
  nextFollowUpDate: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string; role: UserRole };
}

export type ProductCategory =
  | 'SOLAR_PANEL' | 'INVERTER' | 'BATTERY' | 'MOUNTING_STRUCTURE'
  | 'DC_CABLE' | 'AC_CABLE' | 'COMBINER_BOX' | 'PROTECTION_DEVICE'
  | 'CONNECTOR' | 'METER' | 'OTHER';

export interface Product {
  id: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  unitPrice: string;
  currentStock: number;
  minimumStockAlertQuantity: number;
  warehouseLocation: string;
  brand: string | null;
  modelNumber: string | null;
  wattage: number | null;
  equipmentType: string | null;
  warrantyYears: number | null;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT';
export interface StockMovement {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  product?: { id: string; productName: string; sku: string };
  createdBy?: { id: string; name: string; role: UserRole };
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: string;
  productId: string;
  quantity: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  categorySnapshot: string;
  unitPriceSnapshot: string;
}

export interface ChallanSummary {
  id: string;
  challanNumber: string;
  status: ChallanStatus;
  totalQuantity: number;
  createdAt: string;
  confirmedAt: string | null;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  deliveryAddress: string;
  dispatchNotes: string | null;
  installationSiteName: string | null;
  projectReference: string | null;
  proposedSystemCapacityKw: string | null;
  expectedDispatchDate: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  items: ChallanItem[];
  customer?: {
    id: string; customerName: string; businessName: string | null;
    mobileNumber: string; email: string | null; gstNumber: string | null;
    address: string; installationAddress: string | null;
  };
  createdBy?: { id: string; name: string; role: UserRole };
}

export interface DashboardSummary {
  totalLeads: number;
  activeCustomers: number;
  followUpsDueToday: number;
  siteSurveysScheduled: number;
  pipelineCapacityKw: number;
  totalProducts: number;
  lowStockProducts: number;
  confirmedChallansThisMonth: number;
  unitsDispatchedThisMonth: number;
  recentMovements: StockMovement[];
  recentChallans: (ChallanSummary & { customer?: { id: string; customerName: string; businessName: string | null } })[];
}
