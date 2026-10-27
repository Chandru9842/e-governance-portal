import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MessageSquareWarning,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  AlertTriangle,
  ShieldAlert,
  Send,
  Paperclip,
  FileText,
  Star,
  UserCheck,
  Building2,
  MapPin,
  UploadCloud,
  Smartphone,
  Mail,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  BarChart3,
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
import {
  GrievanceTicket,
  GrievanceWorkflowStatus,
  GrievancePriority,
  ApplicationStatus,
} from '../types';
import {
  Card,
  StatCard,
  Modal,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

// ============================================================================
// CONSTANTS & ZOD VALIDATION SCHEMA
// ============================================================================

const GRIEVANCE_CATEGORIES = [
  'Scheme',
  'Subsidy',
  'Market',
  'Loan',
  'Technical',
  'Other',
] as const;

const DEPARTMENTS_BY_CATEGORY: Record<string, string> = {
  Scheme: 'State Agriculture Dept & AIC',
  Subsidy: 'Horticulture / TANHODA',
  Market: 'Agricultural Marketing & TNCSC',
  Loan: 'Co-operative Credit / PACCS',
  Technical: 'e-Governance / GRAINS IT Cell',
  Other: 'Revenue / VAO Office',
};

const NODAL_OFFICERS = [
  'Thiru K. Senthilkumar (TNCSC Regional Quality Inspector)',
  'Tmt. M. Kavitha (Assistant Horticulture Officer)',
  'Tmt. R. Vijayalakshmi (Block Statistical Inspector)',
  'Thiru S. Balasubramanian (Deputy Registrar of Co-op Societies)',
  'Er. P. Karthikeyan (District e-Governance Nodal Engineer)',
  'Thiru V. Murugesan (Revenue Inspector - Veppanthattai)',
  'Dr. A. Rajendran (Joint Director of Agriculture - Perambalur Appellate)',
];

const fileComplaintSchema = z.object({
  category: z.enum(['Scheme', 'Subsidy', 'Market', 'Loan', 'Technical', 'Other']),
  department: z.string().min(3, 'Please select the concerned department'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  subject: z
    .string()
    .min(8, 'Subject must be at least 8 characters long')
    .max(140, 'Subject must be under 140 characters'),
  location: z.string().min(4, 'Please enter village / mandi / block location'),
  description: z
    .string()
    .min(15, 'Please provide detailed description (minimum 15 characters)'),
});

type FileComplaintFormValues = z.infer<typeof fileComplaintSchema>;

interface SmsEmailDispatchLog {
  id: string;
  ticketNo: string;
  channel: 'SMS + Email';
  recipient: string;
  subjectLine: string;
  timestamp: string;
}

// Helper to normalize legacy or new tickets into the 4 workflow statuses
function getTicketWorkflowStatus(ticket: GrievanceTicket): GrievanceWorkflowStatus {
  if (ticket.workflowStatus) return ticket.workflowStatus;
  if (ticket.status === 'Approved') return 'Resolved';
  if (ticket.status === 'Under Review') return 'In Progress';
  if (ticket.status === 'Rejected') return 'Escalated';
  return 'Open';
}

function mapWorkflowToAppStatus(wf: GrievanceWorkflowStatus): ApplicationStatus {
  switch (wf) {
    case 'Open':
      return 'Pending';
    case 'In Progress':
      return 'Under Review';
    case 'Resolved':
      return 'Approved';
    case 'Escalated':
      return 'Under Review';
  }
}

export const GrievancesPage: React.FC = () => {
  const {
    language,
    user,
    role,
    setRole,
    grievances,
    addGrievance,
    updateGrievance,
    addNotification,
    showToast,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState<'All' | GrievanceWorkflowStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | GrievancePriority>('All');
  const [search, setSearch] = useState('');

  // Selected Ticket for Detail & Conversation Thread View
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    grievances[0]?.id || 'grv-501'
  );

  // File Complaint Modal & Attachments State
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [formAttachments, setFormAttachments] = useState<string[]>([
    'Field_Verification_Photo_Oct2026.jpg',
  ]);
  const [uploadError, setUploadError] = useState<string>('');

  // Conversation Thread Reply State
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<string>('');

  // Officer Action Controls State (in Ticket Detail View)
  const [officerRemarkInput, setOfficerRemarkInput] = useState('');

  // Satisfaction Rating & Feedback State (for Resolved Tickets)
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  // Recent SMS / Email Gateway Dispatch Logs
  const [dispatchLogs, setDispatchLogs] = useState<SmsEmailDispatchLog[]>([
    {
      id: 'dsp-1',
      ticketNo: 'GRV-2026-000123',
      channel: 'SMS + Email',
      recipient: `${user.phone} · ${user.email}`,
      subjectLine:
        '[TN-AGRI] Ticket GRV-2026-000123 assigned to Thiru K. Senthilkumar (Status: IN PROGRESS)',
      timestamp: 'Today, 09:42 AM',
    },
  ]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FileComplaintFormValues>({
    resolver: zodResolver(fileComplaintSchema),
    defaultValues: {
      category: 'Market',
      department: 'Agricultural Marketing & TNCSC',
      priority: 'High',
      subject: '',
      location: `${user.village}, ${user.taluk} Taluk, ${user.district}`,
      description: '',
    },
  });

  const watchedCategory = watch('category');
  const watchedPriority = watch('priority');

  // Auto-sync department when category changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value as FileComplaintFormValues['category'];
    setValue('category', cat);
    if (DEPARTMENTS_BY_CATEGORY[cat]) {
      setValue('department', DEPARTMENTS_BY_CATEGORY[cat]);
    }
  };

  // Helper to fire SMS + Email notification toast and log entry
  const triggerSmsEmailAlert = (ticketNo: string, eventSummary: string) => {
    const newLog: SmsEmailDispatchLog = {
      id: `dsp-${Date.now()}`,
      ticketNo,
      channel: 'SMS + Email',
      recipient: `${user.phone} · ${user.email}`,
      subjectLine: `[TN-AGRI HELPDESK] ${ticketNo}: ${eventSummary}`,
      timestamp: 'Just now',
    };
    setDispatchLogs((prev) => [newLog, ...prev.slice(0, 3)]);

    addNotification({
      title: `SMS & Email Alert · ${ticketNo}`,
      titleTa: `குறுஞ்செய்தி & மின்னஞ்சல் · ${ticketNo}`,
      message: `${eventSummary} (Sent to ${user.phone})`,
      messageTa: `${eventSummary} (${user.phone}-க்கு அனுப்பப்பட்டது)`,
      type: 'scheme',
    });

    showToast(
      `SMS & Email Dispatched (${ticketNo})`,
      `Sent to ${user.phone} & ${user.email}: "${eventSummary}"`,
      'info'
    );
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return grievances.filter((g) => {
      const wf = getTicketWorkflowStatus(g);
      const matchesStatus = statusFilter === 'All' || wf === statusFilter;
      const matchesPriority =
        priorityFilter === 'All' || (g.priority || 'Medium') === priorityFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        g.ticketNo.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.department || '').toLowerCase().includes(q) ||
        (g.location || '').toLowerCase().includes(q);
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [grievances, statusFilter, priorityFilter, search]);

  // Currently Selected Ticket
  const selectedTicket = useMemo(() => {
    return (
      grievances.find((g) => g.id === selectedTicketId) ||
      filteredTickets[0] ||
      grievances[0] ||
      null
    );
  }, [grievances, selectedTicketId, filteredTickets]);

  // Officer Analytics Data (Open vs In Progress vs Escalated vs Resolved)
  const statsSummary = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let escalatedCount = 0;
    let breachedCount = 0;

    grievances.forEach((g) => {
      const wf = getTicketWorkflowStatus(g);
      if (wf === 'Open') openCount++;
      else if (wf === 'In Progress') inProgressCount++;
      else if (wf === 'Resolved') resolvedCount++;
      else if (wf === 'Escalated') escalatedCount++;

      if (g.slaBreached && wf !== 'Resolved') breachedCount++;
    });

    const byCategory = GRIEVANCE_CATEGORIES.map((cat) => {
      const matching = grievances.filter((g) => g.category === cat);
      const openOrActive = matching.filter(
        (g) => getTicketWorkflowStatus(g) !== 'Resolved'
      ).length;
      const resolved = matching.filter(
        (g) => getTicketWorkflowStatus(g) === 'Resolved'
      ).length;
      return {
        category: cat,
        Active: openOrActive,
        Resolved: resolved,
      };
    });

    return {
      openCount,
      inProgressCount,
      resolvedCount,
      escalatedCount,
      breachedCount,
      byCategory,
    };
  }, [grievances]);

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------
  const handleFileAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const added: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 5 MB attachment limit.`);
        return;
      }
      added.push(file.name);
    }
    setUploadError('');
    setFormAttachments((prev) => [...prev, ...added]);
  };

  const onSubmitComplaint = (values: FileComplaintFormValues) => {
    const created = addGrievance({
      category: values.category,
      department: values.department,
      priority: values.priority,
      subject: values.subject,
      description: values.description,
      location: values.location,
      district: user.district,
      workflowStatus: 'Open',
      attachments: formAttachments,
    });

    setSelectedTicketId(created.id);
    triggerSmsEmailAlert(
      created.ticketNo,
      `New ${values.priority} priority complaint registered under ${values.department}.`
    );

    reset();
    setFormAttachments(['Field_Verification_Photo_Oct2026.jpg']);
    setIsFileModalOpen(false);
  };

  const handleSendThreadMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    const senderRole: 'Farmer' | 'Officer' =
      role === 'Officer' || role === 'Admin' ? 'Officer' : 'Farmer';
    const senderName =
      senderRole === 'Officer' ? selectedTicket.assignedOfficer : user.name;

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderName,
      senderRole,
      message: replyText.trim(),
      timestamp: 'Today, Just now',
      ...(replyAttachment ? { attachment: replyAttachment } : {}),
    };

    const existingMessages = selectedTicket.messages || [];
    updateGrievance(selectedTicket.id, {
      messages: [...existingMessages, newMsg],
    });

    if (senderRole === 'Officer') {
      triggerSmsEmailAlert(
        selectedTicket.ticketNo,
        `Nodal Officer posted an update on your grievance thread.`
      );
    } else {
      showToast(
        'Reply Posted to Ticket Thread',
        `Your message has been transmitted to ${selectedTicket.assignedOfficer}.`
      );
    }

    setReplyText('');
    setReplyAttachment('');
  };

  const handleEscalateTicket = (ticket: GrievanceTicket) => {
    const appellateOfficer =
      'Dr. A. Rajendran (Joint Director of Agriculture - Perambalur Appellate)';
    const escalationMsg = {
      id: `msg-${Date.now()}`,
      senderName: 'Automated SLA Governance Engine',
      senderRole: 'Officer' as const,
      message: `SLA BREACH ESCALATION: Ticket ${ticket.ticketNo} exceeded the ${
        ticket.slaTotalHours || 72
      }-hour resolution window and has been escalated to ${appellateOfficer} and the District Collectorate Farmers Grievance Redressal Cell.`,
      timestamp: 'Today, Just now',
    };

    updateGrievance(ticket.id, {
      workflowStatus: 'Escalated',
      status: 'Under Review',
      priority: 'Critical',
      assignedOfficer: appellateOfficer,
      resolutionNotes:
        'Escalated to District Appellate Authority due to SLA breach. Priority hearing scheduled.',
      messages: [...(ticket.messages || []), escalationMsg],
    });

    triggerSmsEmailAlert(
      ticket.ticketNo,
      `ESCALATED to Joint Director of Agriculture & District Collectorate due to SLA breach.`
    );
  };

  const handleSimulateSlaBreach = (ticket: GrievanceTicket) => {
    const total = ticket.slaTotalHours || 48;
    updateGrievance(ticket.id, {
      slaBreached: true,
      slaHoursElapsed: total + 14,
    });
    showToast(
      `SLA Timer Breached (${ticket.ticketNo})`,
      `Elapsed time set to ${total + 14}h (Target: ${total}h). Escalation option is now unlocked.`,
      'warning'
    );
  };

  const handleOfficerStatusChange = (
    ticket: GrievanceTicket,
    newWorkflowStatus: GrievanceWorkflowStatus
  ) => {
    const appStatus = mapWorkflowToAppStatus(newWorkflowStatus);
    const noteText =
      officerRemarkInput.trim() ||
      (newWorkflowStatus === 'Resolved'
        ? `Verified and resolved by ${ticket.assignedOfficer}.`
        : `Status updated to ${newWorkflowStatus} by ${role}.`);

    const statusMsg = {
      id: `msg-${Date.now()}`,
      senderName: ticket.assignedOfficer,
      senderRole: 'Officer' as const,
      message: `[STATUS UPDATED TO ${newWorkflowStatus.toUpperCase()}] ${noteText}`,
      timestamp: 'Today, Just now',
    };

    updateGrievance(ticket.id, {
      workflowStatus: newWorkflowStatus,
      status: appStatus,
      slaBreached: newWorkflowStatus === 'Resolved' ? false : ticket.slaBreached,
      resolutionNotes: noteText,
      messages: [...(ticket.messages || []), statusMsg],
    });

    setOfficerRemarkInput('');
    triggerSmsEmailAlert(
      ticket.ticketNo,
      `Status changed to ${newWorkflowStatus.toUpperCase()}. Note: ${noteText.slice(0, 60)}`
    );
  };

  const handleOfficerAssignChange = (ticket: GrievanceTicket, newOfficer: string) => {
    const assignMsg = {
      id: `msg-${Date.now()}`,
      senderName: 'District Nodal Helpdesk',
      senderRole: 'Officer' as const,
      message: `Ticket reassigned to ${newOfficer} for field action.`,
      timestamp: 'Today, Just now',
    };

    updateGrievance(ticket.id, {
      assignedOfficer: newOfficer,
      workflowStatus:
        getTicketWorkflowStatus(ticket) === 'Open'
          ? 'In Progress'
          : getTicketWorkflowStatus(ticket),
      status:
        getTicketWorkflowStatus(ticket) === 'Open' ? 'Under Review' : ticket.status,
      messages: [...(ticket.messages || []), assignMsg],
    });

    triggerSmsEmailAlert(ticket.ticketNo, `Assigned to Nodal Officer: ${newOfficer}`);
  };

  const handleSubmitSatisfaction = (ticket: GrievanceTicket) => {
    updateGrievance(ticket.id, {
      satisfactionRating: ratingInput,
      satisfactionFeedback:
        feedbackInput.trim() || 'Satisfied with the resolution provided by the department.',
    });
    showToast(
      language === 'ta' ? 'கருத்து பதிவு செய்யப்பட்டது' : 'Farmer Feedback Recorded',
      `Thank you! Your ${ratingInput}/5 star rating for ${ticket.ticketNo} has been logged.`
    );
  };

  // UI Helpers for Workflow Status & Priority Badges
  const renderWorkflowBadge = (wf: GrievanceWorkflowStatus) => {
    const styles: Record<GrievanceWorkflowStatus, string> = {
      Open: 'bg-amber-50 text-amber-800 border-amber-200',
      'In Progress': 'bg-sky-50 text-sky-800 border-sky-200',
      Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Escalated: 'bg-red-50 text-red-800 border-red-200',
    };
    const dotColors: Record<GrievanceWorkflowStatus, string> = {
      Open: 'bg-amber-500',
      'In Progress': 'bg-sky-500',
      Resolved: 'bg-emerald-500',
      Escalated: 'bg-red-500',
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[wf]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[wf]}`} />
        {wf}
      </span>
    );
  };

  const renderPriorityBadge = (priority: GrievancePriority = 'Medium') => {
    const styles: Record<GrievancePriority, string> = {
      Critical: 'bg-red-100 text-red-900 border-red-300',
      High: 'bg-orange-50 text-orange-800 border-orange-200',
      Medium: 'bg-slate-100 text-slate-700 border-slate-200',
      Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${styles[priority]}`}
      >
        {priority} Priority
      </span>
    );
  };

  const renderSlaBadge = (ticket: GrievanceTicket) => {
    const wf = getTicketWorkflowStatus(ticket);
    const total = ticket.slaTotalHours || 72;
    const elapsed = ticket.slaHoursElapsed || 12;

    if (wf === 'Resolved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 tabular-nums">
          <CheckCircle2 className="w-3 h-3" />
          Closed in {elapsed}h (SLA: {total}h)
        </span>
      );
    }

    if (ticket.slaBreached || elapsed > total) {
      const overdue = Math.max(1, elapsed - total);
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 tabular-nums">
          <AlertTriangle className="w-3 h-3" />
          SLA Breached (+{overdue}h overdue)
        </span>
      );
    }

    const remaining = Math.max(1, total - elapsed);
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200 tabular-nums">
        <Clock className="w-3 h-3" />
        SLA Timer: {remaining}h left (of {total}h)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Role View Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta'
              ? 'விவசாயிகள் குறைதீர்ப்பு மற்றும் புகார் மேலாண்மை'
              : 'Complaints & Grievance Redressal Portal'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SLA-tracked grievance resolution with live Officer-Farmer conversation threads, Collectorate escalation & SMS/Email alerts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Role View Switcher so user can test Farmer vs Officer View effortlessly */}
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setRole('Farmer')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                role === 'Farmer'
                  ? 'bg-[#0B4D2E] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Farmer View
            </button>
            <button
              type="button"
              onClick={() => setRole('Officer')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                role === 'Officer' || role === 'Admin'
                  ? 'bg-[#0B4D2E] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Officer Desk View
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFileModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ta' ? 'புதிய புகார் பதிவு' : 'File New Complaint'}</span>
          </button>
        </div>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open & In-Progress"
          value={`${statsSummary.openCount + statsSummary.inProgressCount} Active`}
          subtext={`${statsSummary.openCount} Open · ${statsSummary.inProgressCount} In Progress`}
          icon={<MessageSquareWarning className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="Resolved & Closed"
          value={`${statsSummary.resolvedCount} Resolved`}
          subtext="Verified with Farmer Feedback"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Escalated / SLA Breach"
          value={`${statsSummary.escalatedCount + statsSummary.breachedCount} Priority`}
          subtext="Appellate Authority Monitored"
          icon={<ShieldAlert className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="SLA Resolution Target"
          value="24h – 72h"
          subtext="SMS & Email Alerts Enabled"
          icon={<Clock className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Recent SMS / Email Notification Dispatch Feed */}
      <div className="rounded-xl bg-slate-900 text-white px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                SMS & Email Notification Gateway
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({dispatchLogs[0]?.timestamp})
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-0.5 font-mono">
              {dispatchLogs[0]?.subjectLine}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300 shrink-0">
          <Mail className="w-3.5 h-3.5 text-emerald-400" />
          <span>Recipient: {user.phone}</span>
        </div>
      </div>

      {/* Role-Based Officer Dashboard (Open vs Resolved Analytics Chart) */}
      {(role === 'Officer' || role === 'Admin') && (
        <Card
          title="Nodal Officer Command Dashboard — Open vs. Resolved Grievance Workload"
          subtitle="Department-wise ticket distribution, SLA breach monitoring, and resolution metrics"
          action={
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-[#0B4D2E] border border-emerald-200">
              <BarChart3 className="w-3.5 h-3.5" />
              Active Role: {role}
            </span>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <p className="text-xs text-amber-800 font-semibold">Open (Unassigned/New)</p>
                <p className="text-2xl font-bold text-amber-950 tabular-nums mt-1">
                  {statsSummary.openCount}
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">Requires initial review</p>
              </div>
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200">
                <p className="text-xs text-sky-800 font-semibold">In Progress (Field Check)</p>
                <p className="text-2xl font-bold text-sky-950 tabular-nums mt-1">
                  {statsSummary.inProgressCount}
                </p>
                <p className="text-[11px] text-sky-700 mt-0.5">Assigned to Block Officers</p>
              </div>
              <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200">
                <p className="text-xs text-red-800 font-semibold">Escalated / SLA Breached</p>
                <p className="text-2xl font-bold text-red-950 tabular-nums mt-1">
                  {statsSummary.escalatedCount}
                </p>
                <p className="text-[11px] text-red-700 mt-0.5">Appellate Joint Director Desk</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <p className="text-xs text-emerald-800 font-semibold">Resolved & Closed</p>
                <p className="text-2xl font-bold text-emerald-950 tabular-nums mt-1">
                  {statsSummary.resolvedCount}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Avg Rating: 4.9 / 5.0 ★</p>
              </div>
            </div>

            <div className="lg:col-span-7 h-56 bg-slate-50/60 rounded-xl border border-slate-200/80 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statsSummary.byCategory}
                  margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="Active"
                    name="Open / In Progress / Escalated"
                    fill="#d97706"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Resolved"
                    name="Resolved"
                    fill="#1E8E4F"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}

      {/* Main Split View: Left "My Complaints" List (5 cols) + Right Ticket Detail & Conversation Thread (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: MY COMPLAINTS LIST & FILTERS */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title={
              language === 'ta'
                ? `புகார் பட்டியல் (${filteredTickets.length})`
                : `My Complaints (${filteredTickets.length})`
            }
            subtitle="Filter by workflow status or priority and select a ticket to open its conversation thread"
          >
            {/* Status Filter Bar: All, Open, In Progress, Resolved, Escalated */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {(['All', 'Open', 'In Progress', 'Resolved', 'Escalated'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#0B4D2E] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            {/* Search & Priority Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="sm:col-span-2 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ID, category, subject..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
                />
              </div>
              <div className="relative">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as 'All' | GrievancePriority)
                  }
                  className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#0B4D2E]"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Ticket Cards List */}
            {filteredTickets.length === 0 ? (
              <EmptyState
                title="No matching complaints"
                description="Try clearing your status filter or register a new grievance ticket."
                actionLabel="File New Complaint"
                onAction={() => setIsFileModalOpen(true)}
              />
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => {
                  const wf = getTicketWorkflowStatus(ticket);
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'border-[#0B4D2E] bg-emerald-50/40 shadow-xs ring-1 ring-[#0B4D2E]/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#0B4D2E]">
                          {ticket.ticketNo}
                        </span>
                        {renderWorkflowBadge(wf)}
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {ticket.subject}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{ticket.category}</span>
                        <span>·</span>
                        <span>{ticket.department || 'State Agriculture Dept'}</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        {renderPriorityBadge(ticket.priority)}
                        {renderSlaBadge(ticket)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: TICKET DETAIL VIEW, CONVERSATION THREAD, ESCALATION, FEEDBACK & OFFICER DESK */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTicket ? (
            <Card
              title={`Ticket Detail · ${selectedTicket.ticketNo}`}
              subtitle={`${selectedTicket.category} · ${
                selectedTicket.department || 'State Agriculture Dept'
              } · Filed on ${selectedTicket.submittedDate}`}
              action={renderWorkflowBadge(getTicketWorkflowStatus(selectedTicket))}
            >
              <div className="space-y-5">
                {/* 1. Ticket Overview & SLA Timer Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderPriorityBadge(selectedTicket.priority)}
                      {renderSlaBadge(selectedTicket)}
                    </div>

                    {/* Button to test SLA breach on open tickets */}
                    {!selectedTicket.slaBreached &&
                      getTicketWorkflowStatus(selectedTicket) !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => handleSimulateSlaBreach(selectedTicket)}
                          className="text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded border border-amber-300 cursor-pointer"
                        >
                          Simulate SLA Breach
                        </button>
                      )}
                  </div>

                  <h2 className="text-base font-bold text-slate-900">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedTicket.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0B4D2E] shrink-0" />
                      <span>
                        <strong className="text-slate-800">Location:</strong>{' '}
                        {selectedTicket.location || `${selectedTicket.district} District`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#0B4D2E] shrink-0" />
                      <span>
                        <strong className="text-slate-800">Assigned Officer:</strong>{' '}
                        {selectedTicket.assignedOfficer}
                      </span>
                    </div>
                  </div>

                  {/* Attachments */}
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                        Attached Photos & Supporting Documents:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTicket.attachments.map((att) => (
                          <span
                            key={att}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-700"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#0B4D2E]" />
                            {att}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SLA Breach Escalation Banner (When SLA is Breached & Not Resolved) */}
                {selectedTicket.slaBreached &&
                  getTicketWorkflowStatus(selectedTicket) !== 'Resolved' && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>
                            SLA Resolution Window Breached ({selectedTicket.slaHoursElapsed}h elapsed
                            vs {selectedTicket.slaTotalHours}h SLA)
                          </span>
                        </div>
                        <p className="text-xs text-red-700">
                          {getTicketWorkflowStatus(selectedTicket) === 'Escalated'
                            ? 'This ticket is currently escalated to the District Appellate Officer & Collectorate Grievance Cell.'
                            : 'You can immediately escalate this complaint to the Joint Director of Agriculture / District Collectorate.'}
                        </p>
                      </div>

                      {getTicketWorkflowStatus(selectedTicket) !== 'Escalated' && (
                        <button
                          type="button"
                          onClick={() => handleEscalateTicket(selectedTicket)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
                        >
                          <span>Escalate to Appellate Officer</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                {/* 3. Role-Based Officer Action Panel (Assign Officer, Update Status, Add Official Remarks) */}
                {(role === 'Officer' || role === 'Admin') && (
                  <div className="p-4 rounded-xl bg-emerald-950 text-white space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        Nodal Officer Action Desk ({role})
                      </span>
                      <span className="text-[11px] text-emerald-200">
                        Updates trigger instant SMS/Email to Farmer
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-200 mb-1">
                          Assign / Reassign Nodal Officer
                        </label>
                        <select
                          value={selectedTicket.assignedOfficer}
                          onChange={(e) =>
                            handleOfficerAssignChange(selectedTicket, e.target.value)
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg bg-white text-slate-900 focus:outline-none"
                        >
                          {NODAL_OFFICERS.map((off) => (
                            <option key={off} value={off}>
                              {off}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-200 mb-1">
                          Official Resolution / Inspection Note
                        </label>
                        <input
                          type="text"
                          value={officerRemarkInput}
                          onChange={(e) => setOfficerRemarkInput(e.target.value)}
                          placeholder="Enter field verification or DPC token note..."
                          className="w-full px-3 py-2 text-xs rounded-lg bg-white text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-emerald-200 mr-1">Set Status:</span>
                      {(['Open', 'In Progress', 'Resolved', 'Escalated'] as const).map(
                        (st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleOfficerStatusChange(selectedTicket, st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              getTicketWorkflowStatus(selectedTicket) === st
                                ? 'bg-emerald-400 text-slate-950'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            Mark {st}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Two-Way Conversation Thread (Farmer <-> Nodal Officer) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Ticket Conversation Thread ({(selectedTicket.messages || []).length}{' '}
                      Messages)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Posting as:{' '}
                      <strong className="text-[#0B4D2E]">
                        {role === 'Farmer' ? `${user.name} (Farmer)` : `${selectedTicket.assignedOfficer}`}
                      </strong>
                    </span>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    {(selectedTicket.messages || []).map((msg) => {
                      const isOfficer = msg.senderRole === 'Officer';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isOfficer ? 'items-start' : 'items-end'
                          }`}
                        >
                          <div
                            className={`max-w-[88%] rounded-xl p-3 text-xs space-y-1.5 ${
                              isOfficer
                                ? 'bg-white border border-slate-200 text-slate-800'
                                : 'bg-[#0B4D2E] text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <span
                                className={`font-bold ${
                                  isOfficer ? 'text-[#0B4D2E]' : 'text-emerald-200'
                                }`}
                              >
                                {msg.senderName}
                              </span>
                              <span
                                className={`text-[10px] font-mono ${
                                  isOfficer ? 'text-slate-400' : 'text-emerald-200/80'
                                }`}
                              >
                                {msg.timestamp}
                              </span>
                            </div>
                            <p className="leading-relaxed">{msg.message}</p>
                            {msg.attachment && (
                              <div
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                                  isOfficer
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-white/15 text-white'
                                }`}
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>{msg.attachment}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Composer */}
                  <form onSubmit={handleSendThreadMessage} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={
                          role === 'Farmer'
                            ? 'Write a reply or provide additional survey/token details to the Nodal Officer...'
                            : 'Post an official officer response to the farmer...'
                        }
                        className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                      />
                      <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
                        <Paperclip className="w-3.5 h-3.5 text-[#0B4D2E]" />
                        <span className="hidden sm:inline">Attach</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setReplyAttachment(f.name);
                          }}
                        />
                      </label>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                    {replyAttachment && (
                      <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-mono">
                        <Paperclip className="w-3 h-3" />
                        <span>Attached: {replyAttachment}</span>
                        <button
                          type="button"
                          onClick={() => setReplyAttachment('')}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                {/* 5. Post-Resolution Satisfaction Rating & Feedback */}
                {getTicketWorkflowStatus(selectedTicket) === 'Resolved' && (
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-emerald-950">
                          Post-Resolution Farmer Satisfaction Rating & Feedback
                        </h3>
                        <p className="text-[11px] text-emerald-800">
                          Rate the quality and speed of resolution by {selectedTicket.assignedOfficer}
                        </p>
                      </div>
                      {selectedTicket.satisfactionRating && (
                        <span className="px-2.5 py-1 rounded bg-emerald-700 text-white text-xs font-bold">
                          Rated {selectedTicket.satisfactionRating} / 5 ★
                        </span>
                      )}
                    </div>

                    {selectedTicket.satisfactionRating ? (
                      <div className="p-3 rounded-lg bg-white border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (selectedTicket.satisfactionRating || 5)
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-slate-700 italic">
                          "{selectedTicket.satisfactionFeedback}"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-900">
                            Select Rating:
                          </span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingInput(star)}
                              className="p-1 cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= ratingInput
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-emerald-900">
                            ({ratingInput} / 5 Stars)
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={feedbackInput}
                            onChange={(e) => setFeedbackInput(e.target.value)}
                            placeholder="Share your feedback on how the officer resolved your issue..."
                            className="flex-1 px-3 py-2 text-xs rounded-lg border border-emerald-300 bg-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSubmitSatisfaction(selectedTicket)}
                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer shrink-0"
                          >
                            Submit Feedback
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {/* ====================================================================
          FILE NEW COMPLAINT MODAL (React Hook Form + Zod)
      ==================================================================== */}
      <Modal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        title="File New Farmer Grievance / Complaint"
        subtitle="Auto-generates an SLA-tracked ticket ID (GRV-2026-XXXXXX) with instant SMS/Email confirmation"
      >
        <form onSubmit={handleSubmit(onSubmitComplaint)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Complaint Category *
              </label>
              <select
                {...register('category')}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
              >
                <option value="Scheme">Scheme (PM-KISAN / PMFBY Insurance)</option>
                <option value="Subsidy">Subsidy (Drip / Machinery / Input DBT)</option>
                <option value="Market">Market (DPC Procurement / Mandi Weighing)</option>
                <option value="Loan">Loan (PACCS KCC / Bank Subvention)</option>
                <option value="Technical">Technical (Portal / e-Adangal Sync Issue)</option>
                <option value="Other">Other Agricultural Grievance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Concerned Department *
              </label>
              <select
                {...register('department')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
              >
                <option value="Agricultural Marketing & TNCSC">
                  Agricultural Marketing & TNCSC
                </option>
                <option value="State Agriculture Dept & AIC">
                  State Agriculture Dept & AIC
                </option>
                <option value="Horticulture / TANHODA">Horticulture / TANHODA</option>
                <option value="Co-operative Credit / PACCS">
                  Co-operative Credit / PACCS
                </option>
                <option value="e-Governance / GRAINS IT Cell">
                  e-Governance / GRAINS IT Cell
                </option>
                <option value="Revenue / VAO Office">Revenue / VAO Office</option>
              </select>
              {errors.department && (
                <p className="text-[11px] text-red-600 mt-1">{errors.department.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Urgency / Priority Level *
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
              >
                <option value="Critical">Critical (24-Hour SLA Target)</option>
                <option value="High">High (48-Hour SLA Target)</option>
                <option value="Medium">Medium (72-Hour SLA Target)</option>
                <option value="Low">Low (72-Hour Standard SLA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Village / Mandi / Location *
              </label>
              <input
                type="text"
                {...register('location')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.location && (
                <p className="text-[11px] text-red-600 mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* SLA Preview Banner */}
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <span>
              Selected Category: <strong>{watchedCategory}</strong> · Priority:{' '}
              <strong>{watchedPriority}</strong>
            </span>
            <span className="font-mono font-bold">
              SLA Timer:{' '}
              {watchedPriority === 'Critical'
                ? '24 Hours'
                : watchedPriority === 'High'
                ? '48 Hours'
                : '72 Hours'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              5. Complaint Subject *
            </label>
            <input
              type="text"
              placeholder="e.g., Delay in gunny bag allotment or drip work order approval"
              {...register('subject')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
            />
            {errors.subject && (
              <p className="text-[11px] text-red-600 mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              6. Detailed Description (Include Survey No. / Application ID / Token No.) *
            </label>
            <textarea
              rows={3}
              placeholder="Describe the issue clearly with relevant dates, survey numbers, or reference IDs..."
              {...register('description')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
            />
            {errors.description && (
              <p className="text-[11px] text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Photo / Document Attachments */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              7. Photo / Document Attachments (Optional, PDF/JPG &le; 5MB)
            </label>
            <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
              <UploadCloud className="w-5 h-5 text-[#0B4D2E] mb-1" />
              <span className="text-xs font-semibold text-slate-700">
                Click to attach field photos, receipts, or e-Adangal copy
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileAttachmentChange}
                className="hidden"
              />
            </label>

            {uploadError && <p className="text-[11px] text-red-600">{uploadError}</p>}

            {formAttachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formAttachments.map((file, idx) => (
                  <span
                    key={`${file}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700"
                  >
                    <FileText className="w-3 h-3 text-[#0B4D2E]" />
                    <span>{file}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormAttachments((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsFileModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              Register Complaint & Generate Ticket ID
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
