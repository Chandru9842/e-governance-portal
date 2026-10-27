export type Language = 'en' | 'ta';

export type UserRole = 'Farmer' | 'Officer' | 'Admin';

export type ApplicationStatus = 'Approved' | 'Pending' | 'Under Review' | 'Rejected';

export type CropSeason = 'Kharif' | 'Rabi' | 'Summer' | 'Samba' | 'Kuruvai' | 'Navarai';

export type SchemeCategory =
  | 'Income Support'
  | 'Insurance'
  | 'Irrigation'
  | 'Subsidy'
  | 'Loan';

export interface UserProfile {
  id: string;
  farmerId: string;
  name: string;
  nameTa: string;
  role: UserRole;
  phone: string;
  email: string;
  district: string;
  districtTa: string;
  taluk: string;
  village: string;
  villageTa: string;
  totalLandAcres: number;
  soilType: string;
  irrigationSource: string;
  aadhaarLast4: string;
  bankName: string;
  accountMasked: string;
  ifsc: string;
  pmKisanActive: boolean;
}

export interface CropInputLog {
  id: string;
  date: string;
  type: 'Fertilizer' | 'Pesticide' | 'Water';
  itemName: string;
  quantity: string;
  cost: number;
  notes?: string;
}

export interface CropFinancialPoint {
  stage: string;
  expense: number;
  expectedIncome: number;
}

export interface CropRecord {
  id: string;
  cropType: 'Cereals & Millets' | 'Pulses' | 'Oilseeds' | 'Commercial / Cash Crop' | 'Horticulture';
  cropName: string;
  cropNameTa: string;
  variety: string;
  season: CropSeason;
  areaAcres: number;
  sowingDate: string;
  expectedHarvestDate: string;
  growthStage: 'Seedling' | 'Vegetative' | 'Flowering' | 'Grain Filling' | 'Harvest Ready';
  healthStatus: 'Healthy' | 'Needs Attention' | 'Pest Alert';
  expectedYieldQuintals: number;
  surveyNumber: string;
  irrigationType: 'Canal' | 'Borewell' | 'Drip' | 'Rainfed';
  inputLogs: CropInputLog[];
  financialProjection: CropFinancialPoint[];
  notes: string[];
}

export interface SchemeFAQ {
  question: string;
  answer: string;
}

export interface SchemeImportantDate {
  label: string;
  date: string;
}

export interface GovernmentScheme {
  id: string;
  code: string;
  title: string;
  titleTa: string;
  category: SchemeCategory;
  department: 'State Agriculture Dept' | 'Central Govt (PM-KISAN)' | 'Horticulture Dept' | 'Agri Engineering' | 'Co-operative Dept';
  shortDescription: string;
  shortDescriptionTa: string;
  overview: string;
  benefitSummary: string;
  benefitSummaryTa: string;
  benefitsList: string[];
  maxSubsidyAmount: number;
  eligibilityTag: string;
  minLandAcres: number;
  maxLandAcres: number;
  eligibleCrops: string[];
  farmerCategories: ('Small / Marginal' | 'Medium' | 'All Farmers')[];
  eligibility: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  importantDates: SchemeImportantDate[];
  faqs: SchemeFAQ[];
  helpline: {
    phone: string;
    email: string;
    officeHours: string;
  };
  deadline: string;
  publicationStatus?: 'Published' | 'Draft' | 'Archived';
  applicationStatus?: ApplicationStatus;
  appliedDate?: string;
  referenceNo?: string;
}

export interface MarketPriceItem {
  id: string;
  commodity: string;
  commodityTa: string;
  variety: string;
  mandiName: string;
  mandiNameTa: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  previousModalPrice: number;
  arrivalTonnes: number;
  arrivalQuintals: number;
  updatedAt: string;
}

export interface WeatherForecastDay {
  date: string;
  dayName: string;
  dayNameTa: string;
  condition: 'Sunny' | 'Partly Cloudy' | 'Moderate Rain' | 'Heavy Rain' | 'Thunderstorm';
  tempMax: number;
  tempMin: number;
  humidity: number;
  rainfallChancePct: number;
  rainfallMm: number;
  windSpeedKmh: number;
  advisory: string;
  advisoryTa: string;
}

export interface SubsidyApplication {
  id: string;
  referenceNo: string;
  schemeName: string;
  schemeNameTa: string;
  category: 'Micro Irrigation' | 'Farm Machinery' | 'Seed Subsidy' | 'Fertilizer Subsidy' | 'Kisan Credit Card Loan' | 'Solar Pump' | 'Income Support' | 'Insurance';
  amountRequested: number;
  subsidyComponent: number;
  appliedDate: string;
  status: ApplicationStatus;
  currentStep: number; // 1 to 4
  remarks: string;
  bankAccount: string;
}

export type GrievanceWorkflowStatus = 'Open' | 'In Progress' | 'Resolved' | 'Escalated';

export type GrievancePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface GrievanceMessage {
  id: string;
  senderName: string;
  senderRole: 'Farmer' | 'Officer';
  message: string;
  timestamp: string;
  attachment?: string;
}

export interface GrievanceTicket {
  id: string;
  ticketNo: string;
  subject: string;
  category:
    | 'Scheme'
    | 'Subsidy'
    | 'Market'
    | 'Loan'
    | 'Technical'
    | 'Other'
    | 'Crop Insurance (PMFBY)'
    | 'Subsidy Delay'
    | 'Fertilizer Availability'
    | 'Canal Water Release'
    | 'Procurement Center';
  department?: string;
  description: string;
  location?: string;
  district: string;
  priority?: GrievancePriority;
  submittedDate: string;
  status: ApplicationStatus;
  workflowStatus?: GrievanceWorkflowStatus;
  slaTotalHours?: number;
  slaHoursElapsed?: number;
  slaBreached?: boolean;
  assignedOfficer: string;
  resolutionNotes?: string;
  attachments?: string[];
  messages?: GrievanceMessage[];
  satisfactionRating?: number;
  satisfactionFeedback?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  titleTa: string;
  message: string;
  messageTa: string;
  timestamp: string;
  read: boolean;
  type: 'scheme' | 'market' | 'weather' | 'subsidy';
}

export interface ImportantUpdateItem {
  id: string;
  title: string;
  titleTa: string;
  summary: string;
  summaryTa: string;
  date: string;
  category: 'Scheme' | 'Market' | 'Weather' | 'Procurement';
  linkPath: string;
}
