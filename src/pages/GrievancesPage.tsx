import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MessageSquareWarning,
  Plus,
  CheckCircle2,
  Clock,
  PhoneCall,
  Search,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import {
  Card,
  StatCard,
  StatusBadge,
  Modal,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

const grievanceSchema = z.object({
  category: z.enum([
    'Crop Insurance (PMFBY)',
    'Subsidy Delay',
    'Fertilizer Availability',
    'Canal Water Release',
    'Procurement Center',
  ]),
  subject: z.string().min(8, 'Subject must be at least 8 characters long'),
  district: z.string().min(2, 'District is required'),
  description: z.string().min(15, 'Please provide complete details (minimum 15 characters)'),
});

type GrievanceFormValues = z.infer<typeof grievanceSchema>;

export const GrievancesPage: React.FC = () => {
  const {
    language,
    user,
    role,
    grievances,
    addGrievance,
    updateGrievanceStatus,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GrievanceFormValues>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: {
      category: 'Procurement Center',
      subject: '',
      district: user.district,
      description: '',
    },
  });

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const filteredGrievances = grievances.filter(
    (g) =>
      g.subject.toLowerCase().includes(search.toLowerCase()) ||
      g.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
      g.category.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (values: GrievanceFormValues) => {
    addGrievance(values);
    reset();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta'
              ? 'விவசாயிகள் குறைதீர்ப்பு மற்றும் புகார் பிரிவு'
              : 'Farmer Grievance Redressal & Helpdesk'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct escalation to District Collectorate Farmers Grievance Day (Vivasayigal Kurai Theerppu Naal) & Nodal Officers
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ta' ? 'புதிய புகார் பதிவு' : 'File Grievance Ticket'}</span>
        </button>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered Tickets"
          value={`${grievances.length} Tickets`}
          subtext="Linked to Uzhavar ID"
          icon={<MessageSquareWarning className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="Resolved & Closed"
          value={`${grievances.filter((g) => g.status === 'Approved').length} Resolved`}
          subtext="Verified by Block Nodal Officer"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Standard SLA Turnaround"
          value="7 Working Days"
          subtext="CM Helpline 1100 Integrated"
          icon={<Clock className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="Toll-Free Kisan Call Center"
          value="1800-180-1551"
          subtext="6:00 AM – 10:00 PM (Tamil / Eng)"
          icon={<PhoneCall className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Grievance Tickets List */}
      <Card>
        <div className="mb-5 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Ticket ID, category, or subject..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
          />
        </div>

        {filteredGrievances.length === 0 ? (
          <EmptyState
            title="No grievance tickets found"
            description="You have no matching complaints or grievances on record."
            actionLabel="File New Grievance"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredGrievances.map((ticket) => (
              <div key={ticket.id} className="py-5 first:pt-0 last:pb-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-800">
                        {ticket.ticketNo}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-orange-700">{ticket.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">Submitted: {ticket.submittedDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ticket.district} District</span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 mt-1">{ticket.subject}</h2>
                  </div>

                  <StatusBadge status={ticket.status} />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{ticket.description}</p>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Assigned Nodal Officer: <span className="font-normal">{ticket.assignedOfficer}</span>
                    </p>
                    {ticket.resolutionNotes && (
                      <p className="text-slate-600 mt-1">
                        <span className="font-semibold text-[#0B4D2E]">Official Action Note:</span>{' '}
                        {ticket.resolutionNotes}
                      </p>
                    )}
                  </div>

                  {(role === 'Officer' || role === 'Admin') && ticket.status !== 'Approved' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateGrievanceStatus(
                            ticket.id,
                            'Approved',
                            `Resolved by ${role} after field verification with DPC / Block office.`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* File Grievance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Farmer Grievance Ticket"
        subtitle="Escalated directly to Block Agricultural Officer & District Nodal Desk"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grievance Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
              >
                <option value="Procurement Center">TNCSC Direct Purchase Centre (DPC)</option>
                <option value="Crop Insurance (PMFBY)">PMFBY Crop Insurance Claim</option>
                <option value="Subsidy Delay">DBT Subsidy Disbursement Delay</option>
                <option value="Fertilizer Availability">PACCS Urea / DAP Fertilizer Stock</option>
                <option value="Canal Water Release">Irrigation Canal / Sluice Maintenance</option>
              </select>
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
              {errors.district && (
                <p className="text-[11px] text-red-600 mt-1">{errors.district.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Complaint Subject *
            </label>
            <input
              type="text"
              placeholder="e.g. Delay in gunny bag allocation at Orathanadu DPC"
              {...register('subject')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
            />
            {errors.subject && (
              <p className="text-[11px] text-red-600 mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description (Include Survey No. / Token No.) *
            </label>
            <textarea
              rows={4}
              placeholder="Provide specific dates, survey numbers, or DPC token numbers for faster resolution..."
              {...register('description')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
            />
            {errors.description && (
              <p className="text-[11px] text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              Submit Grievance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
