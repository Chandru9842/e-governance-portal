import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Language,
  UserRole,
  UserProfile,
  CropRecord,
  CropInputLog,
  GovernmentScheme,
  MarketPriceItem,
  WeatherForecastDay,
  SubsidyApplication,
  GrievanceTicket,
  NotificationItem,
  ApplicationStatus,
  ImportantUpdateItem,
} from '../types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_CROPS,
  INITIAL_SCHEMES,
  INITIAL_MARKET_PRICES,
  INITIAL_WEATHER_FORECAST,
  INITIAL_SUBSIDIES,
  INITIAL_GRIEVANCES,
  INITIAL_NOTIFICATIONS,
  INITIAL_IMPORTANT_UPDATES,
} from '../services/mockData';
import { translations } from '../i18n/translations';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'info' | 'warning' | 'error';
}

interface PortalContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  user: UserProfile;
  updateUserProfile: (updated: Partial<UserProfile>) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;

  // Auth & Session Handling
  isAuthenticated: boolean;
  loginWithOtp: (mobile: string, aadhaarLast4?: string, selectedRole?: UserRole) => void;
  logout: (reason?: string) => void;
  isLogoutModalOpen: boolean;
  setIsLogoutModalOpen: (open: boolean) => void;
  inactivityTimeoutMins: number;
  setInactivityTimeoutMins: (mins: number) => void;
  isInactivityWarningOpen: boolean;
  setIsInactivityWarningOpen: (open: boolean) => void;
  sessionStartedAt: string;
  lastActivityAt: string;

  // Crops CRUD + Input Logs + Notes
  crops: CropRecord[];
  addCrop: (crop: Omit<CropRecord, 'id' | 'inputLogs' | 'financialProjection' | 'notes'>) => void;
  updateCrop: (id: string, updated: Partial<CropRecord>) => void;
  deleteCrop: (id: string) => void;
  addCropInputLog: (cropId: string, log: Omit<CropInputLog, 'id'>) => void;
  addCropNote: (cropId: string, note: string) => void;

  // Schemes CRUD
  schemes: GovernmentScheme[];
  applyToScheme: (schemeId: string, landSurveyNo: string, remarks: string, customRefNo?: string) => string;
  updateSchemeStatus: (schemeId: string, status: ApplicationStatus) => void;
  addScheme: (scheme: Omit<GovernmentScheme, 'id'>) => GovernmentScheme;
  updateScheme: (schemeId: string, updated: Partial<GovernmentScheme>) => void;
  setSchemePublicationStatus: (schemeId: string, pubStatus: 'Published' | 'Draft' | 'Archived') => void;

  marketPrices: MarketPriceItem[];
  weatherForecast: WeatherForecastDay[];
  importantUpdates: ImportantUpdateItem[];

  subsidies: SubsidyApplication[];
  addSubsidyApplication: (sub: Omit<SubsidyApplication, 'id' | 'referenceNo' | 'appliedDate' | 'status' | 'currentStep'>) => void;
  updateSubsidyStatus: (id: string, status: ApplicationStatus, step: number, remarks?: string) => void;

  grievances: GrievanceTicket[];
  addGrievance: (ticket: Omit<GrievanceTicket, 'id' | 'ticketNo' | 'submittedDate' | 'status' | 'assignedOfficer'>) => GrievanceTicket;
  updateGrievanceStatus: (id: string, status: ApplicationStatus, resolutionNotes?: string) => void;
  updateGrievance: (id: string, updated: Partial<GrievanceTicket>) => void;

  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  updateMarketModalPrice: (id: string, newModalPrice: number) => void;

  // Global UI simulation states (loading skeletons / error boundaries)
  isLoading: boolean;
  triggerLoadingDemo: () => void;
  hasError: boolean;
  setHasError: (err: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [role, setRoleState] = useState<UserRole>('Farmer');

  // Auth & Session States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [inactivityTimeoutMins, setInactivityTimeoutMins] = useState<number>(15);
  const [isInactivityWarningOpen, setIsInactivityWarningOpen] = useState<boolean>(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<string>('Today, 08:45 AM');
  const [lastActivityAt, setLastActivityAt] = useState<string>('Just now');

  const [crops, setCrops] = useState<CropRecord[]>(INITIAL_CROPS);
  const [schemes, setSchemes] = useState<GovernmentScheme[]>(INITIAL_SCHEMES);
  const [marketPrices, setMarketPrices] = useState<MarketPriceItem[]>(INITIAL_MARKET_PRICES);
  const [weatherForecast] = useState<WeatherForecastDay[]>(INITIAL_WEATHER_FORECAST);
  const [importantUpdates] = useState<ImportantUpdateItem[]>(INITIAL_IMPORTANT_UPDATES);
  const [subsidies, setSubsidies] = useState<SubsidyApplication[]>(INITIAL_SUBSIDIES);
  const [grievances, setGrievances] = useState<GrievanceTicket[]>(INITIAL_GRIEVANCES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const t = useCallback(
    (key: string): string => {
      return translations[language][key] || translations.en[key] || key;
    },
    [language]
  );

  const showToast = useCallback(
    (title: string, description?: string, variant: ToastMessage['variant'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const setRole = useCallback(
    (newRole: UserRole) => {
      setRoleState(newRole);
      setUser((prev) => ({ ...prev, role: newRole }));
      showToast(
        language === 'ta' ? `பாத்திரம் மாற்றப்பட்டது: ${newRole}` : `Switched active role to ${newRole}`,
        language === 'ta'
          ? 'அதிகார வரம்பு மற்றும் செயல்பாடுகள் புதுப்பிக்கப்பட்டன.'
          : 'Role-based permissions and review actions updated.',
        'info'
      );
    },
    [language, showToast]
  );

  const triggerLoadingDemo = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 900);
  }, []);

  const updateUserProfile = useCallback(
    (updated: Partial<UserProfile>) => {
      setUser((prev) => ({ ...prev, ...updated }));
      showToast(
        language === 'ta' ? 'சுயவிவரம் புதுப்பிக்கப்பட்டது' : 'Farmer Profile Updated',
        language === 'ta' ? 'உழவர் பதிவேடு வெற்றிகரமாக சேமிக்கப்பட்டது.' : 'Your e-Governance farmer record has been saved.'
      );
    },
    [language, showToast]
  );

  const addCrop = useCallback(
    (crop: Omit<CropRecord, 'id' | 'inputLogs' | 'financialProjection' | 'notes'>) => {
      const baseExpensePerAcre = 11500;
      const estRevenuePerQuintal = 2480;
      const totalExp = Math.round(crop.areaAcres * baseExpensePerAcre);
      const totalInc = Math.round(crop.expectedYieldQuintals * estRevenuePerQuintal);

      const newCrop: CropRecord = {
        ...crop,
        id: `crp-${Date.now()}`,
        inputLogs: [
          {
            id: `log-${Date.now()}`,
            date: crop.sowingDate,
            type: 'Fertilizer',
            itemName: 'Basal Organic FYM & Certified Seed Treatment',
            quantity: `${Math.round(crop.areaAcres * 50)} kg`,
            cost: Math.round(totalExp * 0.25),
            notes: `Initial sowing log recorded for ${crop.surveyNumber}.`,
          },
        ],
        financialProjection: [
          { stage: 'Land Prep & Seed', expense: Math.round(totalExp * 0.25), expectedIncome: 0 },
          { stage: 'Vegetative', expense: Math.round(totalExp * 0.55), expectedIncome: Math.round(totalInc * 0.25) },
          { stage: 'Flowering', expense: Math.round(totalExp * 0.8), expectedIncome: Math.round(totalInc * 0.65) },
          { stage: 'Harvest & Sale', expense: totalExp, expectedIncome: totalInc },
        ],
        notes: [
          `Registered ${crop.cropName} (${crop.variety}) on ${crop.sowingDate} under ${crop.season} season.`,
        ],
      };
      setCrops((prev) => [newCrop, ...prev]);
      showToast(
        language === 'ta' ? 'புதிய பயிர் பதிவு செய்யப்பட்டது' : 'Crop Registered in e-Adangal',
        `${crop.cropName} (${crop.areaAcres} Acres · ${crop.surveyNumber})`
      );
    },
    [language, showToast]
  );

  const updateCrop = useCallback(
    (id: string, updated: Partial<CropRecord>) => {
      setCrops((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
      showToast(
        language === 'ta' ? 'பயிர் விவரங்கள் புதுப்பிக்கப்பட்டன' : 'Crop Details Updated',
        'Changes saved to your e-Adangal crop record.'
      );
    },
    [language, showToast]
  );

  const deleteCrop = useCallback(
    (id: string) => {
      setCrops((prev) => prev.filter((c) => c.id !== id));
      showToast(
        language === 'ta' ? 'பயிர் பதிவு நீக்கப்பட்டது' : 'Crop Record Removed',
        undefined,
        'info'
      );
    },
    [language, showToast]
  );

  const addCropInputLog = useCallback(
    (cropId: string, log: Omit<CropInputLog, 'id'>) => {
      const createdLog: CropInputLog = {
        ...log,
        id: `log-${Date.now()}`,
      };
      setCrops((prev) =>
        prev.map((c) => {
          if (c.id !== cropId) return c;
          const updatedProjections = c.financialProjection.map((fp, idx) =>
            idx === c.financialProjection.length - 1
              ? { ...fp, expense: fp.expense + log.cost }
              : fp
          );
          return {
            ...c,
            inputLogs: [createdLog, ...c.inputLogs],
            financialProjection: updatedProjections,
          };
        })
      );
      showToast(
        language === 'ta' ? 'இடுபொருள் பதிவு சேர்க்கப்பட்டது' : 'Input Log Added',
        `${log.type}: ${log.itemName} (₹${log.cost.toLocaleString('en-IN')})`
      );
    },
    [language, showToast]
  );

  const addCropNote = useCallback(
    (cropId: string, note: string) => {
      setCrops((prev) =>
        prev.map((c) =>
          c.id === cropId ? { ...c, notes: [note, ...c.notes] } : c
        )
      );
      showToast(
        language === 'ta' ? 'குறிப்பு சேமிக்கப்பட்டது' : 'Field Note Added',
        'Saved to crop diary.'
      );
    },
    [language, showToast]
  );

  const applyToScheme = useCallback(
    (schemeId: string, landSurveyNo: string, remarks: string, customRefNo?: string): string => {
      const refNo = customRefNo || `TN-SCH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const today = new Date().toISOString().split('T')[0];

      let targetScheme: GovernmentScheme | undefined;
      setSchemes((prev) =>
        prev.map((sch) => {
          if (sch.id === schemeId) {
            targetScheme = sch;
            return {
              ...sch,
              applicationStatus: 'Pending',
              appliedDate: today,
              referenceNo: refNo,
            };
          }
          return sch;
        })
      );

      if (targetScheme) {
        const newSub: SubsidyApplication = {
          id: `sub-${Date.now()}`,
          referenceNo: refNo,
          schemeName: targetScheme.title,
          schemeNameTa: targetScheme.titleTa,
          category:
            targetScheme.category === 'Irrigation'
              ? 'Micro Irrigation'
              : targetScheme.category === 'Loan'
              ? 'Kisan Credit Card Loan'
              : targetScheme.category === 'Insurance'
              ? 'Insurance'
              : 'Seed Subsidy',
          amountRequested: targetScheme.maxSubsidyAmount,
          subsidyComponent: targetScheme.maxSubsidyAmount,
          appliedDate: today,
          status: 'Pending',
          currentStep: 1,
          remarks: `Survey No: ${landSurveyNo}. ${remarks || 'Submitted online via Digital Farmer Portal.'}`,
          bankAccount: user.accountMasked,
        };
        setSubsidies((prev) => [newSub, ...prev]);
      }

      showToast(
        language === 'ta' ? 'திட்ட விண்ணப்பம் சமர்ப்பிக்கப்பட்டது' : 'Scheme Application Submitted',
        `Reference ID: ${refNo}`
      );
      return refNo;
    },
    [language, showToast, user.accountMasked]
  );

  const updateSchemeStatus = useCallback(
    (schemeId: string, status: ApplicationStatus) => {
      setSchemes((prev) =>
        prev.map((sch) => (sch.id === schemeId ? { ...sch, applicationStatus: status } : sch))
      );
      showToast('Scheme Application Updated', `Status set to ${status}`, 'info');
    },
    [showToast]
  );

  const addScheme = useCallback(
    (scheme: Omit<GovernmentScheme, 'id'>): GovernmentScheme => {
      const created: GovernmentScheme = {
        ...scheme,
        id: `sch-${Date.now()}`,
        publicationStatus: scheme.publicationStatus || 'Published',
      };
      setSchemes((prev) => [created, ...prev]);
      showToast(
        'Government Scheme Created',
        `${created.code} (${created.title}) added to portal catalogue.`
      );
      return created;
    },
    [showToast]
  );

  const updateScheme = useCallback(
    (schemeId: string, updated: Partial<GovernmentScheme>) => {
      setSchemes((prev) =>
        prev.map((sch) => (sch.id === schemeId ? { ...sch, ...updated } : sch))
      );
      showToast('Scheme Configuration Saved', 'Updated scheme parameters in catalogue.');
    },
    [showToast]
  );

  const setSchemePublicationStatus = useCallback(
    (schemeId: string, pubStatus: 'Published' | 'Draft' | 'Archived') => {
      setSchemes((prev) =>
        prev.map((sch) =>
          sch.id === schemeId ? { ...sch, publicationStatus: pubStatus } : sch
        )
      );
      showToast(
        `Scheme ${pubStatus}`,
        `Catalogue visibility set to ${pubStatus}.`,
        pubStatus === 'Archived' ? 'warning' : 'success'
      );
    },
    [showToast]
  );

  const addSubsidyApplication = useCallback(
    (sub: Omit<SubsidyApplication, 'id' | 'referenceNo' | 'appliedDate' | 'status' | 'currentStep'>) => {
      const refNo = `TN-SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const today = new Date().toISOString().split('T')[0];
      const created: SubsidyApplication = {
        ...sub,
        id: `sub-${Date.now()}`,
        referenceNo: refNo,
        appliedDate: today,
        status: 'Pending',
        currentStep: 1,
      };
      setSubsidies((prev) => [created, ...prev]);
      showToast(
        language === 'ta' ? 'மானிய விண்ணப்பம் பதிவு செய்யப்பட்டது' : 'Subsidy / Loan Application Filed',
        `Reference No: ${refNo} · Sent to Block Agricultural Officer`
      );
    },
    [language, showToast]
  );

  const updateSubsidyStatus = useCallback(
    (id: string, status: ApplicationStatus, step: number, remarks?: string) => {
      setSubsidies((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status,
                currentStep: step,
                remarks: remarks || s.remarks,
              }
            : s
        )
      );
      showToast(
        language === 'ta' ? 'மானிய நிலை புதுப்பிக்கப்பட்டது' : 'Application Status Updated',
        `Updated to ${status} (Step ${step}/4)`,
        status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'info'
      );
    },
    [language, showToast]
  );

  const addGrievance = useCallback(
    (ticket: Omit<GrievanceTicket, 'id' | 'ticketNo' | 'submittedDate' | 'status' | 'assignedOfficer'>): GrievanceTicket => {
      const randomSeq = String(Math.floor(124 + Math.random() * 870)).padStart(6, '0');
      const ticketNo = `GRV-2026-${randomSeq}`;
      const today = new Date().toISOString().split('T')[0];
      const priority = ticket.priority || 'Medium';
      const slaTotalHours = priority === 'Critical' ? 24 : priority === 'High' ? 48 : 72;

      const defaultOfficerByDept: Record<string, string> = {
        'State Agriculture Dept & AIC': 'Tmt. R. Vijayalakshmi (Block Statistical Inspector)',
        'Horticulture / TANHODA': 'Tmt. M. Kavitha (Assistant Horticulture Officer)',
        'Agricultural Marketing & TNCSC': 'Thiru K. Senthilkumar (TNCSC Regional Quality Inspector)',
        'Co-operative Credit / PACCS': 'Thiru S. Balasubramanian (Deputy Registrar of Co-op Societies)',
        'e-Governance / GRAINS IT Cell': 'Er. P. Karthikeyan (District e-Governance Nodal Engineer)',
        'Revenue / VAO Office': 'Thiru V. Murugesan (Revenue Inspector - Veppanthattai)',
      };

      const assignedOfficer =
        (ticket.department && defaultOfficerByDept[ticket.department]) ||
        'Block Agricultural Officer (Perambalur Nodal Desk)';

      const newTicket: GrievanceTicket = {
        ...ticket,
        id: `grv-${Date.now()}`,
        ticketNo,
        submittedDate: today,
        status: 'Pending',
        workflowStatus: ticket.workflowStatus || 'Open',
        priority,
        slaTotalHours,
        slaHoursElapsed: 1,
        slaBreached: false,
        assignedOfficer,
        attachments: ticket.attachments || [],
        messages:
          ticket.messages && ticket.messages.length > 0
            ? ticket.messages
            : [
                {
                  id: `msg-${Date.now()}`,
                  senderName: user.name,
                  senderRole: 'Farmer',
                  message: ticket.description,
                  timestamp: 'Today, Just now',
                  attachment: ticket.attachments?.[0],
                },
              ],
      };
      setGrievances((prev) => [newTicket, ...prev]);
      showToast(
        `SMS & Email Sent · Ticket ${ticketNo} Registered`,
        ` Confirmation dispatched to ${user.phone} & ${user.email}. SLA: ${slaTotalHours} Hours.`
      );
      return newTicket;
    },
    [showToast, user.email, user.name, user.phone]
  );

  const updateGrievanceStatus = useCallback(
    (id: string, status: ApplicationStatus, resolutionNotes?: string) => {
      const workflowMap: Record<ApplicationStatus, 'Open' | 'In Progress' | 'Resolved' | 'Escalated'> = {
        Pending: 'Open',
        'Under Review': 'In Progress',
        Approved: 'Resolved',
        Rejected: 'Escalated',
      };
      setGrievances((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                status,
                workflowStatus: workflowMap[status],
                resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : g.resolutionNotes,
              }
            : g
        )
      );
      showToast(
        `SMS & Email Alert Dispatched`,
        `Ticket status updated to ${workflowMap[status]} (${status}). Farmer notified via SMS/Email.`,
        'info'
      );
    },
    [showToast]
  );

  const updateGrievance = useCallback(
    (id: string, updated: Partial<GrievanceTicket>) => {
      setGrievances((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updated } : g))
      );
    },
    []
  );

  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
      const created: NotificationItem = {
        ...item,
        id: `ntf-${Date.now()}`,
        timestamp: 'Just now',
        read: false,
      };
      setNotifications((prev) => [created, ...prev]);
    },
    []
  );

  const updateMarketModalPrice = useCallback((id: string, newModalPrice: number) => {
    setMarketPrices((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              previousModalPrice: m.modalPrice,
              modalPrice: newModalPrice,
              maxPrice: Math.max(m.maxPrice, newModalPrice + 60),
              minPrice: Math.min(m.minPrice, newModalPrice - 80),
              updatedAt: 'Just now (Live Tick)',
            }
          : m
      )
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const loginWithOtp = useCallback(
    (mobile: string, aadhaarLast4?: string, selectedRole?: UserRole) => {
      const formattedPhone = mobile.startsWith('+91')
        ? mobile
        : `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
      setUser((prev) => ({
        ...prev,
        phone: formattedPhone,
        ...(aadhaarLast4 ? { aadhaarLast4 } : {}),
        ...(selectedRole ? { role: selectedRole } : {}),
      }));
      if (selectedRole) {
        setRoleState(selectedRole);
      }
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSessionStartedAt(`Today, ${nowTime}`);
      setLastActivityAt('Just now');
      setIsAuthenticated(true);
      setIsInactivityWarningOpen(false);
      setIsLogoutModalOpen(false);
      showToast(
        language === 'ta' ? 'உள்நுழைவு வெற்றி' : 'Authenticated via Mobile OTP',
        `Welcome back, ${user.name}! Active session initialized with 256-bit encryption.`
      );
    },
    [language, showToast, user.name]
  );

  const logout = useCallback(
    (reason?: string) => {
      setIsLogoutModalOpen(false);
      setIsInactivityWarningOpen(false);
      setIsAuthenticated(false);
      showToast(
        reason || (language === 'ta' ? 'வெற்றிகரமாக வெளியேறினீர்கள்' : 'Signed Out Safely'),
        language === 'ta'
          ? 'உழவர் போர்டல் அமர்வு பாதுகாப்பாக முடிந்தது.'
          : 'Your e-Governance session token has been terminated.',
        'info'
      );
    },
    [language, showToast]
  );

  return (
    <PortalContext.Provider
      value={{
        language,
        setLanguage,
        t,
        user,
        updateUserProfile,
        role,
        setRole,
        isAuthenticated,
        loginWithOtp,
        logout,
        isLogoutModalOpen,
        setIsLogoutModalOpen,
        inactivityTimeoutMins,
        setInactivityTimeoutMins,
        isInactivityWarningOpen,
        setIsInactivityWarningOpen,
        sessionStartedAt,
        lastActivityAt,
        crops,
        addCrop,
        updateCrop,
        deleteCrop,
        addCropInputLog,
        addCropNote,
        schemes,
        applyToScheme,
        updateSchemeStatus,
        addScheme,
        updateScheme,
        setSchemePublicationStatus,
        marketPrices,
        weatherForecast,
        importantUpdates,
        subsidies,
        addSubsidyApplication,
        updateSubsidyStatus,
        grievances,
        addGrievance,
        updateGrievanceStatus,
        updateGrievance,
        notifications,
        addNotification,
        markAllNotificationsRead,
        markNotificationRead,
        updateMarketModalPrice,
        isLoading,
        triggerLoadingDemo,
        hasError,
        setHasError,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = (): PortalContextType => {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return ctx;
};
