
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
        policy_text: `Policies and Regulations for Failing to Return from Leave on Time:
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
- An employee will be designated to communicate with management to follow up on the situation and ensure compliance with company policies.`
    },
    ar: {
        policy_title: "سياسة الإجازات",
        policy_desc: "يرجى قراءة اللوائح التالية بعناية قبل المتابعة.",
        policy_header: "السياسات واللوائح الخاصة بالفشل في العودة من الإجازة في الوقت المحدد",
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
        policy_text: `السياسات واللوائح الخاصة بعدم العودة من الإجازة في موعدها:
1. الإخطار المسبق:
- الموظف الذي لا يستطيع العودة إلى العمل في الوقت المحدد له بعد انتهاء إجازته، يجب عليه إبلاغ الإدارة فوراً وقبل تاريخ العودة بما لا يقل عن 15 يوماً.
- يجب تقديم أسباب مبررة ومعتمدة لهذا التأخير.
2. الإجراءات التصحيحية:
- إذا لم يقم الموظف بالإخطار المسبق أو كانت الأسباب غير مبررة، سيتم اتخاذ إجراءات تصحيحية تبدأ بتوجيه إنذار كتابي يوضع في الملف الشخصي.
3. التأثير على الراتب:
- قد يتم خصم أيام التأخير من راتب الموظف إذا لم يتم اعتماد التمديد.
- يمكن اعتبار أيام التأخير إجازة غير مدفوعة الأجر إذا تجاوزت رصيد الإجازات المستحقة.
4. الإجراءات التأديبية:
- في حال تكرار التأخر دون أسباب مبررة، قد يتم اتخاذ إجراءات تأديبية قد تصل إلى الإيقاف أو إنهاء الخدمة.
- يتم تقييم كل حالة بشكل فردي بناءً على الظروف المحيطة.
5. التنسيق مع الإدارة:
- يجب على الموظف التنسيق مع الإدارة لترتيب العودة وتأكيد موعد العودة النهائي.
- يجب تقديم تقارير طبية أو مستندات داعمة في حالة تمديد الإجازة المرضية.
6. التواصل والمتابعة:
- يجب على الموظف الحفاظ على قنوات تواصل مفتوحة مع الإدارة خلال فترة الإجازة والإبلاغ عن أي تغيير في الخطط.`
    }
};

interface VacationRequestFlowProps {
    employee: { name: string; cpr: string; role: string };
    onBack: () => void;
    onComplete: () => void;
    lang: 'en' | 'ar';
}

// Helper Component for Inputs
const InputGroup = ({ label, value, onChange, type = "text", readOnly = false, isRtl = false }: any) => (
    <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
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

        // Mandatory Fields Validation
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

    // --- REFINED PRINT HANDLER ---
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
                        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
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
                        <InputGroup label={t.lbl_job_title} value={formData.jobTitle} onChange={(v: any) => setFormData({ ...formData, jobTitle: v })} readOnly={isReview} isRtl={isRtl} />
                        <InputGroup label={t.lbl_cpr} value={employee.cpr} readOnly isRtl={isRtl} />
                        <InputGroup label={t.lbl_passport} value={formData.passport} onChange={(v: any) => setFormData({ ...formData, passport: v })} readOnly={isReview} isRtl={isRtl} />
                        <InputGroup label={t.lbl_dept} value={formData.department} onChange={(v: any) => setFormData({ ...formData, department: v })} readOnly={isReview} isRtl={isRtl} />
                        <InputGroup label={t.lbl_location} value={formData.location} onChange={(v: any) => setFormData({ ...formData, location: v })} readOnly={isReview} isRtl={isRtl} />
                        <InputGroup label={t.lbl_join_date} type="date" value={formData.joinDate} onChange={(v: any) => setFormData({ ...formData, joinDate: v })} readOnly={isReview} isRtl={isRtl} />
                        <InputGroup label={t.lbl_last_vac_date} type="date" value={formData.lastVacationDate} onChange={(v: any) => setFormData({ ...formData, lastVacationDate: v })} readOnly={isReview} isRtl={isRtl} />
                    </div>
                    <div className="mb-12">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2"><Calendar className="w-4 h-4" /> {t.lbl_leave_details}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <InputGroup label={t.lbl_from_date} type="date" value={formData.holidayFrom} onChange={(v: any) => setFormData({ ...formData, holidayFrom: v })} readOnly={isReview} isRtl={isRtl} />
                            <InputGroup label={t.lbl_to_date} type="date" value={formData.holidayTo} onChange={(v: any) => setFormData({ ...formData, holidayTo: v })} readOnly={isReview} isRtl={isRtl} />
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
                <div ref={printRef} className="print-root" dir={isRtl ? 'rtl' : 'ltr'}>
                    <style>{`
                    @media print {
                      @page {
                        size: A4;
                        margin: 15mm;
                      }
                      body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      .print-root {
                        font-family: ${isRtl ? "'Arial', serif" : "'Arial', sans-serif"};
                        color: #000;
                        direction: ${isRtl ? 'rtl' : 'ltr'};
                        padding: 20px;
                      }
                    }
                  `}</style>

                    {/* Header Logo/Title Section */}
                    <div className={`flex items-center justify-between border-b-4 border-black pb-6 mb-8 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="w-14 h-14 bg-black text-white rounded-xl flex items-center justify-center">
                                <ShieldCheck className="w-9 h-9" />
                            </div>
                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                <h1 className="text-2xl font-black uppercase text-black">{isRtl ? 'صيدلية تبارك' : 'Tabarak Pharmacy'}</h1>
                                <p className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase">HR Management System</p>
                            </div>
                        </div>
                        <div className={isRtl ? 'text-left' : 'text-right'} dir="ltr">
                            <p className="text-[10px] font-bold text-gray-400">{t.print_date} {new Date().toLocaleDateString()}</p>
                            <p className="text-xs font-black text-black">{t.print_ref}{new Date().getFullYear()}</p>
                        </div>
                    </div>

                    {/* Main Form Title */}
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black border-2 border-black inline-block px-12 py-3 uppercase tracking-widest bg-gray-50">
                            {t.print_form_title}
                        </h2>
                    </div>

                    {/* Employee Block */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 p-8 border border-gray-100 rounded-[2rem] bg-gray-50/30">
                        <PrintItem label={t.lbl_emp_name} value={employee.name} isRtl={isRtl} />
                        <PrintItem label={t.lbl_cpr} value={employee.cpr} isRtl={isRtl} />
                        <PrintItem label={t.lbl_job_title} value={formData.jobTitle} isRtl={isRtl} />
                        <PrintItem label={t.lbl_dept} value={formData.department} isRtl={isRtl} />
                        <PrintItem label={t.lbl_last_vac_date} value={formData.lastVacationDate} isRtl={isRtl} />
                    </div>

                    {/* Leave Reason Grid */}
                    <div className="mb-8">
                        <div className="text-[10px] font-black bg-black text-white p-2 mb-4 tracking-widest text-center uppercase">{t.print_reason_section}</div>
                        <div className="grid grid-cols-3 gap-6 p-4">
                            {['Annual', 'Sick', 'Emergency', 'Special', 'Final', 'Other'].map(type => (
                                <div key={type} className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-5 h-5 border-2 border-black flex items-center justify-center text-sm font-bold ${formData.leaveType === type ? 'bg-black text-white' : ''}`}>
                                        {formData.leaveType === type ? 'X' : ''}
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">{isRtl ? (type === 'Annual' ? 'سنوية' : type === 'Sick' ? 'مرضية' : type === 'Emergency' ? 'طارئة' : type === 'Special' ? 'خاصة' : type === 'Final' ? 'نهائية' : 'أخرى') : type}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Leave Details Block */}
                    <div className="mb-10">
                        <div className="text-[10px] font-black bg-black text-white p-2 mb-4 tracking-widest text-center uppercase">{t.print_details_section}</div>
                        <div className="grid grid-cols-3 gap-8 p-4">
                            <PrintItem label={t.lbl_from_date} value={formData.holidayFrom} isRtl={isRtl} />
                            <PrintItem label={t.lbl_to_date} value={formData.holidayTo} isRtl={isRtl} />
                            <PrintItem label={t.lbl_days} value={String(formData.daysCount)} isRtl={isRtl} />
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="mt-16 grid grid-cols-2 gap-20">
                        <div className="border-t-2 border-black pt-4">
                            <p className="text-center font-black text-black mb-12 italic">{t.print_emp_sig}</p>
                            <p className="text-[9px] text-gray-400 text-center uppercase font-bold tracking-widest">Employee Signature</p>
                        </div>
                        <div className="border-t-2 border-black pt-4">
                            <p className="text-center font-black text-black mb-12 italic">{t.print_mgmt_sig}</p>
                            <p className="text-[9px] text-gray-400 text-center uppercase font-bold tracking-widest">Management Approval</p>
                        </div>
                    </div>

                    {/* Notes Section in Print */}
                    {formData.notes && (
                        <div className="mt-8 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t.lbl_notes}</span>
                            <p className="text-sm font-medium text-gray-700 italic">"{formData.notes}"</p>
                        </div>
                    )}

                    {/* Policy Page Break */}
                    <div style={{ pageBreakBefore: 'always' }} className="pt-10">
                        <div className="text-center mb-8 border-b-2 border-black pb-4">
                            <h2 className="text-xl font-black uppercase tracking-widest">{t.print_policy_ack_title}</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Management Leave Policies</p>
                        </div>
                        <div className={`text-[12px] ${isRtl ? 'leading-[2]' : 'leading-loose'} text-justify text-gray-800 italic`} dir={isRtl ? 'rtl' : 'ltr'}>
                            {t.policy_text}
                        </div>

                        <div className="mt-12 p-8 border-2 border-dashed border-gray-300 rounded-3xl">
                            <p className={`font-black text-sm text-black mb-8 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                                {isRtl
                                    ? `أنا الموقع أدناه، ${employee.name}، أقر بأنني قرأت وفهمت التعليمات المذكورة أعلاه وألتزم بالعودة للعمل في الموعد المحدد.`
                                    : `I, the undersigned ${employee.name}, acknowledge that I have read and understood the above instructions and commit to returning to work on the scheduled date.`}
                            </p>
                            <div className="grid grid-cols-2 gap-10">
                                <div className={`border-b border-gray-400 pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'التوقيع:' : 'Signature:'}</div>
                                <div className={`border-b border-gray-400 pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'التاريخ:' : 'Date:'} {new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Document Footer */}
                    <div className="fixed bottom-0 left-0 right-0 p-8">
                        <div className={`flex justify-between items-center text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] border-t border-gray-100 pt-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span>{t.print_system_footer}</span>
                            <span>{t.print_official_doc}</span>
                            <span>{t.print_page} 1 / 2</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PRIVATE PRINT ITEM ---
const PrintItem = ({ label, value, isRtl }: { label: string, value: string, isRtl: boolean }) => (
    <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{label}</span>
        <span className="text-lg font-black text-black block border-b-2 border-gray-100 pb-1">{value || '---'}</span>
    </div>
);
