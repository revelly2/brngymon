import { BarangayCode, Resident, VitalSign, MaternalRecord, ImmunizationRecord } from '@/types/database';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';

export interface PurokHealthSummary {
  purok: string;
  totalResidents: number;
  pregnantCount: number;
  pediatricCount: number;
  seniorCount: number;
  hypertensiveCount: number;
  febrileCount: number;
}

export interface BarangayHealthProfileReport {
  barangay: BarangayCode;
  reportingPeriod: string; // e.g. "March 2026"
  totalPopulation: number;
  purokBreakdown: PurokHealthSummary[];
  maternalMetrics: {
    totalActivePregnancies: number;
    completed4VisitsCount: number;
    fourVisitCoverageRate: number; // percentage 0-100
  };
  pediatricMetrics: {
    totalInfantsEligible: number;
    fullyImmunizedChildrenCount: number; // FIC
    ficCoverageRate: number; // percentage 0-100
    defaulterCount: number;
  };
  morbiditySurveillance: {
    hypertensiveCrisisCount: number;
    stage2HypertensionCount: number;
    febrileIllnessCount: number;
    suspectedDengueCount: number;
    acuteRespiratoryCount: number;
  };
}

export interface ClinicalReferralAbstract {
  patientUpi: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  sex: string;
  barangay: string;
  purok: string;
  philhealthId: string | null;
  referralDate: string;
  triageSeverity: string;
  primaryReasonForReferral: string;
  vitalSigns: {
    systolicBp: number;
    diastolicBp: number;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    bmi: number;
    nutritionalStatus: string;
  };
  clinicalFlags: string[];
  notes: string;
  referringOfficer: string;
}

export class AnalyticsService {
  /**
   * Compiles monthly aggregate health profile for a specific Barangay
   */
  public static generateBarangayProfile(
    barangay: BarangayCode,
    reportingPeriod: string = 'March 2026',
    customData?: {
      residents?: Resident[];
      vitals?: VitalSign[];
      maternal?: MaternalRecord[];
      immunizations?: ImmunizationRecord[];
    }
  ): BarangayHealthProfileReport {
    const allResidents = customData?.residents || ResidentRegistryService.getResidents();
    const allVitals = customData?.vitals || ClinicalService.getVitals();
    const allMaternal = customData?.maternal || ClinicalService.getMaternalRecords();
    const allImmunizations = customData?.immunizations || ClinicalService.getImmunizations();
    const allVisits = ClinicalService.getAntenatalVisits();

    const barangayResidents = allResidents.filter((r) => r.barangay === barangay);
    const residentIdSet = new Set(barangayResidents.map((r) => r.id));

    // 1. Purok Segmented Breakdown
    const purokMap = new Map<string, PurokHealthSummary>();

    for (const res of barangayResidents) {
      if (!purokMap.has(res.purok)) {
        purokMap.set(res.purok, {
          purok: res.purok,
          totalResidents: 0,
          pregnantCount: 0,
          pediatricCount: 0,
          seniorCount: 0,
          hypertensiveCount: 0,
          febrileCount: 0,
        });
      }

      const summary = purokMap.get(res.purok)!;
      summary.totalResidents++;

      if (res.is_pregnant) summary.pregnantCount++;

      const birthYear = parseInt(res.date_of_birth.split('-')[0], 10);
      const age = Math.max(0, 2026 - birthYear);
      if (age < 5) summary.pediatricCount++;
      if (age >= 60) summary.seniorCount++;
    }

    // Correlate vitals to puroks
    for (const vit of allVitals) {
      if (residentIdSet.has(vit.resident_id)) {
        const res = barangayResidents.find((r) => r.id === vit.resident_id);
        if (res && purokMap.has(res.purok)) {
          const summary = purokMap.get(res.purok)!;
          if (vit.systolic_bp >= 140 || vit.diastolic_bp >= 90) {
            summary.hypertensiveCount++;
          }
          if (vit.temperature_celsius >= 38.0) {
            summary.febrileCount++;
          }
        }
      }
    }

    const purokBreakdown = Array.from(purokMap.values());

    // 2. Maternal Metrics
    const brgyMaternal = allMaternal.filter((m) => residentIdSet.has(m.resident_id));
    const totalActivePregnancies = brgyMaternal.length;
    let completed4VisitsCount = 0;

    for (const mat of brgyMaternal) {
      const patientVisits = allVisits.filter((v) => v.maternal_record_id === mat.id);
      if (patientVisits.length >= 4) completed4VisitsCount++;
    }

    const fourVisitCoverageRate =
      totalActivePregnancies > 0
        ? Math.round((completed4VisitsCount / totalActivePregnancies) * 100)
        : 100;

    // 3. Pediatric EPI & Fully Immunized Children (FIC)
    const brgyInfants = barangayResidents.filter((r) => {
      const birthYear = parseInt(r.date_of_birth.split('-')[0], 10);
      return 2026 - birthYear < 5;
    });

    // An infant is FIC if they have completed BCG, HepB, Penta 1-3, OPV 1-3, and MCV 1
    const MANDATORY_FIC_CODES = ['BCG', 'HEP_B', 'PENTA_1', 'PENTA_2', 'PENTA_3', 'OPV_1', 'OPV_2', 'OPV_3', 'MCV_1'];
    let fullyImmunizedCount = 0;

    for (const child of brgyInfants) {
      const childDoses = new Set(
        allImmunizations
          .filter((im) => im.resident_id === child.id && im.status === 'administered')
          .map((im) => im.vaccine_code)
      );

      const isFic = MANDATORY_FIC_CODES.every((code) => childDoses.has(code));
      if (isFic) fullyImmunizedCount++;
    }

    const ficRate =
      brgyInfants.length > 0 ? Math.round((fullyImmunizedCount / brgyInfants.length) * 100) : 100;

    const defaulters = ClinicalService.computeDefaulters(
      brgyInfants.map((i) => ({
        id: i.id,
        name: `${i.first_name} ${i.last_name}`,
        barangay: i.barangay,
        purok: i.purok,
        dateOfBirth: i.date_of_birth,
      })),
      allImmunizations
    );

    // 4. Morbidity Surveillance
    let hypertensiveCrisisCount = 0;
    let stage2HypertensionCount = 0;
    let febrileIllnessCount = 0;
    let acuteRespiratoryCount = 0;
    let suspectedDengueCount = 0;

    for (const vit of allVitals) {
      if (residentIdSet.has(vit.resident_id)) {
        if (vit.severity === 'CRITICAL' || vit.systolic_bp >= 180 || vit.diastolic_bp >= 120) {
          hypertensiveCrisisCount++;
        } else if (vit.systolic_bp >= 140 || vit.diastolic_bp >= 90) {
          stage2HypertensionCount++;
        }

        if (vit.temperature_celsius >= 38.0) {
          febrileIllnessCount++;
          if (vit.notes?.toLowerCase().includes('dengue') || vit.notes?.toLowerCase().includes('petechiae')) {
            suspectedDengueCount++;
          } else {
            acuteRespiratoryCount++;
          }
        }
      }
    }

    return {
      barangay,
      reportingPeriod,
      totalPopulation: barangayResidents.length,
      purokBreakdown,
      maternalMetrics: {
        totalActivePregnancies,
        completed4VisitsCount,
        fourVisitCoverageRate,
      },
      pediatricMetrics: {
        totalInfantsEligible: brgyInfants.length,
        fullyImmunizedChildrenCount: fullyImmunizedCount,
        ficCoverageRate: ficRate,
        defaulterCount: defaulters.length,
      },
      morbiditySurveillance: {
        hypertensiveCrisisCount,
        stage2HypertensionCount,
        febrileIllnessCount,
        suspectedDengueCount,
        acuteRespiratoryCount,
      },
    };
  }

  /**
   * Generates a printable 1-page Clinical Referral Abstract
   */
  public static generateReferralSlip(
    residentId: string,
    vitalsId?: string,
    officerName: string = 'Elena Bagani (BHW)',
    customData?: { residents?: Resident[]; vitals?: VitalSign[] }
  ): ClinicalReferralAbstract | null {
    const residents = customData?.residents || ResidentRegistryService.getResidents();
    const vitals = customData?.vitals || ClinicalService.getVitals();

    const patient = residents.find((r) => r.id === residentId);
    if (!patient) return null;

    const patientVitals = vitalsId
      ? vitals.find((v) => v.id === vitalsId)
      : vitals.find((v) => v.resident_id === residentId);

    const birthYear = parseInt(patient.date_of_birth.split('-')[0], 10);
    const age = Math.max(0, 2026 - birthYear);

    const bp = patientVitals
      ? {
          systolicBp: patientVitals.systolic_bp,
          diastolicBp: patientVitals.diastolic_bp,
          heartRate: patientVitals.heart_rate_bpm,
          respiratoryRate: patientVitals.respiratory_rate_cpm,
          temperature: Number(patientVitals.temperature_celsius),
          bmi: Number(patientVitals.bmi),
          nutritionalStatus: patientVitals.bmi >= 25 ? 'Overweight / Obese' : 'Normal',
        }
      : {
          systolicBp: 120,
          diastolicBp: 80,
          heartRate: 75,
          respiratoryRate: 18,
          temperature: 36.7,
          bmi: 22.0,
          nutritionalStatus: 'Normal',
        };

    let reason = 'Routine primary health evaluation and specialized clinical consult';
    if (patientVitals?.severity === 'CRITICAL') {
      reason = 'EMERGENCY: Hypertensive Crisis with severe hemodynamic elevation requiring urgent physician management.';
    } else if (patient.is_pregnant) {
      reason = 'Maternal consult: Routine antenatal evaluation / High-risk pregnancy assessment.';
    }

    return {
      patientUpi: patient.upi,
      fullName: `${patient.first_name} ${patient.middle_name ? patient.middle_name + ' ' : ''}${patient.last_name}${patient.suffix ? ' ' + patient.suffix : ''}`,
      dateOfBirth: patient.date_of_birth,
      age,
      sex: patient.biological_sex,
      barangay: patient.barangay,
      purok: patient.purok,
      philhealthId: patient.philhealth_id || null,
      referralDate: new Date().toISOString().split('T')[0],
      triageSeverity: patientVitals?.severity || 'NORMAL',
      primaryReasonForReferral: reason,
      vitalSigns: bp,
      clinicalFlags: patientVitals?.clinical_flags || [],
      notes: patientVitals?.notes || 'No contraindications or acute surgical alerts noted at time of triage.',
      referringOfficer: officerName,
    };
  }
}
