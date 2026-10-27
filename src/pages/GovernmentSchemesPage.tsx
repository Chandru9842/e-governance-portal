import React, { useState } from 'react';
import {
  Landmark,
  CheckCircle2,
  Search,
  Sparkles,
  FileCheck2,
  ArrowLeft,
  PhoneCall,
  Mail,
  Clock,
  Calendar,
  HelpCircle,
  UploadCloud,
  FileText,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { GovernmentScheme, SchemeCategory } from '../types';
import {
  Card,
  StatCard,
  StatusBadge,
  Stepper,
  Modal,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

interface UploadedDocItem {
  name: string;
  sizeBytes: number;
  type: string;
}

export const GovernmentSchemesPage: React.FC = () => {
  const {
    language,
    user,
    role,
    crops,
    schemes,
    applyToScheme,
    updateSchemeStatus,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  // Catalogue Filters & Sorting
  const [categoryFilter, setCategoryFilter] = useState<'All' | SchemeCategory>('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'benefitDesc' | 'deadlineAsc' | 'nameAsc'>('benefitDesc');

  // Detail View state
  const [detailSchemeId, setDetailSchemeId] = useState<string | null>(null);

  // Interactive Eligibility Checker state
  const [showEligibilityChecker, setShowEligibilityChecker] = useState(false);
  const [eligLandSize, setEligLandSize] = useState<string>(String(user.totalLandAcres));
  const [eligCrop, setEligCrop] = useState<string>('Paddy');
  const [eligFarmerCategory, setEligFarmerCategory] = useState<
    'Small / Marginal' | 'Medium' | 'All Farmers'
  >('Small / Marginal');

  // 4-Step Apply Wizard Modal state
  const [applyingScheme, setApplyingScheme] = useState<GovernmentScheme | null>(null);
  const [applyStep, setApplyStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string>('');
  const [submittedRefNo, setSubmittedRefNo] = useState<string | null>(null);

  // Step 1: Personal Details (Auto-filled from profile)
  const [personalForm, setPersonalForm] = useState({
    fullName: user.name,
    farmerId: user.farmerId,
    phone: user.phone,
    district: user.district,
    taluk: user.taluk,
    village: user.village,
    aadhaarLast4: user.aadhaarLast4,
    bankAccount: user.accountMasked,
  });

  // Step 2: Land & Crop Details
  const [landCropForm, setLandCropForm] = useState({
    surveyNumber: crops[0]?.surveyNumber || 'SF-142/2A',
    landAreaAcres: String(crops[0]?.areaAcres || 3.0),
    selectedCrop: crops[0]?.cropName || 'Paddy (ADT-43 / Ponni)',
    irrigationType: crops[0]?.irrigationType || 'Canal',
    remarks: 'Applying online via Digital Farmer Portal for 2026-27 season.',
  });

  // Step 3: Document Upload (Drag-and-drop with type & size validation)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocItem[]>([
    {
      name: 'Patta_Chitta_eAdangal_SF142_2A.pdf',
      sizeBytes: 428 * 1024,
      type: 'application/pdf',
    },
  ]);
  const [isDragging, setIsDragging] = useState(false);

  // Step 4: Consent
  const [declarationChecked, setDeclarationChecked] = useState(true);

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const detailScheme = schemes.find((s) => s.id === detailSchemeId) || null;

  const categories: ('All' | SchemeCategory)[] = [
    'All',
    'Income Support',
    'Insurance',
    'Irrigation',
    'Subsidy',
    'Loan',
  ];

  // Compute Eligibility Match Percentage for a given scheme
  const computeMatchPercentage = (scheme: GovernmentScheme): number => {
    const landNum = parseFloat(eligLandSize) || 0;
    let score = 40; // Base score for registered Tamil Nadu farmer

    // Land size check (up to +30%)
    if (landNum >= scheme.minLandAcres && landNum <= scheme.maxLandAcres) {
      score += 30;
    } else if (landNum > 0) {
      score += 15;
    }

    // Crop check (up to +15%)
    if (
      scheme.eligibleCrops.includes('All Crops') ||
      scheme.eligibleCrops.some((c) => c.toLowerCase().includes(eligCrop.toLowerCase()))
    ) {
      score += 15;
    }

    // Category check (up to +15%)
    if (
      scheme.farmerCategories.includes('All Farmers') ||
      scheme.farmerCategories.includes(eligFarmerCategory)
    ) {
      score += 15;
    }

    return Math.min(100, score);
  };

  const filteredSchemes = schemes
    .filter((s) => {
      const matchesCat = categoryFilter === 'All' || s.category === categoryFilter;
      const matchesSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.titleTa.includes(search) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.shortDescription.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'benefitDesc') return b.maxSubsidyAmount - a.maxSubsidyAmount;
      if (sortBy === 'deadlineAsc') return a.deadline.localeCompare(b.deadline);
      return a.title.localeCompare(b.title);
    });

  const openApplyWizard = (scheme: GovernmentScheme) => {
    setApplyingScheme(scheme);
    setApplyStep(1);
    setStepError('');
    setSubmittedRefNo(null);
    setPersonalForm({
      fullName: user.name,
      farmerId: user.farmerId,
      phone: user.phone,
      district: user.district,
      taluk: user.taluk,
      village: user.village,
      aadhaarLast4: user.aadhaarLast4,
      bankAccount: user.accountMasked,
    });
  };

  const handleFileValidationAndAdd = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setStepError('');
    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxBytes = 5 * 1024 * 1024; // 5 MB

    const nextDocs: UploadedDocItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedMime.includes(file.type)) {
        setStepError(`Invalid file type "${file.name}". Only PDF, JPG, or PNG files are permitted.`);
        return;
      }
      if (file.size > maxBytes) {
        setStepError(`File "${file.name}" exceeds the 5 MB maximum size limit.`);
        return;
      }
      nextDocs.push({
        name: file.name,
        sizeBytes: file.size,
        type: file.type,
      });
    }
    setUploadedDocs((prev) => [...prev, ...nextDocs]);
  };

  const handleFinalSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingScheme) return;
    if (!declarationChecked) {
      setStepError('Please confirm the self-declaration checkbox to submit.');
      return;
    }
    const generatedId = `TN-${applyingScheme.category.slice(0, 3).toUpperCase()}-2026-${Math.floor(
      10000 + Math.random() * 90000
    )}`;
    applyToScheme(
      applyingScheme.id,
      landCropForm.surveyNumber,
      `${landCropForm.selectedCrop} (${landCropForm.landAreaAcres} Acres). ${landCropForm.remarks}`,
      generatedId
    );
    setSubmittedRefNo(generatedId);
  };

  // Generate a valid single-page PDF file blob and trigger browser download
  const handleDownloadAcknowledgementPdf = () => {
    if (!applyingScheme || !submittedRefNo) return;

    const lines = [
      'GOVERNMENT OF TAMIL NADU - DIGITAL FARMER E-GOVERNANCE PORTAL',
      'OFFICIAL SCHEME APPLICATION ACKNOWLEDGEMENT RECEIPT',
      '------------------------------------------------------------',
      `Application Reference ID : ${submittedRefNo}`,
      `Submission Date          : ${new Date().toISOString().split('T')[0]}`,
      `Scheme Name              : ${applyingScheme.title}`,
      `Scheme Code / Category   : ${applyingScheme.code} (${applyingScheme.category})`,
      `Max Eligible Benefit     : Rs. ${applyingScheme.maxSubsidyAmount.toLocaleString('en-IN')}`,
      '------------------------------------------------------------',
      `Applicant Farmer Name    : ${personalForm.fullName}`,
      `Uzhavar Farmer ID        : ${personalForm.farmerId}`,
      `Location                 : ${personalForm.village}, ${personalForm.taluk}, ${personalForm.district}`,
      `Land Survey No. & Area   : ${landCropForm.surveyNumber} (${landCropForm.landAreaAcres} Acres)`,
      `Selected Crop            : ${landCropForm.selectedCrop}`,
      `DBT Linked Bank Account  : ${personalForm.bankAccount}`,
      `Uploaded Documents       : ${uploadedDocs.map((d) => d.name).join(', ')}`,
      '------------------------------------------------------------',
      `Official Helpline        : ${applyingScheme.helpline.phone}`,
      'Status: PENDING BLOCK AGRICULTURAL OFFICER VERIFICATION',
    ];

    // Build minimal valid PDF 1.4 document containing the receipt text
    const escapedLines = lines
      .map(
        (line, idx) =>
          `1 0 0 1 45 ${750 - idx * 22} Tm (${line.replace(/[()\\]/g, '')}) Tj`
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
    link.download = `Acknowledgement_${submittedRefNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // SCHEME DETAIL PAGE VIEW
  // ============================================================================
  if (detailScheme) {
    return (
      <div className="space-y-6">
        {/* Top Back Button & Primary Apply CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDetailSchemeId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Schemes Catalogue</span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-purple-700">
                  {detailScheme.code}
                </span>
                <span aria-hidden="true">·</span>
                <span>{detailScheme.category}</span>
                <span aria-hidden="true">·</span>
                <span>{detailScheme.department}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                {language === 'ta' ? detailScheme.titleTa : detailScheme.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {detailScheme.applicationStatus && (
              <StatusBadge status={detailScheme.applicationStatus} />
            )}
            <button
              type="button"
              onClick={() => openApplyWizard(detailScheme)}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap"
            >
              {detailScheme.applicationStatus ? 'Re-Apply / New Plot' : 'Apply Online (4-Step Flow)'}
            </button>
          </div>
        </div>

        {/* Overview & Benefits Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Scheme Overview & Objective">
              <p className="text-xs text-slate-700 leading-relaxed">{detailScheme.overview}</p>
              <div className="mt-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-900">
                    Key Financial / Subsidy Benefit
                  </p>
                  <p className="text-sm font-bold text-[#0B4D2E] mt-0.5">
                    {language === 'ta' ? detailScheme.benefitSummaryTa : detailScheme.benefitSummary}
                  </p>
                </div>
                <span className="text-lg font-bold text-[#0B4D2E] tabular-nums shrink-0">
                  Up to ₹{detailScheme.maxSubsidyAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </Card>

            <Card title="Core Benefits & Features">
              <ul className="space-y-2.5 text-xs text-slate-700">
                {detailScheme.benefitsList.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1E8E4F] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Eligibility Criteria">
                <ul className="space-y-2 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
                  {detailScheme.eligibility.map((el, i) => (
                    <li key={i}>{el}</li>
                  ))}
                </ul>
              </Card>

              <Card title="Required Documents">
                <ul className="space-y-2 text-xs text-slate-700">
                  {detailScheme.requiredDocuments.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card title="Step-by-Step Application Process">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {detailScheme.applicationProcess.map((proc, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#0B4D2E] text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {index + 1}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{proc}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Frequently Asked Questions (FAQs)">
              <div className="divide-y divide-slate-100">
                {detailScheme.faqs.map((faq, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#0B4D2E] shrink-0" />
                      <span>{faq.question}</span>
                    </p>
                    <p className="text-xs text-slate-600 pl-5 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Sidebar: Important Dates + Official Helpline */}
          <div className="space-y-6">
            <Card title="Important Dates & Deadlines">
              <div className="space-y-3">
                {detailScheme.importantDates.map((d, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-700" />
                      <span>{d.label}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {d.date}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Official Scheme Helpline"
              subtitle="Direct Farmer Support & Nodal Escalation"
            >
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-[#0B4D2E] font-bold">
                    <PhoneCall className="w-4 h-4" />
                    <span className="tabular-nums">{detailScheme.helpline.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="font-mono">{detailScheme.helpline.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>{detailScheme.helpline.officeHours}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN SCHEME CATALOGUE + ELIGIBILITY CHECKER VIEW
  // ============================================================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta'
              ? 'மத்திய மற்றும் மாநில அரசு வேளாண் திட்டங்கள்'
              : 'Government Agricultural Welfare Schemes'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Explore PM-KISAN, PMFBY Crop Insurance, PMKSY Irrigation, Fertilizer Subsidy, and Kisan Credit Card programs
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowEligibilityChecker((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-purple-700 text-white hover:bg-purple-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>
            {showEligibilityChecker ? 'Hide Eligibility Checker' : 'Check Scheme Eligibility'}
          </span>
        </button>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Catalogue Schemes"
          value={`${schemes.length} Active`}
          subtext="State & Central Schemes"
          icon={<Landmark className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="Enrolled & Approved"
          value={`${schemes.filter((s) => s.applicationStatus === 'Approved').length} Schemes`}
          subtext="Direct Benefit Transfer Linked"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Max Credit / Subsidy"
          value="₹3,00,000"
          subtext="0% Interest KCC Crop Loan"
          icon={<Sparkles className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="Aadhaar e-KYC Status"
          value="Verified"
          subtext={`XXXX-${user.aadhaarLast4} · NPCI Active`}
          icon={<FileCheck2 className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Interactive Eligibility Checker Panel */}
      {showEligibilityChecker && (
        <Card
          title="Interactive Farmer Scheme Eligibility Checker"
          subtitle="Enter your landholding size, primary crop, and farmer category to calculate real-time scheme match percentage"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-5 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cultivable Land Size (Acres)
              </label>
              <input
                type="number"
                step="0.25"
                min="0.1"
                value={eligLandSize}
                onChange={(e) => setEligLandSize(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Cultivated Crop
              </label>
              <select
                value={eligCrop}
                onChange={(e) => setEligCrop(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="Paddy">Paddy (Ponni / ADT-43)</option>
                <option value="Maize">Maize (Hybrid)</option>
                <option value="Small Onion">Small Onion (Chettikulam)</option>
                <option value="Cotton">Cotton (MCU-5)</option>
                <option value="Pulses">Pulses (Blackgram / Greengram)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Farmer Landholding Category
              </label>
              <select
                value={eligFarmerCategory}
                onChange={(e) =>
                  setEligFarmerCategory(
                    e.target.value as 'Small / Marginal' | 'Medium' | 'All Farmers'
                  )
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="Small / Marginal">Small / Marginal Farmer (&lt; 5 Acres)</option>
                <option value="Medium">Medium Farmer (5 – 10 Acres)</option>
                <option value="All Farmers">Large / General Farmer (&gt; 10 Acres)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            {schemes.map((sch) => {
              const pct = computeMatchPercentage(sch);
              return (
                <div
                  key={sch.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-semibold text-purple-700">
                        {sch.category}
                      </span>
                      <span className="text-xs font-bold text-[#1E8E4F] tabular-nums">
                        {pct}% Match
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">
                      {sch.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openApplyWizard(sch)}
                    className="w-full py-1.5 rounded-lg text-[11px] font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Search, Category Filter Tabs & Sorting Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schemes (PM-KISAN, PMFBY, PMKSY, Fertilizer, KCC)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              aria-label="Sort schemes"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'benefitDesc' | 'deadlineAsc' | 'nameAsc')
              }
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
            >
              <option value="benefitDesc">Sort: Highest Benefit</option>
              <option value="deadlineAsc">Sort: Nearest Deadline</option>
              <option value="nameAsc">Sort: Scheme Name (A–Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scheme Catalogue Cards */}
      {filteredSchemes.length === 0 ? (
        <Card>
          <EmptyState
            title="No government schemes match your filter"
            description="Reset category filters or search query to view all 5 flagship agricultural schemes."
            actionLabel="Show All Schemes"
            onAction={() => {
              setCategoryFilter('All');
              setSearch('');
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSchemes.map((scheme) => {
            const matchPct = computeMatchPercentage(scheme);
            return (
              <Card key={scheme.id}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-purple-700">{scheme.code}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-700">{scheme.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{scheme.department}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#1E8E4F] font-semibold">
                        Eligibility: {scheme.eligibilityTag} ({matchPct}% Match)
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900">
                      {language === 'ta' ? scheme.titleTa : scheme.title}
                    </h2>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {language === 'ta'
                        ? scheme.shortDescriptionTa
                        : scheme.shortDescription}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="font-semibold text-[#0B4D2E]">
                        Benefit: {language === 'ta' ? scheme.benefitSummaryTa : scheme.benefitSummary}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        Cut-off Date: {scheme.deadline}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left lg:text-right">
                      <p className="text-[11px] text-slate-500">Max Benefit / Limit</p>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">
                        ₹{scheme.maxSubsidyAmount.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {scheme.applicationStatus && (
                        <StatusBadge status={scheme.applicationStatus} />
                      )}

                      <button
                        type="button"
                        onClick={() => setDetailSchemeId(scheme.id)}
                        className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => openApplyWizard(scheme)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Apply
                      </button>

                      {(role === 'Officer' || role === 'Admin') &&
                        scheme.applicationStatus &&
                        scheme.applicationStatus !== 'Approved' && (
                          <button
                            type="button"
                            onClick={() => updateSchemeStatus(scheme.id, 'Approved')}
                            className="px-2.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4-STEP ONLINE APPLICATION WIZARD MODAL */}
      <Modal
        isOpen={!!applyingScheme}
        onClose={() => setApplyingScheme(null)}
        title={
          submittedRefNo
            ? 'Application Submitted Successfully'
            : applyingScheme
            ? `Apply: ${applyingScheme.title}`
            : 'Apply to Scheme'
        }
        subtitle={
          applyingScheme
            ? `${applyingScheme.code} · ${applyingScheme.category} · Max Benefit ₹${applyingScheme.maxSubsidyAmount.toLocaleString('en-IN')}`
            : ''
        }
        maxWidthClass="max-w-2xl"
      >
        {applyingScheme && (
          <div className="space-y-5">
            {submittedRefNo ? (
              /* CONFIRMATION SCREEN WITH DOWNLOADABLE PDF ACKNOWLEDGEMENT */
              <div className="space-y-5 py-2 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#0B4D2E] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#1E8E4F] uppercase tracking-wider">
                    Official e-Governance Receipt Generated
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Application ID: <span className="font-mono text-[#0B4D2E]">{submittedRefNo}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    Your application for <strong>{applyingScheme.title}</strong> has been forwarded to the Block Agricultural Officer ({personalForm.taluk}) for field verification.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicant Name & Uzhavar ID:</span>
                    <span className="font-semibold text-slate-900">
                      {personalForm.fullName} ({personalForm.farmerId})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Land Survey No. & Area:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {landCropForm.surveyNumber} ({landCropForm.landAreaAcres} Acres)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cultivated Crop:</span>
                    <span className="font-semibold text-slate-900">{landCropForm.selectedCrop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DBT Bank Account:</span>
                    <span className="font-mono text-slate-800">{personalForm.bankAccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Documents Attached:</span>
                    <span className="text-slate-800">{uploadedDocs.length} File(s)</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadAcknowledgementPdf}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Acknowledgement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyingScheme(null)}
                    className="px-4 py-2.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Stepper
                  steps={[
                    '1. Personal Details',
                    '2. Land & Crop',
                    '3. Upload Docs',
                    '4. Review & Submit',
                  ]}
                  currentStep={applyStep}
                />

                {/* STEP 1: PERSONAL DETAILS (AUTO-FILLED FROM PROFILE) */}
                {applyStep === 1 && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
                      Auto-filled from your verified Digital Uzhavar Profile ({user.farmerId}). You may update contact fields if needed.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Farmer Full Name *
                        </label>
                        <input
                          type="text"
                          value={personalForm.fullName}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, fullName: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Uzhavar ID (GRAINS)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={personalForm.farmerId}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-100 font-mono text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mobile Number *
                        </label>
                        <input
                          type="text"
                          value={personalForm.phone}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, phone: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          District & Taluk
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={`${personalForm.district} · ${personalForm.taluk}`}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          DBT Bank Account
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={personalForm.bankAccount}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-100 font-mono text-slate-600"
                        />
                      </div>
                    </div>

                    {stepError && <p className="text-xs text-red-600">{stepError}</p>}

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setApplyingScheme(null)}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!personalForm.fullName.trim() || !personalForm.phone.trim()) {
                            setStepError('Name and phone number are required.');
                            return;
                          }
                          setStepError('');
                          setApplyStep(2);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                      >
                        Next: Land & Crop Details →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: LAND & CROP DETAILS */}
                {applyStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Land Survey / Sub-Division No. *
                        </label>
                        <input
                          type="text"
                          value={landCropForm.surveyNumber}
                          onChange={(e) =>
                            setLandCropForm({ ...landCropForm, surveyNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Applied Land Area (Acres) *
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          value={landCropForm.landAreaAcres}
                          onChange={(e) =>
                            setLandCropForm({ ...landCropForm, landAreaAcres: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Standing / Proposed Crop *
                        </label>
                        <select
                          value={landCropForm.selectedCrop}
                          onChange={(e) =>
                            setLandCropForm({ ...landCropForm, selectedCrop: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                        >
                          {crops.map((c) => (
                            <option key={c.id} value={c.cropName}>
                              {c.cropName} ({c.surveyNumber})
                            </option>
                          ))}
                          <option value="Paddy (Samba Ponni)">Paddy (Samba Ponni)</option>
                          <option value="Small Onion (CO-4)">Small Onion (CO-4)</option>
                          <option value="Maize (Hybrid)">Maize (Hybrid)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Irrigation Source
                        </label>
                        <select
                          value={landCropForm.irrigationType}
                          onChange={(e) =>
                            setLandCropForm({
                              ...landCropForm,
                              irrigationType: e.target.value as 'Canal' | 'Borewell' | 'Drip' | 'Rainfed',
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Canal">Canal Irrigation</option>
                          <option value="Drip">Automated Drip System</option>
                          <option value="Borewell">Solar / Electric Borewell</option>
                          <option value="Rainfed">Rainfed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Field Remarks / Equipment Specification
                      </label>
                      <textarea
                        rows={2}
                        value={landCropForm.remarks}
                        onChange={(e) =>
                          setLandCropForm({ ...landCropForm, remarks: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                      />
                    </div>

                    {stepError && <p className="text-xs text-red-600">{stepError}</p>}

                    <div className="flex justify-between gap-2 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setApplyStep(1)}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const area = parseFloat(landCropForm.landAreaAcres);
                          if (!landCropForm.surveyNumber.trim() || Number.isNaN(area) || area <= 0) {
                            setStepError('Enter valid Survey No. and positive land area.');
                            return;
                          }
                          setStepError('');
                          setApplyStep(3);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                      >
                        Next: Document Upload →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: DOCUMENT UPLOAD (DRAG-AND-DROP WITH TYPE & SIZE VALIDATION) */}
                {applyStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-800 mb-1">
                        Required Supporting Documents:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {applyingScheme.requiredDocuments.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFileValidationAndAdd(e.dataTransfer.files);
                      }}
                      className={`p-6 rounded-xl border-2 border-dashed text-center transition-colors ${
                        isDragging
                          ? 'border-[#0B4D2E] bg-emerald-50/60'
                          : 'border-slate-300 bg-slate-50/70'
                      }`}
                    >
                      <UploadCloud className="w-8 h-8 text-[#0B4D2E] mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-800">
                        Drag & drop Patta, e-Adangal, or Bank Passbook files here
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Accepted formats: PDF, JPG, PNG · Max file size: 5 MB
                      </p>
                      <label className="mt-3 inline-block px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer">
                        <span>Browse Files</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => handleFileValidationAndAdd(e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Uploaded Files List */}
                    <div className="space-y-2">
                      {uploadedDocs.map((doc, idx) => (
                        <div
                          key={`${doc.name}-${idx}`}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-[#1E8E4F] shrink-0" />
                            <span className="font-medium text-slate-800 truncate">{doc.name}</span>
                            <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                              ({(doc.sizeBytes / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setUploadedDocs((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-red-600 hover:underline text-[11px] font-medium ml-2 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    {stepError && <p className="text-xs text-red-600">{stepError}</p>}

                    <div className="flex justify-between gap-2 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setApplyStep(2)}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (uploadedDocs.length === 0) {
                            setStepError('Please upload at least 1 supporting document (PDF/JPG/PNG).');
                            return;
                          }
                          setStepError('');
                          setApplyStep(4);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                      >
                        Next: Review & Submit →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & SUBMIT */}
                {applyStep === 4 && (
                  <form onSubmit={handleFinalSubmitApplication} className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Scheme & Code:</span>
                        <span className="font-bold text-slate-900">
                          {applyingScheme.title} ({applyingScheme.code})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Applicant Farmer:</span>
                        <span className="font-semibold text-slate-800">
                          {personalForm.fullName} · {personalForm.farmerId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Survey No. & Cultivated Area:</span>
                        <span className="font-mono font-semibold text-[#0B4D2E]">
                          {landCropForm.surveyNumber} · {landCropForm.landAreaAcres} Acres
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Crop & Irrigation:</span>
                        <span className="text-slate-800">
                          {landCropForm.selectedCrop} ({landCropForm.irrigationType})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Verified Documents:</span>
                        <span className="font-medium text-slate-800">
                          {uploadedDocs.map((d) => d.name).join(', ')}
                        </span>
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={declarationChecked}
                        onChange={(e) => setDeclarationChecked(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-[#0B4D2E]"
                      />
                      <span>
                        I hereby declare that the landholding, crop, and Aadhaar e-KYC particulars furnished above are true and authorize Tamil Nadu Department of Agriculture to process my Direct Benefit Transfer.
                      </span>
                    </label>

                    {stepError && <p className="text-xs text-red-600">{stepError}</p>}

                    <div className="flex justify-between gap-2 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setApplyStep(3)}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                      >
                        Submit Application & Generate ID
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
