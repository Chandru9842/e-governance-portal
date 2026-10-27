import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Language,
  UserRole,
  UserProfile,
  CropRecord,
  GovernmentScheme,
  MarketPriceItem,
  WeatherForecastDay,
  SubsidyApplication,
  GrievanceTicket,
  NotificationItem,
  ApplicationStatus,
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

  // Data collections
  crops: CropRecord[];
  addCrop: (crop: Omit<CropRecord, 'id'>) => void;
  deleteCrop: (id: string) => void;

  schemes: GovernmentScheme[];
  applyToScheme: (schemeId: string, landSurveyNo: string, remarks: string) => void;
  updateSchemeStatus: (schemeId: string, status: ApplicationStatus) => void;

  marketPrices: MarketPriceItem[];
  weatherForecast: WeatherForecastDay[];

  subsidies: SubsidyApplication[];
  addSubsidyApplication: (sub: Omit<SubsidyApplication, 'id' | 'referenceNo' | 'appliedDate' | 'status' | 'currentStep'>) => void;
  updateSubsidyStatus: (id: string, status: ApplicationStatus, step: number, remarks?: string) => void;

  grievances: GrievanceTicket[];
  addGrievance: (ticket: Omit<GrievanceTicket, 'id' | 'ticketNo' | 'submittedDate' | 'status' | 'assignedOfficer'>) => void;
  updateGrievanceStatus: (id: string, status: ApplicationStatus, resolutionNotes?: string) => void;

  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;

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

  const [crops, setCrops] = useState<CropRecord[]>(INITIAL_CROPS);
  const [schemes, setSchemes] = useState<GovernmentScheme[]>(INITIAL_SCHEMES);
  const [marketPrices] = useState<MarketPriceItem[]>(INITIAL_MARKET_PRICES);
  const [weatherForecast] = useState<WeatherForecastDay[]>(INITIAL_WEATHER_FORECAST);
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
    (crop: Omit<CropRecord, 'id'>) => {
      const newCrop: CropRecord = {
        ...crop,
        id: `crp-${Date.now()}`,
      };
      setCrops((prev) => [newCrop, ...prev]);
      showToast(
        language === 'ta' ? 'புதிய பயிர் பதிவு செய்யப்பட்டது' : 'Crop Registered in e-Adangal',
        `${crop.cropName} (${crop.areaAcres} Acres · ${crop.surveyNumber})`
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

  const applyToScheme = useCallback(
    (schemeId: string, landSurveyNo: string, remarks: string) => {
      const refNo = `TN-SCH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
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
          category: 'Seed Subsidy',
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
    (ticket: Omit<GrievanceTicket, 'id' | 'ticketNo' | 'submittedDate' | 'status' | 'assignedOfficer'>) => {
      const ticketNo = `GRV-TJV-2026-${Math.floor(4000 + Math.random() * 5000)}`;
      const today = new Date().toISOString().split('T')[0];
      const newTicket: GrievanceTicket = {
        ...ticket,
        id: `grv-${Date.now()}`,
        ticketNo,
        submittedDate: today,
        status: 'Pending',
        assignedOfficer: 'Block Agricultural Officer (Thanjavur Nodal Desk)',
      };
      setGrievances((prev) => [newTicket, ...prev]);
      showToast(
        language === 'ta' ? 'புகார் எண் உருவாக்கப்பட்டது' : 'Grievance Ticket Registered',
        `Ticket ID: ${ticketNo} · SLA Resolution within 7 working days`
      );
    },
    [language, showToast]
  );

  const updateGrievanceStatus = useCallback(
    (id: string, status: ApplicationStatus, resolutionNotes?: string) => {
      setGrievances((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                status,
                resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : g.resolutionNotes,
              }
            : g
        )
      );
      showToast('Grievance Ticket Updated', `Status changed to ${status}`, 'info');
    },
    [showToast]
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

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
        crops,
        addCrop,
        deleteCrop,
        schemes,
        applyToScheme,
        updateSchemeStatus,
        marketPrices,
        weatherForecast,
        subsidies,
        addSubsidyApplication,
        updateSubsidyStatus,
        grievances,
        addGrievance,
        updateGrievanceStatus,
        notifications,
        markAllNotificationsRead,
        markNotificationRead,
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
