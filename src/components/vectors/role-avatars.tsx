import React from 'react';

interface AvatarVectorProps {
  className?: string;
  size?: number | string;
}

/**
 * Frontline Barangay Health Worker (BHW) Vector Badge
 * Characteristics: Emerald field vest, official LGU/DOH ID badge, digital vitals monitor
 */
export function BhwVectorAvatar({ className = 'w-16 h-16', size }: AvatarVectorProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Barangay Health Worker Avatar"
      role="img"
    >
      <defs>
        <linearGradient id="bhwAvatarBg" x1="60" y1="0" x2="60" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecfdf5" />
          <stop offset="1" stopColor="#d1fae5" />
        </linearGradient>
        <linearGradient id="bhwVestGrad" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="bhwSkin" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f7c59f" />
          <stop offset="1" stopColor="#e5a77c" />
        </linearGradient>
        <linearGradient id="bhwHair" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <filter id="bhwShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#047857" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Outer Enclosure Badge */}
      <circle cx="60" cy="60" r="56" fill="url(#bhwAvatarBg)" stroke="#10b981" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="51" stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

      {/* Torso / White Shirt + Emerald BHW Vest */}
      <g filter="url(#bhwShadow)">
        <path d="M 28 116 C 30 85 42 75 60 75 C 78 75 90 85 92 116 Z" fill="#ffffff" />
        {/* Emerald Vest */}
        <path
          d="M 33 116 C 35 88 44 80 54 78 L 60 98 L 66 78 C 76 80 85 88 87 116 L 76 116 L 72 98 L 48 98 L 44 116 Z"
          fill="url(#bhwVestGrad)"
        />
        {/* Vest Collar */}
        <path d="M 52 77 L 60 88 L 68 77 Z" fill="#e2e8f0" />
        <path d="M 54 77 L 60 85 L 66 77 Z" fill="url(#bhwSkin)" />

        {/* Neck */}
        <rect x="54" y="66" width="12" height="14" rx="4" fill="url(#bhwSkin)" />

        {/* Head */}
        <ellipse cx="60" cy="50" rx="19" ry="22" fill="url(#skinBhw, url(#bhwSkin))" />

        {/* Hair */}
        <path
          d="M 40 50 C 38 22 82 22 80 50 C 80 56 77 62 73 63 C 69 57 66 45 60 45 C 54 45 51 57 47 63 C 43 62 40 56 40 50 Z"
          fill="url(#bhwHair)"
        />

        {/* Face Features */}
        <ellipse cx="53" cy="50" rx="1.5" ry="2" fill="#0f172a" />
        <ellipse cx="67" cy="50" rx="1.5" ry="2" fill="#0f172a" />
        <path d="M 57 58 Q 60 61 63 58" stroke="#c2410c" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* BHW ID Lanyard Badge */}
        <path d="M 54 76 L 58 92 M 66 76 L 62 92" stroke="#047857" strokeWidth="1.2" />
        <rect x="55" y="90" width="10" height="14" rx="2" fill="#ffffff" stroke="#059669" strokeWidth="0.8" />
        <rect x="56.5" y="92" width="7" height="4" rx="1" fill="#10b981" />
        <line x1="57" y1="99" x2="63" y2="99" stroke="#059669" strokeWidth="0.8" />
      </g>

      {/* Floating Checkmark Icon Badge */}
      <circle cx="94" cy="28" r="14" fill="#059669" stroke="#ffffff" strokeWidth="2" />
      <path d="M 89 28 L 93 32 L 100 24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/**
 * Public Health Midwife / Nurse Vector Badge
 * Characteristics: Rose scrub uniform, stethoscope, maternal-child health icon
 */
export function NurseVectorAvatar({ className = 'w-16 h-16', size }: AvatarVectorProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Public Health Midwife / Nurse Avatar"
      role="img"
    >
      <defs>
        <linearGradient id="nurseAvatarBg" x1="60" y1="0" x2="60" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fdf2f8" />
          <stop offset="1" stopColor="#fce7f3" />
        </linearGradient>
        <linearGradient id="nurseScrubGrad" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f472b6" />
          <stop offset="1" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="nurseSkin" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fcd3b0" />
          <stop offset="1" stopColor="#edb186" />
        </linearGradient>
        <linearGradient id="nurseHair" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <filter id="nurseShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#db2777" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Outer Enclosure Badge */}
      <circle cx="60" cy="60" r="56" fill="url(#nurseAvatarBg)" stroke="#db2777" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="51" stroke="#f472b6" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

      {/* Torso / Rose Scrubs */}
      <g filter="url(#nurseShadow)">
        <path d="M 28 116 C 30 85 42 75 60 75 C 78 75 90 85 92 116 Z" fill="url(#nurseScrubGrad)" />
        {/* V-Neck */}
        <path d="M 52 75 L 60 88 L 68 75 Z" fill="#9d174d" opacity="0.5" />
        <path d="M 54 75 L 60 85 L 66 75 Z" fill="url(#nurseSkin)" />

        {/* Neck */}
        <rect x="54" y="66" width="12" height="14" rx="4" fill="url(#nurseSkin)" />

        {/* Head */}
        <ellipse cx="60" cy="50" rx="19" ry="22" fill="url(#nurseSkin)" />

        {/* Nurse Hair with Bun */}
        <path
          d="M 40 50 C 38 22 82 22 80 50 C 80 56 78 61 74 63 C 70 56 68 47 60 47 C 52 47 50 56 46 63 C 42 61 40 56 40 50 Z"
          fill="url(#nurseHair)"
        />
        <circle cx="60" cy="24" r="9" fill="url(#nurseHair)" />

        {/* Face Features */}
        <ellipse cx="53" cy="50" rx="1.5" ry="2" fill="#0f172a" />
        <ellipse cx="67" cy="50" rx="1.5" ry="2" fill="#0f172a" />
        <path d="M 57 58 Q 60 61 63 58" stroke="#b91c1c" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Stethoscope */}
        <path
          d="M 50 78 C 45 92 52 104 60 106 C 68 104 75 92 70 78"
          stroke="#475569"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="60" cy="106" r="3.5" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
      </g>

      {/* Floating Maternal Heart/Cross Badge */}
      <circle cx="94" cy="28" r="14" fill="#db2777" stroke="#ffffff" strokeWidth="2" />
      <path d="M 94 22 L 94 34 M 88 28 L 100 28" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Municipal Health Officer (Doctor) Vector Badge
 * Characteristics: White coat, blue scrubs, stethoscope, clinical oversight badge
 */
export function DoctorVectorAvatar({ className = 'w-16 h-16', size }: AvatarVectorProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Municipal Health Officer (Doctor) Avatar"
      role="img"
    >
      <defs>
        <linearGradient id="doctorAvatarBg" x1="60" y1="0" x2="60" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eff6ff" />
          <stop offset="1" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="docCoat" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1f5f9" />
        </linearGradient>
        <linearGradient id="docSkin" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffd8b3" />
          <stop offset="1" stopColor="#f6be94" />
        </linearGradient>
        <linearGradient id="docHair" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <filter id="doctorShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Outer Enclosure Badge */}
      <circle cx="60" cy="60" r="56" fill="url(#doctorAvatarBg)" stroke="#2563eb" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="51" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

      {/* Torso / White Lab Coat & Blue Scrubs */}
      <g filter="url(#doctorShadow)">
        {/* Inner Blue Scrubs */}
        <path d="M 44 75 L 60 98 L 76 75 Z" fill="#2563eb" />
        {/* White Lab Coat Body */}
        <path
          d="M 28 116 C 30 85 42 75 60 75 C 78 75 90 85 92 116 Z"
          fill="url(#docCoat)"
        />
        {/* Lab Coat Lapels */}
        <path d="M 46 76 L 58 108 L 40 116 L 30 116 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
        <path d="M 74 76 L 62 108 L 80 116 L 90 116 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />

        {/* Neck */}
        <rect x="54" y="66" width="12" height="14" rx="4" fill="url(#docSkin)" />

        {/* Head */}
        <ellipse cx="60" cy="50" rx="19" ry="22" fill="url(#docSkin)" />

        {/* Doctor Hair (neat professional side-part) */}
        <path
          d="M 40 50 C 38 23 82 23 80 50 C 80 56 77 62 73 63 C 69 54 65 44 58 44 C 50 44 47 54 47 63 C 43 62 40 56 40 50 Z"
          fill="url(#docHair)"
        />

        {/* Doctor Glasses */}
        <rect x="47" y="46" width="10" height="8" rx="2" fill="none" stroke="#334155" strokeWidth="1.2" />
        <rect x="63" y="46" width="10" height="8" rx="2" fill="none" stroke="#334155" strokeWidth="1.2" />
        <line x1="57" y1="50" x2="63" y2="50" stroke="#334155" strokeWidth="1.2" />

        {/* Face Features */}
        <ellipse cx="52" cy="50" rx="1.2" ry="1.5" fill="#0f172a" />
        <ellipse cx="68" cy="50" rx="1.2" ry="1.5" fill="#0f172a" />
        <path d="M 57 58 Q 60 61 63 58" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Stethoscope */}
        <path
          d="M 48 78 C 44 92 50 102 60 104 C 70 102 76 92 72 78"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="60" cy="104" r="4" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.2" />
        <circle cx="60" cy="104" r="1.5" fill="#2563eb" />
      </g>

      {/* Floating Stethoscope / Clinical Badge */}
      <circle cx="94" cy="28" r="14" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
      <path
        d="M 89 27 C 89 31 92 33 94 33 C 96 33 99 31 99 27 M 94 33 L 94 36"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="94" cy="36" r="1.5" fill="#ffffff" />
    </svg>
  );
}
