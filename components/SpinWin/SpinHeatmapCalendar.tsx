
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Zap } from 'lucide-react';

interface SpinHeatmapCalendarProps {
    spins: any[];
}

export const SpinHeatmapCalendar: React.FC<SpinHeatmapCalendarProps> = ({ spins }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];

        const firstDayIndex = date.getDay();
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, month: month - 1, year, isCurrentMonth: false });
        }

        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
            days.push({ day: i, month, year, isCurrentMonth: true });
        }

        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ day: i, month: month + 1, year, isCurrentMonth: false });
        }

        return days;
    }, [currentDate]);

    const dailyStats = useMemo(() => {
        const stats: Record<string, { created: number, redeemed: number }> = {};
        spins.forEach(spin => {
            const cDate = new Date(spin.created_at);
            const cKey = `${cDate.getFullYear()}-${cDate.getMonth()}-${cDate.getDate()}`;
            if (!stats[cKey]) stats[cKey] = { created: 0, redeemed: 0 };
            stats[cKey].created += 1;

            if (spin.redeemed_at) {
                const rDate = new Date(spin.redeemed_at);
                const rKey = `${rDate.getFullYear()}-${rDate.getMonth()}-${rDate.getDate()}`;
                if (!stats[rKey]) stats[rKey] = { created: 0, redeemed: 0 };
                stats[rKey].redeemed += 1;
            }
        });
        return stats;
    }, [spins]);

    const maxActivity = useMemo(() => {
        const values = Object.values(dailyStats).map((s: { created: number, redeemed: number }) => s.created + s.redeemed);
        return values.length > 0 ? Math.max(...values) : 0;
    }, [dailyStats]);


    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{monthName}</h3>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2">{year} Engagement Heatmap</p>
                    </div>
                </div>
                <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:text-brand hover:shadow-lg rounded-lg transition-all text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-2"></div>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:text-brand hover:shadow-lg rounded-lg transition-all text-slate-400">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-4">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 flex-1">
                {daysInMonth.map((dateObj, idx) => {
                    const key = `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
                    const stat = dailyStats[key] || { created: 0, redeemed: 0 };
                    const isToday = new Date().toDateString() === new Date(dateObj.year, dateObj.month, dateObj.day).toDateString();
                    const total = stat.created + stat.redeemed;

                    // Intensity calculation based on total activity
                    const intensity = total === 0 ? 'bg-slate-50' : 'bg-slate-100';

                    return (
                        <div
                            key={idx}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-start p-2 transition-all duration-500 group relative ${!dateObj.isCurrentMonth ? 'opacity-0 pointer-events-none' : intensity}`}
                        >
                            <span className={`text-[10px] font-black text-slate-900 mb-1`}>
                                {dateObj.day}
                            </span>

                            {(stat.created > 0 || stat.redeemed > 0) && (
                                <div className="flex flex-col items-center gap-0.5 w-full">
                                    {stat.created > 0 && (
                                        <div className="text-center leading-tight">
                                            <span className="text-[14px] font-black text-red-600 block">{stat.created}</span>
                                            <span className="text-[12px] font-bold text-red-400 uppercase tracking-tight block">Created</span>
                                        </div>
                                    )}
                                    {stat.redeemed > 0 && (
                                        <div className="text-center leading-tight mt-1">
                                            <span className="text-[14px] font-black text-orange-500 block">{stat.redeemed}</span>
                                            <span className="text-[12px] font-bold text-orange-400 uppercase tracking-tight block">Redeemed</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isToday && total === 0 && (
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand rounded-full"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Zap className="w-3 h-3 text-brand" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Spin Activity Density</span>
                </div>
                <div className="flex items-center space-x-1">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-[4px] ${i === 0 ? 'bg-slate-50' : i === 1 ? 'bg-brand/10' : i === 2 ? 'bg-brand/40' : 'bg-brand'}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};
