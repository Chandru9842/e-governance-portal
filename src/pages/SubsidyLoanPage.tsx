import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  HandCoins,
  Plus,
  CheckCircle2,
  Clock,
  Landmark,
  Calculator,
  Sparkles,
  FileText,
  Download,
  BellRing,
  Calendar,
  UploadCloud,
  ShieldCheck,
  Filter,
  Search,
  ArrowRight,
  Tractor,
  Droplets,
  Sprout,
  FlaskConical,
  CreditCard,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { usePortal } from '../context/PortalContext';
import { ApplicationStatus } from '../types';
import {
  Card,
  StatCard,
  StatusBadge,
  Stepper,
  Modal,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

// ============================================================================
// DATA CATALOGUES & TYPES
// ============================================================================

type SubsidyCategoryKey = 'All' | 'Fertilizer' | 'Seed' | 'Drip Irrigation' | 'Machinery';

interface SubsidyCatalogItem {
  id: string;
  code: string;
  categoryKey: Exclude<SubsidyCategoryKey, 'All'>;
  mappedCategory:
    | 'Fertilizer Subsidy'
    | 'Seed Subsidy'
    | 'Micro Irrigation'
    | 'Farm Machinery'
    | 'Solar Pump';
  title: string;
  titleTa: string;
  department: string;
  subsidyPercentSfMf: number;
  subsidyPercentOther: number;
  maxCapAmount: number;
  description: string;
  descriptionTa: string;
  eligibleItems: string[];
  requiredDocs: string[];
}

const SUBSIDY_CATALOGUE: SubsidyCatalogItem[] = [
  {
    id: 'cat-fert-1',
    code: 'TN-FERT-2026',
    categoryKey: 'Fertilizer',
    mappedCategory: 'Fertilizer Subsidy',
    title: 'Integrated Nutrient, Micronutrient & Bio-Fertilizer Subsidy',
    titleTa: 'ஒருங்கிணைந்த உரம், நுண்ணூட்டச் சத்து மற்றும் உயிர் உர மானியம்',
    department: 'Dept. of Agriculture (AEC)',
    subsidyPercentSfMf: 50,
    subsidyPercentOther: 50,
    maxCapAmount: 12500,
    description:
      '50% upfront price subsidy on TNAU crop-specific micronutrient mixtures, Zinc Sulphate, Gypsum, Azospirillum, and liquid bio-fertilizers.',
    descriptionTa:
      'வேளாண் விரிவாக்க மையங்கள் மூலம் நுண்ணூட்டச் சத்து கலவை, ஜிப்சம் மற்றும் உயிர் உரங்களுக்கு 50% மானியம்.',
    eligibleItems: ['TNAU Micronutrient Mixture', 'Liquid Bio-Fertilizers', 'Agricultural Gypsum', 'Zinc Sulphate'],
    requiredDocs: ['Uzhavar ID / Aadhaar', 'Current Season e-Adangal', 'Soil Health Card (Optional)'],
  },
  {
    id: 'cat-fert-2',
    code: 'PM-PRANAM-NANO',
    categoryKey: 'Fertilizer',
    mappedCategory: 'Fertilizer Subsidy',
    title: 'Nano-Urea, Nano-DAP & Green Manure (Daincha) Input Subsidy',
    titleTa: 'நானோ யூரியா மற்றும் பசுந்தாள் உர மானியத் திட்டம்',
    department: 'State Agriculture & PACCS',
    subsidyPercentSfMf: 50,
    subsidyPercentOther: 40,
    maxCapAmount: 8000,
    description:
      'Promotes balanced foliar nutrition and organic carbon restoration using IFFCO Nano-Urea/DAP foliar sprays and Kolingi/Daincha green manure.',
    descriptionTa:
      'மண் வளத்தை மேம்படுத்த நானோ யூரியா மற்றும் தக்கைப்பூண்டு பசுந்தாள் உரங்களுக்கு 50% மானியம்.',
    eligibleItems: ['Nano Urea (500ml Bottles)', 'Nano DAP Foliar', 'Daincha / Sunnhemp Green Manure'],
    requiredDocs: ['Aadhaar Card', 'Patta / Chitta Extract'],
  },
  {
    id: 'cat-seed-1',
    code: 'KAVIADP-SEED-26',
    categoryKey: 'Seed',
    mappedCategory: 'Seed Subsidy',
    title: 'KAVIADP Certified Paddy, Hybrid Maize & Pulse Seed Subsidy',
    titleTa: 'கலைஞரின் ஒருங்கிணைந்த வேளாண் வளர்ச்சித் திட்ட விதை மானியம்',
    department: 'State Seed Certification & Agri Dept',
    subsidyPercentSfMf: 50,
    subsidyPercentOther: 50,
    maxCapAmount: 6000,
    description:
      '50% distribution subsidy on certified high-yielding seeds including ADT-43/White Ponni Paddy, TNAU CoH(M)-6 Maize, and VBN-8 Blackgram.',
    descriptionTa:
      'சான்றளிக்கப்பட்ட பொன்னி நெல், மக்காச்சோளம் மற்றும் உளுந்து விதைகளுக்கு 50% நேரடி மானியம்.',
    eligibleItems: ['ADT-43 / CO-51 Paddy Seed', 'CoH(M)-6 Hybrid Maize', 'VBN-8 Blackgram & Greengram'],
    requiredDocs: ['VAO e-Adangal', 'Aadhaar Linked Bank Account'],
  },
  {
    id: 'cat-drip-1',
    code: 'PMKSY-MI-2026',
    categoryKey: 'Drip Irrigation',
    mappedCategory: 'Micro Irrigation',
    title: 'PMKSY Automated Drip & Micro-Sprinkler Irrigation System',
    titleTa: 'பிரதம மந்திரி நுண்ணீர் பாசனத் திட்டம் (100% சொட்டு நீர் மானியம்)',
    department: 'TANHODA / Horticulture Dept',
    subsidyPercentSfMf: 100,
    subsidyPercentOther: 75,
    maxCapAmount: 82500,
    description:
      '100% free installation subsidy for Small & Marginal farmers (< 5 Acres) and 75% for Medium/Large farmers on BIS-certified drip laterals and fertigation units.',
    descriptionTa:
      'சிறு மற்றும் குறு விவசாயிகளுக்கு 100% மானியம்; இதர விவசாயிகளுக்கு 75% சொட்டு நீர் பாசன மானியம்.',
    eligibleItems: ['Inline Drip Laterals (16mm)', 'Venturi Fertigation Manifold', 'Mini Sprinkler & Rain Gun'],
    requiredDocs: ['Chitta & e-Adangal', 'FMB Field Sketch', 'SF/MF Tahsildar Certificate', 'Soil & Water Report'],
  },
  {
    id: 'cat-mach-1',
    code: 'SMAM-MECH-26',
    categoryKey: 'Machinery',
    mappedCategory: 'Farm Machinery',
    title: 'SMAM Farm Mechanization (Power Tiller, Weeder & Rotavator)',
    titleTa: 'வேளாண் இயந்திரமயமாக்கல் திட்டம் (பவர் டில்லர் & களையெடுக்கும் கருவி)',
    department: 'Agricultural Engineering Dept (AED)',
    subsidyPercentSfMf: 50,
    subsidyPercentOther: 40,
    maxCapAmount: 125000,
    description:
      '50% capital subsidy for Small/Marginal, SC/ST, and Women farmers on 8–12 HP Power Tillers, Mini Power Weeders, Multi-crop Threshers, and Tractor Implements.',
    descriptionTa:
      'சிறு/குறு மற்றும் பெண் விவசாயிகளுக்கு பவர் டில்லர், ரொட்டவேட்டர் வாங்க 50% மானியம்.',
    eligibleItems: ['8.5 HP Power Tiller', 'Self-Propelled Power Weeder', 'Tractor Rotavator & Seed Drill'],
    requiredDocs: ['Patta / Chitta', 'Empanelled Dealer Quotation', 'Aadhaar & Bank Passbook', 'Tractor RC (for implements)'],
  },
  {
    id: 'cat-mach-2',
    code: 'PM-KUSUM-SOLAR',
    categoryKey: 'Machinery',
    mappedCategory: 'Solar Pump',
    title: 'PM-KUSUM 5 HP – 7.5 HP Standalone Solar Agricultural Pump',
    titleTa: 'பி.எம்-குசும் சூரிய சக்தி பம்ப் செட் மானியத் திட்டம் (70% மானியம்)',
    department: 'AED & TEDA Tamil Nadu',
    subsidyPercentSfMf: 70,
    subsidyPercentOther: 70,
    maxCapAmount: 165000,
    description:
      '70% combined Central + Tamil Nadu State subsidy on standalone solar photovoltaic water pumping systems with 5-year comprehensive maintenance warranty.',
    descriptionTa:
      'சூரிய சக்தி மோட்டார் பம்ப் அமைக்க 70% அரசு மானியம் மற்றும் 5 ஆண்டு பராமரிப்பு உத்தரவாதம்.',
    eligibleItems: ['5 HP DC Submersible Solar Pump', '7.5 HP AC/DC Surface & Borewell Solar Set'],
    requiredDocs: ['Borewell Ownership Certificate', 'Chitta / Adangal', 'Farmer Share DD / Online Receipt'],
  },
];

interface LoanProductItem {
  id: string;
  type: 'Kisan Credit Card (KCC)' | 'Crop Loan' | 'Term Loan';
  title: string;
  titleTa: string;
  bankPartner: string;
  interestRatePct: number;
  standardRatePct: number;
  subventionNote: string;
  tenureRange: string;
  defaultTenureMonths: number;
  defaultAmount: number;
  maxLimit: number;
  collateralRule: string;
  features: string[];
}

const LOAN_PRODUCTS: LoanProductItem[] = [
  {
    id: 'loan-kcc',
    type: 'Kisan Credit Card (KCC)',
    title: 'Kisan Credit Card (KCC) Revolving Crop Credit',
    titleTa: 'கிசான் கிரெடிட் கார்டு (KCC) 0% வட்டியில்லா பயிர் கடன்',
    bankPartner: 'Perambalur DCCB (PACCS Arumbavur) & Indian Bank',
    interestRatePct: 0.0,
    standardRatePct: 7.0,
    subventionNote: '7% Base - 3% GoI Incentive - 4% TN PACCS Waiver = 0% Effective Interest',
    tenureRange: '12 Months Revolving (5-Yr Card Validity)',
    defaultTenureMonths: 12,
    defaultAmount: 125000,
    maxLimit: 300000,
    collateralRule: 'Zero Collateral up to ₹1,60,000 (RBI Mandate)',
    features: [
      '0% effective interest for prompt repayment within 12 months up to ₹3,00,000.',
      'RuPay Kisan ATM-cum-Debit Card usable at all input dealers and ATMs.',
      'Built-in ₹2,00,000 Personal Accident Insurance cover.',
    ],
  },
  {
    id: 'loan-crop',
    type: 'Crop Loan',
    title: 'Short-Term Seasonal Crop Production Loan (Scale of Finance)',
    titleTa: 'குறுகிய கால சாகுபடி பயிர் கடன் திட்டம்',
    bankPartner: 'State Bank of India (ADB Perambalur) & Canara Bank',
    interestRatePct: 4.0,
    standardRatePct: 7.0,
    subventionNote: '3% Central Interest Subvention applied for timely post-harvest settlement',
    tenureRange: '6 to 12 Months (Harvest-Linked Bullet / EMI)',
    defaultTenureMonths: 12,
    defaultAmount: 200000,
    maxLimit: 500000,
    collateralRule: 'Hypothecation of standing crops; no land mortgage up to ₹1.60L',
    features: [
      'Covers seed, fertilizer, micro-irrigation maintenance, and harvesting labour.',
      'DLTC Scale of Finance: ₹38,000/acre (Paddy), ₹45,000/acre (Small Onion), ₹32,000/acre (Maize).',
      'Flexible post-harvest grace period up to 60 days for e-NAM/Mandi sale.',
    ],
  },
  {
    id: 'loan-term',
    type: 'Term Loan',
    title: 'Agri Term Loan (Farm Mechanization, Borewell & Land Development)',
    titleTa: 'நடுத்தர மற்றும் நீண்ட கால வேளாண் முதலீட்டு கடன்',
    bankPartner: 'Indian Bank, Tamil Nadu Grama Bank & NABARD Refinance',
    interestRatePct: 8.5,
    standardRatePct: 10.75,
    subventionNote: 'Concessional NABARD Long-Term Irrigation & Mechanization Refinance Rate',
    tenureRange: '36 to 84 Months (3 to 7 Years)',
    defaultTenureMonths: 48,
    defaultAmount: 450000,
    maxLimit: 1500000,
    collateralRule: 'Hypothecation of machinery/asset + registered equitable land charge above ₹2L',
    features: [
      'Ideal for tractors, power tillers, deep borewells, farm ponds, and onion storage godowns.',
      'Can be linked directly with 40%–50% SMAM or PM-KUSUM back-ended capital subsidy.',
      'Half-yearly or monthly EMI aligned with Kharif & Samba harvest cashflows.',
    ],
  },
];

interface ActiveLoanAccount {
  id: string;
  accountNo: string;
  loanType: 'Kisan Credit Card (KCC)' | 'Crop Loan' | 'Term Loan';
  title: string;
  bankPartner: string;
  sanctionedAmount: number;
  outstandingBalance: number;
  interestRatePct: number;
  monthlyEmiOrDue: number;
  nextDueDate: string;
  daysRemaining: number;
  subventionActive: boolean;
  reminderSet: boolean;
}

export type LoanTimelineStage = 'Submitted' | 'Verified' | 'Sanctioned' | 'Disbursed';

interface LoanApplicationRecord {
  id: string;
  referenceNo: string;
  loanType: 'Kisan Credit Card (KCC)' | 'Crop Loan' | 'Term Loan';
  bankPartner: string;
  applicantName: string;
  farmerId: string;
  surveyNo: string;
  landAcres: number;
  cropName: string;
  amountRequested: number;
  sanctionedAmount: number;
  interestRatePct: number;
  tenureMonths: number;
  purpose: string;
  appliedDate: string;
  stageIndex: number; // 1 = Submitted, 2 = Verified, 3 = Sanctioned, 4 = Disbursed
  status: ApplicationStatus;
  stageTimestamps: {
    submitted: string;
    verified?: string;
    sanctioned?: string;
    disbursed?: string;
  };
  officerNotes: string;
  documents: string[];
}

const INITIAL_ACTIVE_LOANS: ActiveLoanAccount[] = [
  {
    id: 'act-ln-1',
    accountNo: 'KCC-PACCS-PBL-9930',
    loanType: 'Kisan Credit Card (KCC)',
    title: 'KCC Revolving Crop Limit (Samba Paddy & Maize)',
    bankPartner: 'PACCS Arumbavur · Perambalur DCCB',
    sanctionedAmount: 125000,
    outstandingBalance: 82500,
    interestRatePct: 0.0,
    monthlyEmiOrDue: 82500,
    nextDueDate: '15 Dec 2026',
    daysRemaining: 49,
    subventionActive: true,
    reminderSet: false,
  },
  {
    id: 'act-ln-2',
    accountNo: 'TL-IDIB-004412',
    loanType: 'Term Loan',
    title: 'Minor Irrigation & Onion Storage Shed Term Loan',
    bankPartner: 'Indian Bank · Perambalur Branch',
    sanctionedAmount: 240000,
    outstandingBalance: 164200,
    interestRatePct: 8.5,
    monthlyEmiOrDue: 5915,
    nextDueDate: '10 Nov 2026',
    daysRemaining: 14,
    subventionActive: true,
    reminderSet: true,
  },
];

const INITIAL_LOAN_APPLICATIONS: LoanApplicationRecord[] = [
  {
    id: 'lapp-101',
    referenceNo: 'TN-KCC-2026-9930',
    loanType: 'Kisan Credit Card (KCC)',
    bankPartner: 'PACCS Arumbavur · Perambalur DCCB',
    applicantName: 'Muruganandham Selvaraj',
    farmerId: 'TN-PBL-2026-84920',
    surveyNo: 'SF-142/2A',
    landAcres: 3.0,
    cropName: 'Paddy (ADT-43 / Ponni)',
    amountRequested: 125000,
    sanctionedAmount: 125000,
    interestRatePct: 0.0,
    tenureMonths: 12,
    purpose: 'Samba Paddy & Hybrid Maize cultivation inputs (Seed, Basal DAP, Labour)',
    appliedDate: '2026-09-18',
    stageIndex: 4,
    status: 'Approved',
    stageTimestamps: {
      submitted: '18 Sep 2026, 10:15 AM',
      verified: '20 Sep 2026, 03:40 PM',
      sanctioned: '23 Sep 2026, 11:20 AM',
      disbursed: '25 Sep 2026, 02:05 PM',
    },
    officerNotes:
      'Sanctioned under 100% TN State Interest Subvention Scheme. Disbursed to DCCB SB A/c XXXX-1108.',
    documents: ['Patta_Chitta_SF142.pdf', 'VAO_eAdangal_Samba2026.pdf', 'Aadhaar_Card_7842.pdf'],
  },
  {
    id: 'lapp-102',
    referenceNo: 'TN-TL-2026-4819',
    loanType: 'Term Loan',
    bankPartner: 'Indian Bank · Perambalur Branch',
    applicantName: 'Muruganandham Selvaraj',
    farmerId: 'TN-PBL-2026-84920',
    surveyNo: 'SF-145/3',
    landAcres: 1.75,
    cropName: 'Small Onion (Perambalur Local)',
    amountRequested: 320000,
    sanctionedAmount: 300000,
    interestRatePct: 8.5,
    tenureMonths: 48,
    purpose: '8.5 HP Power Tiller + 15-Tonne Ventilated Onion Storage Structure',
    appliedDate: '2026-10-14',
    stageIndex: 3,
    status: 'Under Review',
    stageTimestamps: {
      submitted: '14 Oct 2026, 09:50 AM',
      verified: '18 Oct 2026, 04:15 PM',
      sanctioned: '24 Oct 2026, 12:30 PM',
    },
    officerNotes:
      'Credit appraisal and field verification completed by Field Officer. Sanction order generated; awaiting dealer invoice for final disbursal.',
    documents: ['Patta_Chitta_SF145.pdf', 'TEDA_Dealer_Quotation.pdf', 'Bank_NoDue_Cert.pdf'],
  },
];

// ============================================================================
// ZOD SCHEMA FOR SUBSIDY FORM
// ============================================================================

const subsidyFormSchema = z.object({
  schemeName: z.string().min(4, 'Enter or select a valid subsidy program name'),
  category: z.enum([
    'Fertilizer Subsidy',
    'Seed Subsidy',
    'Micro Irrigation',
    'Farm Machinery',
    'Solar Pump',
  ]),
  amountRequested: z
    .number({ message: 'Enter valid invoice / input cost in ₹' })
    .min(1000, 'Minimum ₹1,000 invoice amount required')
    .max(500000, 'Maximum ₹5,00,000 online self-declaration limit'),
  bankAccount: z.string().min(5, 'DBT linked bank account reference is required'),
  remarks: z.string().min(5, 'Provide land survey number and dealer/AEC quotation details'),
});

type SubsidyFormValues = z.infer<typeof subsidyFormSchema>;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SubsidyLoanPage: React.FC = () => {
  const {
    language,
    user,
    role,
    crops,
    subsidies,
    addSubsidyApplication,
    updateSubsidyStatus,
    addNotification,
    showToast,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  // Main Two-Tab State: 'subsidy' | 'loan'
  const [activeTab, setActiveTab] = useState<'subsidy' | 'loan'>('subsidy');

  // --------------------------------------------------------------------------
  // SUBSIDY TAB STATES
  // --------------------------------------------------------------------------
  const [subsidyCategoryFilter, setSubsidyCategoryFilter] = useState<SubsidyCategoryKey>('All');
  const [subsidySearch, setSubsidySearch] = useState('');
  const [trackerStatusFilter, setTrackerStatusFilter] = useState<'All' | ApplicationStatus>('All');
  const [isSubsidyModalOpen, setIsSubsidyModalOpen] = useState(false);

  // Interactive Subsidy Eligibility Checker state
  const [eligSubCategory, setEligSubCategory] =
    useState<Exclude<SubsidyCategoryKey, 'All'>>('Drip Irrigation');
  const [eligLandAcres, setEligLandAcres] = useState<number>(3.5);
  const [eligFarmerType, setEligFarmerType] = useState<
    'Small / Marginal (< 5 Acres)' | 'SC / ST / Women Priority' | 'Medium / Large (> 5 Acres)'
  >('Small / Marginal (< 5 Acres)');
  const [eligWaterSource, setEligWaterSource] = useState<string>('Borewell + Canal');
  const [eligInvoiceCost, setEligInvoiceCost] = useState<number>(68000);

  // --------------------------------------------------------------------------
  // LOAN TAB STATES
  // --------------------------------------------------------------------------
  const [activeLoans, setActiveLoans] = useState<ActiveLoanAccount[]>(INITIAL_ACTIVE_LOANS);
  const [loanApplications, setLoanApplications] =
    useState<LoanApplicationRecord[]>(INITIAL_LOAN_APPLICATIONS);

  // EMI & Interest Calculator Sliders
  const [calcAmount, setCalcAmount] = useState<number>(200000);
  const [calcRate, setCalcRate] = useState<number>(4.0);
  const [calcTenureMonths, setCalcTenureMonths] = useState<number>(24);
  const [showAmortizationTable, setShowAmortizationTable] = useState<boolean>(false);

  // 5-Step Loan Application Wizard Modal
  const [isLoanWizardOpen, setIsLoanWizardOpen] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardError, setWizardError] = useState<string>('');
  const [wizardSubmittedLoan, setWizardSubmittedLoan] = useState<LoanApplicationRecord | null>(
    null
  );

  const [loanWizardData, setLoanWizardData] = useState({
    // Step 1: Applicant
    applicantName: user.name,
    farmerId: user.farmerId,
    phone: user.phone,
    aadhaarLast4: user.aadhaarLast4,
    village: `${user.village}, ${user.taluk}, ${user.district}`,
    bankPartner: 'PACCS Arumbavur · Perambalur DCCB',
    // Step 2: Land & Crop
    surveyNo: crops[0]?.surveyNumber || 'SF-142/2A',
    landAcres: crops[0]?.areaAcres || 3.0,
    cropName: crops[0]?.cropName || 'Paddy (ADT-43 / Ponni)',
    irrigationType: crops[0]?.irrigationType || 'Canal',
    // Step 3: Loan Amount & Purpose
    loanType: 'Kisan Credit Card (KCC)' as LoanProductItem['type'],
    amountRequested: 125000,
    interestRatePct: 0.0,
    tenureMonths: 12,
    purpose: 'Samba Paddy & Maize crop production inputs (Seeds, Fertilizers, Irrigation)',
    // Step 4: Documents
    documents: [
      'Computerized_Patta_Chitta_SF142.pdf',
      'VAO_eAdangal_Sowing_Cert_2026.pdf',
      'Aadhaar_NPCI_Bank_Passbook.pdf',
    ],
    // Step 5: Consent
    consentAccepted: true,
  });

  // React Hook Form for Subsidy Application
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubsidyFormValues>({
    resolver: zodResolver(subsidyFormSchema),
    defaultValues: {
      schemeName: 'PMKSY Automated Drip & Micro-Sprinkler Irrigation System',
      category: 'Micro Irrigation',
      amountRequested: 68400,
      bankAccount: user.accountMasked,
      remarks: 'Survey No. SF-144/1B · Empanelled TANHODA Vendor Quotation Attached.',
    },
  });

  const watchedCategory = watch('category');
  const watchedAmount = watch('amountRequested') || 0;

  const estimatedFormSubsidy = useMemo(() => {
    const ratio =
      watchedCategory === 'Micro Irrigation'
        ? 1.0
        : watchedCategory === 'Solar Pump'
        ? 0.7
        : watchedCategory === 'Farm Machinery'
        ? 0.5
        : watchedCategory === 'Fertilizer Subsidy'
        ? 0.5
        : 0.5;
    const cap =
      watchedCategory === 'Micro Irrigation'
        ? 82500
        : watchedCategory === 'Solar Pump'
        ? 165000
        : watchedCategory === 'Farm Machinery'
        ? 125000
        : watchedCategory === 'Fertilizer Subsidy'
        ? 12500
        : 6000;
    return Math.min(Math.round(Number(watchedAmount) * ratio), cap);
  }, [watchedCategory, watchedAmount]);

  // --------------------------------------------------------------------------
  // SUBSIDY ELIGIBILITY CHECKER COMPUTATION
  // --------------------------------------------------------------------------
  const eligibilityCalculation = useMemo(() => {
    const isSmallOrPriority =
      eligFarmerType === 'Small / Marginal (< 5 Acres)' ||
      eligFarmerType === 'SC / ST / Women Priority' ||
      eligLandAcres <= 5;

    let ratePct = 50;
    let maxCap = 12500;
    let schemeTitle = 'Integrated Nutrient & Bio-Fertilizer Input Subsidy';

    if (eligSubCategory === 'Fertilizer') {
      ratePct = 50;
      maxCap = 12500;
      schemeTitle = 'Integrated Nutrient, Micronutrient & Bio-Fertilizer Subsidy';
    } else if (eligSubCategory === 'Seed') {
      ratePct = 50;
      maxCap = 6000;
      schemeTitle = 'KAVIADP Certified Paddy, Hybrid Maize & Pulse Seed Subsidy';
    } else if (eligSubCategory === 'Drip Irrigation') {
      ratePct = isSmallOrPriority ? 100 : 75;
      maxCap = 82500;
      schemeTitle = 'PMKSY Automated Drip & Micro-Sprinkler Irrigation System';
    } else if (eligSubCategory === 'Machinery') {
      ratePct = isSmallOrPriority ? 50 : 40;
      maxCap = 125000;
      schemeTitle = 'SMAM Farm Mechanization (Power Tiller, Weeder & Rotavator)';
    }

    const rawSubsidy = Math.round((eligInvoiceCost * ratePct) / 100);
    const admissibleSubsidy = Math.min(rawSubsidy, maxCap);
    const farmerShare = Math.max(0, eligInvoiceCost - admissibleSubsidy);
    const isEligible = eligLandAcres >= 0.25 && eligLandAcres <= 25;

    return {
      isEligible,
      ratePct,
      maxCap,
      admissibleSubsidy,
      farmerShare,
      schemeTitle,
    };
  }, [eligSubCategory, eligLandAcres, eligFarmerType, eligInvoiceCost]);

  // --------------------------------------------------------------------------
  // LOAN EMI & REPAYMENT SCHEDULE CHART COMPUTATION
  // --------------------------------------------------------------------------
  const emiData = useMemo(() => {
    const P = calcAmount;
    const annualRate = calcRate;
    const N = calcTenureMonths;

    if (annualRate === 0) {
      const monthlyEmi = Math.round(P / N);
      const totalPayment = P;
      const totalInterest = 0;
      const interestSavedVsStandard = Math.round(P * 0.07 * (N / 12));

      const schedule: {
        period: string;
        principal: number;
        interest: number;
        balance: number;
      }[] = [];

      const step = Math.max(1, Math.floor(N / 8));
      let rem = P;
      for (let m = 1; m <= N; m++) {
        rem = Math.max(0, rem - monthlyEmi);
        if (m % step === 0 || m === N || m === 1) {
          schedule.push({
            period: `Mo ${m}`,
            principal: monthlyEmi,
            interest: 0,
            balance: Math.round(rem),
          });
        }
      }

      return {
        monthlyEmi,
        totalPrincipal: P,
        totalInterest,
        totalPayment,
        interestSavedVsStandard,
        schedule,
      };
    }

    const r = annualRate / 12 / 100;
    const factor = Math.pow(1 + r, N);
    const emiExact = (P * r * factor) / (factor - 1);
    const monthlyEmi = Math.round(emiExact);

    let balance = P;
    let totalInterestAcc = 0;
    const fullMonths: {
      month: number;
      principal: number;
      interest: number;
      balance: number;
    }[] = [];

    for (let m = 1; m <= N; m++) {
      const intComp = Math.round(balance * r);
      const prinComp = Math.min(balance, Math.max(0, monthlyEmi - intComp));
      balance = Math.max(0, balance - prinComp);
      totalInterestAcc += intComp;
      fullMonths.push({
        month: m,
        principal: prinComp,
        interest: intComp,
        balance: Math.round(balance),
      });
    }

    // Group into up to 10 chart buckets so the Recharts chart is super crisp
    const bucketCount = Math.min(N, 10);
    const bucketSize = Math.max(1, Math.ceil(N / bucketCount));
    const schedule: {
      period: string;
      principal: number;
      interest: number;
      balance: number;
    }[] = [];

    for (let i = 0; i < N; i += bucketSize) {
      const slice = fullMonths.slice(i, i + bucketSize);
      if (slice.length === 0) continue;
      const sumPrin = slice.reduce((a, b) => a + b.principal, 0);
      const sumInt = slice.reduce((a, b) => a + b.interest, 0);
      const endBal = slice[slice.length - 1].balance;
      const label =
        bucketSize === 1
          ? `M${slice[0].month}`
          : `M${slice[0].month}-${slice[slice.length - 1].month}`;
      schedule.push({
        period: label,
        principal: sumPrin,
        interest: sumInt,
        balance: endBal,
      });
    }

    const totalPayment = P + totalInterestAcc;
    const interestSavedVsStandard = Math.max(
      0,
      Math.round(P * (Math.max(0, 11 - annualRate) / 100) * (N / 12))
    );

    return {
      monthlyEmi,
      totalPrincipal: P,
      totalInterest: totalInterestAcc,
      totalPayment,
      interestSavedVsStandard,
      schedule,
    };
  }, [calcAmount, calcRate, calcTenureMonths]);

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  // --------------------------------------------------------------------------
  // SUMMARY METRICS
  // --------------------------------------------------------------------------
  const totalApprovedSubsidy = subsidies
    .filter((s) => s.status === 'Approved')
    .reduce((acc, s) => acc + s.subsidyComponent, 0);

  const totalPendingSubsidy = subsidies
    .filter((s) => s.status === 'Pending' || s.status === 'Under Review')
    .reduce((acc, s) => acc + s.subsidyComponent, 0);

  const totalOutstandingLoan = activeLoans.reduce((acc, l) => acc + l.outstandingBalance, 0);
  const nearestDueLoan = [...activeLoans].sort((a, b) => a.daysRemaining - b.daysRemaining)[0];

  // Filtered Subsidy Catalogue
  const filteredSubsidyCatalogue = SUBSIDY_CATALOGUE.filter((item) => {
    const matchesCat =
      subsidyCategoryFilter === 'All' || item.categoryKey === subsidyCategoryFilter;
    const q = subsidySearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Filtered Subsidy Applications
  const filteredSubsidyApplications = subsidies.filter(
    (s) => trackerStatusFilter === 'All' || s.status === trackerStatusFilter
  );

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------
  const handleQuickApplySubsidy = (item: SubsidyCatalogItem) => {
    setValue('category', item.mappedCategory);
    setValue('schemeName', item.title);
    setValue(
      'amountRequested',
      item.categoryKey === 'Drip Irrigation'
        ? 68400
        : item.categoryKey === 'Machinery'
        ? 95000
        : item.categoryKey === 'Fertilizer'
        ? 12000
        : 5000
    );
    setValue(
      'remarks',
      `Survey No. ${crops[0]?.surveyNumber || 'SF-142/2A'} · ${item.code} Online Claim`
    );
    setIsSubsidyModalOpen(true);
  };

  const onSubmitSubsidyForm = (values: SubsidyFormValues) => {
    addSubsidyApplication({
      ...values,
      schemeNameTa: values.schemeName,
      subsidyComponent: estimatedFormSubsidy,
    });
    reset();
    setIsSubsidyModalOpen(false);
  };

  const handleSetLoanReminder = (loan: ActiveLoanAccount) => {
    setActiveLoans((prev) =>
      prev.map((item) => (item.id === loan.id ? { ...item, reminderSet: true } : item))
    );
    addNotification({
      title: `Repayment Reminder: ${loan.accountNo}`,
      titleTa: `கடன் தவணை நினைவூட்டல்: ${loan.accountNo}`,
      message: `Due on ${loan.nextDueDate} (${loan.daysRemaining} days left). Pay on time to retain 100% interest subvention.`,
      messageTa: `அடுத்த தவணை தேதி: ${loan.nextDueDate}. சரியான நேரத்தில் செலுத்தி வட்டி மானியத்தைப் பெறுங்கள்.`,
      type: 'subsidy',
    });
    showToast(
      language === 'ta' ? 'தவணை நினைவூட்டல் அமைக்கப்பட்டது' : 'Repayment Reminder Activated',
      `Alert added to notification bell for ${loan.accountNo} (Due: ${loan.nextDueDate})`
    );
  };

  const handleSimulatePartPayment = (loan: ActiveLoanAccount) => {
    const payment = Math.min(10000, loan.outstandingBalance);
    if (payment <= 0) return;
    setActiveLoans((prev) =>
      prev.map((item) =>
        item.id === loan.id
          ? { ...item, outstandingBalance: Math.max(0, item.outstandingBalance - payment) }
          : item
      )
    );
    showToast(
      language === 'ta' ? 'தவணைத் தொகை வரவு வைக்கப்பட்டது' : 'Part-Payment Recorded',
      `₹${payment.toLocaleString('en-IN')} credited towards ${loan.accountNo}. Updated balance reflected.`
    );
  };

  const handleOpenLoanWizardForProduct = (product: LoanProductItem) => {
    setLoanWizardData((prev) => ({
      ...prev,
      loanType: product.type,
      bankPartner: product.bankPartner,
      amountRequested: product.defaultAmount,
      interestRatePct: product.interestRatePct,
      tenureMonths: product.defaultTenureMonths,
      purpose:
        product.type === 'Kisan Credit Card (KCC)'
          ? 'Revolving crop production credit for Samba Paddy & Maize'
          : product.type === 'Crop Loan'
          ? 'Seasonal Scale-of-Finance inputs for Paddy & Small Onion'
          : 'Purchase of 8.5 HP Power Tiller & Drip Fertigation Assembly',
    }));
    setWizardStep(1);
    setWizardError('');
    setWizardSubmittedLoan(null);
    setIsLoanWizardOpen(true);
  };

  const handleLoanDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newNames: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > 5 * 1024 * 1024) {
        setWizardError(`File "${f.name}" exceeds 5 MB maximum size.`);
        return;
      }
      newNames.push(f.name);
    }
    setWizardError('');
    setLoanWizardData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newNames],
    }));
  };

  const handleSubmitLoanWizard = () => {
    if (!loanWizardData.consentAccepted) {
      setWizardError('Please accept the borrower declaration to submit your application.');
      return;
    }
    const refPrefix =
      loanWizardData.loanType === 'Kisan Credit Card (KCC)'
        ? 'TN-KCC'
        : loanWizardData.loanType === 'Crop Loan'
        ? 'TN-CRL'
        : 'TN-TL';
    const refNo = `${refPrefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newLoanRecord: LoanApplicationRecord = {
      id: `lapp-${Date.now()}`,
      referenceNo: refNo,
      loanType: loanWizardData.loanType,
      bankPartner: loanWizardData.bankPartner,
      applicantName: loanWizardData.applicantName,
      farmerId: loanWizardData.farmerId,
      surveyNo: loanWizardData.surveyNo,
      landAcres: Number(loanWizardData.landAcres),
      cropName: loanWizardData.cropName,
      amountRequested: Number(loanWizardData.amountRequested),
      sanctionedAmount: Number(loanWizardData.amountRequested),
      interestRatePct: Number(loanWizardData.interestRatePct),
      tenureMonths: Number(loanWizardData.tenureMonths),
      purpose: loanWizardData.purpose,
      appliedDate: todayStr,
      stageIndex: 1,
      status: 'Pending',
      stageTimestamps: {
        submitted: 'Today, Just now',
      },
      officerNotes:
        'Application transmitted online to VAO & Nodal Bank Branch for e-Adangal and encumbrance verification.',
      documents: loanWizardData.documents,
    };

    setLoanApplications((prev) => [newLoanRecord, ...prev]);
    setWizardSubmittedLoan(newLoanRecord);
    showToast(
      language === 'ta' ? 'கடன் விண்ணப்பம் சமர்ப்பிக்கப்பட்டது' : 'Loan Application Submitted',
      `Reference ID: ${refNo} · Sent to ${loanWizardData.bankPartner}`
    );
  };

  const handleAdvanceLoanStage = (loanApp: LoanApplicationRecord) => {
    const nextStage = Math.min(4, loanApp.stageIndex + 1);
    const nowLabel = 'Updated Today';
    const nextStatus: ApplicationStatus =
      nextStage === 4 ? 'Approved' : nextStage >= 2 ? 'Under Review' : 'Pending';

    const notesMap: Record<number, string> = {
      2: 'Land survey & VAO e-Adangal verified without encumbrance.',
      3: `Sanctioned by Branch Credit Committee (${loanApp.bankPartner}). Sanction Letter ready for download.`,
      4: 'Funds disbursed directly to farmer bank / KCC account via CBS NEFT.',
    };

    setLoanApplications((prev) =>
      prev.map((item) => {
        if (item.id !== loanApp.id) return item;
        return {
          ...item,
          stageIndex: nextStage,
          status: nextStatus,
          officerNotes: notesMap[nextStage] || item.officerNotes,
          stageTimestamps: {
            ...item.stageTimestamps,
            ...(nextStage === 2 ? { verified: nowLabel } : {}),
            ...(nextStage === 3 ? { sanctioned: nowLabel } : {}),
            ...(nextStage === 4 ? { disbursed: nowLabel } : {}),
          },
        };
      })
    );

    showToast(
      'Loan Pipeline Stage Updated',
      `${loanApp.referenceNo} advanced to Stage ${nextStage}/4 (${
        ['Submitted', 'Verified', 'Sanctioned', 'Disbursed'][nextStage - 1]
      })`
    );
  };

  const handleDownloadSanctionLetterPdf = (loanApp: LoanApplicationRecord) => {
    const monthlyEmiEst =
      loanApp.interestRatePct === 0
        ? Math.round(loanApp.sanctionedAmount / loanApp.tenureMonths)
        : Math.round(
            (loanApp.sanctionedAmount *
              (loanApp.interestRatePct / 1200) *
              Math.pow(1 + loanApp.interestRatePct / 1200, loanApp.tenureMonths)) /
              (Math.pow(1 + loanApp.interestRatePct / 1200, loanApp.tenureMonths) - 1)
          );

    const lines = [
      'GOVERNMENT OF TAMIL NADU - DIGITAL FARMER e-GOVERNANCE PORTAL',
      'OFFICIAL AGRICULTURAL CREDIT & KCC SANCTION LETTER',
      '============================================================',
      `Sanction Reference No.   : ${loanApp.referenceNo}`,
      `Date of Issue            : ${loanApp.appliedDate}`,
      `Sanctioning Institution  : ${loanApp.bankPartner}`,
      `Application Status       : ${loanApp.status.toUpperCase()} (Stage ${loanApp.stageIndex}/4)`,
      '------------------------------------------------------------',
      `Borrower Farmer Name     : ${loanApp.applicantName}`,
      `Uzhavar Farmer ID        : ${loanApp.farmerId}`,
      `Land Survey No. & Area   : ${loanApp.surveyNo} (${loanApp.landAcres} Acres)`,
      `Notified Crop            : ${loanApp.cropName}`,
      '------------------------------------------------------------',
      `Credit Facility Type     : ${loanApp.loanType}`,
      `Sanctioned Loan Amount   : Rs. ${loanApp.sanctionedAmount.toLocaleString('en-IN')}`,
      `Effective Interest Rate  : ${loanApp.interestRatePct.toFixed(2)}% p.a. (Subvention Applied)`,
      `Repayment Tenure         : ${loanApp.tenureMonths} Months`,
      `Estimated Monthly/Bullet : Rs. ${monthlyEmiEst.toLocaleString('en-IN')} / installment`,
      `Purpose of Credit        : ${loanApp.purpose.slice(0, 52)}`,
      '------------------------------------------------------------',
      `Verification Note        : ${loanApp.officerNotes.slice(0, 55)}`,
      'Digitally Signed by Authorised Credit Officer / PACCS Secretary',
    ];

    const escapedLines = lines
      .map(
        (line, idx) =>
          `1 0 0 1 40 ${750 - idx * 24} Tm (${line.replace(/[()\\]/g, '')}) Tj`
      )
      .join('\n');

    const streamContent = `BT\n/F1 10 Tf\n${escapedLines}\nET`;
    const pdfRaw = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamContent.length} >> stream
${streamContent}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000950 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
1018
%%EOF`;

    const blob = new Blob([pdfRaw], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sanction_Letter_${loanApp.referenceNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      language === 'ta' ? 'கடன் அனுமதி கடிதம் பதிவிறக்கப்பட்டது' : 'Sanction Letter Downloaded',
      `Saved Sanction_Letter_${loanApp.referenceNo}.pdf`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta'
              ? 'வேளாண் மானியம் மற்றும் பயிர் கடன் சேவைகள்'
              : 'Agricultural Subsidy & Farm Credit (KCC / Term Loans)'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct Benefit Transfer (DBT) input/machinery subsidies, 0%-interest PACCS Kisan Credit Card, and NABARD term loans
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('subsidy');
              setIsSubsidyModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0B4D2E]" />
            <span>{language === 'ta' ? 'புதிய மானிய விண்ணப்பம்' : 'Apply for Subsidy'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('loan');
              handleOpenLoanWizardForProduct(LOAN_PRODUCTS[0]);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
          >
            <Landmark className="w-4 h-4" />
            <span>{language === 'ta' ? 'புதிய கடன் விண்ணப்பம்' : 'Apply for Agricultural Loan'}</span>
          </button>
        </div>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={language === 'ta' ? 'மொத்த மானியம் வரவு' : 'Total DBT Subsidy Credited'}
          value={`₹${totalApprovedSubsidy.toLocaleString('en-IN')}`}
          subtext={`Credited to ${user.bankName.split('·')[0]}`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label={language === 'ta' ? 'பரிசீலனையில் உள்ள மானியம்' : 'In-Pipeline Subsidy Claims'}
          value={`₹${totalPendingSubsidy.toLocaleString('en-IN')}`}
          subtext="Under Block / TANHODA Verification"
          icon={<Clock className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label={language === 'ta' ? 'நிலுவையில் உள்ள கடன் தொகை' : 'Active Loan Outstanding'}
          value={`₹${totalOutstandingLoan.toLocaleString('en-IN')}`}
          subtext={`${activeLoans.length} Active Accounts (KCC + Term Loan)`}
          icon={<Landmark className="w-5 h-5" />}
          accentColor="blue"
        />
        <StatCard
          label={language === 'ta' ? 'அடுத்த தவணை தேதி' : 'Next Loan Due Date'}
          value={nearestDueLoan ? nearestDueLoan.nextDueDate : 'No Dues'}
          subtext={
            nearestDueLoan
              ? `In ${nearestDueLoan.daysRemaining} days · ₹${nearestDueLoan.monthlyEmiOrDue.toLocaleString('en-IN')}`
              : '100% Interest Subvention Active'
          }
          icon={<Calendar className="w-5 h-5" />}
          accentColor="orange"
        />
      </div>

      {/* Primary Two-Tab Switcher: SUBSIDY | LOAN */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-xs flex flex-col sm:flex-row gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('subsidy')}
          className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'subsidy'
              ? 'bg-[#0B4D2E] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <HandCoins className="w-4 h-4" />
          <span>
            {language === 'ta'
              ? '1. மானியத் திட்டங்கள் (SUBSIDY — உரம், விதை, சொட்டு நீர், இயந்திரம்)'
              : 'SUBSIDY (Fertilizer, Seed, Drip Irrigation & Machinery)'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums ${
              activeTab === 'subsidy'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {subsidies.length} Tracked
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('loan')}
          className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'loan'
              ? 'bg-[#0B4D2E] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>
            {language === 'ta'
              ? '2. வேளாண் கடன் & இஎம்ஐ கால்குலேட்டர் (LOAN — KCC, பயிர் & கால கடன்)'
              : 'LOAN (Kisan Credit Card, Crop Loan, Term Loan & EMI Calculator)'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums ${
              activeTab === 'loan'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {loanApplications.length} Applications
          </span>
        </button>
      </div>

      {/* ====================================================================
          TAB 1: SUBSIDY MODULE
      ==================================================================== */}
      {activeTab === 'subsidy' && (
        <div className="space-y-6">
          {/* 1A. Available Subsidies Catalogue */}
          <Card
            title={
              language === 'ta'
                ? 'கிடைக்கும் வேளாண் மானியத் திட்டங்கள் (உரம், விதை, சொட்டு நீர், இயந்திரங்கள்)'
                : 'Available Agricultural Subsidies (Fertilizer, Seed, Drip Irrigation & Machinery)'
            }
            subtitle="Select a subsidy category to inspect admissible grant rates, check eligibility, or file an online DBT claim"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={subsidySearch}
                    onChange={(e) => setSubsidySearch(e.target.value)}
                    placeholder="Search subsidy..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
                  />
                </div>
              </div>
            }
          >
            {/* Category Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Category:
              </span>
              {(['All', 'Fertilizer', 'Seed', 'Drip Irrigation', 'Machinery'] as SubsidyCategoryKey[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSubsidyCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      subsidyCategoryFilter === cat
                        ? 'bg-[#0B4D2E] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            {/* Subsidy Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubsidyCatalogue.map((item) => {
                const CategoryIcon =
                  item.categoryKey === 'Fertilizer'
                    ? FlaskConical
                    : item.categoryKey === 'Seed'
                    ? Sprout
                    : item.categoryKey === 'Drip Irrigation'
                    ? Droplets
                    : Tractor;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200/90 bg-white p-4 flex flex-col justify-between hover:border-[#0B4D2E]/50 transition-all shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-[#0B4D2E] border border-emerald-200">
                          <CategoryIcon className="w-3.5 h-3.5" />
                          {item.categoryKey}
                        </span>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 tabular-nums">
                          Up to {item.subsidyPercentSfMf}% Subsidy
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {language === 'ta' ? item.titleTa : item.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {item.department} · Code: <span className="font-mono">{item.code}</span>
                      </p>

                      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                        {language === 'ta' ? item.descriptionTa : item.description}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Max Subsidy Ceiling:</span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            ₹{item.maxCapAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">SF/MF vs Others Rate:</span>
                          <span className="font-mono font-semibold text-[#1E8E4F] tabular-nums">
                            {item.subsidyPercentSfMf}% / {item.subsidyPercentOther}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-[11px] font-semibold text-slate-500 mb-1">
                          Eligible Items Covered:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.eligibleItems.map((el) => (
                            <span
                              key={el}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]"
                            >
                              {el}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEligSubCategory(item.categoryKey);
                          setEligInvoiceCost(
                            item.categoryKey === 'Drip Irrigation'
                              ? 68400
                              : item.categoryKey === 'Machinery'
                              ? 95000
                              : item.categoryKey === 'Fertilizer'
                              ? 12000
                              : 5000
                          );
                          const el = document.getElementById('subsidy-eligibility-section');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-center"
                      >
                        Check Eligibility
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickApplySubsidy(item)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer text-center"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 1B. Interactive Subsidy Eligibility & Grant Calculator */}
          <div id="subsidy-eligibility-section">
            <Card
              title={
                language === 'ta'
                  ? 'மானியத் தகுதி மற்றும் நேரடி மானியத் தொகை கணிப்பான்'
                  : 'Interactive Subsidy Eligibility Checker & DBT Grant Estimator'
              }
              subtitle="Verify your instant eligibility across Fertilizer, Seed, Drip Irrigation, and Farm Machinery subsidies based on landholding and category"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Inputs (7 cols) */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      1. Select Subsidy Type
                    </label>
                    <select
                      value={eligSubCategory}
                      onChange={(e) =>
                        setEligSubCategory(e.target.value as Exclude<SubsidyCategoryKey, 'All'>)
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
                    >
                      <option value="Fertilizer">Fertilizer & Bio-Input Subsidy (50%)</option>
                      <option value="Seed">Certified Seed Distribution Subsidy (50%)</option>
                      <option value="Drip Irrigation">PMKSY Drip / Micro-Irrigation (Up to 100%)</option>
                      <option value="Machinery">SMAM Farm Machinery & Solar Pump (40%–70%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Farmer Category
                    </label>
                    <select
                      value={eligFarmerType}
                      onChange={(e) =>
                        setEligFarmerType(
                          e.target.value as
                            | 'Small / Marginal (< 5 Acres)'
                            | 'SC / ST / Women Priority'
                            | 'Medium / Large (> 5 Acres)'
                        )
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
                    >
                      <option value="Small / Marginal (< 5 Acres)">
                        Small / Marginal Farmer (&lt; 5 Acres)
                      </option>
                      <option value="SC / ST / Women Priority">
                        SC / ST / Women Farmer (Priority Quota)
                      </option>
                      <option value="Medium / Large (> 5 Acres)">
                        Medium / Other Farmer (&gt; 5 Acres)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>3. Cultivable Land Area (Acres)</span>
                      <span className="font-mono text-[#0B4D2E] font-bold tabular-nums">
                        {eligLandAcres} Acres
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.1"
                      max="30"
                      value={eligLandAcres}
                      onChange={(e) => setEligLandAcres(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4. Assured Irrigation Source
                    </label>
                    <select
                      value={eligWaterSource}
                      onChange={(e) => setEligWaterSource(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
                    >
                      <option value="Borewell + Canal">Borewell + Check Dam Canal</option>
                      <option value="Open Well / Solar Pump">Open Well / Solar Submersible</option>
                      <option value="Rainfed + Farm Pond">Rainfed with Farm Pond</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>5. Estimated Equipment / Input Invoice Cost (₹)</span>
                      <span className="font-mono text-sm font-bold text-[#0B4D2E] tabular-nums">
                        ₹{eligInvoiceCost.toLocaleString('en-IN')}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={2000}
                      max={200000}
                      step={1000}
                      value={eligInvoiceCost}
                      onChange={(e) => setEligInvoiceCost(Number(e.target.value))}
                      className="w-full accent-[#0B4D2E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 tabular-nums mt-0.5">
                      <span>₹2,000 (Seeds/Bio-Input)</span>
                      <span>₹75,000 (Drip Kit)</span>
                      <span>₹2,00,000 (Machinery)</span>
                    </div>
                  </div>
                </div>

                {/* Right Eligibility Result Panel (5 cols) */}
                <div className="lg:col-span-5 rounded-xl bg-emerald-950 text-white p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      <ShieldCheck className="w-4 h-4" />
                      {eligibilityCalculation.isEligible
                        ? '100% ELIGIBLE FOR DBT CLAIM'
                        : 'CHECK LAND CEILING'}
                    </span>
                    <span className="font-mono text-xs text-emerald-200 tabular-nums">
                      Grant Rate: {eligibilityCalculation.ratePct}%
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-emerald-200">{eligibilityCalculation.schemeTitle}</p>
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/15">
                      <div>
                        <p className="text-[11px] text-emerald-300">Admissible Govt Subsidy</p>
                        <p className="text-xl font-bold text-white tabular-nums mt-0.5">
                          ₹{eligibilityCalculation.admissibleSubsidy.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-emerald-300/80 tabular-nums">
                          (Max Cap: ₹{eligibilityCalculation.maxCap.toLocaleString('en-IN')})
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-emerald-300">Net Farmer Share</p>
                        <p className="text-xl font-bold text-amber-300 tabular-nums mt-0.5">
                          ₹{eligibilityCalculation.farmerShare.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-emerald-300/80">
                          Payable to AEC / Dealer
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-emerald-100 pt-2 border-t border-white/15">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Aadhaar e-KYC & NPCI Bank Seeding Verified ({user.accountMasked})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Current Season e-Adangal Active ({eligWaterSource})</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const matched = SUBSIDY_CATALOGUE.find(
                        (c) => c.categoryKey === eligSubCategory
                      );
                      if (matched) {
                        setValue('category', matched.mappedCategory);
                        setValue('schemeName', matched.title);
                      }
                      setValue('amountRequested', eligInvoiceCost);
                      setIsSubsidyModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Subsidy Application Form</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* 1C. Subsidy Status Tracking Pipeline */}
          <Card
            title={
              language === 'ta'
                ? 'எனது மானிய விண்ணப்பங்களின் நிலை (4-நிலை கள ஆய்வு கண்காணிப்பு)'
                : 'Subsidy Status Tracker (4-Stage Field Verification & PFMS DBT Pipeline)'
            }
            subtitle={
              role !== 'Farmer'
                ? `Viewing as ${role} — Use the review controls on each record to test RBAC workflow`
                : 'Real-time updates from Village Administrative Officer (VAO), Block Agricultural Officer & PFMS'
            }
            action={
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Approved', 'Under Review', 'Pending', 'Rejected'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTrackerStatusFilter(st)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        trackerStatusFilter === st
                          ? 'bg-[#0B4D2E] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            }
          >
            <div className="divide-y divide-slate-100">
              {filteredSubsidyApplications.map((sub) => (
                <div key={sub.id} className="py-5 first:pt-0 last:pb-0 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-800">
                          {sub.referenceNo}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {sub.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">Filed: {sub.appliedDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>Bank: {sub.bankAccount}</span>
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 mt-1">
                        {language === 'ta' ? sub.schemeNameTa : sub.schemeName}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500">Sanctioned Subsidy</p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          ₹{sub.subsidyComponent.toLocaleString('en-IN')}{' '}
                          <span className="text-[11px] font-normal text-slate-500">
                            (of ₹{sub.amountRequested.toLocaleString('en-IN')})
                          </span>
                        </p>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>

                  <Stepper
                    steps={[
                      '1. Online Filing',
                      '2. VAO e-Adangal Check',
                      '3. Field Inspection',
                      '4. PFMS DBT Credit',
                    ]}
                    currentStep={sub.currentStep}
                    status={sub.status}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-slate-600">{sub.remarks}</p>

                    {(role === 'Officer' || role === 'Admin') && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateSubsidyStatus(
                              sub.id,
                              'Under Review',
                              3,
                              `Field inspection logged by ${role}.`
                            )
                          }
                          className="px-2.5 py-1 rounded text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 cursor-pointer"
                        >
                          Mark Inspected
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSubsidyStatus(
                              sub.id,
                              'Approved',
                              4,
                              `Approved for PFMS DBT release by ${role}.`
                            )
                          }
                          className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Approve DBT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSubsidyStatus(
                              sub.id,
                              'Rejected',
                              sub.currentStep,
                              `Returned by ${role}: Survey sub-division mismatch.`
                            )
                          }
                          className="px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ====================================================================
          TAB 2: LOAN MODULE
      ==================================================================== */}
      {activeTab === 'loan' && (
        <div className="space-y-6">
          {/* 2A. Active Loans — Outstanding Balance, Next Due Date & Reminders */}
          <Card
            title={
              language === 'ta'
                ? 'செயலில் உள்ள கடன் கணக்குகள் — நிலுவைத் தொகை மற்றும் தவணை நினைவூட்டல்'
                : 'Active Agricultural Loan Accounts — Outstanding Balance & Due-Date Reminders'
            }
            subtitle="Repay KCC and short-term crop loans before the due date to retain 100% Tamil Nadu Government & NABARD interest subvention"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeLoans.map((loan) => {
                const repaidPct = Math.min(
                  100,
                  Math.round(
                    ((loan.sanctionedAmount - loan.outstandingBalance) /
                      loan.sanctionedAmount) *
                      100
                  )
                );

                return (
                  <div
                    key={loan.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#0B4D2E] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            {loan.accountNo}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {loan.loanType}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{loan.title}</h3>
                        <p className="text-xs text-slate-500">{loan.bankPartner}</p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold tabular-nums ${
                          loan.daysRemaining <= 15
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-sky-50 text-sky-800 border border-sky-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Due: {loan.nextDueDate} ({loan.daysRemaining}d left)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 text-xs">
                      <div>
                        <p className="text-slate-500">Sanctioned Limit</p>
                        <p className="font-mono text-sm font-bold text-slate-800 tabular-nums mt-0.5">
                          ₹{loan.sanctionedAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Outstanding Balance</p>
                        <p className="font-mono text-sm font-bold text-red-700 tabular-nums mt-0.5">
                          ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Next Installment</p>
                        <p className="font-mono text-sm font-bold text-[#0B4D2E] tabular-nums mt-0.5">
                          ₹{loan.monthlyEmiOrDue.toLocaleString('en-IN')}{' '}
                          <span className="text-[11px] font-normal text-slate-500">
                            @ {loan.interestRatePct}%
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Repayment Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Principal Repaid: {repaidPct}%</span>
                        <span className="text-emerald-700 font-semibold">
                          {loan.subventionActive ? 'Interest Subvention Active' : 'Standard Rate'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-[#1E8E4F] transition-all duration-300"
                          style={{ width: `${repaidPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => handleSetLoanReminder(loan)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          loan.reminderSet
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                        }`}
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>
                          {loan.reminderSet
                            ? 'SMS & In-App Reminder Active'
                            : 'Set Due-Date Reminder'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSimulatePartPayment(loan)}
                        disabled={loan.outstandingBalance <= 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        <TrendingDown className="w-3.5 h-3.5 text-[#0B4D2E]" />
                        <span>Record ₹10,000 Part-Payment</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 2B. Loan Products Catalogue (KCC, Crop Loan, Term Loan) */}
          <Card
            title={
              language === 'ta'
                ? 'வேளாண் கடன் திட்டங்கள் — கிசான் கிரெடிட் கார்டு (KCC), பயிர் கடன் மற்றும் கால கடன்'
                : 'Institutional Credit Facilities — Kisan Credit Card (KCC), Crop Loan & Term Loan'
            }
            subtitle="Compare interest rates, subvention benefits, tenure, and empanelled banking partners across Tamil Nadu"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {LOAN_PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between hover:border-[#0B4D2E]/50 transition-all shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-[#0B4D2E] border border-emerald-200">
                        <CreditCard className="w-3.5 h-3.5" />
                        {prod.type}
                      </span>
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 tabular-nums">
                        {prod.interestRatePct.toFixed(1)}% p.a.
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {language === 'ta' ? prod.titleTa : prod.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{prod.bankPartner}</span>
                    </p>

                    <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Effective Interest:</span>
                        <span className="font-mono font-bold text-[#1E8E4F] tabular-nums">
                          {prod.interestRatePct.toFixed(2)}% p.a.{' '}
                          <span className="line-through text-slate-400 font-normal">
                            ({prod.standardRatePct}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Repayment Tenure:</span>
                        <span className="font-semibold text-slate-800">{prod.tenureRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Max Credit Limit:</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          ₹{prod.maxLimit.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-700 font-medium mt-2.5">
                      ★ {prod.subventionNote}
                    </p>

                    <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                      {prod.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E4F] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCalcAmount(prod.defaultAmount);
                        setCalcRate(prod.interestRatePct);
                        setCalcTenureMonths(prod.defaultTenureMonths);
                        const el = document.getElementById('loan-emi-calculator-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-center"
                    >
                      Calculate EMI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLoanWizardForProduct(prod)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer text-center"
                    >
                      Apply for Loan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 2C. Interactive EMI & Interest Calculator with Sliders + Repayment Schedule Chart */}
          <div id="loan-emi-calculator-section">
            <Card
              title={
                language === 'ta'
                  ? 'இஎம்ஐ (EMI) மற்றும் வட்டி கால்குலேட்டர் & தவணை அட்டவணை வரைபடம்'
                  : 'Interactive Loan EMI & Interest Subvention Calculator with Repayment Chart'
              }
              subtitle="Adjust loan amount, interest rate, and tenure sliders to visualize principal vs. interest amortization"
              action={
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCalcAmount(125000);
                      setCalcRate(0.0);
                      setCalcTenureMonths(12);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      calcRate === 0
                        ? 'bg-[#0B4D2E] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    0% KCC Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalcAmount(200000);
                      setCalcRate(4.0);
                      setCalcTenureMonths(12);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      calcRate === 4.0
                        ? 'bg-[#0B4D2E] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    4% Crop Loan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalcAmount(450000);
                      setCalcRate(8.5);
                      setCalcTenureMonths(48);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      calcRate === 8.5
                        ? 'bg-[#0B4D2E] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    8.5% Term Loan
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Sliders & KPI Cards (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Slider 1: Loan Amount */}
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>1. Loan Principal Amount (₹)</span>
                      <span className="font-mono text-sm font-bold text-[#0B4D2E] tabular-nums">
                        ₹{calcAmount.toLocaleString('en-IN')}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={25000}
                      max={1500000}
                      step={25000}
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Number(e.target.value))}
                      className="w-full accent-[#0B4D2E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                      <span>₹25,000</span>
                      <span>₹7,50,000</span>
                      <span>₹15,00,000</span>
                    </div>
                  </div>

                  {/* Slider 2: Interest Rate */}
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>2. Interest Rate (% per annum)</span>
                      <span className="font-mono text-sm font-bold text-[#0B4D2E] tabular-nums">
                        {calcRate.toFixed(1)}% p.a.
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={14}
                      step={0.5}
                      value={calcRate}
                      onChange={(e) => setCalcRate(Number(e.target.value))}
                      className="w-full accent-[#0B4D2E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                      <span>0% (PACCS KCC)</span>
                      <span>4% (Subvented)</span>
                      <span>8.5% (Term)</span>
                      <span>14%</span>
                    </div>
                  </div>

                  {/* Slider 3: Tenure Months */}
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>3. Repayment Tenure (Months)</span>
                      <span className="font-mono text-sm font-bold text-[#0B4D2E] tabular-nums">
                        {calcTenureMonths} Months ({(calcTenureMonths / 12).toFixed(1)} Yrs)
                      </span>
                    </label>
                    <input
                      type="range"
                      min={6}
                      max={84}
                      step={6}
                      value={calcTenureMonths}
                      onChange={(e) => setCalcTenureMonths(Number(e.target.value))}
                      className="w-full accent-[#0B4D2E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                      <span>6 Mos</span>
                      <span>24 Mos</span>
                      <span>48 Mos</span>
                      <span>84 Mos (7 Yrs)</span>
                    </div>
                  </div>

                  {/* Calculated EMI Summary Box */}
                  <div className="rounded-xl bg-[#0B4D2E] text-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-200">Estimated Monthly Installment (EMI)</p>
                        <p className="text-2xl font-bold tabular-nums mt-0.5">
                          ₹{emiData.monthlyEmi.toLocaleString('en-IN')}{' '}
                          <span className="text-xs font-normal text-emerald-200">/ month</span>
                        </p>
                      </div>
                      <Calculator className="w-7 h-7 text-emerald-300 shrink-0" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15 text-xs">
                      <div>
                        <p className="text-[11px] text-emerald-200">Principal</p>
                        <p className="font-mono font-bold tabular-nums">
                          ₹{emiData.totalPrincipal.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-emerald-200">Total Interest</p>
                        <p className="font-mono font-bold text-amber-300 tabular-nums">
                          ₹{emiData.totalInterest.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-emerald-200">Total Payable</p>
                        <p className="font-mono font-bold tabular-nums">
                          ₹{emiData.totalPayment.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {emiData.interestSavedVsStandard > 0 && (
                      <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-300">
                        <span>Interest Saved via Subvention vs Commercial Rate:</span>
                        <span className="font-mono font-bold tabular-nums">
                          +₹{emiData.interestSavedVsStandard.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Recharts Repayment Schedule Chart (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Repayment Amortization Schedule (Principal vs Interest)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Stacked bar breakdown across {calcTenureMonths} months tenure
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAmortizationTable((prev) => !prev)}
                      className="text-xs font-semibold text-[#0B4D2E] hover:underline cursor-pointer"
                    >
                      {showAmortizationTable ? 'Hide Schedule Table' : 'View Schedule Table'}
                    </button>
                  </div>

                  <div className="h-72 w-full bg-slate-50/60 rounded-xl border border-slate-200/80 p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={emiData.schedule}
                        margin={{ top: 10, right: 16, left: 4, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#475569' }} />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#475569' }}
                          tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`}
                        />
                        <Tooltip
                          formatter={(value: unknown, name: unknown) => [
                            `₹${Number(value).toLocaleString('en-IN')}`,
                            String(name),
                          ]}
                          contentStyle={{
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar
                          dataKey="principal"
                          name="Principal Component (₹)"
                          stackId="a"
                          fill="#0B4D2E"
                          radius={[0, 0, 4, 4]}
                        />
                        <Bar
                          dataKey="interest"
                          name="Interest Component (₹)"
                          stackId="a"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {showAmortizationTable && (
                    <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                            <th className="py-2 px-3 font-semibold">Period</th>
                            <th className="py-2 px-3 font-semibold text-right">Principal (₹)</th>
                            <th className="py-2 px-3 font-semibold text-right">Interest (₹)</th>
                            <th className="py-2 px-3 font-semibold text-right">Closing Balance (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {emiData.schedule.map((row) => (
                            <tr key={row.period} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                                {row.period}
                              </td>
                              <td className="py-2 px-3 font-mono text-right tabular-nums text-emerald-800">
                                ₹{row.principal.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 font-mono text-right tabular-nums text-amber-700">
                                ₹{row.interest.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 font-mono text-right tabular-nums font-bold text-slate-900">
                                ₹{row.balance.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* 2D. "My Applications" Tracker with Vertical Status Timeline & Downloadable Sanction Letter */}
          <Card
            title={
              language === 'ta'
                ? 'எனது கடன் விண்ணப்பங்கள் (Submitted → Verified → Sanctioned → Disbursed)'
                : 'My Loan Applications Tracker (Vertical Status Timeline & Sanction Letters)'
            }
            subtitle="Track end-to-end credit verification from online submission to bank disbursement and download official PDF sanction letters"
            action={
              <button
                type="button"
                onClick={() => handleOpenLoanWizardForProduct(LOAN_PRODUCTS[0])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Loan Application</span>
              </button>
            }
          >
            <div className="space-y-6">
              {loanApplications.map((loanApp) => {
                const stages: {
                  step: number;
                  label: LoanTimelineStage;
                  sublabel: string;
                  timestamp?: string;
                }[] = [
                  {
                    step: 1,
                    label: 'Submitted',
                    sublabel: 'Online application & e-Adangal dossier transmitted to Nodal Bank',
                    timestamp: loanApp.stageTimestamps.submitted,
                  },
                  {
                    step: 2,
                    label: 'Verified',
                    sublabel: 'VAO land encumbrance & PACCS Secretary / Field Officer inspection',
                    timestamp: loanApp.stageTimestamps.verified,
                  },
                  {
                    step: 3,
                    label: 'Sanctioned',
                    sublabel: `Scale-of-Finance credit limit sanctioned by ${loanApp.bankPartner}`,
                    timestamp: loanApp.stageTimestamps.sanctioned,
                  },
                  {
                    step: 4,
                    label: 'Disbursed',
                    sublabel: 'Direct NEFT / CBS credit to Farmer KCC / Savings Account',
                    timestamp: loanApp.stageTimestamps.disbursed,
                  },
                ];

                return (
                  <div
                    key={loanApp.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-2xs"
                  >
                    {/* Top Row: Reference, Title, Amounts & Download Sanction Letter CTA */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-bold text-[#0B4D2E] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            {loanApp.referenceNo}
                          </span>
                          <span className="font-semibold text-slate-800">{loanApp.loanType}</span>
                          <span aria-hidden="true">·</span>
                          <span>{loanApp.bankPartner}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">Applied: {loanApp.appliedDate}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                          {loanApp.purpose}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Survey No: <span className="font-mono font-semibold">{loanApp.surveyNo}</span> ({loanApp.landAcres} Acres · {loanApp.cropName})
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[11px] text-slate-500">Sanctioned Amount</p>
                          <p className="text-base font-bold text-slate-900 tabular-nums">
                            ₹{loanApp.sanctionedAmount.toLocaleString('en-IN')}{' '}
                            <span className="text-xs font-semibold text-[#1E8E4F]">
                              @ {loanApp.interestRatePct}% p.a.
                            </span>
                          </p>
                        </div>

                        <StatusBadge status={loanApp.status} />

                        <button
                          type="button"
                          onClick={() => handleDownloadSanctionLetterPdf(loanApp)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-[#0B4D2E] hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Sanction Letter (PDF)</span>
                        </button>
                      </div>
                    </div>

                    {/* Grid: Vertical Status Timeline (7 cols) + Officer Note & Docs (5 cols) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Vertical Status Timeline */}
                      <div className="lg:col-span-7">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                          Vertical Verification & Disbursement Timeline
                        </p>
                        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {stages.map((st) => {
                            const isCompleted = loanApp.stageIndex >= st.step;
                            const isCurrent = loanApp.stageIndex === st.step;

                            return (
                              <div key={st.label} className="relative flex items-start justify-between gap-4">
                                <span
                                  className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                                    isCompleted
                                      ? 'bg-[#1E8E4F] border-[#1E8E4F] text-white'
                                      : 'bg-white border-slate-300 text-slate-400'
                                  }`}
                                >
                                  {isCompleted ? '✓' : st.step}
                                </span>

                                <div className="pl-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-bold ${
                                        isCompleted ? 'text-slate-900' : 'text-slate-400'
                                      }`}
                                    >
                                      {st.step}. {st.label}
                                    </span>
                                    {isCurrent && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-[#0B4D2E]">
                                        Current Stage
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">{st.sublabel}</p>
                                </div>

                                <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                                  {st.timestamp || 'Pending'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Column: Bank Appraisal Remarks, Attached Documents & Officer Action */}
                      <div className="lg:col-span-5 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            Credit Officer / PACCS Secretary Remarks
                          </p>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {loanApp.officerNotes}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80">
                          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                            Verified Loan Dossier Documents:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {loanApp.documents.map((doc) => (
                              <span
                                key={doc}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-[11px] text-slate-700 font-mono"
                              >
                                <FileText className="w-3 h-3 text-[#0B4D2E]" />
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>

                        {loanApp.stageIndex < 4 && (
                          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-500">
                              {role === 'Farmer'
                                ? 'Simulate next bank verification milestone:'
                                : `Acting as ${role}:`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdvanceLoanStage(loanApp)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                            >
                              Advance to{' '}
                              {
                                ['Submitted', 'Verified', 'Sanctioned', 'Disbursed'][
                                  loanApp.stageIndex
                                ]
                              }{' '}
                              →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ====================================================================
          MODAL 1: SUBSIDY APPLICATION FORM (React Hook Form + Zod)
      ==================================================================== */}
      <Modal
        isOpen={isSubsidyModalOpen}
        onClose={() => setIsSubsidyModalOpen(false)}
        title="File New Agricultural Subsidy Application"
        subtitle="Integrated with Tamil Nadu GRAINS, TANHODA & Block Agricultural Extension Centres"
      >
        <form onSubmit={handleSubmit(onSubmitSubsidyForm)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subsidy Category *
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
            >
              <option value="Fertilizer Subsidy">
                Fertilizer & Bio-Input Subsidy (50% up to ₹12,500)
              </option>
              <option value="Seed Subsidy">
                Certified Seed Distribution Subsidy (50% up to ₹6,000)
              </option>
              <option value="Micro Irrigation">
                PMKSY Automated Drip / Sprinkler (100% SF/MF up to ₹82,500)
              </option>
              <option value="Farm Machinery">
                SMAM Farm Machinery — Power Tiller / Weeder (50% up to ₹1,25,000)
              </option>
              <option value="Solar Pump">
                PM-KUSUM Standalone Solar Pump (70% up to ₹1,65,000)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subsidy Program / Equipment Title *
            </label>
            <input
              type="text"
              {...register('schemeName')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
            />
            {errors.schemeName && (
              <p className="text-[11px] text-red-600 mt-1">{errors.schemeName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Invoice / Input Cost (₹) *
              </label>
              <input
                type="number"
                {...register('amountRequested', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.amountRequested && (
                <p className="text-[11px] text-red-600 mt-1">{errors.amountRequested.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DBT Linked Bank Account *
              </label>
              <input
                type="text"
                {...register('bankAccount')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.bankAccount && (
                <p className="text-[11px] text-red-600 mt-1">{errors.bankAccount.message}</p>
              )}
            </div>
          </div>

          {/* Live Calculated Subsidy Preview */}
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900">
              Estimated Direct Benefit Transfer (DBT) Grant:
            </span>
            <span className="font-mono text-sm font-bold text-[#0B4D2E] tabular-nums">
              ₹{estimatedFormSubsidy.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Land Survey No. & Dealer / AEC Quotation Details *
            </label>
            <textarea
              rows={3}
              {...register('remarks')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
            />
            {errors.remarks && (
              <p className="text-[11px] text-red-600 mt-1">{errors.remarks.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSubsidyModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              Submit Subsidy Claim
            </button>
          </div>
        </form>
      </Modal>

      {/* ====================================================================
          MODAL 2: 5-STEP LOAN APPLICATION WIZARD
      ==================================================================== */}
      <Modal
        isOpen={isLoanWizardOpen}
        onClose={() => setIsLoanWizardOpen(false)}
        title="Agricultural Loan & KCC Application Wizard"
        subtitle="5-step digital credit proposal to PACCS & Commercial Bank Partners"
      >
        {wizardSubmittedLoan ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#1E8E4F] mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                Loan Application Transmitted Successfully!
              </h3>
              <p className="text-xs text-slate-600">
                Your credit proposal has been registered under Reference ID{' '}
                <span className="font-mono font-bold text-[#0B4D2E]">
                  {wizardSubmittedLoan.referenceNo}
                </span>{' '}
                with {wizardSubmittedLoan.bankPartner}.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Credit Facility:</span>
                <span className="font-semibold text-slate-900">{wizardSubmittedLoan.loanType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Amount & Rate:</span>
                <span className="font-mono font-bold text-[#0B4D2E] tabular-nums">
                  ₹{wizardSubmittedLoan.amountRequested.toLocaleString('en-IN')} @{' '}
                  {wizardSubmittedLoan.interestRatePct}% p.a.
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Survey No. & Crop:</span>
                <span className="font-mono text-slate-800">
                  {wizardSubmittedLoan.surveyNo} ({wizardSubmittedLoan.cropName})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleDownloadSanctionLetterPdf(wizardSubmittedLoan)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-[#0B4D2E] border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Provisional Sanction PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLoanWizardOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
              >
                Done & Track Status
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 5-Step Progress Indicator */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                '1. Applicant',
                '2. Land & Crop',
                '3. Loan & Rate',
                '4. Documents',
                '5. Review',
              ].map((label, idx) => {
                const stepNum = idx + 1;
                const active = wizardStep === stepNum;
                const done = wizardStep > stepNum;
                return (
                  <div
                    key={label}
                    className={`px-2 py-1.5 rounded text-center text-[11px] font-semibold border ${
                      active
                        ? 'bg-[#0B4D2E] text-white border-[#0B4D2E]'
                        : done
                        ? 'bg-emerald-50 text-[#0B4D2E] border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>

            {wizardError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* STEP 1: APPLICANT DETAILS */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Applicant Farmer Name *
                    </label>
                    <input
                      type="text"
                      value={loanWizardData.applicantName}
                      onChange={(e) =>
                        setLoanWizardData({ ...loanWizardData, applicantName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Uzhavar Farmer ID *
                    </label>
                    <input
                      type="text"
                      value={loanWizardData.farmerId}
                      readOnly
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="text"
                      value={loanWizardData.phone}
                      onChange={(e) =>
                        setLoanWizardData({ ...loanWizardData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aadhaar Reference (e-KYC Verified)
                    </label>
                    <input
                      type="text"
                      value={`XXXX-XXXX-${loanWizardData.aadhaarLast4}`}
                      readOnly
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Partner Bank / PACCS Society *
                  </label>
                  <select
                    value={loanWizardData.bankPartner}
                    onChange={(e) =>
                      setLoanWizardData({ ...loanWizardData, bankPartner: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="PACCS Arumbavur · Perambalur DCCB">
                      PACCS Arumbavur · Perambalur DCCB (0% KCC Nodal)
                    </option>
                    <option value="Indian Bank · Perambalur Branch">
                      Indian Bank · Perambalur Branch (Lead Bank)
                    </option>
                    <option value="State Bank of India · ADB Perambalur">
                      State Bank of India · ADB Perambalur
                    </option>
                    <option value="Tamil Nadu Grama Bank · Veppanthattai">
                      Tamil Nadu Grama Bank · Veppanthattai
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: LAND & CROP DETAILS */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Survey / Sub-Division No. *
                    </label>
                    <input
                      type="text"
                      value={loanWizardData.surveyNo}
                      onChange={(e) =>
                        setLoanWizardData({ ...loanWizardData, surveyNo: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cultivable Land Area (Acres) *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={loanWizardData.landAcres}
                      onChange={(e) =>
                        setLoanWizardData({
                          ...loanWizardData,
                          landAcres: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Cultivated Crop *
                    </label>
                    <select
                      value={loanWizardData.cropName}
                      onChange={(e) =>
                        setLoanWizardData({ ...loanWizardData, cropName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Paddy (ADT-43 / Ponni)">Paddy (ADT-43 / Ponni)</option>
                      <option value="Maize (TNAU CoH(M)-6)">Maize (TNAU CoH(M)-6)</option>
                      <option value="Small Onion (Perambalur Local)">
                        Small Onion (Perambalur Local)
                      </option>
                      <option value="Cotton (MCU-5 / Surabhi)">Cotton (MCU-5 / Surabhi)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Irrigation Source
                    </label>
                    <select
                      value={loanWizardData.irrigationType}
                      onChange={(e) =>
                        setLoanWizardData({ ...loanWizardData, irrigationType: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Canal">Canal + Borewell</option>
                      <option value="Drip">Automated Drip Irrigation</option>
                      <option value="Borewell">Solar / Electric Borewell</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                  <span className="font-semibold">DLTC Scale of Finance Eligibility:</span> Based on{' '}
                  <span className="font-mono font-bold">{loanWizardData.landAcres} Acres</span> of{' '}
                  {loanWizardData.cropName}, your pre-approved crop credit limit is up to{' '}
                  <span className="font-mono font-bold">
                    ₹{Math.round(loanWizardData.landAcres * 42000).toLocaleString('en-IN')}
                  </span>
                  .
                </div>
              </div>
            )}

            {/* STEP 3: LOAN AMOUNT & PURPOSE */}
            {wizardStep === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Loan Facility Type *
                    </label>
                    <select
                      value={loanWizardData.loanType}
                      onChange={(e) => {
                        const t = e.target.value as LoanProductItem['type'];
                        const rate =
                          t === 'Kisan Credit Card (KCC)'
                            ? 0.0
                            : t === 'Crop Loan'
                            ? 4.0
                            : 8.5;
                        const tenure = t === 'Term Loan' ? 48 : 12;
                        setLoanWizardData({
                          ...loanWizardData,
                          loanType: t,
                          interestRatePct: rate,
                          tenureMonths: tenure,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Kisan Credit Card (KCC)">
                        Kisan Credit Card (KCC) — 0% Interest
                      </option>
                      <option value="Crop Loan">Short-Term Crop Loan — 4% Interest</option>
                      <option value="Term Loan">Agri Term Loan — 8.5% Interest</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Requested Loan Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="5000"
                      min="10000"
                      max="1500000"
                      value={loanWizardData.amountRequested}
                      onChange={(e) =>
                        setLoanWizardData({
                          ...loanWizardData,
                          amountRequested: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Applicable Interest Rate (% p.a.)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${loanWizardData.interestRatePct.toFixed(2)}% p.a. (Subvented)`}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Repayment Tenure (Months) *
                    </label>
                    <select
                      value={loanWizardData.tenureMonths}
                      onChange={(e) =>
                        setLoanWizardData({
                          ...loanWizardData,
                          tenureMonths: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value={6}>6 Months (Single Season)</option>
                      <option value={12}>12 Months (Annual KCC / Crop Cycle)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years)</option>
                      <option value={48}>48 Months (4 Years)</option>
                      <option value={60}>60 Months (5 Years)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purpose of Credit *
                  </label>
                  <textarea
                    rows={2}
                    value={loanWizardData.purpose}
                    onChange={(e) =>
                      setLoanWizardData({ ...loanWizardData, purpose: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: DOCUMENTS */}
            {wizardStep === 4 && (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors">
                  <UploadCloud className="w-7 h-7 text-[#0B4D2E] mb-1.5" />
                  <span className="text-xs font-semibold text-slate-800">
                    Click to upload additional Land Patta, e-Adangal, or Quotation (PDF/JPG &le; 5MB)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    e-Sevai / Tamil Nilam records are already pre-fetched
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleLoanDocumentUpload}
                    className="hidden"
                  />
                </label>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700">
                    Attached Verification Documents ({loanWizardData.documents.length}):
                  </p>
                  {loanWizardData.documents.map((docName, i) => (
                    <div
                      key={`${docName}-${i}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                    >
                      <span className="flex items-center gap-2 font-mono text-slate-800">
                        <FileText className="w-3.5 h-3.5 text-[#1E8E4F]" />
                        {docName}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold">Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & SUBMIT */}
            {wizardStep === 5 && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicant & Farmer ID:</span>
                    <span className="font-semibold text-slate-900">
                      {loanWizardData.applicantName} ({loanWizardData.farmerId})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lending Institution:</span>
                    <span className="font-semibold text-slate-800">
                      {loanWizardData.bankPartner}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loan Facility & Tenure:</span>
                    <span className="font-semibold text-slate-900">
                      {loanWizardData.loanType} ({loanWizardData.tenureMonths} Months)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Requested Loan Amount:</span>
                    <span className="font-mono font-bold text-[#0B4D2E] tabular-nums">
                      ₹{loanWizardData.amountRequested.toLocaleString('en-IN')} @{' '}
                      {loanWizardData.interestRatePct}% p.a.
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Land Survey & Crop:</span>
                    <span className="font-mono text-slate-800">
                      {loanWizardData.surveyNo} · {loanWizardData.landAcres} Acres (
                      {loanWizardData.cropName})
                    </span>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loanWizardData.consentAccepted}
                    onChange={(e) =>
                      setLoanWizardData({
                        ...loanWizardData,
                        consentAccepted: e.target.checked,
                      })
                    }
                    className="mt-0.5 accent-[#0B4D2E]"
                  />
                  <span>
                    I hereby declare that the landholding in Survey No. {loanWizardData.surveyNo} is
                    free from conflicting encumbrance and authorize {loanWizardData.bankPartner} to
                    verify my Tamil Nilam e-Adangal record.
                  </span>
                </label>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setWizardError('');
                  if (wizardStep > 1) setWizardStep(wizardStep - 1);
                  else setIsLoanWizardOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {wizardStep === 1 ? 'Cancel' : '← Back'}
              </button>

              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 2 && (!loanWizardData.surveyNo || loanWizardData.landAcres <= 0)) {
                      setWizardError('Please enter a valid Survey Number and Land Acreage.');
                      return;
                    }
                    if (wizardStep === 3 && loanWizardData.amountRequested < 10000) {
                      setWizardError('Minimum loan amount is ₹10,000.');
                      return;
                    }
                    setWizardError('');
                    setWizardStep(wizardStep + 1);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitLoanWizard}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                >
                  Submit Loan Application
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
