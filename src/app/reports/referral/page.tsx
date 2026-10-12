'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/context/auth-context';
import { Resident, VitalSign } from '@/types/database';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';
import { AnalyticsService, ClinicalReferralAbstract } from '@/lib/services/analytics-service';
import {
  Printer,
  ArrowLeft,
  FileText,
  AlertOctagon,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';

export default function ClinicalReferralPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [referral, setReferral] = useState<ClinicalReferralAbstract | null>(null);

  useEffect(() => {
    const list = ResidentRegistryService.getResidents();
    setResidents(list);
    if (list.length > 0) {
      // Default to Rodrigo Flores or first resident
      const rodrigo = list.find((r) => r.last_name === 'Flores') || list[0];
      setSelectedResidentId(rodrigo.id);
    }
  }, []);

  useEffect(() => {
    if (selectedResidentId) {
      const data = AnalyticsService.generateReferralSlip(selectedResidentId, undefined, user.name);
      setReferral(data);
    }
  }, [selectedResidentId, user.name]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation & Controls (Hidden in Print) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-3">
            <Link
              href="/analytics"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Analytics</span>
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-700 font-semibold">Select Patient:</label>
              <select
                value={selectedResidentId}
                onChange={(e) => setSelectedResidentId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.first_name} {r.last_name} ({r.upi})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center justify-center space-x-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Clinical Abstract</span>
          </button>
        </div>

        {/* Printable 1-Page Clinical Abstract Sheet */}
        {referral && (
          <div className="bg-white text-slate-900 rounded-xl p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto border border-slate-200 print:border-none print:shadow-none print:p-0">
            {/* Republic Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-0.5">
              <span className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold block">
                Republic of the Philippines • Province of Abra
              </span>
              <h2 className="text-sm font-bold uppercase text-slate-800">
                Municipality of Lagangilang • Rural Health Unit
              </h2>
              <h1 className="text-lg font-black tracking-tight uppercase text-slate-950 pt-1">
                Barangay Health Station — Clinical Referral Abstract
              </h1>
              <p className="text-[10px] text-slate-500 italic">
                Form BHSMS-RF1 • Primary Care Triage & Continuity of Care Record (DPA 2012 Compliant)
              </p>
            </div>

            {/* Referral Metadata Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-300 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 block font-semibold">Patient UPI</span>
                <span className="font-mono font-bold text-slate-900">{referral.patientUpi}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 block font-semibold">Referral Date</span>
                <span className="font-mono font-bold text-slate-900">{referral.referralDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 block font-semibold">Triage Severity</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block ${
                  referral.triageSeverity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {referral.triageSeverity}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 block font-semibold">PhilHealth ID</span>
                <span className="font-mono text-slate-700">{referral.philhealthId || 'Not Enrolled'}</span>
              </div>
            </div>

            {/* Resident Demographics */}
            <div className="py-4 border-b border-slate-300">
              <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">1. Resident Demographics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Full Legal Name</span>
                  <span className="font-bold text-slate-950 text-sm">{referral.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Date of Birth</span>
                  <span className="font-mono text-slate-800">{referral.dateOfBirth} ({referral.age} yrs)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Biological Sex</span>
                  <span className="capitalize text-slate-800">{referral.sex}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Barangay Residence</span>
                  <span className="text-slate-800">{referral.barangay} — {referral.purok}</span>
                </div>
              </div>
            </div>

            {/* Clinical Vitals & Triage Findings */}
            <div className="py-4 border-b border-slate-300 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-700">2. Recorded Biometrics & Clinical Triage</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase text-slate-500 block">Blood Pressure</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {referral.vitalSigns.systolicBp}/{referral.vitalSigns.diastolicBp}
                  </span>
                  <span className="text-[9px] text-slate-500 block">mmHg</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase text-slate-500 block">Pulse Rate</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{referral.vitalSigns.heartRate}</span>
                  <span className="text-[9px] text-slate-500 block">bpm</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase text-slate-500 block">Resp. Rate</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{referral.vitalSigns.respiratoryRate}</span>
                  <span className="text-[9px] text-slate-500 block">cpm</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase text-slate-500 block">Temperature</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{referral.vitalSigns.temperature}°C</span>
                  <span className="text-[9px] text-slate-500 block">axillary</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase text-slate-500 block">Body Mass Index</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{referral.vitalSigns.bmi}</span>
                  <span className="text-[9px] text-slate-500 block">kg/m²</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase text-slate-500 block">Nutritional Class</span>
                  <span className="font-semibold text-slate-900 text-xs">{referral.vitalSigns.nutritionalStatus}</span>
                  <span className="text-[9px] text-slate-500 block">WHO AP</span>
                </div>
              </div>

              {referral.clinicalFlags.length > 0 && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs">
                  <span className="font-bold text-red-900 block mb-1">Triggered Clinical Decision Support Flags:</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-red-800">
                    {referral.clinicalFlags.map((flag, idx) => (
                      <span key={idx} className="bg-red-100 px-2 py-0.5 rounded border border-red-300">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reason for Referral & Clinical Notes */}
            <div className="py-4 border-b border-slate-300 space-y-2 text-xs">
              <h3 className="font-bold uppercase text-slate-700">3. Primary Reason for RHU / Facility Referral</h3>
              <p className="p-3 bg-slate-50 rounded border border-slate-200 font-medium text-slate-900">
                {referral.primaryReasonForReferral}
              </p>

              <h3 className="font-bold uppercase text-slate-700 pt-2">4. Field Clinical Notes & Symptoms</h3>
              <p className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800">
                {referral.notes}
              </p>
            </div>

            {/* Official Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
              <div className="text-center space-y-8">
                <div className="border-b border-slate-400 pb-1">
                  <span className="font-bold text-slate-950 block">{referral.referringOfficer}</span>
                  <span className="text-[10px] text-slate-500">Designated BHW / Rural Health Midwife</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase">Referring Personnel Signature / Date</span>
              </div>

              <div className="text-center space-y-8">
                <div className="border-b border-slate-400 pb-1">
                  <span className="font-bold text-slate-950 block">Dr. Arthur Alcantara, MD / Attending Physician</span>
                  <span className="text-[10px] text-slate-500">Municipal Health Officer • Lagangilang RHU</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase">Receiving Medical Officer Signature</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
