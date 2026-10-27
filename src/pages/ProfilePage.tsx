import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserCheck,
  ShieldCheck,
  MapPin,
  Landmark,
  Save,
  Award,
  FileText,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Smartphone,
  Laptop,
  LogOut,
  KeyRound,
  Globe,
  Clock,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import {
  Card,
  StatCard,
  Modal,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

type ProfileTabKey =
  | 'personal'
  | 'land'
  | 'bank'
  | 'documents'
  | 'preferences'
  | 'security';

interface LandParcelRecord {
  id: string;
  surveyNo: string;
  pattaNo: string;
  areaAcres: number;
  ownershipType: 'Individual Patta' | 'Joint Patta' | 'Registered Tenant';
  soilType: string;
  irrigationSource: string;
  verifiedWithTamilNilam: boolean;
}

interface ProfileDocumentItem {
  id: string;
  title: string;
  docNumberMasked: string;
  docNumberFull: string;
  category: 'Identity KYC' | 'Land Record' | 'Banking DBT' | 'Agronomy';
  status: 'Verified' | 'Pending Upload' | 'Under Verification';
  updatedAt: string;
  fileName?: string;
}

interface ActiveSessionItem {
  id: string;
  device: string;
  platform: 'Desktop Web' | 'Mobile App';
  location: string;
  ipMasked: string;
  lastActive: string;
  isCurrent: boolean;
}

const personalSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  dob: z.string().min(4, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  fatherOrSpouseName: z.string().min(3, 'Father / Spouse name is required'),
  phone: z.string().min(10, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email address'),
  addressLine: z.string().min(5, 'Residential door/street address is required'),
  village: z.string().min(2, 'Revenue village is required'),
  taluk: z.string().min(2, 'Taluk is required'),
  district: z.string().min(2, 'District is required'),
  pinCode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  nomineeName: z.string().optional(),
  nomineeRelation: z.string().optional(),
});

type PersonalFormValues = z.infer<typeof personalSchema>;

export const ProfilePage: React.FC = () => {
  const {
    language,
    setLanguage,
    user,
    role,
    setRole,
    updateUserProfile,
    setIsLogoutModalOpen,
    inactivityTimeoutMins,
    setInactivityTimeoutMins,
    setIsInactivityWarningOpen,
    showToast,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  const [activeTab, setActiveTab] = useState<ProfileTabKey>('personal');
  const [revealSensitive, setRevealSensitive] = useState<boolean>(false);
  const [dataConsentAccepted, setDataConsentAccepted] = useState<boolean>(true);

  // 1. Personal Details Extra States
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nomineeFilled, setNomineeFilled] = useState<boolean>(false);

  // 2. Land Holdings State
  const [landParcels, setLandParcels] = useState<LandParcelRecord[]>([
    {
      id: 'lp-1',
      surveyNo: 'SF-142/2A',
      pattaNo: 'PT-88410',
      areaAcres: 3.0,
      ownershipType: 'Individual Patta',
      soilType: 'Black Clay Loam',
      irrigationSource: 'Check Dam Canal + Borewell',
      verifiedWithTamilNilam: true,
    },
    {
      id: 'lp-2',
      surveyNo: 'SF-144/1B',
      pattaNo: 'PT-88412',
      areaAcres: 1.75,
      ownershipType: 'Individual Patta',
      soilType: 'Red Calcareous Loam',
      irrigationSource: 'Automated Solar Drip',
      verifiedWithTamilNilam: true,
    },
    {
      id: 'lp-3',
      surveyNo: 'SF-145/3',
      pattaNo: 'PT-89004',
      areaAcres: 1.75,
      ownershipType: 'Joint Patta',
      soilType: 'Red Loamy Soil',
      irrigationSource: 'Drip + Open Well',
      verifiedWithTamilNilam: true,
    },
  ]);
  const [isAddLandModalOpen, setIsAddLandModalOpen] = useState(false);
  const [newLandForm, setNewLandForm] = useState({
    surveyNo: 'SF-148/4A',
    pattaNo: 'PT-90112',
    areaAcres: 1.5,
    ownershipType: 'Individual Patta' as LandParcelRecord['ownershipType'],
    soilType: 'Red Sandy Loam',
    irrigationSource: 'Solar Borewell',
  });

  // 3. Bank Details State
  const [bankForm, setBankForm] = useState({
    accountHolderName: user.name,
    bankName: user.bankName,
    accountFull: '642801924910',
    ifsc: user.ifsc,
    branchName: 'Perambalur Main Branch (Code: 0042)',
    upiId: 'muruganandham.farm@indianbank',
    npciSeeded: true,
    pfmsStatus: 'Active & Verified (Last Penny-Drop: 18 Oct 2026)',
  });

  // 4. Documents State
  const [documents, setDocuments] = useState<ProfileDocumentItem[]>([
    {
      id: 'doc-1',
      title: 'UIDAI Aadhaar Card (e-KYC Seeded)',
      docNumberMasked: `XXXX-XXXX-${user.aadhaarLast4}`,
      docNumberFull: `6291-4083-${user.aadhaarLast4}`,
      category: 'Identity KYC',
      status: 'Verified',
      updatedAt: '12 Apr 2026',
      fileName: 'Aadhaar_eKYC_7842.pdf',
    },
    {
      id: 'doc-2',
      title: 'Computerized Patta & Chitta Extract (Tamil Nilam)',
      docNumberMasked: 'PT-XXXX10 / SF-142',
      docNumberFull: 'PT-88410 / SF-142/2A',
      category: 'Land Record',
      status: 'Verified',
      updatedAt: '05 Aug 2026',
      fileName: 'TamilNilam_Patta_Chitta_2026.pdf',
    },
    {
      id: 'doc-3',
      title: 'VAO Current Season e-Adangal Cultivation Certificate',
      docNumberMasked: 'ADG-2026-XXXX89',
      docNumberFull: 'ADG-2026-441089',
      category: 'Land Record',
      status: 'Verified',
      updatedAt: '22 Sep 2026',
      fileName: 'VAO_eAdangal_Samba_2026.pdf',
    },
    {
      id: 'doc-4',
      title: 'Indian Bank Passbook & NPCI DBT Mandate',
      docNumberMasked: 'A/c XXXX-XXXX-4910',
      docNumberFull: 'A/c 6428-0192-4910',
      category: 'Banking DBT',
      status: 'Verified',
      updatedAt: '14 Jun 2026',
      fileName: 'IndianBank_DBT_Passbook.pdf',
    },
    {
      id: 'doc-5',
      title: 'TNAU Soil Health Card & Micronutrient Report',
      docNumberMasked: 'SHC-TN-PBL-XXXX',
      docNumberFull: 'SHC-TN-PBL-2026-912',
      category: 'Agronomy',
      status: 'Pending Upload',
      updatedAt: 'Action Needed',
    },
  ]);

  // 5. Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    smsAlerts: true,
    whatsappAlerts: true,
    emailDigests: true,
    pushNotifications: true,
    weatherWarnings: true,
    mandiPriceAlerts: true,
    subsidyDbtUpdates: true,
    loanDueReminders: true,
    voiceAdvisoryTamil: true,
  });

  // 6. Security State (PIN & Active Sessions)
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinError, setPinError] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionItem[]>([
    {
      id: 'sess-1',
      device: 'Chrome 130 on Linux / Desktop Terminal',
      platform: 'Desktop Web',
      location: 'Perambalur, Tamil Nadu, IN',
      ipMasked: '117.242.XX.84',
      lastActive: 'Active Now (Current Session)',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'Uzhavar e-Governance App · Redmi Note 13 Pro (Android 15)',
      platform: 'Mobile App',
      location: 'Veppanthattai, Perambalur, IN',
      ipMasked: '49.37.XX.119',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PersonalFormValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      name: user.name,
      dob: '1978-05-14',
      gender: 'Male',
      fatherOrSpouseName: 'Selvaraj Kounder',
      phone: user.phone,
      email: user.email,
      addressLine: 'No. 42, North Mariamman Kovil Street',
      village: user.village,
      taluk: user.taluk,
      district: user.district,
      pinCode: '621103',
      nomineeName: '',
      nomineeRelation: 'Spouse',
    },
  });

  const watchedNominee = watch('nomineeName');

  // --------------------------------------------------------------------------
  // PROFILE COMPLETION PERCENTAGE & MISSING ITEMS CALCULATION
  // --------------------------------------------------------------------------
  const completionStats = useMemo(() => {
    const soilDocVerified = documents.some(
      (d) => d.id === 'doc-5' && d.status === 'Verified'
    );
    const hasNominee = Boolean(
      nomineeFilled || (watchedNominee && watchedNominee.trim().length >= 3)
    );

    const missingItems: {
      id: string;
      label: string;
      tab: ProfileTabKey;
      points: number;
    }[] = [];

    if (!hasNominee) {
      missingItems.push({
        id: 'miss-nominee',
        label: 'Add Family Nominee in Personal Details (+8%)',
        tab: 'personal',
        points: 8,
      });
    }
    if (!soilDocVerified) {
      missingItems.push({
        id: 'miss-shc',
        label: 'Upload & Verify Soil Health Card in Documents (+8%)',
        tab: 'documents',
        points: 8,
      });
    }

    const totalPct = 100 - missingItems.reduce((acc, m) => acc + m.points, 0);
    return {
      totalPct,
      missingItems,
    };
  }, [documents, nomineeFilled, watchedNominee]);

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const totalComputedLandAcres = landParcels.reduce((acc, p) => acc + p.areaAcres, 0);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------
  const onSubmitPersonal = (values: PersonalFormValues) => {
    if (values.nomineeName && values.nomineeName.trim().length >= 2) {
      setNomineeFilled(true);
    }
    updateUserProfile({
      name: values.name,
      phone: values.phone,
      email: values.email,
      village: values.village,
      taluk: values.taluk,
      district: values.district,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        showToast('Profile Photo Updated', 'Passport photo synced with Digital Uzhavar ID card.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddLandParcel = (e: React.FormEvent) => {
    e.preventDefault();
    const newParcel: LandParcelRecord = {
      id: `lp-${Date.now()}`,
      ...newLandForm,
      areaAcres: Number(newLandForm.areaAcres),
      verifiedWithTamilNilam: true,
    };
    const updated = [...landParcels, newParcel];
    setLandParcels(updated);
    const newTotal = updated.reduce((acc, item) => acc + item.areaAcres, 0);
    updateUserProfile({ totalLandAcres: newTotal });
    setIsAddLandModalOpen(false);
    showToast(
      'Land Parcel Linked via Tamil Nilam',
      `Survey No. ${newParcel.surveyNo} (${newParcel.areaAcres} Acres) added to your holding.`
    );
  };

  const handleDeleteLandParcel = (id: string) => {
    if (landParcels.length <= 1) {
      showToast('Cannot Remove Primary Plot', 'At least one Patta landholding is required.', 'warning');
      return;
    }
    const updated = landParcels.filter((p) => p.id !== id);
    setLandParcels(updated);
    const newTotal = updated.reduce((acc, item) => acc + item.areaAcres, 0);
    updateUserProfile({ totalLandAcres: newTotal });
    showToast('Land Parcel Removed', 'Updated total cultivable landholding.', 'info');
  };

  const handleUploadAndVerifyDocument = (
    docId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    const uploadedName = file ? file.name : 'Soil_Health_Card_Perambalur_2026.pdf';
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'Verified',
              updatedAt: 'Today, Just now',
              fileName: uploadedName,
            }
          : d
      )
    );
    showToast(
      'Document Uploaded & e-Verified',
      `${uploadedName} verified against Tamil Nadu Agrisnet repository.`
    );
  };

  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const last4 = bankForm.accountFull.replace(/\D/g, '').slice(-4) || '4910';
    updateUserProfile({
      bankName: bankForm.bankName,
      ifsc: bankForm.ifsc,
      accountMasked: `XXXX-XXXX-${last4}`,
    });
    showToast(
      'NPCI DBT Bank Record Verified',
      `Penny-drop verification succeeded for A/c ending in ${last4} (IFSC: ${bankForm.ifsc}).`
    );
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinForm.newPin)) {
      setPinError('New Security PIN must be exactly 6 numeric digits.');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('New PIN and Confirm PIN do not match.');
      return;
    }
    setPinError('');
    setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
    showToast(
      '6-Digit Security PIN Updated',
      'Your e-Governance portal MPIN has been encrypted and updated.'
    );
  };

  const handleRevokeSession = (sessionId: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Remote Device Session Revoked', 'Token invalidated immediately.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Encryption / Masking Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta'
              ? 'எனது உழவர் சுயவிவரம் மற்றும் பாதுகாப்பு அமைப்புகள்'
              : 'My Farmer Profile, Land Registry & Security Vault'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized with Tamil Nilam (Patta / Chitta), UIDAI Aadhaar Vault, and NPCI Direct Benefit Transfer
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRevealSensitive((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              revealSensitive
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {revealSensitive ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                <span>Mask Sensitive PII Fields</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#0B4D2E]" />
                <span>Reveal Masked PII (Aadhaar / Bank)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Switch User</span>
          </button>
        </div>
      </div>

      {/* Profile Completion Bar & Missing Items Prompt */}
      <div className="rounded-xl bg-white border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-[#0B4D2E] font-mono text-xs font-bold border border-emerald-200">
              {completionStats.totalPct}%
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                e-Governance Profile Completion Status
              </h2>
              <p className="text-xs text-slate-500">
                {completionStats.totalPct === 100
                  ? '100% Complete — Eligible for instant single-window scheme & KCC sanctions!'
                  : 'Complete the remaining items below to unlock 100% single-window auto-verification'}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold text-[#1E8E4F] tabular-nums">
            {completionStats.totalPct}% Completed
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-[#1E8E4F] transition-all duration-300"
            style={{ width: `${completionStats.totalPct}%` }}
          />
        </div>

        {completionStats.missingItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Missing Items Prompt:
            </span>
            {completionStats.missingItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
              >
                <span>{item.label}</span>
                <span>→</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4-Column Summary Grid (Respects Masking Toggle) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Unique Uzhavar ID"
          value={user.farmerId}
          subtext="GRAINS Tamil Nadu Verified"
          icon={<UserCheck className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Total Patta Holding"
          value={`${totalComputedLandAcres.toFixed(2)} Acres`}
          subtext={`${landParcels.length} Registered Survey Plots`}
          icon={<MapPin className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="NPCI DBT Bank Link"
          value={
            revealSensitive
              ? `6428-0192-${user.accountMasked.slice(-4)}`
              : user.accountMasked
          }
          subtext={`IFSC: ${user.ifsc} · Active`}
          icon={<Landmark className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="UIDAI Aadhaar Vault"
          value={
            revealSensitive
              ? `6291-4083-${user.aadhaarLast4}`
              : `XXXX-XXXX-${user.aadhaarLast4}`
          }
          subtext="AES-256 Masked & e-KYC Active"
          icon={<Award className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* 6-Tab Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-2xs flex flex-wrap gap-1">
        {(
          [
            { key: 'personal', label: '1. Personal Details', icon: UserCheck },
            { key: 'land', label: '2. Land Holdings', icon: MapPin },
            { key: 'bank', label: '3. Bank Details', icon: Landmark },
            { key: 'documents', label: '4. Documents Vault', icon: FileText },
            { key: 'preferences', label: '5. Language & Alerts', icon: Bell },
            { key: 'security', label: '6. Security & Sessions', icon: Lock },
          ] as { key: ProfileTabKey; label: string; icon: React.ElementType }[]
        ).map((tab) => {
          const IconComp = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-[#0B4D2E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconComp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          TAB 1: PERSONAL DETAILS
      ==================================================================== */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Digital Uzhavar Card & Photo Upload */}
          <div className="space-y-6">
            <div className="rounded-xl bg-[#0B4D2E] text-white p-6 shadow-sm border border-emerald-700 space-y-4">
              <div className="flex items-center gap-4 border-b border-white/15 pb-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#1E8E4F] flex items-center justify-center font-bold text-xl border-2 border-emerald-300/60">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <label
                    title="Upload Farmer Photo"
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white text-[#0B4D2E] flex items-center justify-center shadow-md cursor-pointer hover:bg-emerald-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
                    Govt. of Tamil Nadu · Uzhavar Card
                  </p>
                  <h2 className="text-base font-bold mt-0.5">
                    {language === 'ta' ? user.nameTa : user.name}
                  </h2>
                  <p className="text-xs font-mono text-emerald-200 mt-0.5">{user.farmerId}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-emerald-200/80">Masked Aadhaar:</span>
                  <span className="font-mono font-semibold">
                    {revealSensitive
                      ? `6291-4083-${user.aadhaarLast4}`
                      : `XXXX-XXXX-${user.aadhaarLast4}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-200/80">Revenue Village:</span>
                  <span className="font-medium">
                    {user.village} ({user.taluk})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-200/80">District:</span>
                  <span className="font-medium">{user.district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-200/80">DBT Bank Account:</span>
                  <span className="font-mono">
                    {revealSensitive
                      ? `6428-0192-${user.accountMasked.slice(-4)}`
                      : user.accountMasked}
                  </span>
                </div>
              </div>
            </div>

            {/* RBAC Role Switcher */}
            <Card
              title="Role-Based Access Control (RBAC)"
              subtitle="Switch active portal persona to test Farmer, Agri Officer, and District Admin workflows"
            >
              <div className="space-y-2.5">
                {(['Farmer', 'Officer', 'Admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      role === r
                        ? 'border-[#0B4D2E] bg-emerald-50/60 text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{r} Role</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {r === 'Farmer'
                          ? 'Apply for schemes, register crops, check mandi rates'
                          : r === 'Officer'
                          ? 'Inspect fields, approve/reject subsidies & grievances'
                          : 'Full district oversight & DBT sanction authority'}
                      </p>
                    </div>
                    <ShieldCheck
                      className={`w-4 h-4 shrink-0 ${
                        role === r ? 'text-[#0B4D2E]' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right 2 Columns: Personal Details Form */}
          <div className="lg:col-span-2">
            <Card
              title="Personal Demographics, Address & Nominee Registry"
              subtitle="Fields marked with * are validated via Zod schema; sensitive identifiers are encrypted at rest"
            >
              <form onSubmit={handleSubmit(onSubmitPersonal)} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Farmer Full Name (as per Aadhaar) *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                    />
                    {errors.name && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      {...register('dob')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender *
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Father / Spouse Name *
                    </label>
                    <input
                      type="text"
                      {...register('fatherOrSpouseName')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aadhaar-Linked Mobile *
                    </label>
                    <input
                      type="text"
                      {...register('phone')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono tabular-nums focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Residential Door No. & Street Address *
                    </label>
                    <input
                      type="text"
                      {...register('addressLine')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Revenue Village *
                    </label>
                    <input
                      type="text"
                      {...register('village')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Taluk *
                    </label>
                    <input
                      type="text"
                      {...register('taluk')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      {...register('district')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      {...register('pinCode')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono tabular-nums focus:outline-none focus:border-[#0B4D2E]"
                    />
                  </div>
                </div>

                {/* Nominee Section (Completing this adds +8% to Profile Completion) */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950">
                      PM-KISAN & PMFBY Family Nominee Details (+8% Profile Completion)
                    </span>
                    {nomineeFilled && (
                      <span className="text-[11px] font-semibold text-[#1E8E4F] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nominee Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Selvi Muruganandham"
                        {...register('nomineeName')}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Relationship with Farmer
                      </label>
                      <select
                        {...register('nomineeRelation')}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Son / Daughter">Son / Daughter</option>
                        <option value="Parent">Parent</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Personal Details</span>
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: LAND HOLDINGS
      ==================================================================== */}
      {activeTab === 'land' && (
        <Card
          title="Registered Agricultural Land Holdings (Tamil Nilam Patta / Chitta Sync)"
          subtitle="Verified survey numbers, area in acres, ownership type, and soil classification used for automated scheme eligibility"
          action={
            <button
              type="button"
              onClick={() => setIsAddLandModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Land Parcel</span>
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                  <th className="py-3 px-4 font-semibold">Survey / Sub-Div No.</th>
                  <th className="py-3 px-4 font-semibold">Patta No.</th>
                  <th className="py-3 px-4 font-semibold">Area (Acres)</th>
                  <th className="py-3 px-4 font-semibold">Ownership Type</th>
                  <th className="py-3 px-4 font-semibold">Soil Type</th>
                  <th className="py-3 px-4 font-semibold">Irrigation Source</th>
                  <th className="py-3 px-4 font-semibold">Tamil Nilam Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {landParcels.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {parcel.surveyNo}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {revealSensitive ? parcel.pattaNo : `PT-XXXX${parcel.pattaNo.slice(-2)}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B4D2E] tabular-nums">
                      {parcel.areaAcres.toFixed(2)} Acres
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-medium">
                        {parcel.ownershipType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{parcel.soilType}</td>
                    <td className="py-3.5 px-4 text-slate-700">{parcel.irrigationSource}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> e-Adangal Synced
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLandParcel(parcel.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Remove Parcel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ====================================================================
          TAB 3: BANK DETAILS
      ==================================================================== */}
      {activeTab === 'bank' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-xl bg-[#0B4D2E] text-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded bg-emerald-400/20 text-emerald-200 text-xs font-bold border border-emerald-400/30">
                NPCI Aadhaar Mapper Active
              </span>
              <Landmark className="w-6 h-6 text-emerald-300" />
            </div>

            <div>
              <p className="text-xs text-emerald-200">Primary Direct Benefit Transfer (DBT) Account</p>
              <p className="text-xl font-mono font-bold tracking-wider mt-1">
                {revealSensitive
                  ? bankForm.accountFull.replace(/(\d{4})(?=\d)/g, '$1-')
                  : user.accountMasked}
              </p>
              <p className="text-xs text-emerald-100 mt-1">{bankForm.bankName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15 text-xs">
              <div>
                <p className="text-emerald-200/80">IFSC Code</p>
                <p className="font-mono font-bold mt-0.5">{bankForm.ifsc}</p>
              </div>
              <div>
                <p className="text-emerald-200/80">PFMS Status</p>
                <p className="font-semibold text-emerald-300 mt-0.5">Verified & Ready</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Card
              title="Bank Account & IFSC Configuration for Subsidy / Loan Credits"
              subtitle="Account number is masked by default for security; click 'Reveal Masked PII' above to view full digits"
            >
              <form onSubmit={handleSaveBankDetails} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Holder Name (as per Bank)
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountHolderName}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, accountHolderName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank & Branch Name
                    </label>
                    <input
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Savings / KCC Account Number {revealSensitive ? '(Unmasked)' : '(Masked)'}
                    </label>
                    <input
                      type={revealSensitive ? 'text' : 'password'}
                      value={bankForm.accountFull}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, accountFull: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={bankForm.ifsc}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1E8E4F]" />
                    {bankForm.pfmsStatus}
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                  >
                    Verify Penny-Drop & Save
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: DOCUMENTS VAULT
      ==================================================================== */}
      {activeTab === 'documents' && (
        <Card
          title="Digital Farmer Document Vault (DigiLocker & Tamil Nilam Integrated)"
          subtitle="Upload and verify mandatory documents once to auto-attach them across all scheme and loan applications"
        >
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {doc.category}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-600">
                      {revealSensitive ? doc.docNumberFull : doc.docNumberMasked}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{doc.title}</h3>
                  <p className="text-xs text-slate-500">
                    {doc.fileName ? (
                      <span className="font-mono text-emerald-800">
                        File: {doc.fileName} · Updated: {doc.updatedAt}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">
                        Pending upload — Upload PDF/JPG to add +8% profile completion
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                      doc.status === 'Verified'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {doc.status === 'Verified' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    {doc.status}
                  </span>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{doc.status === 'Verified' ? 'Re-upload' : 'Upload & Verify'}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleUploadAndVerifyDocument(doc.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ====================================================================
          TAB 5: LANGUAGE & NOTIFICATION PREFERENCES
      ==================================================================== */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Language & Accessibility Preferences"
            subtitle="Choose your preferred interface language for forms, advisories, and SMS alerts"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    language === 'en'
                      ? 'border-[#0B4D2E] bg-emerald-50/70'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">English</span>
                    <Globe className="w-4 h-4 text-[#0B4D2E]" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Standard English interface & receipts
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('ta')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    language === 'ta'
                      ? 'border-[#0B4D2E] bg-emerald-50/70'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">தமிழ் (Tamil)</span>
                    <Globe className="w-4 h-4 text-[#0B4D2E]" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    தமிழ் மொழிப் பலகை மற்றும் குறுஞ்செய்தி
                  </p>
                </button>
              </div>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Tamil Voice / Audio Crop Advisories
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Receive automated IVR voice calls during cyclone or heavy rain alerts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.voiceAdvisoryTamil}
                  onChange={(e) =>
                    setNotifPrefs({ ...notifPrefs, voiceAdvisoryTamil: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#0B4D2E]"
                />
              </label>
            </div>
          </Card>

          <Card
            title="Multi-Channel Alert Subscriptions"
            subtitle="Configure SMS, WhatsApp, and Email notifications for key events"
          >
            <div className="space-y-3">
              {(
                [
                  {
                    key: 'weatherWarnings',
                    label: 'Severe Weather & Monsoon Warnings (IMD)',
                    desc: 'Instant SMS when heavy rain or heat stress is forecast',
                  },
                  {
                    key: 'mandiPriceAlerts',
                    label: 'Regulated Market (Mandi) Target Price Alerts',
                    desc: 'Notify when Ponni Paddy, Maize, or Onion crosses target price',
                  },
                  {
                    key: 'subsidyDbtUpdates',
                    label: 'Scheme & PFMS Subsidy DBT Stage Updates',
                    desc: 'SMS & Email on VAO verification, inspection, and bank credit',
                  },
                  {
                    key: 'loanDueReminders',
                    label: 'PACCS KCC & Term Loan Repayment Reminders',
                    desc: '15-day advance alert to preserve 0% interest subvention',
                  },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.label}</p>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs[item.key]}
                    onChange={(e) => {
                      setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked });
                      showToast('Notification Preference Saved', `${item.label} updated.`);
                    }}
                    className="w-4 h-4 accent-[#0B4D2E]"
                  />
                </label>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ====================================================================
          TAB 6: SECURITY (CHANGE PIN, AUTO-LOGOUT & ACTIVE SESSIONS)
      ==================================================================== */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: Change Security PIN & Auto-Logout Settings */}
          <div className="lg:col-span-5 space-y-6">
            <Card
              title="Change 6-Digit Portal Security PIN (MPIN)"
              subtitle="Used for authorizing DBT bank changes and high-value loan submissions"
            >
              <form onSubmit={handleChangePin} className="space-y-3.5">
                {pinError && (
                  <p className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                    {pinError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current 6-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="••••••"
                    value={pinForm.currentPin}
                    onChange={(e) =>
                      setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, '') })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New 6-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="••••••"
                      value={pinForm.newPin}
                      onChange={(e) =>
                        setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="••••••"
                      value={pinForm.confirmPin}
                      onChange={(e) =>
                        setPinForm({
                          ...pinForm,
                          confirmPin: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono tracking-widest"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Security PIN</span>
                </button>
              </form>
            </Card>

            <Card
              title="Inactivity Auto-Logout & Two-Factor OTP"
              subtitle="Protects farmer accounts on shared e-Sevai and CSC computers"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Auto-Logout Inactivity Timer
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setInactivityTimeoutMins(mins);
                          showToast(
                            'Inactivity Timer Updated',
                            `Session will auto-logout after ${mins} minutes of inactivity.`
                          );
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                          inactivityTimeoutMins === mins
                            ? 'bg-[#0B4D2E] text-white border-[#0B4D2E]'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {mins} Minutes
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-900">Mandatory SMS OTP on New Device</p>
                    <p className="text-[11px] text-slate-500">
                      Require 6-digit OTP verification for every new login
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#0B4D2E]"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setIsInactivityWarningOpen(true)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Simulate Inactivity Auto-Logout Warning (15s Countdown)</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Right 7 Cols: Active Sessions Manager */}
          <div className="lg:col-span-7">
            <Card
              title={`Active Logged-In Devices & Sessions (${activeSessions.length})`}
              subtitle="Monitor devices currently signed into your Uzhavar e-Governance account"
            >
              <div className="divide-y divide-slate-100">
                {activeSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#0B4D2E] border border-emerald-200 flex items-center justify-center shrink-0">
                        {sess.platform === 'Desktop Web' ? (
                          <Laptop className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-900">{sess.device}</h3>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#0B4D2E] text-[10px] font-bold">
                              THIS DEVICE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {sess.location} · IP: <span className="font-mono">{sess.ipMasked}</span>
                        </p>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          {sess.lastActive}
                        </p>
                      </div>
                    </div>

                    {!sess.isCurrent ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 cursor-pointer shrink-0"
                      >
                        Revoke Session
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Explicit Data Privacy & Encryption Consent Notice Footer */}
      <div className="rounded-xl bg-slate-900 text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-emerald-300">
              Data Protection, UIDAI Tokenization & Consent Notice (DPDP Act 2023)
            </p>
            <p className="text-slate-300 leading-relaxed">
              Your Aadhaar number, bank account, and Tamil Nilam land records are stored in an
              AES-256 encrypted state vault and masked in the UI (`XXXX-XXXX-{user.aadhaarLast4}`).
              Data is shared strictly with State Agriculture, TANHODA, PFMS, and PACCS for
              authorized subsidy and crop loan disbursement.
            </p>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold text-emerald-200 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={dataConsentAccepted}
            onChange={(e) => {
              setDataConsentAccepted(e.target.checked);
              showToast(
                'Data Consent Preference Updated',
                e.target.checked
                  ? 'e-Governance data sharing consent is active.'
                  : 'Consent restricted to mandatory DBT functions.'
              );
            }}
            className="accent-emerald-500"
          />
          <span>e-KYC & DBT Consent Active</span>
        </label>
      </div>

      {/* Add Land Parcel Modal */}
      <Modal
        isOpen={isAddLandModalOpen}
        onClose={() => setIsAddLandModalOpen(false)}
        title="Add New Land Holding Parcel (Tamil Nilam)"
        subtitle="Link an additional Survey Number & Patta to your Uzhavar profile"
      >
        <form onSubmit={handleAddLandParcel} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Survey / Sub-Division No. *
              </label>
              <input
                type="text"
                required
                value={newLandForm.surveyNo}
                onChange={(e) =>
                  setNewLandForm({ ...newLandForm, surveyNo: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patta Number *
              </label>
              <input
                type="text"
                required
                value={newLandForm.pattaNo}
                onChange={(e) =>
                  setNewLandForm({ ...newLandForm, pattaNo: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Extent / Area (Acres) *
              </label>
              <input
                type="number"
                step="0.25"
                min="0.1"
                required
                value={newLandForm.areaAcres}
                onChange={(e) =>
                  setNewLandForm({ ...newLandForm, areaAcres: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ownership Type *
              </label>
              <select
                value={newLandForm.ownershipType}
                onChange={(e) =>
                  setNewLandForm({
                    ...newLandForm,
                    ownershipType: e.target.value as LandParcelRecord['ownershipType'],
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="Individual Patta">Individual Patta</option>
                <option value="Joint Patta">Joint Patta</option>
                <option value="Registered Tenant">Registered Tenant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Soil Type *
              </label>
              <input
                type="text"
                required
                value={newLandForm.soilType}
                onChange={(e) =>
                  setNewLandForm({ ...newLandForm, soilType: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Irrigation Source *
              </label>
              <input
                type="text"
                required
                value={newLandForm.irrigationSource}
                onChange={(e) =>
                  setNewLandForm({ ...newLandForm, irrigationSource: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddLandModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              Verify & Link Parcel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
