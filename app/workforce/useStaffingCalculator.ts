
import { useState, useMemo } from 'react';

export type Region = {
    id: string;
    name: string;
    branches24h: number; // 3 shifts
    branchesRegular: number; // 2 shifts
};

export const useStaffingCalculator = (initialRegions: Region[]) => {
    const [regions, setRegions] = useState<Region[]>(initialRegions);
    const [includePublicHolidays, setIncludePublicHolidays] = useState(false);
    const [includeRamadan, setIncludeRamadan] = useState(false);
    const [includeAnnualLeave, setIncludeAnnualLeave] = useState(false);
    const [ramadanConfig, setRamadanConfig] = useState({
        totalFemaleHours: 1000, // Total accumulated hours for all female staff
        totalMaleHours: 1000,   // Total accumulated hours for all male staff
        maleDayValuation: 8,  // 8 hours = 1 day for males
        femaleDayValuation: 6 // 6 hours = 1 day for females
    });

    // Constants
    const DAYS_IN_YEAR = 365;
    const LEAVES_WEEKLY = 4 * 12; // 48
    const LEAVES_ANNUAL = 30;
    const LEAVES_PUBLIC_HOLIDAYS = 14;

    const results = useMemo(() => {
        // 1. Calculate Total Working Days per Employee
        const totalLeaves = LEAVES_WEEKLY +
            (includePublicHolidays ? LEAVES_PUBLIC_HOLIDAYS : 0) +
            (includeAnnualLeave ? LEAVES_ANNUAL : 0);
        const workingDaysPerEmployee = DAYS_IN_YEAR - totalLeaves;

        // 2. Calculate Total Demand
        let totalDailyShifts = 0;

        regions.forEach(region => {
            const shifts24h = region.branches24h * 3;
            const shiftsRegular = region.branchesRegular * 2;
            totalDailyShifts += (shifts24h + shiftsRegular);
        });

        const totalAnnualShiftsNeeded = totalDailyShifts * DAYS_IN_YEAR;

        // 3. Base Headcount (Without Ramadan)
        const basePharmacistsNeededRaw = totalAnnualShiftsNeeded / workingDaysPerEmployee;
        const basePharmacistsNeeded = Math.ceil(basePharmacistsNeededRaw);

        // 6. Ramadan Analysis
        // New Logic: Direct input of total hours
        // Fallbacks added to prevent NaN if state is stale during hot reload
        const femaleTotalHours = ramadanConfig.totalFemaleHours || 0;
        const maleTotalHours = ramadanConfig.totalMaleHours || 0;
        const totalRamadanHours = femaleTotalHours + maleTotalHours;

        // Convert to Equivalent Days Off (The User's specific rule)
        // Female: 6 hours extra = 1 day
        // Male: 8 hours extra = 1 day
        const femaleValuation = ramadanConfig.femaleDayValuation || 6;
        const maleValuation = ramadanConfig.maleDayValuation || 8;

        const femaleDaysOff = femaleTotalHours / femaleValuation;
        const maleDaysOff = maleTotalHours / maleValuation;

        const ramadanEquivalentShifts = femaleDaysOff + maleDaysOff;

        // How many extra pharmacists (FTE) needed to cover these specific days off?
        const ramadanCoverageFTE = ramadanEquivalentShifts / workingDaysPerEmployee;

        // 4. Final Headcount
        // If Ramadan enabled, we add the coverage FTE to the total
        const finalTotalPharmacistsNeeded = includeRamadan
            ? Math.ceil(basePharmacistsNeededRaw + ramadanCoverageFTE)
            : basePharmacistsNeeded;

        // 5. Calculate Relief Force
        // Relief Force = Total Headcount - Base Daily Staffing
        const reliefForceSize = finalTotalPharmacistsNeeded - totalDailyShifts;

        // 6. Coverage Ratio
        const coverageRatio = totalDailyShifts > 0 ? (finalTotalPharmacistsNeeded / totalDailyShifts) : 0;

        return {
            totalDailyShifts,
            totalPharmacistsNeeded: finalTotalPharmacistsNeeded,
            basePharmacistsNeeded, // exposed for comparison if needed
            reliefForceSize,
            coverageRatio,
            workingDaysPerEmployee,
            ramadan: {
                totalHours: totalRamadanHours,
                equivalentShifts: ramadanEquivalentShifts,
                coverageFTE: ramadanCoverageFTE,
                breakdown: {
                    femaleDaysOff,
                    maleDaysOff
                },
                isActive: includeRamadan
            }
        };
    }, [regions, includePublicHolidays, includeRamadan, includeAnnualLeave, ramadanConfig]);

    const updateRegion = (id: string, field: 'branches24h' | 'branchesRegular', value: number) => {
        setRegions(prev => prev.map(r =>
            r.id === id ? { ...r, [field]: Math.max(0, value) } : r
        ));
    };

    return {
        regions,
        setRegions,
        updateRegion,
        includePublicHolidays,
        setIncludePublicHolidays,
        includeRamadan,
        setIncludeRamadan,
        includeAnnualLeave,
        setIncludeAnnualLeave,
        ramadanConfig,
        setRamadanConfig,
        results
    };
};
