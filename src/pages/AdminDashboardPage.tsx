import React, { useState, useMemo } from 'react';
import {
  Users,
  Landmark,
  ShieldAlert,
  HandCoins,
  Download,
  FileSpreadsheet,
  Plus,
  Edit3,
  Archive,
  CheckCircle2,
  Eye,
  Search,
  ShieldCheck,
  Activity,
  MapPin,
  Clock,
  FileText,
  UserPlus,
  SlidersHorizontal,
  Sparkles,
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
import { GovernmentScheme, SchemeCategory, UserRole } from '../types';
import {
  Card,
  StatCard,
  StatusBadge,
  Modal,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

// ============================================================================
// TYPES & REALISTIC TAMIL NADU GOVERNANCE TELEMETRY
// ============================================================================

type AdminTabKey = 'overview' | 'schemes' | 'users' | 'audit';

type HeatMapMetric = 'farmers' | 'adoptionPct' | 'dbtCrores' | 'slaPct';

interface DistrictHeatItem {
  district: string;
  districtTa: string;
  zone: string;
  farmers: number;
  adoptionPct: number;
  dbtCrores: number;
  slaPct: number;
  pendingInspections: number;
  activeDpcs: number;
  nodalOfficer: string;
}

const TN_DISTRICT_HEATMAP_DATA: DistrictHeatItem[] = [
  {
    district: 'Perambalur',
    districtTa: 'பெரம்பலூர்',
    zone: 'Central Nodal',
    farmers: 18450,
    adoptionPct: 94.2,
    dbtCrores: 6.45,
    slaPct: 95.8,
    pendingInspections: 14,
    activeDpcs: 18,
    nodalOfficer: 'Dr. A. Rajendran (JDA)',
  },
  {
    district: 'Thanjavur',
    districtTa: 'தஞ்சாவூர்',
    zone: 'Cauvery Delta',
    farmers: 24800,
    adoptionPct: 96.5,
    dbtCrores: 9.8,
    slaPct: 94.1,
    pendingInspections: 22,
    activeDpcs: 46,
    nodalOfficer: 'Thiru K. Baskaran (JDA)',
  },
  {
    district: 'Erode',
    districtTa: 'ஈரோடு',
    zone: 'Western Kongu',
    farmers: 16200,
    adoptionPct: 91.0,
    dbtCrores: 5.9,
    slaPct: 92.4,
    pendingInspections: 19,
    activeDpcs: 21,
    nodalOfficer: 'Tmt. S.revathi (JDA)',
  },
  {
    district: 'Coimbatore',
    districtTa: 'கோயம்புத்தூர்',
    zone: 'Western Kongu',
    farmers: 14900,
    adoptionPct: 93.4,
    dbtCrores: 5.2,
    slaPct: 96.2,
    pendingInspections: 11,
    activeDpcs: 16,
    nodalOfficer: 'Dr. M. Muthukumar (JDA)',
  },
  {
    district: 'Villupuram',
    districtTa: 'விழுப்புரம்',
    zone: 'Northern Arcot',
    farmers: 19650,
    adoptionPct: 88.7,
    dbtCrores: 4.85,
    slaPct: 89.5,
    pendingInspections: 31,
    activeDpcs: 28,
    nodalOfficer: 'Thiru R. Venkatesan (JDA)',
  },
  {
    district: 'Madurai',
    districtTa: 'மதுரை',
    zone: 'Southern Vaigai',
    farmers: 13400,
    adoptionPct: 90.2,
    dbtCrores: 3.75,
    slaPct: 91.8,
    pendingInspections: 17,
    activeDpcs: 19,
    nodalOfficer: 'Tmt. P. Meenakshi (JDA)',
  },
  {
    district: 'Salem',
    districtTa: 'சேலம்',
    zone: 'North-Western',
    farmers: 15120,
    adoptionPct: 89.4,
    dbtCrores: 4.1,
    slaPct: 90.6,
    pendingInspections: 24,
    activeDpcs: 17,
    nodalOfficer: 'Thiru N. Elangovan (JDA)',
  },
  {
    district: 'Tiruchirappalli',
    districtTa: 'திருச்சிராப்பள்ளி',
    zone: 'Central Cauvery',
    farmers: 14250,
    adoptionPct: 92.8,
    dbtCrores: 4.6,
    slaPct: 93.9,
    pendingInspections: 15,
    activeDpcs: 24,
    nodalOfficer: 'Dr. V. Shanmugam (JDA)',
  },
  {
    district: 'Tirunelveli',
    districtTa: 'திருநெல்வேலி',
    zone: 'Tamirabarani Basin',
    farmers: 12150,
    adoptionPct: 87.5,
    dbtCrores: 3.2,
    slaPct: 88.2,
    pendingInspections: 26,
    activeDpcs: 15,
    nodalOfficer: 'Thiru A.Subramanian (JDA)',
  },
];

interface ManagedPortalUser {
  id: string;
  userCode: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  departmentOrVillage: string;
  role: UserRole;
  status: 'Active' | 'Suspended';
  lastLogin: string;
}

const INITIAL_MANAGED_USERS: ManagedPortalUser[] = [
  {
    id: 'usr-101',
    userCode: 'TN-PBL-2026-84920',
    name: 'Muruganandham Selvaraj',
    phone: '+91 94432 68105',
    email: 'muruganandham.farm@tnagri.in',
    district: 'Perambalur',
    departmentOrVillage: 'Arumbavur Village (6.50 Acres)',
    role: 'Farmer',
    status: 'Active',
    lastLogin: 'Today, Active Now',
  },
  {
    id: 'usr-102',
    userCode: 'OFF-TNCSC-0419',
    name: 'Thiru K. Senthilkumar',
    phone: '+91 94421 11204',
    email: 'senthilkumar.qci@tncsc.tn.gov.in',
    district: 'Perambalur',
    departmentOrVillage: 'TNCSC Regional Quality Control',
    role: 'Officer',
    status: 'Active',
    lastLogin: 'Today, 09:15 AM',
  },
  {
    id: 'usr-103',
    userCode: 'OFF-HORT-0882',
    name: 'Tmt. M. Kavitha',
    phone: '+91 94438 77410',
    email: 'kavitha.aho@tanhoda.tn.gov.in',
    district: 'Perambalur',
    departmentOrVillage: 'TANHODA Micro-Irrigation Desk',
    role: 'Officer',
    status: 'Active',
    lastLogin: 'Today, 10:02 AM',
  },
  {
    id: 'usr-104',
    userCode: 'ADM-JDA-PBL-01',
    name: 'Dr. A. Rajendran',
    phone: '+91 94430 00108',
    email: 'jda.perambalur@tn.gov.in',
    district: 'Perambalur',
    departmentOrVillage: 'Joint Director of Agriculture (Appellate)',
    role: 'Admin',
    status: 'Active',
    lastLogin: 'Today, 08:30 AM',
  },
  {
    id: 'usr-105',
    userCode: 'TN-TNJ-2026-39104',
    name: 'Palanisamy Natarajan',
    phone: '+91 98424 55190',
    email: 'palanisamy.delta@tnagri.in',
    district: 'Thanjavur',
    departmentOrVillage: 'Orathanadu Block (4.25 Acres)',
    role: 'Farmer',
    status: 'Active',
    lastLogin: 'Yesterday, 06:40 PM',
  },
  {
    id: 'usr-106',
    userCode: 'OFF-PACCS-418',
    name: 'Thiru S. Balasubramanian',
    phone: '+91 94435 90812',
    email: 'dr.perambalur@tncu.tn.gov.in',
    district: 'Perambalur',
    departmentOrVillage: 'Co-operative Credit / PACCS Audit',
    role: 'Officer',
    status: 'Active',
    lastLogin: '26 Oct 2026, 05:10 PM',
  },
];

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  category: 'Scheme CRUD' | 'User RBAC' | 'DBT Sanction' | 'Grievance SLA' | 'Report Export';
  actionSummary: string;
  targetRef: string;
  ipAddress: string;
  integrityHash: string;
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-901',
    timestamp: '27 Oct 2026, 10:12 AM',
    actorName: 'Dr. A. Rajendran',
    actorRole: 'Admin',
    category: 'Scheme CRUD',
    actionSummary: 'Published Samba 2026 quota for PMKSY Automated Drip Irrigation (100% SF/MF)',
    targetRef: 'PMKSY-DRIP-26',
    ipAddress: '117.242.18.10',
    integrityHash: 'sha256:9f84c2...e10a',
  },
  {
    id: 'aud-902',
    timestamp: '27 Oct 2026, 09:45 AM',
    actorName: 'Thiru K. Senthilkumar',
    actorRole: 'Officer',
    category: 'Grievance SLA',
    actionSummary: 'Assigned moisture inspection team for Arumbavur DPC Token Batch #12',
    targetRef: 'GRV-2026-000123',
    ipAddress: '117.242.19.44',
    integrityHash: 'sha256:4b12d8...c83f',
  },
  {
    id: 'aud-903',
    timestamp: '26 Oct 2026, 04:30 PM',
    actorName: 'Tmt. R. Vijayalakshmi',
    actorRole: 'Officer',
    category: 'DBT Sanction',
    actionSummary: 'Approved PFMS DBT release of ₹6,000 under Integrated Bio-Fertilizer Input Subsidy',
    targetRef: 'TN-SUB-2026-9045',
    ipAddress: '49.37.210.88',
    integrityHash: 'sha256:7c39a1...b29d',
  },
  {
    id: 'aud-904',
    timestamp: '25 Oct 2026, 11:20 AM',
    actorName: 'Dr. A. Rajendran',
    actorRole: 'Admin',
    category: 'User RBAC',
    actionSummary: 'Granted Nodal Officer role permissions to Tmt. M. Kavitha (TANHODA Desk)',
    targetRef: 'OFF-HORT-0882',
    ipAddress: '117.242.18.10',
    integrityHash: 'sha256:2e71f0...a45c',
  },
];

export const AdminDashboardPage: React.FC = () => {
  const {
    language,
    user,
    role,
    setRole,
    schemes,
    addScheme,
    updateScheme,
    setSchemePublicationStatus,
    subsidies,
    grievances,
    showToast,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');

  // District Heat Map State
  const [heatMetric, setHeatMetric] = useState<HeatMapMetric>('farmers');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictHeatItem>(
    TN_DISTRICT_HEATMAP_DATA[0]
  );

  // Scheme CRUD Modal State
  const [schemePubFilter, setSchemePubFilter] = useState<
    'All' | 'Published' | 'Draft' | 'Archived'
  >('All');
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
  const [schemeForm, setSchemeForm] = useState({
    code: 'TN-MILLETS-2026',
    title: 'Tamil Nadu Millet Mission (Sirudhaniya Special Subsidy)',
    titleTa: 'தமிழ்நாடு சிறுதானிய சிறப்பு மானியத் திட்டம்',
    category: 'Subsidy' as SchemeCategory,
    department: 'State Agriculture Dept' as GovernmentScheme['department'],
    maxSubsidyAmount: 15000,
    benefitSummary: '₹15,000 / Ha cluster incentive + 50% bio-input & processing unit subsidy.',
    shortDescription:
      'Promotes drought-resilient Ragi, Pearl Millet (Kambu), and Sorghum (Cholam) cultivation in rainfed blocks.',
    eligibilityTag: 'Rainfed & Millet Cluster Farmers',
    deadline: '2026-12-31',
    publicationStatus: 'Published' as 'Published' | 'Draft' | 'Archived',
  });

  // User Management State
  const [managedUsers, setManagedUsers] = useState<ManagedPortalUser[]>(INITIAL_MANAGED_USERS);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'All' | UserRole>('All');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: 'Er. K. Parthiban',
    userCode: 'OFF-AED-2026-19',
    phone: '+91 94431 82910',
    email: 'parthiban.ae@aed.tn.gov.in',
    district: 'Perambalur',
    departmentOrVillage: 'Agricultural Engineering Dept (Solar & Machinery)',
    role: 'Officer' as UserRole,
  });

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<
    'All' | AuditLogEntry['category']
  >('All');
  const [auditSearch, setAuditSearch] = useState('');

  // Helper to append an entry to the Audit Log
  const recordAuditEvent = (
    category: AuditLogEntry['category'],
    actionSummary: string,
    targetRef: string
  ) => {
    const hashTail = Math.random().toString(16).slice(2, 6);
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: 'Today, Just now',
      actorName: user.name,
      actorRole: role,
      category,
      actionSummary,
      targetRef,
      ipAddress: '117.242.18.84',
      integrityHash: `sha256:8a4e...${hashTail}`,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // --------------------------------------------------------------------------
  // CHART 1: APPLICATIONS BY SCHEME & STATUS
  // --------------------------------------------------------------------------
  const schemeApplicationsChartData = useMemo(() => {
    return [
      {
        scheme: 'PM-KISAN',
        Approved: 1420,
        'Under Review': 185,
        Pending: 92,
        Rejected: 24,
      },
      {
        scheme: 'PMFBY Ins.',
        Approved: 980,
        'Under Review': 240,
        Pending: 145,
        Rejected: 38,
      },
      {
        scheme: 'PMKSY Drip',
        Approved: 610 + subsidies.filter((s) => s.status === 'Approved').length,
        'Under Review': 195 + subsidies.filter((s) => s.status === 'Under Review').length,
        Pending: 110 + subsidies.filter((s) => s.status === 'Pending').length,
        Rejected: 19 + subsidies.filter((s) => s.status === 'Rejected').length,
      },
      {
        scheme: 'Fert. & Seed',
        Approved: 1150,
        'Under Review': 130,
        Pending: 84,
        Rejected: 15,
      },
      {
        scheme: 'PACCS KCC',
        Approved: 890,
        'Under Review': 160,
        Pending: 75,
        Rejected: 28,
      },
    ];
  }, [subsidies]);

  // --------------------------------------------------------------------------
  // CHART 2: GRIEVANCES BY SLA STATUS ACROSS DEPARTMENTS
  // --------------------------------------------------------------------------
  const grievancesSlaChartData = useMemo(() => {
    const liveBreached = grievances.filter((g) => g.slaBreached).length;
    const liveResolved = grievances.filter(
      (g) => g.workflowStatus === 'Resolved' || g.status === 'Approved'
    ).length;

    return [
      {
        dept: 'TNCSC / Market',
        'Within SLA': 42,
        'Resolved in SLA': 118 + liveResolved,
        'SLA Breached': 4 + liveBreached,
      },
      {
        dept: 'TANHODA Drip',
        'Within SLA': 31,
        'Resolved in SLA': 94,
        'SLA Breached': 6,
      },
      {
        dept: 'Agri & PMFBY',
        'Within SLA': 28,
        'Resolved in SLA': 142,
        'SLA Breached': 3,
      },
      {
        dept: 'PACCS Credit',
        'Within SLA': 19,
        'Resolved in SLA': 87,
        'SLA Breached': 5,
      },
    ];
  }, [grievances]);

  const totalFarmersCount = useMemo(
    () => TN_DISTRICT_HEATMAP_DATA.reduce((acc, d) => acc + d.farmers, 0),
    []
  );

  const totalDbtCrores = useMemo(
    () => TN_DISTRICT_HEATMAP_DATA.reduce((acc, d) => acc + d.dbtCrores, 0),
    []
  );

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  // Filtered Schemes for CRUD table
  const filteredSchemes = schemes.filter((s) => {
    const pub = s.publicationStatus || 'Published';
    return schemePubFilter === 'All' || pub === schemePubFilter;
  });

  // Filtered Users
  const filteredUsers = managedUsers.filter((u) => {
    const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter;
    const q = userSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.userCode.toLowerCase().includes(q) ||
      u.district.toLowerCase().includes(q) ||
      u.departmentOrVillage.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesCat =
      auditCategoryFilter === 'All' || log.category === auditCategoryFilter;
    const q = auditSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      log.actionSummary.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.targetRef.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // --------------------------------------------------------------------------
  // HANDLERS: SCHEME CRUD
  // --------------------------------------------------------------------------
  const handleOpenCreateScheme = () => {
    setEditingSchemeId(null);
    setSchemeForm({
      code: `TN-SCH-${Math.floor(100 + Math.random() * 900)}`,
      title: 'Tamil Nadu Millet Mission (Sirudhaniya Special Subsidy)',
      titleTa: 'தமிழ்நாடு சிறுதானிய சிறப்பு மானியத் திட்டம்',
      category: 'Subsidy',
      department: 'State Agriculture Dept',
      maxSubsidyAmount: 15000,
      benefitSummary: '₹15,000 / Ha cluster incentive + 50% bio-input & seed subsidy.',
      shortDescription:
        'Promotes drought-resilient Ragi, Pearl Millet (Kambu), and Sorghum (Cholam) cultivation in rainfed blocks.',
      eligibilityTag: 'All Millet Growers (0.5 – 12.5 Acres)',
      deadline: '2026-12-31',
      publicationStatus: 'Published',
    });
    setIsSchemeModalOpen(true);
  };

  const handleOpenEditScheme = (sch: GovernmentScheme) => {
    setEditingSchemeId(sch.id);
    setSchemeForm({
      code: sch.code,
      title: sch.title,
      titleTa: sch.titleTa,
      category: sch.category,
      department: sch.department,
      maxSubsidyAmount: sch.maxSubsidyAmount,
      benefitSummary: sch.benefitSummary,
      shortDescription: sch.shortDescription,
      eligibilityTag: sch.eligibilityTag,
      deadline: sch.deadline,
      publicationStatus: sch.publicationStatus || 'Published',
    });
    setIsSchemeModalOpen(true);
  };

  const handleSaveSchemeCrud = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchemeId) {
      updateScheme(editingSchemeId, {
        ...schemeForm,
        maxSubsidyAmount: Number(schemeForm.maxSubsidyAmount),
      });
      recordAuditEvent(
        'Scheme CRUD',
        `Updated scheme configuration & benefit cap (₹${Number(
          schemeForm.maxSubsidyAmount
        ).toLocaleString('en-IN')}) for ${schemeForm.title}`,
        schemeForm.code
      );
    } else {
      const created = addScheme({
        ...schemeForm,
        shortDescriptionTa: schemeForm.titleTa,
        overview: schemeForm.shortDescription,
        benefitSummaryTa: schemeForm.benefitSummary,
        benefitsList: [schemeForm.benefitSummary, '100% Direct Benefit Transfer via PFMS.'],
        maxSubsidyAmount: Number(schemeForm.maxSubsidyAmount),
        minLandAcres: 0.25,
        maxLandAcres: 25,
        eligibleCrops: ['All Crops', 'Paddy', 'Maize', 'Small Onion', 'Pulses'],
        farmerCategories: ['Small / Marginal', 'Medium', 'All Farmers'],
        eligibility: ['Registered farmer on Tamil Nadu GRAINS portal with active e-Adangal.'],
        requiredDocuments: ['Aadhaar Card', 'Patta / Chitta & e-Adangal', 'Bank Passbook'],
        applicationProcess: ['Apply online via Digital Farmer Portal', 'Field verification by BAO'],
        importantDates: [{ label: 'Application Cut-off', date: schemeForm.deadline }],
        faqs: [
          {
            question: 'How is the subsidy disbursed?',
            answer: 'Direct Benefit Transfer (DBT) into Aadhaar-seeded bank account.',
          },
        ],
        helpline: {
          phone: '1800-180-1551',
          email: 'diragri@tn.nic.in',
          officeHours: 'Mon – Sat, 9:30 AM to 5:30 PM',
        },
      });
      recordAuditEvent(
        'Scheme CRUD',
        `Created new ${created.publicationStatus} scheme "${created.title}"`,
        created.code
      );
    }
    setIsSchemeModalOpen(false);
  };

  const handleToggleSchemePub = (
    sch: GovernmentScheme,
    newPub: 'Published' | 'Draft' | 'Archived'
  ) => {
    setSchemePublicationStatus(sch.id, newPub);
    recordAuditEvent(
      'Scheme CRUD',
      `Changed scheme status to ${newPub.toUpperCase()} for "${sch.title}"`,
      sch.code
    );
  };

  // --------------------------------------------------------------------------
  // HANDLERS: USER MANAGEMENT & RBAC
  // --------------------------------------------------------------------------
  const handleRoleAssignChange = (targetUser: ManagedPortalUser, newRole: UserRole) => {
    setManagedUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
    );
    if (targetUser.userCode === user.farmerId) {
      setRole(newRole);
    }
    recordAuditEvent(
      'User RBAC',
      `Assigned role "${newRole}" to ${targetUser.name} (${targetUser.district})`,
      targetUser.userCode
    );
    showToast(
      'Role Permission Updated',
      `${targetUser.name} is now assigned the ${newRole} role.`
    );
  };

  const handleToggleUserStatus = (targetUser: ManagedPortalUser) => {
    const nextStatus = targetUser.status === 'Active' ? 'Suspended' : 'Active';
    setManagedUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u))
    );
    recordAuditEvent(
      'User RBAC',
      `Changed account status to ${nextStatus.toUpperCase()} for ${targetUser.name}`,
      targetUser.userCode
    );
    showToast(
      `User Account ${nextStatus}`,
      `${targetUser.name} (${targetUser.userCode}) status set to ${nextStatus}.`,
      nextStatus === 'Suspended' ? 'warning' : 'success'
    );
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ManagedPortalUser = {
      id: `usr-${Date.now()}`,
      ...newUserForm,
      status: 'Active',
      lastLogin: 'Invited Just Now',
    };
    setManagedUsers((prev) => [created, ...prev]);
    recordAuditEvent(
      'User RBAC',
      `Registered new ${created.role} account for ${created.name} (${created.departmentOrVillage})`,
      created.userCode
    );
    setIsAddUserModalOpen(false);
    showToast(
      'Portal User Provisioned',
      `${created.name} (${created.role}) added to ${created.district} district directory.`
    );
  };

  // --------------------------------------------------------------------------
  // HANDLERS: REPORT EXPORT (CSV & PDF)
  // --------------------------------------------------------------------------
  const handleExportCsvReport = () => {
    const headers = [
      'District',
      'Zone',
      'Registered_Farmers',
      'Scheme_Adoption_Pct',
      'DBT_Disbursed_Crores_INR',
      'Grievance_SLA_Compliance_Pct',
      'Pending_Field_Inspections',
      'Nodal_Officer',
    ];
    const rows = TN_DISTRICT_HEATMAP_DATA.map((d) => [
      d.district,
      `"${d.zone}"`,
      d.farmers,
      d.adoptionPct,
      d.dbtCrores,
      d.slaPct,
      d.pendingInspections,
      `"${d.nodalOfficer}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TN_Agri_Governance_Report_2026.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    recordAuditEvent(
      'Report Export',
      'Exported District-Wise Agricultural Governance & SLA Telemetry (CSV)',
      'RPT-CSV-2026'
    );
  };

  const handleExportPdfReport = () => {
    const lines = [
      'GOVERNMENT OF TAMIL NADU - DEPARTMENT OF AGRICULTURE',
      'EXECUTIVE e-GOVERNANCE & SLA COMPLIANCE REPORT (2026-27)',
      '============================================================',
      `Generated By             : ${user.name} (${role})`,
      `Date & Time              : ${new Date().toISOString().split('T')[0]}`,
      `Total Registered Farmers : ${totalFarmersCount.toLocaleString('en-IN')} (Across 9 Nodal Districts)`,
      `Total DBT Disbursed      : Rs. ${totalDbtCrores.toFixed(2)} Crores`,
      `Active Portal Schemes    : ${schemes.length} Schemes (${
        schemes.filter((s) => (s.publicationStatus || 'Published') === 'Published').length
      } Published)`,
      '------------------------------------------------------------',
      'DISTRICT-WISE TELEMETRY SUMMARY:',
      ...TN_DISTRICT_HEATMAP_DATA.map(
        (d) =>
          `${d.district.padEnd(16, ' ')} | Farmers: ${String(d.farmers).padEnd(
            7,
            ' '
          )} | Adoption: ${d.adoptionPct}% | DBT: Rs.${d.dbtCrores}Cr | SLA: ${d.slaPct}%`
      ),
      '------------------------------------------------------------',
      'RECENT GOVERNANCE AUDIT LOGS:',
      ...auditLogs.slice(0, 4).map(
        (l) => `[${l.category}] ${l.targetRef}: ${l.actionSummary.slice(0, 48)}`
      ),
      '============================================================',
      'Digitally Verified by Tamil Nadu e-Governance Agency (TNeGA)',
    ];

    const escapedLines = lines
      .map(
        (line, idx) =>
          `1 0 0 1 36 ${755 - idx * 22} Tm (${line.replace(/[()\\]/g, '')}) Tj`
      )
      .join('\n');

    const streamContent = `BT\n/F1 9 Tf\n${escapedLines}\nET`;
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
    link.download = `TN_Executive_Governance_Report_2026.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    recordAuditEvent(
      'Report Export',
      'Generated & downloaded Official Executive Governance Report (PDF)',
      'RPT-PDF-2026'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Role Guard Banner if currently in Farmer role */}
      {role === 'Farmer' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-950">
                You are currently viewing the Admin / Officer Command Center in Farmer Preview Mode
              </p>
              <p className="text-amber-800 mt-0.5">
                Switch your active role to <strong>District Admin</strong> or{' '}
                <strong>Agri Officer</strong> with one click for full RBAC authority across all modules.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setRole('Officer')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 cursor-pointer"
            >
              Switch to Officer
            </button>
            <button
              type="button"
              onClick={() => setRole('Admin')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              Activate District Admin
            </button>
          </div>
        </div>
      )}

      {/* Page Header & Report Export Actions (CSV / PDF) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-[#0B4D2E] text-[11px] font-bold uppercase tracking-wider">
              State Command Desk · {role}
            </span>
            <span className="text-xs text-slate-400 font-mono">Agrisnet v2.4</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            {language === 'ta'
              ? 'மாவட்ட நிர்வாகி மற்றும் வேளாண் அதிகாரி கட்டுப்பாட்டு அறை'
              : 'Admin & Nodal Officer Governance Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            State-wide farmer enrollment, scheme CRUD management, district heat map, SLA grievance oversight & immutable audit logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsvReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0B4D2E]" />
            <span>Export Report (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdfReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Official Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* 4-Column Executive Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Farmers Registered"
          value={totalFarmersCount.toLocaleString('en-IN')}
          subtext="96.4% UIDAI e-KYC & Tamil Nilam Linked"
          icon={<Users className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Scheme & Subsidy Claims"
          value="7,565 Active"
          subtext="5,050 Approved · 1,416 Under Review"
          icon={<Landmark className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="Grievance SLA Compliance"
          value="92.8% On-Time"
          subtext={`${
            grievances.filter((g) => g.slaBreached).length
          } Active SLA Breaches Monitored`}
          icon={<ShieldAlert className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="Total PFMS DBT Disbursed"
          value={`₹${totalDbtCrores.toFixed(2)} Cr`}
          subtext="Direct Aadhaar Bank Transfers (2026-27)"
          icon={<HandCoins className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* 4-Tab Command Navigation */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-2xs flex flex-wrap gap-1.5">
        {(
          [
            {
              key: 'overview',
              label: '1. Analytics & District Heat Map',
              badge: '9 Districts',
            },
            {
              key: 'schemes',
              label: '2. Scheme Management (CRUD)',
              badge: `${schemes.length} Schemes`,
            },
            {
              key: 'users',
              label: '3. User Management & RBAC',
              badge: `${managedUsers.length} Users`,
            },
            {
              key: 'audit',
              label: '4. System Audit Logs',
              badge: `${auditLogs.length} Events`,
            },
          ] as { key: AdminTabKey; label: string; badge: string }[]
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-[#0B4D2E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          TAB 1: ANALYTICS & DISTRICT-WISE HEAT MAP
      ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Two-Column Recharts Row: Applications by Scheme & Status | Grievances by SLA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Applications by Scheme & Workflow Status"
              subtitle="Distribution of Approved, Under Review, Pending, and Rejected claims across flagship schemes"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={schemeApplicationsChartData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="scheme" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="Approved"
                      stackId="a"
                      fill="#1E8E4F"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="Under Review"
                      stackId="a"
                      fill="#0284c7"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="Pending"
                      stackId="a"
                      fill="#f59e0b"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="Rejected"
                      stackId="a"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              title="Grievances by SLA Compliance & Department"
              subtitle="Comparison of Resolved Within SLA, Active Within SLA, and SLA-Breached tickets"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={grievancesSlaChartData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="Resolved in SLA"
                      fill="#0B4D2E"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Within SLA"
                      fill="#0ea5e9"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="SLA Breached"
                      fill="#dc2626"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* District-Wise Heat Map & Interactive Drill-Down */}
          <Card
            title="Tamil Nadu District-Wise Agricultural Telemetry Heat Map"
            subtitle="Click any district tile to inspect nodal officer readiness, DPC procurement centers, and pending field verifications"
            action={
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'farmers', label: 'Registered Farmers' },
                    { key: 'adoptionPct', label: 'Scheme Adoption %' },
                    { key: 'dbtCrores', label: 'DBT Disbursed (₹ Cr)' },
                    { key: 'slaPct', label: 'SLA Compliance %' },
                  ] as { key: HeatMapMetric; label: string }[]
                ).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setHeatMetric(m.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      heatMetric === m.key
                        ? 'bg-[#0B4D2E] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 9-District Heat Map Matrix (8 Cols) */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TN_DISTRICT_HEATMAP_DATA.map((item) => {
                  const isSelected = selectedDistrict.district === item.district;

                  // Compute intensity level (High / Medium-High / Moderate)
                  const rawScore =
                    heatMetric === 'farmers'
                      ? item.farmers / 25000
                      : heatMetric === 'adoptionPct'
                      ? (item.adoptionPct - 85) / 12
                      : heatMetric === 'dbtCrores'
                      ? item.dbtCrores / 10
                      : (item.slaPct - 85) / 12;

                  const intensityClass =
                    rawScore >= 0.72
                      ? 'bg-[#0B4D2E] text-white border-[#0B4D2E]'
                      : rawScore >= 0.5
                      ? 'bg-[#1E8E4F] text-white border-[#1E8E4F]'
                      : 'bg-emerald-100 text-emerald-950 border-emerald-300';

                  const displayValue =
                    heatMetric === 'farmers'
                      ? `${item.farmers.toLocaleString('en-IN')}`
                      : heatMetric === 'adoptionPct'
                      ? `${item.adoptionPct.toFixed(1)}%`
                      : heatMetric === 'dbtCrores'
                      ? `₹${item.dbtCrores.toFixed(2)} Cr`
                      : `${item.slaPct.toFixed(1)}%`;

                  return (
                    <button
                      key={item.district}
                      type="button"
                      onClick={() => setSelectedDistrict(item)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${intensityClass} ${
                        isSelected ? 'ring-2 ring-amber-400 shadow-md scale-[1.01]' : 'opacity-95 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold tracking-tight">
                          {language === 'ta' ? item.districtTa : item.district}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                          {item.zone}
                        </span>
                      </div>

                      <p className="text-xl font-mono font-bold tabular-nums mt-2">
                        {displayValue}
                      </p>

                      <div className="mt-2 pt-2 border-t border-current/15 flex items-center justify-between text-[11px] opacity-90 tabular-nums">
                        <span>Adoption: {item.adoptionPct}%</span>
                        <span>SLA: {item.slaPct}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected District Drill-Down Panel (4 Cols) */}
              <div className="lg:col-span-4 rounded-xl bg-slate-900 text-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      District Nodal Drill-Down
                    </span>
                    <h3 className="text-base font-bold mt-0.5">
                      {selectedDistrict.district} ({selectedDistrict.districtTa})
                    </h3>
                  </div>
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-slate-400 text-[11px]">Registered Farmers</p>
                    <p className="text-base font-mono font-bold text-white tabular-nums mt-0.5">
                      {selectedDistrict.farmers.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-slate-400 text-[11px]">PFMS DBT Released</p>
                    <p className="text-base font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                      ₹{selectedDistrict.dbtCrores.toFixed(2)} Cr
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-slate-400 text-[11px]">Active TNCSC DPCs</p>
                    <p className="text-base font-mono font-bold text-amber-300 tabular-nums mt-0.5">
                      {selectedDistrict.activeDpcs} Centres
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-slate-400 text-[11px]">Pending Inspections</p>
                    <p className="text-base font-mono font-bold text-sky-300 tabular-nums mt-0.5">
                      {selectedDistrict.pendingInspections} Plots
                    </p>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-2 border-t border-white/15">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Agro-Climatic Zone:</span>
                    <span className="font-semibold text-white">{selectedDistrict.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">District Nodal Head:</span>
                    <span className="font-semibold text-emerald-300">
                      {selectedDistrict.nodalOfficer}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grievance SLA Rate:</span>
                    <span className="font-mono font-bold text-white">
                      {selectedDistrict.slaPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ====================================================================
          TAB 2: SCHEME MANAGEMENT CRUD (CREATE, EDIT, PUBLISH, ARCHIVE)
      ==================================================================== */}
      {activeTab === 'schemes' && (
        <Card
          title={`Government Scheme Catalogue Management (${filteredSchemes.length} Schemes)`}
          subtitle="Create new schemes, edit subsidy caps, publish drafts to farmers, or archive closed programs"
          action={
            <div className="flex flex-wrap items-center gap-2">
              {(['All', 'Published', 'Draft', 'Archived'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSchemePubFilter(st)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    schemePubFilter === st
                      ? 'bg-[#0B4D2E] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}

              <button
                type="button"
                onClick={handleOpenCreateScheme}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Scheme</span>
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="py-3 px-4 font-semibold">Code & Category</th>
                  <th className="py-3 px-4 font-semibold">Scheme Title & Department</th>
                  <th className="py-3 px-4 font-semibold">Max Benefit Cap</th>
                  <th className="py-3 px-4 font-semibold">Cut-off Date</th>
                  <th className="py-3 px-4 font-semibold">Catalogue Status</th>
                  <th className="py-3 px-4 font-semibold text-right">CRUD Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchemes.map((sch) => {
                  const pubStatus = sch.publicationStatus || 'Published';
                  return (
                    <tr key={sch.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded block w-fit">
                          {sch.code}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          {sch.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-bold text-slate-900">{sch.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {sch.department} · {sch.eligibilityTag}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B4D2E] tabular-nums">
                        ₹{sch.maxSubsidyAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 tabular-nums">
                        {sch.deadline}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${
                            pubStatus === 'Published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : pubStatus === 'Draft'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {pubStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditScheme(sch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {pubStatus !== 'Published' && (
                            <button
                              type="button"
                              onClick={() => handleToggleSchemePub(sch, 'Published')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Publish</span>
                            </button>
                          )}

                          {pubStatus !== 'Archived' && (
                            <button
                              type="button"
                              onClick={() => handleToggleSchemePub(sch, 'Archived')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-semibold cursor-pointer"
                            >
                              <Archive className="w-3 h-3" />
                              <span>Archive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ====================================================================
          TAB 3: USER MANAGEMENT WITH ROLE ASSIGNMENT
      ==================================================================== */}
      {activeTab === 'users' && (
        <Card
          title={`Portal User Directory & RBAC Role Assignment (${filteredUsers.length} Accounts)`}
          subtitle="Assign Farmer, Agri Officer, or District Admin roles and manage account access across districts"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user, ID, district..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as 'All' | UserRole)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="All">All Roles</option>
                <option value="Farmer">Farmer</option>
                <option value="Officer">Officer</option>
                <option value="Admin">Admin</option>
              </select>

              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add User / Officer</span>
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="py-3 px-4 font-semibold">User / Employee ID</th>
                  <th className="py-3 px-4 font-semibold">Full Name & Contact</th>
                  <th className="py-3 px-4 font-semibold">District & Jurisdiction</th>
                  <th className="py-3 px-4 font-semibold">Assigned RBAC Role</th>
                  <th className="py-3 px-4 font-semibold">Account Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B4D2E]">
                      {u.userCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {u.phone} · {u.email}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{u.district}</p>
                      <p className="text-[11px] text-slate-500">{u.departmentOrVillage}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleAssignChange(u, e.target.value as UserRole)
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#0B4D2E]"
                      >
                        <option value="Farmer">Farmer</option>
                        <option value="Officer">Agri Officer</option>
                        <option value="Admin">District Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold border ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-3 py-1 rounded text-xs font-semibold border cursor-pointer ${
                          u.status === 'Active'
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.status === 'Active' ? 'Suspend' : 'Activate'}
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
          TAB 4: IMMUTABLE SYSTEM AUDIT LOG
      ==================================================================== */}
      {activeTab === 'audit' && (
        <Card
          title={`Immutable Governance & Security Audit Trail (${filteredAuditLogs.length} Events)`}
          subtitle="Cryptographically hashed log of every scheme modification, RBAC role assignment, DBT sanction, and report export"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit events..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
                />
              </div>

              <select
                value={auditCategoryFilter}
                onChange={(e) =>
                  setAuditCategoryFilter(
                    e.target.value as 'All' | AuditLogEntry['category']
                  )
                }
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="All">All Categories</option>
                <option value="Scheme CRUD">Scheme CRUD</option>
                <option value="User RBAC">User RBAC</option>
                <option value="DBT Sanction">DBT Sanction</option>
                <option value="Grievance SLA">Grievance SLA</option>
                <option value="Report Export">Report Export</option>
              </select>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Actor & Role</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Action Description</th>
                  <th className="py-3 px-4 font-semibold">Target Ref</th>
                  <th className="py-3 px-4 font-semibold">IP & SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{log.actorName}</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#0B4D2E] border border-emerald-200 font-semibold">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-md">
                      {log.actionSummary}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {log.targetRef}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      <div>{log.ipAddress}</div>
                      <div className="text-emerald-700">{log.integrityHash}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ====================================================================
          MODAL 1: CREATE / EDIT GOVERNMENT SCHEME (CRUD)
      ==================================================================== */}
      <Modal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        title={
          editingSchemeId
            ? 'Edit Government Scheme Configuration'
            : 'Create & Publish New Government Scheme'
        }
        subtitle="Changes immediately sync with the Farmer Government Schemes catalogue and record an Audit Log entry"
      >
        <form onSubmit={handleSaveSchemeCrud} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheme Code *
              </label>
              <input
                type="text"
                required
                value={schemeForm.code}
                onChange={(e) =>
                  setSchemeForm({ ...schemeForm, code: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={schemeForm.category}
                onChange={(e) =>
                  setSchemeForm({
                    ...schemeForm,
                    category: e.target.value as SchemeCategory,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="Subsidy">Subsidy</option>
                <option value="Irrigation">Irrigation</option>
                <option value="Insurance">Insurance</option>
                <option value="Income Support">Income Support</option>
                <option value="Loan">Loan</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheme Title (English) *
              </label>
              <input
                type="text"
                required
                value={schemeForm.title}
                onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheme Title (Tamil / தமிழ்) *
              </label>
              <input
                type="text"
                required
                value={schemeForm.titleTa}
                onChange={(e) => setSchemeForm({ ...schemeForm, titleTa: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Benefit / Subsidy Cap (₹) *
              </label>
              <input
                type="number"
                required
                min={1000}
                value={schemeForm.maxSubsidyAmount}
                onChange={(e) =>
                  setSchemeForm({
                    ...schemeForm,
                    maxSubsidyAmount: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Deadline *
              </label>
              <input
                type="date"
                required
                value={schemeForm.deadline}
                onChange={(e) =>
                  setSchemeForm({ ...schemeForm, deadline: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Eligibility Badge Label *
              </label>
              <input
                type="text"
                required
                value={schemeForm.eligibilityTag}
                onChange={(e) =>
                  setSchemeForm({ ...schemeForm, eligibilityTag: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publication State *
              </label>
              <select
                value={schemeForm.publicationStatus}
                onChange={(e) =>
                  setSchemeForm({
                    ...schemeForm,
                    publicationStatus: e.target.value as 'Published' | 'Draft' | 'Archived',
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="Published">Published (Live for Farmers)</option>
                <option value="Draft">Draft (Internal Review)</option>
                <option value="Archived">Archived (Closed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Benefit Summary *
            </label>
            <input
              type="text"
              required
              value={schemeForm.benefitSummary}
              onChange={(e) =>
                setSchemeForm({ ...schemeForm, benefitSummary: e.target.value })
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Description *
            </label>
            <textarea
              rows={2}
              required
              value={schemeForm.shortDescription}
              onChange={(e) =>
                setSchemeForm({ ...schemeForm, shortDescription: e.target.value })
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSchemeModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              {editingSchemeId ? 'Save Changes' : 'Create & Publish Scheme'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ====================================================================
          MODAL 2: PROVISION NEW USER / NODAL OFFICER
      ==================================================================== */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Provision New Portal User / Nodal Officer"
        subtitle="Assign district jurisdiction and Role-Based Access Control (RBAC) permissions"
      >
        <form onSubmit={handleCreateNewUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newUserForm.name}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, name: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee / Uzhavar Code *
              </label>
              <input
                type="text"
                required
                value={newUserForm.userCode}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, userCode: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="text"
                required
                value={newUserForm.phone}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email *
              </label>
              <input
                type="email"
                required
                value={newUserForm.email}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, email: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                District *
              </label>
              <select
                value={newUserForm.district}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, district: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                {TN_DISTRICT_HEATMAP_DATA.map((d) => (
                  <option key={d.district} value={d.district}>
                    {d.district}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned RBAC Role *
              </label>
              <select
                value={newUserForm.role}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
              >
                <option value="Officer">Agri Officer</option>
                <option value="Admin">District Admin</option>
                <option value="Farmer">Farmer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department / Block Jurisdiction *
            </label>
            <input
              type="text"
              required
              value={newUserForm.departmentOrVillage}
              onChange={(e) =>
                setNewUserForm({ ...newUserForm, departmentOrVillage: e.target.value })
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              Provision User & Log Audit Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
