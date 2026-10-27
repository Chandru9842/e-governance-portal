export type Language = 'en' | 'ta';

export type UserRole = 'Farmer' | 'Officer' | 'Admin';

export type ApplicationStatus = 'Approved' | 'Pending' | 'Under Review' | 'Rejected';

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

export interface CropRecord {
  id: string;
  cropName: string;
  cropNameTa: string;
  variety: string;
  season: 'Kuruvai' | 'Samba' | 'Navarai' | 'Thaladi';
  areaAcres: number;
  sowingDate: string;
  expectedHarvestDate: string;
  growthStage: 'Seedling' | 'Vegetative' | 'Flowering' | 'Grain Filling' | 'Harvest Ready';
  healthStatus: 'Healthy' | 'Needs Attention' | 'Pest Alert';
  expectedYieldQuintals: number;
  surveyNumber: string;
  irrigationType: 'Canal' | 'Borewell' | 'Drip' | 'Rainfed';
}

export interface GovernmentScheme {
  id: string;
  code: string;
  title: string;
  titleTa: string;
  department: 'State Agriculture Dept' | 'Central Govt (PM-KISAN)' | 'Horticulture Dept' | 'Agri Engineering';
  benefitSummary: string;
  benefitSummaryTa: string;
  maxSubsidyAmount: number;
  eligibility: string[];
  deadline: string;
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
  category: 'Micro Irrigation' | 'Farm Machinery' | 'Seed Subsidy' | 'Kisan Credit Card Loan' | 'Solar Pump';
  amountRequested: number;
  subsidyComponent: number;
  appliedDate: string;
  status: ApplicationStatus;
  currentStep: number; // 1 to 4
  remarks: string;
  bankAccount: string;
}

export interface GrievanceTicket {
  id: string;
  ticketNo: string;
  subject: string;
  category: 'Crop Insurance (PMFBY)' | 'Subsidy Delay' | 'Fertilizer Availability' | 'Canal Water Release' | 'Procurement Center';
  description: string;
  district: string;
  submittedDate: string;
  status: ApplicationStatus;
  assignedOfficer: string;
  resolutionNotes?: string;
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
