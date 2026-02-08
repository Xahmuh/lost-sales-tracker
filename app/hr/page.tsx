import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    IdCard,
    ArrowRight,
    Power,
    Globe,
    FileText,
    Mail,
    Printer,
    UploadCloud,
    CheckCircle2,
    Loader2,
    Lock,
    Trash2,
    FileCheck,
    Search,
    ChevronLeft,
    ChevronRight,
    Info,
    AlertCircle,
    Clock,
    ExternalLink,
    ShieldCheck,
    Building2,
    HelpCircle,
    ChevronDown,
    Bell,
    UserCircle2,
    CalendarDays,
    FileText as FileTextIcon
} from 'lucide-react';
import { VacationRequestFlow } from './VacationRequestFlow';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

// --- CONFIGURATION ---
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzhFVrwIdvBK4qOK13y0dXxpaownQMsKfnI_iZFNGh3PWnykKBzgDSxT1Sb1AbbddMy/exec";

const translations = {
    en: {
        portal_name: "HR self-service",
        service_title: "My HR Requests",
        login_title: "HR Request Portal",
        login_desc: "Please verify your identity to access the HR self-service.",
        cpr_label: "CPR Number",
        btn_continue: "Continue Securely",
        btn_logout: "Sign Out",
        btn_back: "Back",
        btn_next: "Continue",
        lbl_submit: "Review Request",
        btn_confirm: "Submit Officially",
        lbl_passport: "Passport Number",
        lbl_passport_name: "Full Name as in Passport",
        lbl_license: "NHRA License",
        lbl_sponsor: "Sponsor Name",
        lbl_join_date: "Joining Date",
        lbl_doc_type: "Document Type",
        lbl_others: "Please specify document",
        lbl_reason: "Reason of Document",
        lbl_reason_placeholder: "Briefly explain the purpose of this document",
        lbl_req_date: "Needed By Date",
        lbl_email: "Corporate Email",
        lbl_delivery: "Delivery Method",
        lbl_files: "Attachments",
        card_email_title: "E-Certificate (PDF)",
        card_email_desc: "Sent to your corporate email",
        card_print_title: "Physical Copy",
        card_print_desc: "Collect from HR department",
        step_identity: "Access",
        step_details: "Request Info",
        step_delivery: "Delivery",
        step_review: "Confirmation",
        track_status: "Track My Requests",
        new_request: "New Document",
        draft_saved: "Draft Saved",
        no_requests: "No requests found",
        reference_id: "Reference #",
        submitted_on: "Date",
        status_pending: "Processing",
        status_completed: "Ready",
        review_title: "Final Confirmation",
        review_desc: "Verify these details before sending to HR.",
        declaration: "I confirm all provided data is accurate.",
        toast_cpr_missing: "CPR is required",
        toast_cpr_not_found: "Employee record not found",
        submission_success: "Request Submitted successfully",
        cpr_placeholder: "000000000",
        upload_limits: "Max 5MB",
        click_upload: "Click to upload files",
        select_placeholder: "Select an option...",
        friday_warning: "Delivery is not available on Fridays. Please select another date.",
        btn_remove: "Remove"
    },
    ar: {
        portal_name: "تبارك للموارد البشرية",
        service_title: "نظام إصدار المستندات",
        login_title: "دخول الموظف",
        login_desc: "يرجى تسجيل الدخول برقمك الشخصي للوصول للنظام.",
        cpr_label: "الرقم الشخصي",
        btn_continue: "توثيق",
        btn_logout: "خروج",
        btn_back: "رجوع",
        btn_next: "استمرار",
        btn_submit: "مراجعة الطلب",
        btn_confirm: "إرسال رسمي",
        lbl_passport: "رقم جواز السفر",
        lbl_passport_name: "الاسم الكامل كما في الجواز",
        lbl_license: "ترخيص الهيئة (NHRA)",
        lbl_sponsor: "اسم الكفيل",
        lbl_join_date: "تاريخ الالتحاق",
        lbl_doc_type: "نوع المستند",
        lbl_others: "يرجى تحديد الوثيقة",
        lbl_reason: "سبب طلب الوثيقة",
        lbl_reason_placeholder: "اشرح باختصار الغرض من هذه الوثيقة",
        lbl_req_date: "تاريخ الاستحقاق",
        lbl_email: "البريد الإلكتروني",
        lbl_delivery: "طريقة الاستلام",
        lbl_files: "المرفقات",
        card_email_title: "شهادة إلكترونية (PDF)",
        card_email_desc: "ترسل لبريدك الإلكتروني رسمي",
        card_print_title: "نسخة ورقية",
        card_print_desc: "استلام من قسم الموارد البشرية",
        step_identity: "الدخول",
        step_details: "بيانات الطلب",
        step_delivery: "الاستلام",
        step_review: "التأكيد",
        track_status: "طلباتي السابقة",
        new_request: "طلب جديد",
        draft_saved: "تم حفظ المسودة",
        no_requests: "لا توجد طلبات سابقة",
        reference_id: "رقم المرجع #",
        submitted_on: "التاريخ",
        status_pending: "قيد المعالجة",
        status_completed: "جاهز",
        review_title: "التأكيد النهائي",
        review_desc: "تأكد من صحة البيانات قبل الإرسال.",
        declaration: "أؤكد أن جميع البيانات المقدمة صحيحة.",
        toast_cpr_missing: "الرقم الشخصي مطلوب",
        toast_cpr_not_found: "سجل الموظف غير موجود",
        submission_success: "تم إرسال الطلب بنجاح",
        cpr_placeholder: "000000000",
        upload_limits: "الحد الأقصى 5 ميجا",
        select_placeholder: "اختر من القائمة...",
        friday_warning: "التسليم غير متاح أيام الجمعة. يرجى اختيار تاريخ آخر.",
        btn_remove: "حذف"
    }
};

type Language = 'en' | 'ar';
type Step = 1 | 2 | 3 | 4 | 5;

interface HRPortalPageProps {
    onBack?: () => void;
}

export const HRPortalPage: React.FC<HRPortalPageProps> = ({ onBack }) => {
    const [lang, setLang] = useState<Language>('en');
    const [step, setStep] = useState<Step>(1);
    const [selectedService, setSelectedService] = useState<'documents' | 'vacation' | null>(null);
    const [cpr, setCpr] = useState('');
    const [employee, setEmployee] = useState({ name: '', cpr: '', role: 'Employee' });
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [declared, setDeclared] = useState(false);

    const [formData, setFormData] = useState({
        passport: '',
        passportName: '',
        license: '',
        sponsor: '',
        joinDate: '',
        salary: '',
        docTypes: [] as string[],
        otherDocType: '',
        docReason: '',
        reason: '', // General internal reason
        reqDate: '',
        email: '',
        delivery: ''
    });
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    const t = translations[lang];
    const isRtl = lang === 'ar';

    useEffect(() => {
        const saved = localStorage.getItem('hr_doc_draft');
        if (saved) {
            try { setFormData(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('hr_doc_draft', JSON.stringify(formData));
    }, [formData]);

    const toggleLang = () => setLang(l => l === 'en' ? 'ar' : 'en');
    const showToast = (msg: string, icon: 'success' | 'error' | 'warning') => {
        Swal.fire({ toast: true, position: 'top-end', icon, title: msg, showConfirmButton: false, timer: 3000 });
    };

    const handleLogin = async () => {
        if (!cpr.trim()) {
            showToast(t.toast_cpr_missing, 'warning');
            return;
        }
        setIsAuthenticating(true);
        try {
            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "login", cpr: cpr.trim() })
            });
            const result = await response.json();
            if (result.result === "success") {
                setEmployee({ name: result.name, cpr: cpr.trim(), role: 'Employee' });
                setStep(2);
            } else {
                throw new Error("No record");
            }
        } catch (error) {
            showToast(t.toast_cpr_not_found, 'error');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const isFriday = (dateStr: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getDay() === 5;
    };

    const finalSubmit = async () => {
        if (!declared) {
            showToast(isRtl ? "يرجى تأكيد الإقرار" : "Please confirm declaration", 'warning');
            return;
        }
        if (isFriday(formData.reqDate)) {
            showToast(t.friday_warning, 'error');
            return;
        }

        setIsSubmitting(true);
        const refNum = 'DOC-' + Math.floor(100000 + Math.random() * 900000);
        try {
            const attachments = await Promise.all(uploadedFiles.map(async (file) => {
                const base64 = await toBase64(file);
                return { filename: file.name, content: base64.split(",")[1], mimeType: file.type };
            }));

            const finalDocTypes = formData.docTypes.map(d => d === 'Others' ? `Other: ${formData.otherDocType}` : d);

            const payload = {
                action: "submit",
                "Name of Employee": employee.name,
                "CPR Number": employee.cpr,
                "Passport Number": formData.passport,
                "Passport Name": formData.passportName,
                "NHRA License Number": formData.license,
                "Name of Sponsor": formData.sponsor,
                "Joining Date": formData.joinDate,
                "Type of Document": finalDocTypes.join(", "),
                "Salary": formData.salary,
                "Purpose of Document": formData.docReason,
                "Internal Reason": formData.reason,
                "Desired Date": formData.reqDate,
                "Employee Email": formData.email,
                "Preferred Delivery Method": formData.delivery,
                referenceNumber: refNum,
                attachments
            };
            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.result === "success") {
                await supabase.hrRequests.create({
                    refNum,
                    employeeName: employee.name,
                    cpr: employee.cpr,
                    passport: formData.passport,
                    passportName: formData.passportName,
                    license: formData.license,
                    sponsor: formData.sponsor,
                    joinDate: formData.joinDate,
                    salary: formData.salary,
                    docTypes: formData.docTypes,
                    docReason: formData.docReason,
                    reqDate: formData.reqDate,
                    email: formData.email,
                    deliveryMethod: formData.delivery,
                    otherDocType: formData.otherDocType
                });
                localStorage.removeItem('hr_doc_draft');
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#b91c1c', '#ffffff'] });
                Swal.fire({
                    icon: 'success',
                    title: t.submission_success,
                    html: `<div class="p-6 bg-red-50 border border-red-100 rounded-3xl mt-4"><p class="text-[10px] font-black uppercase text-red-400 mb-2">${t.reference_id}</p><h2 class="text-4xl font-black text-slate-900 tracking-tighter">${refNum}</h2></div>`,
                    confirmButtonColor: '#b91c1c',
                    confirmButtonText: isRtl ? 'تم الإطلاع علي التنبيه' : 'Acknowledged'
                }).then(() => {
                    if (onBack) onBack(); else window.location.reload();
                });
            } else { throw new Error("Failed"); }
        } catch (error) { showToast("Submission Failed", 'error'); }
        finally { setIsSubmitting(false); }
    };

    const toBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    return (
        <div className={`flex flex-col h-full bg-[#fcfdfe] overflow-hidden ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>

            {/* BRANDED PROFESSIONAL HEADER (NO LOGO) */}
            <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-8 lg:px-14 shrink-0 transition-all z-50">
                {employee.name ? (
                    <div className="flex items-center gap-6 animate-in slide-in-from-left-4 duration-500">
                        <div className="w-14 h-14 bg-brand text-white rounded-[1.25rem] flex items-center justify-center text-2xl font-black shadow-lg shadow-brand/20">
                            {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{employee.name}</h2>
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg">CPR {employee.cpr}</div>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.portal_name}</span>
                            </div>
                        </div>
                    </div>
                ) : <div></div>}

                <div className="flex items-center gap-5">
                    <button
                        onClick={toggleLang}
                        className="h-12 px-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group"
                    >
                        <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        {lang === 'en' ? 'Arabic' : 'English'}
                    </button>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="h-12 px-6 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 rounded-2xl border border-rose-100 flex items-center justify-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
                        >
                            <Power className="w-4 h-4" />
                            <span>Leave & Back</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto relative bg-[#fcfdfe]">
                {!employee.name ? (
                    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-slate-50">
                        <div className="w-full max-w-lg">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">{t.login_title}</h2>
                                <p className="text-slate-500 font-medium">{t.login_desc}</p>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-2 border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="space-y-4">
                                        <label htmlFor="cpr-input" className={`text-xs font-bold text-slate-900 uppercase tracking-widest block ${isRtl ? 'text-right' : ''}`}>{t.cpr_label}</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <IdCard className="h-6 w-6 text-slate-400 group-focus-within:text-brand transition-colors" />
                                            </div>
                                            <input
                                                id="cpr-input"
                                                type="text"
                                                value={cpr}
                                                onChange={(e) => setCpr(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                className="block w-full h-16 pl-14 pr-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all"
                                                placeholder="Example: 901234567"
                                                title={t.cpr_label}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLogin}
                                        disabled={isAuthenticating}
                                        className="w-full h-14 bg-[#D92D20] text-white rounded-xl font-bold text-base shadow-lg shadow-red-500/20 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <span>{t.btn_continue}</span>
                                                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
                                <Lock className="w-3 h-3" />
                                <span className="text-[11px] font-medium">End-to-end encrypted connection</span>
                            </div>
                        </div>
                    </div>
                ) : selectedService === 'vacation' ? (
                    <div className="h-full overflow-y-auto">
                        <VacationRequestFlow
                            employee={employee}
                            lang={lang}
                            onBack={() => { setSelectedService(null); setStep(2); }}
                            onComplete={() => window.location.reload()}
                        />
                    </div>
                ) : (
                    // FOCUSED FORM FLOW
                    <div className="max-w-4xl mx-auto py-20 px-8 animate-in fade-in duration-1000">

                        {/* STEP 2: SERVICE SELECTION */}
                        {step === 2 && (
                            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-slate-900 mb-4">{t.service_title}</h2>
                                    <p className="text-slate-500 font-medium">Select the type of request you wish to submit.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <button
                                        onClick={() => { setSelectedService('documents'); setStep(3); }}
                                        className="group relative p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-500 text-left overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                            <FileTextIcon className="w-32 h-32 text-blue-900" />
                                        </div>
                                        <div className="w-16 h-16 bg-blue-50 border-2 border-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-500 relative z-10">
                                            <FileTextIcon className="w-8 h-8" />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">Internal Documents</h3>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed group-hover:text-slate-600">Request salary certificates, employment letters, and other official HR documentation.</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setSelectedService('vacation'); }}
                                        className="group relative p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-500 text-left overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                            <CalendarDays className="w-32 h-32 text-emerald-900" />
                                        </div>
                                        <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white transition-all duration-500 relative z-10">
                                            <CalendarDays className="w-8 h-8" />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-emerald-600 transition-colors">Vacation Request</h3>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed group-hover:text-slate-600">Submit a new leave request, view policies, and manage your vacation schedule.</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP PROGRESSION (Only for Documents) */}
                        {step > 2 && (
                            <div className="flex items-center justify-center gap-4 mb-24">
                                {[3, 4, 5].map(idx => (
                                    <React.Fragment key={idx}>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-700 shadow-sm ${step >= idx ? 'bg-brand text-white scale-110 shadow-lg shadow-brand/20' : 'bg-white border border-slate-100 text-slate-200'}`}>
                                            {idx - 2}
                                        </div>
                                        {idx < 5 && <div className={`w-16 h-0.5 rounded-full transition-all duration-1000 ${step > idx ? 'bg-brand' : 'bg-slate-100'}`}></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        <form className="space-y-20">
                            {/* STEP 3: DOCUMENTS & REASONS */}
                            {step === 3 && (
                                <div className="space-y-20 animate-in slide-in-from-bottom-12 duration-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="passportName" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                                {t.lbl_passport_name} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="passportName"
                                                value={formData.passportName}
                                                onChange={e => setFormData({ ...formData, passportName: e.target.value })}
                                                className="w-full h-12 bg-white border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 px-4 rounded-xl text-slate-900 font-medium outline-none transition-all"
                                                placeholder="e.g. MOHAMED AHMED"
                                                title={t.lbl_passport_name}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="passportNumber" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                                {t.lbl_passport} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="passportNumber"
                                                value={formData.passport}
                                                onChange={e => setFormData({ ...formData, passport: e.target.value })}
                                                className="w-full h-12 bg-white border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 px-4 rounded-xl text-slate-900 font-medium outline-none transition-all"
                                                title={t.lbl_passport}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="nhraLicense" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                                {t.lbl_license} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="nhraLicense"
                                                value={formData.license}
                                                onChange={e => setFormData({ ...formData, license: e.target.value })}
                                                className="w-full h-12 bg-white border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 px-4 rounded-xl text-slate-900 font-medium outline-none transition-all"
                                                title={t.lbl_license}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="sponsor" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                                {t.lbl_sponsor} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="sponsor"
                                                    value={formData.sponsor}
                                                    onChange={e => setFormData({ ...formData, sponsor: e.target.value })}
                                                    className="w-full h-12 bg-white border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 px-4 rounded-xl text-slate-900 font-medium outline-none transition-all appearance-none"
                                                    title={t.lbl_sponsor}
                                                >
                                                    <option value="">{t.select_placeholder}</option>
                                                    <option value="TABARAK PHARMACY WLL">TABARAK PHARMACY WLL</option>
                                                    <option value="ALHODA PHARMACY WLL">ALHODA PHARMACY WLL</option>
                                                    <option value="SANAD PHARMACY WLL">SANAD PHARMACY WLL</option>
                                                    <option value="DISTRICT PHARMACY WLL">DISTRICT PHARMACY WLL</option>
                                                    <option value="ALNAHAR PHARMACY WLL">ALNAHAR PHARMACY WLL</option>
                                                    <option value="DAMISTAN PHARMACY WLL">DAMISTAN PHARMACY WLL</option>
                                                    <option value="JANABIYA SQUARE PHARMACY WLL">JANABIYA SQUARE PHARMACY WLL</option>
                                                    <option value="JAMILA PHARMACY WLL">JAMILA PHARMACY WLL</option>
                                                    <option value="SANAD 2 PHARMACY WLL">SANAD 2 PHARMACY WLL</option>
                                                </select>
                                                <ChevronDown className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none`} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="joinDate" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                                {t.lbl_join_date} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="joinDate"
                                                type="date"
                                                value={formData.joinDate}
                                                onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                                                className="w-full h-12 bg-white border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 px-4 rounded-xl font-medium outline-none transition-all text-slate-500 focus:text-slate-900"
                                                title={t.lbl_join_date}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label htmlFor="docTypeDisplay" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                            {t.lbl_doc_type} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-1 gap-2">
                                            <input
                                                id="docTypeDisplay"
                                                value={formData.docTypes.join(", ")}
                                                readOnly
                                                className="w-full h-12 bg-white border border-slate-200 px-4 rounded-xl text-slate-500 font-medium outline-none cursor-default"
                                                placeholder={t.select_placeholder}
                                                title={t.lbl_doc_type}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {['Experience Certificate', 'Employment Certificate', 'Salary Certificate', 'NOC', 'Bank Letter', 'Embassy Letter', 'Others'].map(doc => (
                                                <button
                                                    key={doc}
                                                    type="button"
                                                    onClick={() => {
                                                        const types = formData.docTypes.includes(doc)
                                                            ? formData.docTypes.filter(t => t !== doc)
                                                            : [...formData.docTypes, doc];
                                                        setFormData({ ...formData, docTypes: types });
                                                    }}
                                                    className={`px-4 py-3 rounded-xl text-left border transition-all flex items-center gap-3 ${formData.docTypes.includes(doc) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${formData.docTypes.includes(doc) ? 'border-white bg-white' : 'border-slate-300'}`}>
                                                        {formData.docTypes.includes(doc) && <div className="w-2 h-2 rounded-full bg-slate-900"></div>}
                                                    </div>
                                                    <span className="text-sm font-medium">{doc}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* CONDITIONAL SALARY INPUT */}
                                        {formData.docTypes.includes('Salary Certificate') && (
                                            <div className="mt-4 animate-in zoom-in-95 duration-500">
                                                <label htmlFor="salary" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1 mb-2">
                                                    Monthly Salary (BHD) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="salary"
                                                    type="number"
                                                    value={formData.salary}
                                                    onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                                    className="w-full h-12 bg-white border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 px-4 rounded-xl text-slate-900 font-medium outline-none transition-all"
                                                    placeholder="e.g. 500"
                                                    title="Monthly Salary (BHD)"
                                                />
                                            </div>
                                        )}

                                        {/* CONDITIONAL SPECIFICATION */}
                                        {formData.docTypes.includes('Others') && (
                                            <div className="mt-4 animate-in zoom-in-95 duration-500">
                                                <label htmlFor="otherDocType" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1 mb-2">
                                                    {t.lbl_others} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="otherDocType"
                                                    value={formData.otherDocType}
                                                    onChange={e => setFormData({ ...formData, otherDocType: e.target.value })}
                                                    className="w-full h-12 bg-white border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 px-4 rounded-xl text-slate-900 font-medium outline-none transition-all"
                                                    placeholder="..."
                                                    title={t.lbl_others}
                                                />
                                            </div>
                                        )}

                                        {/* REASON OF DOCUMENT FIELD */}
                                        <div className="mt-8 space-y-2">
                                            <label htmlFor="docReason" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                                {t.lbl_reason}
                                            </label>
                                            <textarea
                                                id="docReason"
                                                value={formData.docReason}
                                                onChange={e => setFormData({ ...formData, docReason: e.target.value })}
                                                className="w-full h-32 bg-white border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 p-4 rounded-xl text-slate-900 font-medium outline-none transition-all resize-none"
                                                placeholder={t.lbl_reason_placeholder}
                                                title={t.lbl_reason}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-12 border-t border-slate-100">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="px-8 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                                        >
                                            Back to Menu
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!formData.passportName || !formData.passport || !formData.license || !formData.sponsor || !formData.joinDate || formData.docTypes.length === 0) {
                                                    showToast(isRtl ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields", 'warning');
                                                    return;
                                                }
                                                if (formData.docTypes.includes('Others') && !formData.otherDocType) {
                                                    showToast(isRtl ? "يرجى تحديد نوع الوثيقة" : "Please specify document type", 'warning');
                                                    return;
                                                }
                                                if (formData.docTypes.includes('Salary Certificate') && !formData.salary) {
                                                    showToast(isRtl ? "يرجى إدخال الراتب" : "Please enter salary", 'warning');
                                                    return;
                                                }
                                                setStep(4);
                                            }}
                                            className="px-16 py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-brand hover:scale-105 active:scale-95 transition-all flex items-center gap-5"
                                        >
                                            <span>{t.btn_next}</span>
                                            <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: DISPATCH DETAILS */}
                            {step === 4 && (
                                <div className="space-y-8 animate-in slide-in-from-right-12 duration-700">
                                    {/* Date & Email Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="reqDate" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                                {t.lbl_req_date} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="reqDate"
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={formData.reqDate}
                                                onChange={e => {
                                                    if (isFriday(e.target.value)) showToast(t.friday_warning, 'warning');
                                                    setFormData({ ...formData, reqDate: e.target.value });
                                                }}
                                                className={`w-full h-12 bg-white border border-slate-200 px-4 rounded-xl text-slate-900 font-medium outline-none transition-all ${isFriday(formData.reqDate) ? 'border-rose-500 ring-4 ring-rose-500/10' : 'focus:border-slate-400 focus:ring-4 focus:ring-slate-100'}`}
                                                title={t.lbl_req_date}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                                {t.lbl_email} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full h-12 bg-white border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 px-4 rounded-xl text-slate-900 font-medium outline-none transition-all"
                                                placeholder="name@tabarak.com"
                                                title={t.lbl_email}
                                            />
                                        </div>
                                    </div>

                                    {/* Delivery Method Cards */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                            {t.lbl_delivery} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, delivery: 'PDF by Email' })}
                                                className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 text-left group hover:shadow-lg hover:-translate-y-0.5 duration-500 ${formData.delivery === 'PDF by Email' ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/20' : 'bg-white border-slate-100 hover:border-blue-400/50'}`}
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                                                    <Mail className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-sm mb-0.5 tracking-tight group-hover:text-blue-600 transition-colors uppercase">{t.card_email_title}</h4>
                                                    <p className="text-xs text-slate-400 font-bold">{t.card_email_desc}</p>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, delivery: 'Printed Copy' })}
                                                className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 text-left group hover:shadow-lg hover:-translate-y-0.5 duration-500 ${formData.delivery === 'Printed Copy' ? 'bg-white border-orange-500 shadow-xl shadow-orange-500/20' : 'bg-white border-slate-100 hover:border-orange-400/50'}`}
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                                                    <Printer className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-sm mb-0.5 tracking-tight group-hover:text-orange-600 transition-colors uppercase">{t.card_print_title}</h4>
                                                    <p className="text-xs text-slate-400 font-bold">{t.card_print_desc}</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Attachments Section */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-700 px-1 flex items-center gap-1">
                                            {t.lbl_files} <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <div
                                            onClick={() => document.getElementById('final-files-refined')?.click()}
                                            className="border-2 border-dashed border-slate-200 rounded-[2rem] py-12 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-red-200 transition-all cursor-pointer group"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center mb-4 text-slate-400 group-hover:text-red-500 group-hover:border-red-100 group-hover:scale-110 transition-all duration-500 shadow-sm">
                                                <UploadCloud className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1 group-hover:text-red-600 transition-colors">{t.click_upload}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">PDF, PNG, JPG (Max 5MB)</p>
                                            <input id="final-files-refined" type="file" multiple className="hidden" onChange={e => { if (e.target.files) setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]); }} />
                                        </div>
                                        {uploadedFiles.length > 0 && (
                                            <div className="space-y-2">
                                                {uploadedFiles.map((f, i) => (
                                                    <div key={i} className="bg-white border border-slate-100 p-3 rounded-xl flex items-center justify-between group shadow-sm">
                                                        <div className="flex items-center gap-3 truncate">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">PDF</div>
                                                            <span className="text-xs font-bold text-slate-700 truncate">{f.name}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== i))}
                                                            className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                                                            aria-label={t.btn_remove}
                                                            title={t.btn_remove}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="flex items-center gap-6 pt-8">
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="flex-1 h-14 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            {isRtl ? 'رجوع' : 'Back'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(5)}
                                            className="flex-1 h-14 bg-[#0F172A] text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                                        >
                                            {isRtl ? 'مراجعة الطلب' : 'Submit Request'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: FORMAL REVIEW */}
                            {step === 5 && (
                                <div className="space-y-20 animate-in zoom-in-95 duration-700">
                                    <div className="text-center">
                                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-6">{t.review_title}</h2>
                                        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-lg mx-auto">{t.review_desc}</p>
                                    </div>

                                    <div className="bg-slate-900 text-white rounded-[5rem] p-16 lg:p-24 shadow-[0_80px_150px_-40px_rgba(15,23,42,0.4)] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/10 rounded-full blur-[120px] -mr-64 -mt-64 transition-transform group-hover:scale-110 duration-1000"></div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 relative z-10">
                                            <div className="space-y-16">
                                                <div>
                                                    <label className="text-[10px] font-black text-brand uppercase tracking-[0.5em] block mb-10 border-l-4 border-brand pl-6">{t.step_details}</label>
                                                    <div className="space-y-8">
                                                        <div className="flex justify-between border-b border-white/10 pb-6"><span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Sponsor Entity</span><span className="font-black text-xl">{formData.sponsor}</span></div>
                                                        <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
                                                            <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Documents Requested</span>
                                                            <span className="font-black text-2xl text-brand leading-tight">
                                                                {formData.docTypes.map(d => d === 'Others' ? formData.otherDocType : d).join(" • ")}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col gap-4">
                                                            <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Purpose</span>
                                                            <span className="font-bold text-lg text-slate-400 leading-relaxed italic">"{formData.docReason || 'N/A'}"</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-16">
                                                <div>
                                                    <label className="text-[10px] font-black text-brand uppercase tracking-[0.5em] block mb-10 border-l-4 border-brand pl-6">{t.step_delivery}</label>
                                                    <div className="space-y-8">
                                                        <div className="flex justify-between border-b border-white/10 pb-6"><span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Method</span><span className="font-black text-xl">{formData.delivery}</span></div>
                                                        <div className="flex justify-between border-b border-white/10 pb-6"><span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Desired Date</span><span className="font-black text-2xl text-emerald-400">{formData.reqDate}</span></div>
                                                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                                            <div className="flex items-center gap-3 text-brand mb-4">
                                                                <ShieldCheck className="w-5 h-5" />
                                                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Official Filing System v3.0</span>
                                                            </div>
                                                            <p className="text-[11px] text-white/30 leading-relaxed font-bold uppercase tracking-wider">Direct encryption bridge established to Tabarak Central HR servers.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className={`group p-12 rounded-[4rem] border-2 transition-all flex items-start gap-10 cursor-pointer ${declared ? 'bg-brand/5 border-brand shadow-2xl shadow-brand/10 scale-[1.03]' : 'bg-white border-slate-100 hover:border-brand/40'}`}
                                        onClick={() => setDeclared(!declared)}
                                    >
                                        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all shrink-0 ${declared ? 'bg-brand text-white shadow-xl rotate-3' : 'bg-slate-50 text-slate-200'}`}>
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className={`text-lg font-black leading-relaxed ${declared ? 'text-brand' : 'text-slate-600'}`}>{t.declaration}</p>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">{isRtl ? 'بموجب قوانين الموارد البشرية' : 'UNDER HR COMPLIANCE POLICY v2.4'}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-20 border-t border-slate-100">
                                        <button type="button" onClick={() => setStep(4)} className="h-20 px-10 rounded-[2rem] text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all flex items-center gap-4">
                                            <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} /> {t.btn_back}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={finalSubmit}
                                            disabled={isSubmitting || !declared || isFriday(formData.reqDate)}
                                            className="px-24 py-9 bg-brand text-white rounded-[3rem] font-black uppercase text-base tracking-[0.5em] shadow-[0_40px_80px_-15px_rgba(185,28,28,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-8 disabled:opacity-20 disabled:scale-100 disabled:shadow-none"
                                        >
                                            {isSubmitting ? <Loader2 className="w-10 h-10 animate-spin" /> : <FileCheck className="w-10 h-10" />}
                                            <span>{t.btn_confirm}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};
