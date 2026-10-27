import React from 'react';

interface MedicalTeamVectorProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function MedicalTeamVector({
  className = 'w-full h-auto',
  width = '100%',
  height = '100%',
}: MedicalTeamVectorProps) {
  return (
    <svg
      viewBox="0 0 800 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width, height, maxHeight: '100%' }}
      aria-label="Philippine Primary Healthcare Team: Physician, Public Health Midwife, and Barangay Health Worker"
      role="img"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="bgGlow" x1="400" y1="50" x2="400" y2="450" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" stopOpacity="0.12" />
          <stop offset="1" stopColor="#059669" stopOpacity="0.01" />
        </linearGradient>

        <linearGradient id="shieldGrad" x1="400" y1="60" x2="400" y2="440" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecfdf5" stopOpacity="0.8" />
          <stop offset="1" stopColor="#f0fdf4" stopOpacity="0.2" />
        </linearGradient>

        {/* Doctor Lab Coat Gradient */}
        <linearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>

        {/* Midwife Scrub Gradient */}
        <linearGradient id="midwifeScrub" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f472b6" />
          <stop offset="1" stopColor="#db2777" />
        </linearGradient>

        {/* BHW Vest Gradient */}
        <linearGradient id="bhwVest" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>

        {/* Skin Tone Gradients */}
        <linearGradient id="skinDoctor" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffd8b3" />
          <stop offset="1" stopColor="#f6be94" />
        </linearGradient>

        <linearGradient id="skinMidwife" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fcd3b0" />
          <stop offset="1" stopColor="#edb186" />
        </linearGradient>

        <linearGradient id="skinBhw" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f7c59f" />
          <stop offset="1" stopColor="#e5a77c" />
        </linearGradient>

        {/* Hair Gradients */}
        <linearGradient id="darkHair" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="vectorDropShadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.08" />
        </filter>
        <filter id="pillShadow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#059669" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Atmospheric Background Geometry */}
      <circle cx="400" cy="250" r="210" fill="url(#bgGlow)" />
      <circle cx="400" cy="250" r="185" stroke="#10b981" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="6 6" />

      {/* Cross & Medical Ring Motif */}
      <g opacity="0.35" transform="translate(400, 110)">
        <circle cx="0" cy="0" r="28" fill="#10b981" fillOpacity="0.1" />
        <rect x="-4" y="-14" width="8" height="28" rx="3" fill="#10b981" fillOpacity="0.5" />
        <rect x="-14" y="-4" width="28" height="8" rx="3" fill="#10b981" fillOpacity="0.5" />
      </g>

      {/* Clinical EKG Rhythm Trace */}
      <path
        d="M 120 280 L 220 280 L 240 260 L 255 305 L 275 220 L 295 320 L 310 270 L 325 280 L 475 280 L 490 265 L 505 300 L 525 230 L 545 315 L 560 275 L 680 280"
        stroke="#10b981"
        strokeOpacity="0.25"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ======================================================== */}
      {/* 1. LEFT CHARACTER: PUBLIC HEALTH MIDWIFE / NURSE (Rose) */}
      {/* ======================================================== */}
      <g id="midwife-character" filter="url(#vectorDropShadow)">
        {/* Body / Scrubs */}
        <path
          d="M 195 480 L 205 340 Q 210 290 265 290 Q 320 290 325 340 L 335 480 Z"
          fill="url(#midwifeScrub)"
        />
        {/* Scrub V-Neck Collar */}
        <path d="M 245 290 L 265 330 L 285 290 Z" fill="#be185d" opacity="0.6" />
        <path d="M 252 290 L 265 318 L 278 290 Z" fill="url(#skinMidwife)" />

        {/* Neck */}
        <rect x="256" y="270" width="18" height="26" rx="6" fill="url(#skinMidwife)" />

        {/* Head */}
        <ellipse cx="265" cy="235" rx="30" ry="34" fill="url(#skinMidwife)" />

        {/* Nurse Hair - Clean bun/ponytail */}
        <path
          d="M 233 235 C 230 190 300 190 297 235 C 297 245 295 255 290 258 C 285 250 280 230 265 230 C 250 230 245 250 240 258 C 235 255 233 245 233 235 Z"
          fill="url(#darkHair)"
        />
        {/* Hair Bun */}
        <circle cx="265" cy="192" r="15" fill="url(#darkHair)" />

        {/* Face details */}
        <ellipse cx="254" cy="234" rx="2.5" ry="3.5" fill="#1e293b" />
        <ellipse cx="276" cy="234" rx="2.5" ry="3.5" fill="#1e293b" />
        <path d="M 261 247 Q 265 252 269 247" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Midwife Maternal & Child Health Clipboard */}
        <g transform="translate(190, 360) rotate(-8)">
          <rect x="0" y="0" width="48" height="66" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="14" y="-4" width="20" height="7" rx="2" fill="#94a3b8" />
          {/* Clipboard lines */}
          <line x1="8" y1="14" x2="40" y2="14" stroke="#db2777" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="23" x2="32" y2="23" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="31" x2="38" y2="31" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="39" x2="26" y2="39" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          {/* Pink Cross icon on clipboard */}
          <circle cx="24" cy="52" r="7" fill="#fce7f3" />
          <path d="M 24 48 L 24 56 M 20 52 L 28 52" stroke="#db2777" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Left hand holding clipboard */}
        <circle cx="218" cy="390" r="10" fill="url(#skinMidwife)" />

        {/* Right arm & stethoscope */}
        <path
          d="M 250 310 C 240 345 250 375 270 380 C 285 385 290 350 280 310"
          stroke="#475569"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="270" cy="380" r="6" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />

        {/* Role Badge Pin */}
        <rect x="238" y="335" width="24" height="12" rx="3" fill="#ffffff" stroke="#f472b6" strokeWidth="1" />
        <rect x="241" y="339" width="18" height="4" rx="1" fill="#db2777" />
      </g>

      {/* ======================================================== */}
      {/* 2. RIGHT CHARACTER: BARANGAY HEALTH WORKER (Emerald) */}
      {/* ======================================================== */}
      <g id="bhw-character" filter="url(#vectorDropShadow)">
        {/* Body / BHW Uniform */}
        <path
          d="M 465 480 L 475 340 Q 480 290 535 290 Q 590 290 595 340 L 605 480 Z"
          fill="#f8fafc"
        />
        {/* Emerald BHW Official Field Vest */}
        <path
          d="M 478 480 L 485 342 Q 490 298 520 295 L 535 375 L 550 295 Q 580 298 585 342 L 592 480 L 555 480 L 545 390 L 525 390 L 515 480 Z"
          fill="url(#bhwVest)"
        />

        {/* Inner Shirt Collar */}
        <path d="M 520 292 L 535 320 L 550 292 Z" fill="#e2e8f0" />
        <path d="M 525 292 L 535 312 L 545 292 Z" fill="url(#skinBhw)" />

        {/* Neck */}
        <rect x="526" y="270" width="18" height="26" rx="6" fill="url(#skinBhw)" />

        {/* Head */}
        <ellipse cx="535" cy="235" rx="30" ry="34" fill="url(#skinBhw)" />

        {/* BHW Hair (neat community worker style) */}
        <path
          d="M 503 235 C 500 188 570 188 567 235 C 567 248 563 260 556 262 C 550 252 546 230 535 230 C 524 230 520 252 514 262 C 507 260 503 248 503 235 Z"
          fill="url(#darkHair)"
        />

        {/* Face details */}
        <ellipse cx="524" cy="234" rx="2.5" ry="3.5" fill="#1e293b" />
        <ellipse cx="546" cy="234" rx="2.5" ry="3.5" fill="#1e293b" />
        <path d="M 531 247 Q 535 252 539 247" stroke="#c2410c" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* BHW Official Lanyard & ID Card */}
        <path d="M 525 290 L 532 355 M 545 290 L 538 355" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
        <rect x="523" y="352" width="24" height="32" rx="3" fill="#ffffff" stroke="#059669" strokeWidth="1.2" />
        <rect x="527" y="356" width="16" height="12" rx="1" fill="#a7f3d0" />
        <line x1="527" y1="373" x2="543" y2="373" stroke="#059669" strokeWidth="1.5" />
        <line x1="527" y1="378" x2="538" y2="378" stroke="#94a3b8" strokeWidth="1.2" />

        {/* Digital Blood Pressure Screener in Hand */}
        <g transform="translate(565, 360)">
          <rect x="0" y="0" width="44" height="58" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <rect x="6" y="8" width="32" height="26" rx="3" fill="#0f172a" />
          {/* BP readings on LCD */}
          <text x="10" y="21" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">120</text>
          <text x="10" y="30" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">/80</text>
          <circle cx="30" cy="24" r="2" fill="#ef4444" />
          {/* BP Button */}
          <circle cx="22" cy="45" r="5" fill="#10b981" />
        </g>
        {/* Right hand holding BP screener */}
        <circle cx="582" cy="410" r="10" fill="url(#skinBhw)" />

        {/* BHW Vest Reflective Pocket Lines */}
        <rect x="490" y="385" width="25" height="18" rx="2" fill="#047857" stroke="#34d399" strokeWidth="1" />
        <rect x="495" y="392" width="15" height="2" fill="#a7f3d0" />
      </g>

      {/* ======================================================== */}
      {/* 3. CENTER / FOREGROUND CHARACTER: MUNICIPAL PHYSICIAN (Doctor) */}
      {/* ======================================================== */}
      <g id="doctor-character" filter="url(#vectorDropShadow)">
        {/* Lab Coat / Torso */}
        <path
          d="M 330 490 L 340 320 Q 345 260 400 260 Q 455 260 460 320 L 470 490 Z"
          fill="url(#coatGrad)"
        />
        {/* Inner Blue Scrub Shirt */}
        <path d="M 380 260 L 400 320 L 420 260 Z" fill="#2563eb" />
        <path d="M 388 260 L 400 295 L 412 260 Z" fill="url(#skinDoctor)" />

        {/* Lab Coat Lapels */}
        <path d="M 372 262 L 398 385 L 360 490 L 332 490 L 340 320 Z" fill="#ffffff" />
        <path d="M 428 262 L 402 385 L 440 490 L 468 490 L 460 320 Z" fill="#f1f5f9" />
        {/* Coat Lapel Shadows */}
        <path d="M 372 262 L 396 360 L 396 385 L 372 262 Z" fill="#cbd5e1" opacity="0.4" />
        <path d="M 428 262 L 404 360 L 404 385 L 428 262 Z" fill="#cbd5e1" opacity="0.4" />

        {/* Neck */}
        <rect x="390" y="238" width="20" height="28" rx="6" fill="url(#skinDoctor)" />

        {/* Head */}
        <ellipse cx="400" cy="205" rx="32" ry="36" fill="url(#skinDoctor)" />

        {/* Physician Hair (professional side-part) */}
        <path
          d="M 366 205 C 363 155 437 155 434 205 C 434 218 430 228 424 230 C 418 215 410 198 395 198 C 380 198 375 215 372 230 C 368 228 366 218 366 205 Z"
          fill="url(#darkHair)"
        />

        {/* Doctor Glasses */}
        <rect x="375" y="196" width="20" height="14" rx="4" fill="none" stroke="#334155" strokeWidth="2" />
        <rect x="405" y="196" width="20" height="14" rx="4" fill="none" stroke="#334155" strokeWidth="2" />
        <line x1="395" y1="202" x2="405" y2="202" stroke="#334155" strokeWidth="2" />

        {/* Face details */}
        <ellipse cx="385" cy="203" rx="2" ry="2.5" fill="#0f172a" />
        <ellipse cx="415" cy="203" rx="2" ry="2.5" fill="#0f172a" />
        <path d="M 394 220 Q 400 225 406 220" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Professional Stethoscope draped over coat */}
        <path
          d="M 378 275 C 372 320 382 355 400 365 C 418 355 428 320 422 275"
          stroke="#0f172a"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="400" cy="365" r="7" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
        <circle cx="400" cy="365" r="3" fill="#2563eb" />

        {/* Doctor Clinical Tablet / Chart in Hands */}
        <g transform="translate(365, 395)">
          <rect x="0" y="0" width="70" height="50" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          <rect x="4" y="4" width="62" height="42" rx="3" fill="#1e293b" />
          {/* Tablet UI Elements */}
          <rect x="8" y="8" width="24" height="6" rx="2" fill="#3b82f6" />
          <rect x="36" y="8" width="16" height="6" rx="2" fill="#10b981" />
          <line x1="8" y1="20" x2="56" y2="20" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="27" x2="48" y2="27" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="34" x2="52" y2="34" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Doctor Hands holding tablet */}
        <circle cx="366" cy="425" r="10" fill="url(#skinDoctor)" />
        <circle cx="434" cy="425" r="10" fill="url(#skinDoctor)" />

        {/* Doctor Breast Pocket & Pens */}
        <rect x="350" y="325" width="20" height="24" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="354" y1="318" x2="354" y2="326" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
        <line x1="358" y1="320" x2="358" y2="326" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Floating Operational Triad Badges */}
      <g transform="translate(130, 210)" filter="url(#pillShadow)">
        <rect x="0" y="0" width="115" height="32" rx="16" fill="#ffffff" stroke="#fbcfe8" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="8" fill="#fce7f3" />
        <path d="M 16 11 L 16 21 M 11 16 L 21 16" stroke="#db2777" strokeWidth="2" strokeLinecap="round" />
        <text x="32" y="20" fill="#9d174d" fontSize="10.5" fontFamily="sans-serif" fontWeight="700">
          Midwife / MCH
        </text>
      </g>

      <g transform="translate(565, 210)" filter="url(#pillShadow)">
        <rect x="0" y="0" width="105" height="32" rx="16" fill="#ffffff" stroke="#a7f3d0" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="8" fill="#d1fae5" />
        <path d="M 12 16 L 15 19 L 20 13" stroke="#059669" strokeWidth="2" strokeLinecap="round" fill="none" />
        <text x="32" y="20" fill="#065f46" fontSize="10.5" fontFamily="sans-serif" fontWeight="700">
          BHW Intake
        </text>
      </g>

      <g transform="translate(335, 75)" filter="url(#pillShadow)">
        <rect x="0" y="0" width="130" height="34" rx="17" fill="#ffffff" stroke="#bfdbfe" strokeWidth="1.5" />
        <circle cx="17" cy="17" r="9" fill="#dbeafe" />
        <circle cx="17" cy="17" r="4" fill="#2563eb" />
        <text x="34" y="21" fill="#1e40af" fontSize="11" fontFamily="sans-serif" fontWeight="700">
          MHO Physician
        </text>
      </g>
    </svg>
  );
}
