
import React, { useState, useEffect } from 'react';
import {
    Calendar, Plane, User, FileText, CheckCircle2,
    Printer, ArrowRight, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';

// --- POLICY TEXT ---
const POLICY_TEXT = `Policies and Regulations for Failing to Return from Leave on Time:
1. Prior Notification:
- An employee who is unable to return to work on time after their leave must immediately notify the management before the scheduled return date at least 15 days from his return.
- Justifiable and approved reasons for the delay must be provided.
2. Corrective Actions:
- If the employee does not provide prior notification or the reasons given are not justified, corrective actions will be taken, starting with a written warning will be issued and placed in the employee's personal file.
3. Impact on Salary:
- Days of delay may be deducted from the employee's salary if the extended leave is not approved or justified.
- Days of delay can be counted as unpaid leave if they exceed the entitled paid leave.
4. Disciplinary Actions:
- In case of repeated failure to return on time without justified reasons, disciplinary actions may be taken, including suspension or termination of employment.
- Each case will be individually assessed based on the surrounding circumstances.
5. Coordination with Management:
- The employee must coordinate with management to arrange the return and confirm the final return date.
- Medical reports or supporting documents should be provided in the case of extended medical leave.
6. Communication and Follow-up:
- The employee must maintain open communication channels with management during the leave period and report any changes in return plans.
- An employee will be designated to communicate with management to follow up on the situation and ensure compliance with company policies.`;

const UNDERTAKING_TEXT = "I, the undersigned, , commit to start work on the due date and understand the consequences of failing to do so.";

interface VacationRequestFlowProps {
    employee: { name: string; cpr: string; role: string };
    onBack: () => void;
    onComplete: () => void;
}

export const VacationRequestFlow: React.FC<VacationRequestFlowProps> = ({ employee, onBack, onComplete }) => {
    const [step, setStep] = useState<'policy' | 'form' | 'review'>('policy');
    const [policyRead, setPolicyRead] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        jobTitle: '',
        passport: '',
        department: '',
        location: '',
        joinDate: '',

        holidayFrom: '',
        holidayTo: '',
        daysCount: 0,

        lastVacationDate: '',
        lastVacationDays: 0,

        leaveType: 'Annual', // Annual, Sick, Emergency, Special, Final

        email: '',
        mobile: '',

        flightOut: '',
        flightReturn: '',

        undertakingAgreed: false
    });

    // Calculate days count automatically
    useEffect(() => {
        if (formData.holidayFrom && formData.holidayTo) {
            const start = new Date(formData.holidayFrom);
            const end = new Date(formData.holidayTo);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
            setFormData(prev => ({ ...prev, daysCount: diffDays > 0 ? diffDays : 0 }));
        }
    }, [formData.holidayFrom, formData.holidayTo]);

    const handleSubmit = async () => {
        if (!formData.undertakingAgreed) {
            Swal.fire('Error', 'You must agree to the undertaking.', 'error');
            return;
        }

        const refNum = 'VAC-' + Math.floor(100000 + Math.random() * 900000);

        const payload = {
            refNum,
            type: 'Vacation Request',
            docTypes: [],
            employeeName: employee.name,
            cpr: employee.cpr,
            ...formData,
            status: 'Pending',
            timestamp: new Date().toISOString()
        };

        await supabase.hrRequests.create(payload);

        Swal.fire({
            icon: 'success',
            title: 'Submitted Successfully',
            html: `<div class="p-6 bg-red-50 border border-red-100 rounded-3xl mt-4"><p class="text-[10px] font-black uppercase text-red-400 mb-2">Reference #</p><h2 class="text-4xl font-black text-slate-900 tracking-tighter">${refNum}</h2></div>`,
            confirmButtonColor: '#b91c1c'
        }).then(() => {
            onComplete();
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // --- STEP 1: POLICY VIEW ---
    if (step === 'policy') {
        return (
            <div className="max-w-4xl mx-auto py-10 px-6 animate-in fade-in duration-500">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Leave Policy</h2>
                    <p className="text-slate-500">Please read the following regulations carefully before proceeding.</p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Policies and Regulations for Failing to Return from Leave on Time</h3>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-medium">
                            {POLICY_TEXT}
                        </div>
                    </div>
                </div>

                <div
                    className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${policyRead ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-brand/30'}`}
                    onClick={() => setPolicyRead(!policyRead)}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${policyRead ? 'bg-brand border-brand text-white' : 'border-slate-300 bg-white'}`}>
                        {policyRead && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <span className="font-bold text-slate-700">I have read and understood the policy regulations.</span>
                </div>

                <div className="flex justify-between mt-8">
                    <button onClick={onBack} className="px-8 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">
                        Cancel
                    </button>
                    <button
                        disabled={!policyRead}
                        onClick={() => setStep('form')}
                        className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand transition-all flex items-center gap-2"
                    >
                        Proceed to Form <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    // --- STEP 2: FORM / REVIEW ---
    // We combine Form and Review (Review is just the form but cleaner/disabled or a proper print view)
    // Actually, user asked to "fill form -> submit -> review/edit -> print"
    // Wait: "after submit -> be able to review again and edit -> print"
    // Usually submit means it's sent. "Review again and edit" implies before final approval or just reviewing what was sent.
    // "بعد م يملاها اونلاين و يعمل submit يبقي قادر انه يشوفها review تاني و يقدر يعدل فيها" -> "After fill and submit, he can see it review again and can edit it"
    // This implies a "Draft" buffer or "Edit" capability on "Pending" requests.
    // However, given the flow "Submit officially", usually it locks.
    // Let's interpret "submit" in the form as "Preview/Review" step, then "Final Submit".

    // Let's do: Fill Form -> Click "Review" -> See Review Mode (Printable) -> Click "Final Submit".
    // In Review Mode, "Edit" button takes back to Form.

    if (step === 'form' || step === 'review') {
        const isReview = step === 'review';

        return (
            <>
                {/* --- SCREEN VIEW (INTERACTIVE) --- */}
                <div className="max-w-5xl mx-auto py-10 px-6 animate-in fade-in duration-500 print:hidden">
                    {/* NAV HEADER */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                title="Back to Services"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 mb-1">{isReview ? 'Review Request' : 'Leave Application'}</h2>
                                <p className="text-slate-500 font-medium">{isReview ? 'Verify details before submission.' : 'Fill in the details below.'}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {isReview && (
                                <>
                                    <button onClick={() => setStep('form')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all">
                                        Edit Details
                                    </button>
                                    <button onClick={handlePrint} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 transition-all">
                                        <Printer className="w-5 h-5" /> Print PDF
                                    </button>
                                    <button onClick={handleSubmit} className="px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-brand/20 transition-all">
                                        Submit Request
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* INTERACTIVE FORM CONTAINER */}
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-8 sm:p-12">
                        {/* Employee Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                            <InputGroup label="Employee Name" value={employee.name} readOnly />
                            <InputGroup label="Job Title" value={formData.jobTitle} onChange={v => setFormData({ ...formData, jobTitle: v })} readOnly={isReview} />
                            <InputGroup label="CPR No" value={employee.cpr} readOnly />
                            <InputGroup label="Passport No" value={formData.passport} onChange={v => setFormData({ ...formData, passport: v })} readOnly={isReview} />
                            <InputGroup label="Department" value={formData.department} onChange={v => setFormData({ ...formData, department: v })} readOnly={isReview} />
                            <InputGroup label="Location" value={formData.location} onChange={v => setFormData({ ...formData, location: v })} readOnly={isReview} />
                            <InputGroup label="Joining Date" type="date" value={formData.joinDate} onChange={v => setFormData({ ...formData, joinDate: v })} readOnly={isReview} />
                        </div>

                        <div className="h-px bg-slate-100 w-full mb-12"></div>

                        {/* Leave Details */}
                        <div className="mb-12">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Leave Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <InputGroup label="From Date" type="date" value={formData.holidayFrom} onChange={v => setFormData({ ...formData, holidayFrom: v })} readOnly={isReview} />
                                <InputGroup label="To Date" type="date" value={formData.holidayTo} onChange={v => setFormData({ ...formData, holidayTo: v })} readOnly={isReview} />
                                <InputGroup label="No of Days" value={formData.daysCount} readOnly />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup label="Last Vacation Date" type="date" value={formData.lastVacationDate} onChange={v => setFormData({ ...formData, lastVacationDate: v })} readOnly={isReview} />
                                <InputGroup label="Last Vacation Days" type="number" value={formData.lastVacationDays} onChange={v => setFormData({ ...formData, lastVacationDays: Number(v) })} readOnly={isReview} />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full mb-12"></div>

                        {/* Leave Type */}
                        <div className="mb-12">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Type of Leave</h3>
                            <div className="flex flex-wrap gap-4">
                                {['Annual', 'Sick', 'Emergency', 'Special', 'Final'].map(type => (
                                    <label key={type} className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer ${formData.leaveType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                        <input
                                            type="radio"
                                            name="leaveType"
                                            disabled={isReview}
                                            checked={formData.leaveType === type}
                                            onChange={() => setFormData({ ...formData, leaveType: type })}
                                            className="hidden"
                                        />
                                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.leaveType === type ? 'border-white' : 'border-slate-400'}`}>
                                            {formData.leaveType === type && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </span>
                                        <span className="font-bold text-sm">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Contact & Flight */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                            <InputGroup label="Email Address" type="email" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} readOnly={isReview} />
                            <InputGroup label="Mobile No" type="tel" value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} readOnly={isReview} />
                            <InputGroup label="Flight Out" type="datetime-local" value={formData.flightOut} onChange={v => setFormData({ ...formData, flightOut: v })} readOnly={isReview} />
                            <InputGroup label="Flight Return" type="datetime-local" value={formData.flightReturn} onChange={v => setFormData({ ...formData, flightReturn: v })} readOnly={isReview} />
                        </div>

                        {/* Undertaking Checkbox for Screen */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                            <label className="flex items-start gap-4 cursor-pointer">
                                <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${formData.undertakingAgreed ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300'}`}>
                                    {formData.undertakingAgreed && <CheckCircle2 className="w-4 h-4" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={formData.undertakingAgreed} onChange={e => setFormData({ ...formData, undertakingAgreed: e.target.checked })} />
                                <div>
                                    <p className="font-bold text-slate-900">I agree to the undertaking</p>
                                    <p className="text-sm text-slate-500 mt-1">"I commit to start work on the due date and understand the consequences of failing to do so."</p>
                                </div>
                            </label>
                        </div>

                        {/* ACTIONS FOR FORM */}
                        {!isReview && (
                            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setStep('review')}
                                    className="px-12 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-brand transition-all flex items-center gap-3 shadow-xl shadow-brand/10"
                                >
                                    Review & Sign <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PRINT VIEW (HIDDEN ON SCREEN) --- */}
                <div className="hidden print:block font-sans text-black">

                    {/* PAGE 1: INFORMATION */}
                    <div className="w-full h-screen relative flex flex-col p-8" style={{ pageBreakAfter: 'always' }}>
                        {/* Header */}
                        <div className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-widest text-black">Leave Authorization Request</h1>
                                <p className="text-sm font-bold text-gray-600 mt-1 uppercase tracking-wider">Tabarak Human Resources</p>
                            </div>
                            <div className="text-right">
                                <div className="w-32 h-12 border-2 border-black flex items-center justify-center font-bold text-xl mb-1">{formData.leaveType}</div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Leave Type</p>
                            </div>
                        </div>

                        <div className="flex-1">
                            {/* Section 1: Employee Info */}
                            <div className="mb-8">
                                <h3 className="text-sm font-black uppercase tracking-widest border-b border-gray-300 pb-1 mb-4">Employee Information</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                    <PrintField label="Name" value={employee.name} />
                                    <PrintField label="CPR Number" value={employee.cpr} />
                                    <PrintField label="Job Title" value={formData.jobTitle} />
                                    <PrintField label="Department" value={formData.department} />
                                    <PrintField label="Location" value={formData.location} />
                                    <PrintField label="Joining Date" value={formData.joinDate} />
                                    <PrintField label="Passport No" value={formData.passport} />
                                    <PrintField label="Mobile" value={formData.mobile} />
                                </div>
                            </div>

                            {/* Section 2: Leave Info */}
                            <div className="mb-8">
                                <h3 className="text-sm font-black uppercase tracking-widest border-b border-gray-300 pb-1 mb-4">Leave Details</h3>
                                <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-4">
                                    <PrintField label="Start Date" value={formData.holidayFrom} />
                                    <PrintField label="End Date" value={formData.holidayTo} />
                                    <PrintField label="Duration" value={`${formData.daysCount} Days`} />
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                    <PrintField label="Last Vacation Date" value={formData.lastVacationDate} />
                                    <PrintField label="Last Vacation Duration" value={`${formData.lastVacationDays} Days`} />
                                </div>
                            </div>

                            {/* Section 3: Flight Info */}
                            {(formData.flightOut || formData.flightReturn) && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest border-b border-gray-300 pb-1 mb-4">Flight Details</h3>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <PrintField label="Departure" value={formData.flightOut?.replace('T', ' ')} />
                                        <PrintField label="Return" value={formData.flightReturn?.replace('T', ' ')} />
                                    </div>
                                </div>
                            )}

                            {/* Section 4: Undertaking */}
                            <div className="mt-8 p-4 border border-gray-300 bg-gray-50 rounded text-sm italic leading-relaxed text-justify">
                                <span className="font-bold not-italic text-black">Undertaking:</span> I, the undersigned employee, commit to start work on the due date mentioned above. I understand that failing to return on time without a justified and approved reason constitutes a violation of company policy and may result in disciplinary action up to termination.
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="mt-auto grid grid-cols-3 gap-8 pt-8 border-t-2 border-black">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest mb-12">Employee Signature</p>
                                <div className="border-b border-black w-full"></div>
                                <p className="text-xs mt-1 text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest mb-12">Manager Approval</p>
                                <div className="border-b border-black w-full"></div>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest mb-12">HR Approval</p>
                                <div className="border-b border-black w-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* PAGE 2: POLICY */}
                    <div className="w-full h-screen relative flex flex-col p-12 bg-white" style={{ pageBreakBefore: 'always' }}>
                        <div className="border-b-4 border-black pb-4 mb-12 text-center">
                            <h1 className="text-2xl font-black uppercase tracking-widest text-black">Policy Acknowledgement</h1>
                            <p className="text-sm font-bold text-gray-600 mt-2">Regulations for Failing to Return from Leave on Time</p>
                        </div>

                        <div className="flex-1 columns-2 gap-12 text-xs text-justify leading-relaxed font-serif text-black">
                            {POLICY_TEXT.split('\n').map((line, i) => {
                                if (line.match(/^\d\./)) return <p key={i} className="font-bold mt-4 mb-2 text-sm break-keep">{line}</p>;
                                if (line.trim().startsWith('-')) return <p key={i} className="pl-4 mb-2">• {line.substring(1).trim()}</p>;
                                return <p key={i} className="mb-2">{line}</p>;
                            })}
                        </div>

                        <div className="mt-12 pt-8 border-t-2 border-black">
                            <p className="mb-8 font-bold text-sm">I have read, understood, and received a copy of these regulations.</p>
                            <div className="grid grid-cols-2 gap-12">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-8">Employee Name</p>
                                    <p className="font-serif text-xl border-b border-gray-300 pb-1">{employee.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-8">Signature</p>
                                    <div className="border-b border-black w-full h-8"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return null;
};

// Helper Component for Inputs
const InputGroup = ({ label, value, onChange, type = "text", readOnly = false }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</label>
        {readOnly ? (
            <div className="min-h-[40px] text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center">
                {value || '-'}
            </div>
        ) : (
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full h-10 bg-transparent border-b border-slate-300 focus:border-brand text-lg font-bold text-slate-900 outline-none transition-colors"
                placeholder="..."
            />
        )}

    </div>
);

const PrintField = ({ label, value }: { label: string, value: any }) => (
    <div>
        <span className="block text-[10px] font-black transform uppercase tracking-widest text-gray-500 mb-1">{label}</span>
        <span className="block font-serif text-lg font-bold border-b border-gray-300 pb-1 min-h-[1.75rem]">
            {value || '—'}
        </span>
    </div>
);
