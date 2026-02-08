
import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Calendar, Plane, User, FileText, CheckCircle2,
    Printer, ArrowRight, ChevronLeft, ChevronRight, AlertCircle,
    ShieldCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';

// --- TRANSLATIONS ---
const translations = {
    en: {
        policy_title: "Leave Policy",
        policy_desc: "Please read the following regulations carefully before proceeding.",
        policy_header: "Policies and Regulations for Failing to Return from Leave on Time",
        policy_ack: "I have read and understood the policy regulations.",
        btn_cancel: "Cancel",
        btn_proceed: "Proceed",
        btn_edit: "Edit",
        btn_print: "Print PDF",
        btn_submit: "Submit",
        btn_review_sign: "Review & Sign",
        screen_title_form: "Leave Application",
        screen_title_review: "Review Request",
        screen_desc: "Fill in the details below.",
        lbl_emp_name: "Employee Name",
        lbl_job_title: "Job Title",
        lbl_cpr: "CPR No",
        lbl_passport: "Passport No",
        lbl_dept: "Department",
        lbl_location: "Location",
        lbl_join_date: "Joining Date",
        lbl_leave_details: "Leave Details",
        lbl_from_date: "From Date",
        lbl_to_date: "To Date",
        lbl_days: "No of Days",
        lbl_leave_type: "Type of Leave",
        lbl_undertaking_title: "I agree to the undertaking",
        lbl_undertaking_desc: "\"I commit to start work on the due date.\"",
        msg_ack_error: "You must agree to the undertaking.",
        msg_validation_error: "Please fill in all mandatory fields.",
        msg_success: "Submitted Successfully",
        lbl_notes: "Notes / Additional Information",
        lbl_last_vac_date: "Last Vacation Date",
        print_form_title: "Employee Leave Request Form",
        print_ref: "REF: VAC-REQ-",
        print_date: "ISSUED DATE: ",
        print_reason_section: "REASON FOR LEAVE",
        print_details_section: "LEAVE DETAILS",
        print_comments: "Comments:",
        print_emp_sig: "Employee Signature",
        print_mgmt_sig: "Management Approval",
        print_policy_ack_title: "POLICY ACKNOWLEDGEMENT",
        print_system_footer: "Tabarak Hub Integrated Systems",
        print_official_doc: "Official Human Resources Document",
        print_page: "Page",
        policy_text: `
In the interest of ensuring work regularity and smooth operations, the company is committed to organizing a clear mechanism for handling cases where employees fail to return from leave after its expiration, as follows:

1. Prior Notification
In the event that an employee is unable to return to work on the scheduled date after their leave ends, they must notify the management in advance, at least (15) days before the scheduled return date, explaining the reasons and providing supporting evidence, provided the reasons are acceptable and approved by management.

2. Corrective Actions
In the event that the employee fails to provide prior notification, or if the reasons provided are found to be unjustified, management reserves the right to take appropriate corrective actions, starting with a written warning to be added to the employee's personnel file.

3. Financial Impact
Failure to approve a leave extension will result in the deduction of the delay days from the employee's salary. These days may also be considered unpaid leave if the employee's entitled leave balance is exceeded.

4. Disciplinary Actions
In the event of repeated failure to return on time without acceptable justifications, management reserves the right to take progressive disciplinary actions, which may reach suspension or termination of employment, taking into account an individual assessment of each case according to its circumstances.

5. Coordination with Management
The employee is committed to continuous coordination with Area Managers to organize return procedures and confirm the final return date, with the necessity of providing medical reports or supporting documents if a sick leave extension is requested.

6. Coordination and Follow-up
The employee must maintain communication with management during the leave period and notify them immediately of any updates or changes that may affect the return date.`
    },
    ar: {
        policy_title: "سياسة الإجازات",
        policy_desc: "يرجى قراءة اللوائح التالية بعناية قبل المتابعة.",
        policy_header: "السياسات واللوائح المتعلقة بعدم العودة من الإجازة في موعدها:",
        policy_ack: "لقد قرأت وفهمت لوائح السياسة.",
        btn_cancel: "إلغاء",
        btn_proceed: "متابعة",
        btn_edit: "تعديل",
        btn_print: "طباعة PDF",
        btn_submit: "إرسال",
        btn_review_sign: "مراجعة وتوقيع",
        screen_title_form: "طلب إجازة",
        screen_title_review: "مراجعة الطلب",
        screen_desc: "أدخل التفاصيل أدناه.",
        lbl_emp_name: "اسم الموظف",
        lbl_job_title: "المسمى الوظيفي",
        lbl_cpr: "الرقم الشخصي",
        lbl_passport: "رقم جواز السفر",
        lbl_dept: "القسم",
        lbl_location: "الموقع",
        lbl_join_date: "تاريخ الالتحاق",
        lbl_leave_details: "تفاصيل الإجازة",
        lbl_from_date: "من تاريخ",
        lbl_to_date: "إلى تاريخ",
        lbl_days: "عدد الأيام",
        lbl_leave_type: "نوع الإجازة",
        lbl_undertaking_title: "أوافق على التعهد",
        lbl_undertaking_desc: "\"ألتزم بمباشرة العمل في التاريخ المحدد.\"",
        msg_ack_error: "يجب عليك الموافقة على التعهد.",
        msg_validation_error: "يرجى ملء جميع الحقول الإلزامية.",
        msg_success: "تم الإرسال بنجاح",
        lbl_notes: "ملاحظات / معلومات إضافية",
        lbl_last_vac_date: "تاريخ آخر إجازة",
        print_form_title: "نموذج طلب إجازة موظف",
        print_ref: "المرجع: VAC-REQ-",
        print_date: "تاريخ الإصدار: ",
        print_reason_section: "سبب الإجازة",
        print_details_section: "تفاصيل الإجازة",
        print_comments: "ملاحظات:",
        print_emp_sig: "توقيع الموظف",
        print_mgmt_sig: "اعتماد الإدارة",
        print_policy_ack_title: "إقرار السياسة التنظيمية",
        print_system_footer: "أنظمة تبارك المتكاملة",
        print_official_doc: "مستند رسمي للموارد البشرية",
        print_page: "صفحة",
        policy_text: `
حرصاً على انتظام العمل وضمان سيره بالشكل المطلوب، تلتزم الشركة بتنظيم آلية واضحة للتعامل مع حالات تأخر الموظف عن العودة من الإجازة بعد انتهائها، وذلك على النحو التالي:

1. الإخطار المسبق
في حال تعذّر عودة الموظف إلى العمل في الموعد المحدد بعد انتهاء إجازته، يجب عليه إخطار الإدارة بشكل مسبق، وبمدة لا تقل عن (15) يوماً قبل تاريخ العودة المقرر، مع توضيح الأسباب وتقديم ما يثبت ذلك، على أن تكون الأسباب مقبولة ومعتمدة من الإدارة.

2. الإجراءات التصحيحية
في حال عدم قيام الموظف بالإخطار المسبق، أو إذا تبين أن الأسباب المقدمة غير مبررة، يحق للإدارة اتخاذ الإجراءات التصحيحية المناسبة، والتي تبدأ بتوجيه إنذار كتابي يُضاف إلى الملف الوظيفي للموظف.

3. الأثر المالي
يترتب على عدم اعتماد تمديد الإجازة خصم أيام التأخير من راتب الموظف، كما يجوز اعتبار هذه الأيام إجازة غير مدفوعة الأجر في حال تجاوز رصيد الإجازات المستحق.

4. الإجراءات التأديبية
في حال تكرار التأخر عن العودة دون مبررات مقبولة، تحتفظ الإدارة بحق اتخاذ إجراءات تأديبية تصاعدية قد تصل إلى الإيقاف عن العمل أو إنهاء الخدمة، مع مراعاة تقييم كل حالة على حدة وفقاً لظروفها.

5. التنسيق مع الإدارة
يلتزم الموظف بالتنسيق المستمر مع مديري المناطق لتنظيم إجراءات العودة وتأكيد تاريخ العودة النهائي، مع ضرورة تقديم التقارير الطبية أو المستندات الداعمة في حال طلب تمديد الإجازة المرضية.

6. التواصل والمتابعة
يتوجب على الموظف الحفاظ على التواصل مع الإدارة خلال فترة الإجازة، وإبلاغها فوراً بأي مستجدات أو تغييرات قد تؤثر على موعد العودة.`
    }
};

interface VacationRequestFlowProps {
    employee: { name: string; cpr: string; role: string };
    onBack: () => void;
    onComplete: () => void;
    lang: 'en' | 'ar';
}

// Helper Component for Inputs
const InputGroup = ({ label, value, onChange, type = "text", readOnly = false, isRtl = false, required = false }: any) => (
    <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {readOnly ? (
            <div className="min-h-[40px] text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center">
                {value || '-'}
            </div>
        ) : (
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`w-full h-10 bg-transparent border-b border-slate-300 focus:border-brand text-lg font-bold text-slate-900 outline-none transition-colors ${isRtl ? 'text-right' : 'text-left'}`}
                placeholder="..."
            />
        )}
    </div>
);

export const VacationRequestFlow: React.FC<VacationRequestFlowProps> = ({ employee, onBack, onComplete, lang }) => {
    const [step, setStep] = useState<'policy' | 'form' | 'review'>('policy');
    const [policyRead, setPolicyRead] = useState(false);

    // Print Ref
    const printRef = useRef<HTMLDivElement>(null);
    const t = translations[lang];
    const isRtl = lang === 'ar';

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
        leaveType: 'Annual',
        email: '',
        mobile: '',
        flightReturn: '',
        notes: '',
        lastVacationDate: '',
        undertakingAgreed: false
    });

    // Calculate days count automatically
    useEffect(() => {
        if (formData.holidayFrom && formData.holidayTo) {
            const start = new Date(formData.holidayFrom);
            const end = new Date(formData.holidayTo);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setFormData(prev => ({ ...prev, daysCount: diffDays > 0 ? diffDays : 0 }));
        }
    }, [formData.holidayFrom, formData.holidayTo]);

    const handleSubmit = async () => {
        if (!formData.undertakingAgreed) {
            Swal.fire(isRtl ? 'خطأ' : 'Error', t.msg_ack_error, 'error');
            return;
        }

        const mandatoryFields = [
            'jobTitle', 'passport', 'department', 'location',
            'joinDate', 'holidayFrom', 'holidayTo', 'lastVacationDate'
        ];
        const isMissing = mandatoryFields.some(field => !formData[field as keyof typeof formData]);

        if (isMissing) {
            Swal.fire(isRtl ? 'تنبيه' : 'Warning', t.msg_validation_error, 'warning');
            return;
        }

        const refNum = 'VAC-' + Math.floor(100000 + Math.random() * 900000);
        const payload = {
            refNum,
            type: 'Vacation Request',
            employeeName: employee.name,
            cpr: employee.cpr,
            ...formData,
            status: 'Pending',
            timestamp: new Date().toISOString()
        };
        await supabase.hrRequests.create(payload);
        Swal.fire({
            icon: 'success',
            title: t.msg_success,
            html: `<div class="p-6 bg-red-50 border border-red-100 rounded-3xl mt-4"><h2 class="text-4xl font-black text-slate-900 tracking-tighter">${refNum}</h2></div>`,
            confirmButtonColor: '#b91c1c'
        }).then(() => onComplete());
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Vacation_Request_${employee.name}`,
    });

    if (step === 'policy') {
        return (
            <div className={`max-w-4xl mx-auto py-10 px-6 animate-in fade-in duration-500 ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{t.policy_title}</h2>
                    <p className="text-slate-500">{t.policy_desc}</p>
                </div>
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">{t.policy_header}</h3>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-medium">{t.policy_text}</div>
                    </div>
                </div>
                <div className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${policyRead ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-brand/30'}`} onClick={() => setPolicyRead(!policyRead)}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${policyRead ? 'bg-brand border-brand text-white' : 'border-slate-300 bg-white'}`}>
                        {policyRead && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <span className="font-bold text-slate-700">{t.policy_ack}</span>
                </div>
                <div className="flex justify-between mt-8">
                    <button onClick={onBack} className="px-8 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">{t.btn_cancel}</button>
                    <button disabled={!policyRead} onClick={() => setStep('form')} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-brand transition-all flex items-center gap-2">
                        {t.btn_proceed} <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
        );
    }

    const isReview = step === 'review';

    return (
        <div className={isRtl ? 'font-arabic' : 'font-sans'} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* --- SCREEN VIEW --- */}
            <div className="max-w-5xl mx-auto py-10 px-6 animate-in fade-in duration-500 print:hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                            aria-label={t.btn_back}
                            title={t.btn_back}
                        >
                            {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                        </button>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-1">{isReview ? t.screen_title_review : t.screen_title_form}</h2>
                            <p className="text-slate-500 font-medium">{t.screen_desc}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {isReview && (
                            <>
                                <button onClick={() => setStep('form')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all">{t.btn_edit}</button>
                                <button onClick={() => handlePrint()} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 transition-all">
                                    <Printer className="w-5 h-5" />
                                    <span>{t.btn_print}</span>
                                </button>
                                <button onClick={handleSubmit} className="px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-brand/20 transition-all">{t.btn_submit}</button>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-8 sm:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                        <InputGroup label={t.lbl_emp_name} value={employee.name} readOnly isRtl={isRtl} />
                        <InputGroup label={t.lbl_job_title} value={formData.jobTitle} onChange={(v: any) => setFormData({ ...formData, jobTitle: v })} readOnly={isReview} isRtl={isRtl} required={!isReview} />
                        <InputGroup label={t.lbl_cpr} value={employee.cpr} readOnly isRtl={isRtl} />
                        <InputGroup label={t.lbl_passport} value={formData.passport} onChange={(v: any) => setFormData({ ...formData, passport: v })} readOnly={isReview} isRtl={isRtl} required={!isReview} />
                        <InputGroup label={t.lbl_dept} value={formData.department} onChange={(v: any) => setFormData({ ...formData, department: v })} readOnly={isReview} isRtl={isRtl} required={!isReview} />
                        <InputGroup label={t.lbl_location} value={formData.location} onChange={(v: any) => setFormData({ ...formData, location: v })} readOnly={isReview} isRtl={isRtl} required={!isReview} />
                        <InputGroup label={t.lbl_join_date} type="date" value={formData.joinDate} onChange={(v: any) => setFormData({ ...formData, joinDate: v })} readOnly={isReview} isRtl={isRtl} required={!isReview} />
                        <InputGroup label={t.lbl_last_vac_date} type="date" value={formData.lastVacationDate} onChange={(v: any) => setFormData({ ...formData, lastVacationDate: v })} readOnly={isReview} isRtl={isRtl} required={!isReview} />
                    </div>
                    <div className="mb-12">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2"><Calendar className="w-4 h-4" /> {t.lbl_leave_details}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <InputGroup label={t.lbl_from_date} type="date" value={formData.holidayFrom} onChange={(v: any) => setFormData({ ...formData, holidayFrom: v })} readOnly={isReview} isRtl={isRtl} required={!isReview} />
                            <InputGroup label={t.lbl_to_date} type="date" value={formData.holidayTo} onChange={(v: any) => setFormData({ ...formData, holidayTo: v })} readOnly={isReview} isRtl={isRtl} required={!isReview} />
                            <InputGroup label={t.lbl_days} value={String(formData.daysCount)} readOnly isRtl={isRtl} />
                        </div>
                    </div>

                    <div className="mb-12">
                        <InputGroup label={t.lbl_notes} value={formData.notes} onChange={(v: any) => setFormData({ ...formData, notes: v })} readOnly={isReview} isRtl={isRtl} />
                    </div>
                    <div className="mb-12">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">{t.lbl_leave_type}</h3>
                        <div className="flex flex-wrap gap-4">
                            {['Annual', 'Sick', 'Emergency', 'Special', 'Final'].map(type => (
                                <label key={type} className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer ${formData.leaveType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                    <input type="radio" name="leaveType" disabled={isReview} checked={formData.leaveType === type} onChange={() => setFormData({ ...formData, leaveType: type })} className="hidden" />
                                    <span className="font-bold text-sm tracking-tight">{isRtl ? (type === 'Annual' ? 'سنوية' : type === 'Sick' ? 'مرضية' : type === 'Emergency' ? 'طارئة' : type === 'Special' ? 'خاصة' : 'نهائية') : type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <label className="flex items-start gap-4 cursor-pointer">
                            <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${formData.undertakingAgreed ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300'}`}>
                                {formData.undertakingAgreed && <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={formData.undertakingAgreed} onChange={e => setFormData({ ...formData, undertakingAgreed: e.target.checked })} />
                            <div>
                                <p className="font-bold text-slate-900">{t.lbl_undertaking_title}</p>
                                <p className="text-sm text-slate-500 mt-1">{t.lbl_undertaking_desc}</p>
                            </div>
                        </label>
                    </div>
                    {!isReview && (
                        <div className={`mt-12 pt-8 border-t border-slate-100 flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
                            <button onClick={() => setStep('review')} className="px-12 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-brand transition-all flex items-center gap-3">
                                {t.btn_review_sign} <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- REFINED PRINT VIEW (FOR REACT-TO-PRINT) --- */}
            <div className="hidden">
                <div ref={printRef} dir={isRtl ? 'rtl' : 'ltr'}>
                    <style>{`
                    @media print {
                      @page {
                        size: A4;
                        margin: 0;
                      }
                      body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        margin: 0;
                        padding: 0;
                      }
                      .print-page {
                        width: 210mm;
                        height: 297mm;
                        padding: 15mm;
                        box-sizing: border-box;
                        page-break-after: always;
                        display: flex;
                        flex-direction: column;
                        background: white;
                        position: relative;
                        overflow: hidden;
                      }
                      .print-page:last-child {
                        page-break-after: avoid;
                      }
                    }
                  `}</style>

                    {/* --- PAGE 1: REQUEST DETAILS --- */}
                    <div className="print-page">
                        <div className="flex-grow">
                            {/* Header Logo/Title Section */}
                            <div className={`flex items-center justify-between border-b-4 border-black pb-4 mb-6 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-gray-100">
                                        <img src="/logo.jpg" alt="Company Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <div className={isRtl ? 'text-right' : 'text-left'}>
                                        <h1 className="text-xl font-black uppercase text-black">{isRtl ? 'صيدلية تبارك' : 'Tabarak Pharmacy'}</h1>
                                        <p className="text-[8px] font-bold text-gray-500 tracking-[0.2em] uppercase">HR Management System</p>
                                    </div>
                                </div>
                                <div className={isRtl ? 'text-left' : 'text-right'} dir="ltr">
                                    <p className="text-[9px] font-bold text-gray-400">{t.print_date} {new Date().toLocaleDateString()}</p>
                                    <p className="text-xs font-black text-black">{t.print_ref}{new Date().getFullYear()}</p>
                                </div>
                            </div>

                            {/* Main Form Title */}
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-black border-2 border-black inline-block px-10 py-2 uppercase tracking-widest bg-gray-50">
                                    {t.print_form_title}
                                </h2>
                            </div>

                            {/* Employee Block */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 p-6 border border-gray-100 rounded-[1.5rem] bg-gray-50/30">
                                <PrintItem label={t.lbl_emp_name} value={employee.name} isRtl={isRtl} />
                                <PrintItem label={t.lbl_cpr} value={employee.cpr} isRtl={isRtl} />
                                <PrintItem label={t.lbl_job_title} value={formData.jobTitle} isRtl={isRtl} />
                                <PrintItem label={t.lbl_dept} value={formData.department} isRtl={isRtl} />
                                <PrintItem label={t.lbl_last_vac_date} value={formData.lastVacationDate} isRtl={isRtl} />
                                <PrintItem label={t.lbl_passport} value={formData.passport} isRtl={isRtl} />
                            </div>

                            {/* Leave Reason Grid */}
                            <div className="mb-6">
                                <div className="text-[9px] font-black bg-black text-white p-2 mb-3 tracking-widest text-center uppercase">{t.print_reason_section}</div>
                                <div className="grid grid-cols-3 gap-4 p-2">
                                    {['Annual', 'Sick', 'Emergency', 'Special', 'Final', 'Other'].map(type => (
                                        <div key={type} className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-4 h-4 border-2 border-black flex items-center justify-center text-xs font-bold ${formData.leaveType === type ? 'bg-black text-white' : ''}`}>
                                                {formData.leaveType === type ? 'X' : ''}
                                            </div>
                                            <span className="text-xs font-bold text-gray-800">{isRtl ? (type === 'Annual' ? 'سنوية' : type === 'Sick' ? 'مرضية' : type === 'Emergency' ? 'طارئة' : type === 'Special' ? 'خاصة' : type === 'Final' ? 'نهائية' : 'أخرى') : type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Leave Details Block */}
                            <div className="mb-6">
                                <div className="text-[9px] font-black bg-black text-white p-2 mb-3 tracking-widest text-center uppercase">{t.print_details_section}</div>
                                <div className="grid grid-cols-3 gap-6 p-2">
                                    <PrintItem label={t.lbl_from_date} value={formData.holidayFrom} isRtl={isRtl} />
                                    <PrintItem label={t.lbl_to_date} value={formData.holidayTo} isRtl={isRtl} />
                                    <PrintItem label={t.lbl_days} value={String(formData.daysCount)} isRtl={isRtl} />
                                </div>
                            </div>

                            {/* Signature Section */}
                            <div className="mt-8 grid grid-cols-2 gap-16">
                                <div className="border-t-2 border-black pt-2">
                                    <p className="text-center font-black text-black mb-10 italic text-sm">{t.print_emp_sig}</p>
                                    <p className="text-[8px] text-gray-400 text-center uppercase font-bold tracking-widest">Employee Signature</p>
                                </div>
                                <div className="border-t-2 border-black pt-2">
                                    <p className="text-center font-black text-black mb-10 italic text-sm">{t.print_mgmt_sig}</p>
                                    <p className="text-[8px] text-gray-400 text-center uppercase font-bold tracking-widest">Management Approval</p>
                                </div>
                            </div>

                            {/* Notes Section in Print */}
                            {formData.notes && (
                                <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t.lbl_notes}</span>
                                    <p className="text-xs font-medium text-gray-700 italic">"{formData.notes}"</p>
                                </div>
                            )}
                        </div>
                        <PrintFooter t={t} isRtl={isRtl} pageNum={1} />
                    </div>

                    {/* --- PAGE 2: POLICY --- */}
                    <div className="print-page">
                        <div className="flex-grow pt-8">
                            <div className="text-center mb-8 border-b-2 border-black pb-4">
                                <h2 className="text-xl font-black uppercase tracking-widest text-black">{t.print_policy_ack_title}</h2>
                                <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Management Leave Policies & Regulations</p>
                            </div>

                            <div className={`text-xs leading-relaxed text-black whitespace-pre-wrap mb-8 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                                {t.policy_text}
                            </div>

                            <div className="p-8 border-2 border-black rounded-2xl bg-gray-50/50">
                                <p className={`font-black text-sm text-black mb-8 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                                    {isRtl
                                        ? `أنا الموظف الموقع أدناه، ${employee.name}، أقر بأنني قرأت وفهمت التعليمات المذكورة أعلاه وألتزم بالعودة للعمل في الموعد المحدد.`
                                        : `I, the undersigned employee ${employee.name}, acknowledge that I have read and understood the above regulations and commit to returning to work on the scheduled date.`}
                                </p>
                                <div className="grid grid-cols-2 gap-16">
                                    <div className={`border-b-2 border-black pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                                        <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">{isRtl ? 'توقيع الموظف' : 'Employee Signature'}</span>
                                        <div className="h-6"></div>
                                    </div>
                                    <div className={`border-b-2 border-black pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                                        <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">{isRtl ? 'التاريخ' : 'Date'}</span>
                                        <div className="font-bold text-black text-sm">{new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <PrintFooter t={t} isRtl={isRtl} pageNum={2} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PRIVATE HELPERS ---

const PrintItem = ({ label, value, isRtl }: { label: string, value: string, isRtl: boolean }) => (
    <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{label}</span>
        <span className="text-lg font-black text-black block border-b-2 border-gray-100 pb-1">{value || '---'}</span>
    </div>
);

const PrintFooter = ({ t, isRtl, pageNum }: any) => (
    <div className="mt-auto pt-4 border-t border-gray-100 px-10 pb-6">
        <div className={`flex justify-between items-center text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <span>{t.print_system_footer}</span>
            <span>{t.print_official_doc}</span>
            <span className="text-gray-400">PAGE {pageNum} OF 2</span>
        </div>
    </div>
);
