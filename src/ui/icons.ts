// Vector Graphics & Icon System for Transformers: Rescue Bots
export const SVG_ICONS: Record<string, string> = {
            // Career Progression & Info Box Indicators (14x14)
            STAR: `<svg viewBox="0 0 24 24" width="13" height="13" style="width:13px;height:13px;display:inline-block;vertical-align:middle;" class="shrink-0" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#fbbf24" stroke="#d97706" stroke-width="1.2"/></svg>`,
            MEDAL: `<svg viewBox="0 0 24 24" width="13" height="13" style="width:13px;height:13px;display:inline-block;vertical-align:middle;" class="shrink-0" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/><path d="M8.21 13.89L7 2l5 3 5-3-1.21 11.89" fill="#ef4444" stroke="#dc2626" stroke-width="1.2"/></svg>`,
            PEOPLE: `<svg viewBox="0 0 24 24" width="13" height="13" style="width:13px;height:13px;display:inline-block;vertical-align:middle;" class="shrink-0" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
            BOLT: `<svg viewBox="0 0 24 24" width="13" height="13" style="width:13px;height:13px;display:inline-block;vertical-align:middle;" class="shrink-0" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#fbbf24" stroke="#d97706" stroke-width="1.4"/></svg>`,

            // 4-Bot HQ Roster Vehicles (32x32)
            BOULDER: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="19" width="19" height="9" rx="4.5" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
                <circle cx="6" cy="23.5" r="2" fill="#64748b"/>
                <circle cx="11.5" cy="23.5" r="2" fill="#64748b"/>
                <circle cx="17" cy="23.5" r="2" fill="#64748b"/>
                <path d="M4 19L7 11H17L19 19H4Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
                <rect x="11" y="7" width="7" height="6" rx="1.5" fill="#16a34a" stroke="#15803d" stroke-width="1.2"/>
                <rect x="13" y="9" width="4" height="3" rx="0.5" fill="#38bdf8"/>
                <rect x="8" y="7" width="2" height="4" rx="0.5" fill="#475569"/>
                <path d="M17 17L22 20V25L17 22Z" fill="#15803d"/>
                <path d="M22 13L24 13L28 27H23L21 16" fill="#22c55e" stroke="#16a34a" stroke-width="1.5"/>
                <path d="M24 13L29 27H26L22 13H24Z" fill="#4ade80"/>
                <rect x="23" y="19" width="5" height="2" transform="rotate(-15 23 19)" fill="#facc15"/>
            </svg>`,
            HEATWAVE: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="13" width="26" height="12" rx="2.5" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
                <rect x="4" y="8" width="16" height="5" rx="1" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
                <path d="M7 8V13M11 8V13M15 8V13M19 8V13" stroke="#64748b" stroke-width="1"/>
                <rect x="21" y="15" width="6" height="5" rx="1" fill="#38bdf8"/>
                <rect x="14" y="15" width="5" height="5" rx="1" fill="#f8fafc" opacity="0.9"/>
                <circle cx="8" cy="25" r="3.2" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5"/>
                <circle cx="23" cy="25" r="3.2" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5"/>
                <rect x="23" y="11" width="3" height="2" rx="1" fill="#fbbf24"/>
                <path d="M3 18H12V21H3V18Z" fill="#f8fafc" opacity="0.4"/>
            </svg>`,
            CHASE: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 20L6 14C7 12 9 11 11 11H21C23 11 25 12 26 14L29 20V24H3V20Z" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>
                <path d="M10 13L8 18H24L22 13H10Z" fill="#38bdf8"/>
                <rect x="4" y="18" width="24" height="4" fill="#f8fafc"/>
                <circle cx="8" cy="24" r="3" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
                <circle cx="24" cy="24" r="3" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
                <rect x="14" y="9" width="2" height="2" fill="#ef4444"/>
                <rect x="16" y="9" width="2" height="2" fill="#38bdf8"/>
            </svg>`,
            BLADES: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 7H30" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>
                <circle cx="16" cy="7" r="1.5" fill="#f59e0b"/>
                <path d="M16 7V10" stroke="#64748b" stroke-width="2"/>
                <path d="M8 13C8 10.8 9.8 9 12 9H20C22.2 9 24 10.8 24 13V18C24 20.2 22.2 22 20 22H12C9.8 22 8 20.2 8 18V13Z" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/>
                <path d="M16 11H22C23.1 11 24 11.9 24 13V16H16V11Z" fill="#38bdf8"/>
                <path d="M8 15H1V17H8V15Z" fill="#f8fafc"/>
                <path d="M1 13V19" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
                <path d="M8 26H24M11 22V26M21 22V26" stroke="#e2e8f0" stroke-width="1.8" stroke-linecap="round"/>
            </svg>`,
            OPTIMUS: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="10" width="22" height="14" rx="2" fill="#ef4444" stroke="#991b1b" stroke-width="1.2"/>
                <rect x="7" y="12" width="7" height="5" rx="1" fill="#38bdf8"/>
                <rect x="18" y="12" width="7" height="5" rx="1" fill="#38bdf8"/>
                <rect x="11" y="18" width="10" height="5" fill="#cbd5e1" stroke="#475569" stroke-width="1"/>
                <rect x="3" y="6" width="2" height="10" fill="#cbd5e1"/>
                <rect x="27" y="6" width="2" height="10" fill="#cbd5e1"/>
                <circle cx="9" cy="25" r="2.8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.2"/>
                <circle cx="23" cy="25" r="2.8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.2"/>
            </svg>`,
            BUMBLEBEE: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 21L7 13C8 11 10 10 12 10H20C22 10 24 11 25 13L28 21V25H4V21Z" fill="#facc15" stroke="#ca8a04" stroke-width="1.2"/>
                <rect x="14" y="10" width="4" height="15" fill="#0f172a"/>
                <path d="M10 12L8 18H13L13 12H10Z" fill="#38bdf8"/>
                <path d="M22 12L24 18H19L19 12H22Z" fill="#38bdf8"/>
                <circle cx="8" cy="25" r="2.8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.2"/>
                <circle cx="24" cy="25" r="2.8" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.2"/>
            </svg>`,
            BLURR: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 23L7 14H25L30 23V26H2V23Z" fill="#7c3aed" stroke="#581c87" stroke-width="1.2"/>
                <path d="M11 15L16 11L21 15V22H11V15Z" fill="#38bdf8"/>
                <rect x="14" y="11" width="4" height="15" fill="#f8fafc"/>
                <rect x="6" y="9" width="20" height="2" fill="#0f172a"/>
                <circle cx="7" cy="25" r="2.8" fill="#0f172a" stroke="#22c55e" stroke-width="1.4"/>
                <circle cx="25" cy="25" r="2.8" fill="#0f172a" stroke="#22c55e" stroke-width="1.4"/>
            </svg>`,
            SALVAGE: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="10" width="24" height="15" rx="2" fill="#1d4ed8" stroke="#1e3a8a" stroke-width="1.2"/>
                <rect x="6" y="8" width="20" height="10" rx="1.5" fill="#cbf827" stroke="#84cc16" stroke-width="1.2"/>
                <rect x="9" y="10" width="6" height="5" rx="1" fill="#38bdf8"/>
                <rect x="17" y="10" width="6" height="5" rx="1" fill="#38bdf8"/>
                <text x="16" y="21" font-size="7" font-weight="bold" fill="#15803d" text-anchor="middle">♻</text>
                <circle cx="8" cy="25" r="3" fill="#0f172a" stroke="#94a3b8" stroke-width="1.2"/>
                <circle cx="24" cy="25" r="3" fill="#0f172a" stroke="#94a3b8" stroke-width="1.2"/>
            </svg>`,
            HIGHTIDE: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 17C4 17 8 13 16 13C24 13 28 17 28 17L27 22H5L4 17Z" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2"/>
                <rect x="13" y="8" width="6" height="6" rx="1" fill="#f8fafc"/>
                <rect x="15" y="4" width="2" height="4" fill="#38bdf8"/>
                <circle cx="16" cy="11" r="1.5" fill="#0284c7"/>
                <path d="M2 19L5 24H27L30 19" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round"/>
            </svg>`,
            QUICKSHADOW: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 22L7 14L12 11H20L25 14L28 22H4Z" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.2"/>
                <path d="M9 14L13 12H19L23 14H9Z" fill="#0f172a"/>
                <rect x="25" y="10" width="2" height="5" fill="#0f172a"/>
                <line x1="24" y1="10" x2="28" y2="10" stroke="#0284c7" stroke-width="1.5"/>
                <circle cx="8" cy="22" r="3" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2"/>
                <circle cx="24" cy="22" r="3" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2"/>
            </svg>`,
            STARSPEED: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="23" r="5" fill="#0f172a" stroke="#fde047" stroke-width="1.8"/>
                <circle cx="8" cy="23" r="2" fill="#06b6d4"/>
                <circle cx="24.5" cy="23" r="5" fill="#0f172a" stroke="#fde047" stroke-width="1.8"/>
                <circle cx="24.5" cy="23" r="2" fill="#06b6d4"/>
                <path d="M8 23L14 14H20L24.5 23" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11 14L17 11L22 14L19 17H13L11 14Z" fill="#06b6d4" stroke="#0f172a" stroke-width="1.2"/>
                <path d="M19 10L23 11.5L26 15" stroke="#f43f5e" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M6 16L12 14" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
                <path d="M19 8.5H23" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            BUDDY: `<svg viewBox="0 0 24 24" width="14" height="14" style="width:14px;height:14px;display:inline-block;" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 11l2 2a2.8 2.8 0 004 0 2.8 2.8 0 000-4l-3-3a3 3 0 00-4.2 0L12 9"/>
                <path d="M8 13l-2-2a2.8 2.8 0 00-4 0 2.8 2.8 0 000 4l3 3a3 3 0 004.2 0L12 15"/>
                <path d="M9 11l6 6M11 9l2 2"/>
            </svg>`,

            // Quick Utility Menu (24x24)
            HQ: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h1M14 10h1M9 14h1M14 14h1"/>
            </svg>`,
            AUTO_SPAWN_ON: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18.178 8c5.096 0 5.096 8 0 8-2.688 0-4.636-2.585-6.178-5-1.542-2.415-3.49-5-6.178-5-5.096 0-5.096 8 0 8 2.688 0 4.636-2.585 6.178-5 1.542-2.415 3.49-5 6.178-5z"/>
            </svg>`,
            AUTO_SPAWN_OFF: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M10 9v6M14 9v6"/>
            </svg>`,
            WEATHER_SUNNY: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>`,
            WEATHER_SUNSET: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 18a5 5 0 00-10 0"/>
                <path d="M12 2v4M4.22 10.22l2.83 2.83M1 18h22M19.78 10.22l-2.83 2.83M12 11V7"/>
            </svg>`,
            WEATHER_RAIN: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/>
                <path d="M8 19v3M12 18v4M16 19v3"/>
            </svg>`,
            WEATHER_FOG: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 14h16M2 18h20M6 10h12M8 6h8"/>
            </svg>`,
            WEATHER_VOLCANO: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 21l6-13h4l6 13H4z"/>
                <path d="M10 8L8 4M14 8l2-4M12 8V2"/>
            </svg>`,
            WEATHER_NIGHT: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                <path d="M17 4v3M15.5 5.5h3"/>
            </svg>`,
            VIEW_WIDE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 9V5a2 2 0 012-2h4M16 3h4a2 2 0 012 2v4M22 15v4a2 2 0 01-2 2h-4M8 21H4a2 2 0 01-2-2v-4"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>`,
            SOUND_ON: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/>
            </svg>`,
            SOUND_OFF: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>`,
            RESET: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
            </svg>`,

            // Bottom Right Action Cluster (24x24)
            JUMP: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
                <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-3.95 11a22.35 22.35 0 01-3.95 2l-2.1-2.1z"/>
                <path d="M9 12H4s.55-3.03 2-4.5c1.45-1.47 4.5-2 4.5-2M15 9V4s3.03.55 4.5 2c1.47 1.45 2 4.5 2 4.5"/>
            </svg>`,
            SONAR: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 0110 10M12 6a6 6 0 016 6M12 10a2 2 0 012 2"/>
                <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
                <path d="M12 14v8M8 22h8"/>
            </svg>`,
            ASCEND: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 11l-5-5-5 5M17 18l-5-5-5 5"/>
            </svg>`,
            DESCEND: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 6l5 5 5-5M7 13l5 5 5-5"/>
            </svg>`,
            SIREN: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 19h12a2 2 0 002-2v-4a8 8 0 10-16 0v4a2 2 0 002 2z"/>
                <path d="M12 3v3M4 6l2 2M20 6l-2 2M12 13v6M4 21h16"/>
            </svg>`,
            DRILL: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="2.5" width="12" height="4.5" rx="1.2" fill="#facc15" stroke="#0f172a" stroke-width="1.5"/>
                <rect x="8" y="4" width="3" height="1.5" fill="#0f172a"/>
                <rect x="13" y="4" width="3" height="1.5" fill="#0f172a"/>
                <polygon points="7,7 17,7 12,21" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.6"/>
                <path d="M7.6 9.5L16.2 11.2M8.8 13L15.1 14.5M10 16.5L13.9 17.6" stroke="#facc15" stroke-width="2"/>
                <path d="M4 21.5h16M5 18.5l-2 2M19 18.5l2 2" stroke="#84cc16" stroke-width="1.6"/>
            </svg>`,
            DRILL_UP: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12,3 7,17 17,17" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.6"/>
                <path d="M9.6 8.5L14.5 10M8.6 12L15.4 13.5M7.8 15.2L16.2 16.2" stroke="#facc15" stroke-width="2"/>
                <rect x="6" y="17" width="12" height="4" rx="1.2" fill="#facc15" stroke="#0f172a" stroke-width="1.5"/>
                <path d="M5 6l2-3M19 6l-2-3M12 1v1.5" stroke="#38bdf8" stroke-width="1.8"/>
            </svg>`,
            CAVERN_GEM: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12,2 20,8 17,21 7,21 4,8" fill="#a855f7" fill-opacity="0.35" stroke="#c084fc" stroke-width="1.8"/>
                <polygon points="12,2 16,8 12,21 8,8" fill="#38bdf8" fill-opacity="0.35" stroke="#38bdf8" stroke-width="1.4"/>
                <line x1="4" y1="8" x2="20" y2="8" stroke="#e9d5ff" stroke-width="1.4"/>
            </svg>`,
            CAVERN_COMPASS: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 20c0-8 4-14 9-14s9 6 9 14H3z" fill="#334155" fill-opacity="0.55" stroke="#38bdf8" stroke-width="1.8"/>
                <path d="M7 20c0-5 2.2-9 5-9s5 4 5 9" fill="#0f172a" stroke="#22d3ee" stroke-width="1.4"/>
                <polygon points="12,13 13.2,15.5 16,15.8 13.8,17.5 14.5,20 12,18.6 9.5,20 10.2,17.5 8,15.8 10.8,15.5" fill="#facc15"/>
            </svg>`,

            // Bot-Specific Special Powers (24x24)
            QUAKE_SMASH: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 6l4-4 4 4-4 4-4-4z" fill="currentColor" fill-opacity="0.25"/>
                <path d="M15 9l-9 9a2 2 0 01-3-3l9-9"/>
                <path d="M3 21h18M6 18l-2 3M18 18l2 3M12 18v3"/>
            </svg>`,
            DOZER_SCOOP: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 17h10l6-9v9h-6"/>
                <path d="M2 17h4v4H2z" fill="currentColor" fill-opacity="0.3"/>
                <path d="M14 12l4-5M8 12l3-4"/>
            </svg>`,
            TRICERA_CHARGE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3c4 0 8 3 8 7 0 5-4 9-8 11-4-2-8-6-8-11 0-4 4-7 8-7z" fill="currentColor" fill-opacity="0.2"/>
                <path d="M8 8L3 4M16 8l5-4M12 12V6"/>
            </svg>`,
            WATER_CANNON: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 15h6v4H3z"/>
                <path d="M9 17h4l4-5h4M17 12a4 4 0 014-4M15 16a5 5 0 016-1"/>
                <circle cx="21" cy="7" r="1" fill="currentColor"/>
            </svg>`,
            FIREBOAT: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 17l2-7h16l2 7H2z" fill="#e81e25" fill-opacity="0.3"/>
                <path d="M4 10l2-4h12l2 4"/>
                <path d="M12 6V3M9 4h6"/>
                <path d="M2 21c3-1 6-1 10 0 4-1 7-1 10 0" stroke="#38bdf8"/>
            </svg>`,
            TWIN_DELUGE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 16h5v4H4zM15 16h5v4h-5z"/>
                <path d="M6 16v-4l4-4M18 16v-4l-4-4"/>
                <circle cx="10" cy="8" r="1.5" fill="#facc15"/>
                <circle cx="14" cy="8" r="1.5" fill="#facc15"/>
                <path d="M10 6c1-2 3-2 4 0" stroke="#38bdf8"/>
            </svg>`,
            POLICE_DEPTH_SONAR: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 13l4-5h10l4 5-3 5H6l-3-5z" fill="#38bdf8" fill-opacity="0.25"/>
                <circle cx="12" cy="14" r="2" fill="#0284c7"/>
                <path d="M8 14a4 4 0 018 0M5 14a7 7 0 0114 0" stroke="#38bdf8"/>
                <rect x="11" y="5" width="2" height="3" fill="#ef4444"/>
            </svg>`,
            HOVER_AIR_JET: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="7" rx="3.5" fill="#f97316" fill-opacity="0.25" stroke="#ea580c"/>
                <circle cx="7" cy="8" r="3" stroke="#f97316"/>
                <circle cx="17" cy="8" r="3" stroke="#f97316"/>
                <path d="M7 6v4M5 8h4M17 6v4M15 8h4"/>
                <path d="M4 20c3-1 6-1 8 0 2-1 5-1 8 0" stroke="#38bdf8"/>
            </svg>`,
            DREDGE_RAM: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="6" width="4" height="12" rx="1" fill="#22c55e" stroke="#16a34a"/>
                <rect x="16" y="6" width="4" height="12" rx="1" fill="#22c55e" stroke="#16a34a"/>
                <path d="M8 10h8M8 14h8M4 17h16" stroke="#15803d"/>
                <path d="M2 21c4-1.5 8-1.5 10 0 2-1.5 6-1.5 10 0" stroke="#facc15"/>
            </svg>`,
            COMMAND_DELUGE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 16l3-6h12l3 6H3z" fill="#ef4444" fill-opacity="0.25" stroke="#dc2626"/>
                <path d="M10 10V5M14 10V5M8 5h8"/>
                <path d="M7 3c2-1 5 1 5 2M17 3c-2-1-5 1-5 2" stroke="#38bdf8"/>
                <circle cx="12" cy="7" r="1.5" fill="#facc15"/>
            </svg>`,
            TURBO_ROOSTER_TAIL: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 15l14-5 6 3-10 6-10-4z" fill="#facc15" fill-opacity="0.25" stroke="#eab308"/>
                <path d="M3 13c-2-4 1-8 4-10 1 3 0 6-2 8" stroke="#38bdf8"/>
                <path d="M6 13c-1-3 1-6 3-8 1 2 0 5-1 6" stroke="#06b6d4"/>
                <circle cx="18" cy="12" r="1.5" fill="#facc15"/>
            </svg>`,
            SUPERSONIC_HYDRO_GLIDE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 10l12-3 7 3-11 3-8-3z" fill="#a855f7" fill-opacity="0.25" stroke="#9333ea"/>
                <path d="M8 12l-2 7h5l-1-7M16 11l-1 8h4l1-8" stroke="#22c55e"/>
                <path d="M2 20c5-1 10-1 20 0" stroke="#38bdf8"/>
            </svg>`,
            OCEAN_SKIMMER_SCOOP: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="5" height="12" rx="2" fill="#0284c7" fill-opacity="0.25" stroke="#0369a1"/>
                <rect x="17" y="7" width="5" height="12" rx="2" fill="#0284c7" fill-opacity="0.25" stroke="#0369a1"/>
                <path d="M7 11h10v6a3 3 0 01-3 3h-4a3 3 0 01-3-3v-6z" fill="#84cc16" fill-opacity="0.3" stroke="#65a30d"/>
                <path d="M10 14l2-2 2 2M12 12v5" stroke="#facc15"/>
            </svg>`,
            STEALTH_HYDRO_GLIDE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 21 16 12 14 3 16" fill="#0ea5e9" fill-opacity="0.2" stroke="#0284c7"/>
                <line x1="12" y1="2" x2="12" y2="21" stroke="#38bdf8"/>
                <path d="M5 20c3-1 5-1 7 0 2-1 4-1 7 0" stroke="#06b6d4"/>
            </svg>`,
            HYDRO_DELUGE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19h16M12 19V11M8 11h8l2-4H6l2 4z"/>
                <path d="M12 7V3M9 4a6 6 0 016 0"/>
            </svg>`,
            DINO_HYDRO_JET: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 18c2-6 6-12 10-12h4l2 3-3 2h-3c-3 0-5 3-6 7H4z"/>
                <path d="M17 10c2 2 4 4 5 7M15 12c1.5 1.5 3 3 4 5"/>
            </svg>`,
            ENERGY_NET: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 20 6.5 20 15.5 12 20 4 15.5 4 6.5"/>
                <line x1="12" y1="2" x2="12" y2="20"/>
                <line x1="4" y1="6.5" x2="20" y2="15.5"/>
                <line x1="4" y1="15.5" x2="20" y2="6.5"/>
                <circle cx="12" cy="11" r="2" fill="currentColor" fill-opacity="0.3"/>
            </svg>`,
            TOW_WINCH_NET: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="7" cy="8" r="4"/>
                <path d="M11 8h6l4 8a3 3 0 01-6 0"/>
                <path d="M7 6v4M5 8h4"/>
            </svg>`,
            TAIL_SPIKE_EMP: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19c6-2 10-6 12-12l4-3-3 4c-6 2-10 6-13 11z"/>
                <path d="M13 10l3-3M10 13l2-3M7 16l2-3M15 15l4-1-2 4 4-1-5 5 1-4-3 1"/>
            </svg>`,
            ROTOR_CYCLONE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <path d="M12 2C6.5 2 2 6.5 2 12h8M12 22c5.5 0 10-4.5 10-10h-8"/>
            </svg>`,
            RESCUE_WINCH: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="7" y="3" width="10" height="5" rx="1.5"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <circle cx="12" cy="18.5" r="2.5"/>
                <path d="M9 5h6"/>
            </svg>`,
            WING_GALE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 14c-4-4-8-7-10-6 1 4 4 8 10 9M12 14c4-4 8-7 10-6-1 4-4 8-10 9"/>
                <path d="M8 19c2 1 4 1 8 0M6 21c3 1 6 1 12 0"/>
            </svg>`,

            // Optimus Prime Special Powers
            MATRIX_PULSE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4.5" fill="currentColor" fill-opacity="0.25"/>
                <circle cx="12" cy="12" r="2" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2"/>
                <path d="M7.5 9H4a2.5 2.5 0 000 6h3.5M16.5 9H20a2.5 2.5 0 010 6h-3.5"/>
                <path d="M12 2.5v3M12 18.5v3M5.5 5.5l2.2 2.2M16.3 16.3l2.2 2.2M18.5 5.5l-2.2 2.2M7.7 16.3l-2.2 2.2"/>
            </svg>`,
            CAB_BOOST: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="8" width="12" height="12" rx="2" fill="currentColor" fill-opacity="0.2"/>
                <line x1="9" y1="13" x2="15" y2="13"/>
                <line x1="9" y1="16" x2="15" y2="16"/>
                <line x1="12" y1="10" x2="12" y2="18"/>
                <line x1="4" y1="5" x2="4" y2="14"/>
                <line x1="20" y1="5" x2="20" y2="14"/>
                <path d="M8 5l4-3 4 3M9 8l3-2 3 2"/>
            </svg>`,
            T_REX_ROAR: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 14c2-5 6-10 14-10 2 0 4 2 4 4 0 3-3 4-5 5l2 4c-3 1-6 2-9 2-2 0-4-2-6-5z" fill="currentColor" fill-opacity="0.25"/>
                <path d="M11 9l2 2-2 2M15 10l2 2-2 2"/>
                <path d="M6 16l3-1M5 19l4-2M9 22l2-3"/>
                <circle cx="16" cy="7" r="1.5" fill="#facc15" stroke="none"/>
            </svg>`,

            // Bumblebee Special Powers
            STINGER_PULSE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="14" width="5" height="7" rx="1.5" fill="currentColor" fill-opacity="0.25"/>
                <rect x="15" y="14" width="5" height="7" rx="1.5" fill="currentColor" fill-opacity="0.25"/>
                <line x1="6.5" y1="14" x2="6.5" y2="9"/>
                <line x1="17.5" y1="14" x2="17.5" y2="9"/>
                <path d="M6.5 9l2-3-3-2 3-3" stroke="#facc15"/>
                <path d="M17.5 9l-2-3 3-2-3-3" stroke="#facc15"/>
                <polygon points="12 3 13.5 7.5 10.5 8.5 13.5 13" fill="#facc15" stroke="none"/>
            </svg>`,
            NITRO_TURBO: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 14h14v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z" fill="currentColor" fill-opacity="0.2"/>
                <path d="M8 14V8a4 4 0 018 0v6"/>
                <path d="M12 3v3M9 5l1.5 2M15 5l-1.5 2"/>
                <circle cx="12" cy="18" r="2.5" fill="#facc15"/>
                <path d="M12 18l1.5-1.5"/>
            </svg>`,
            RAPTOR_LEAP: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19c2-5 6-11 14-14-1 6-4 12-8 15" fill="currentColor" fill-opacity="0.2"/>
                <path d="M8 20c2-4 5-8 10-10"/>
                <path d="M13 21c2-3 4-5 7-6"/>
                <line x1="2" y1="8" x2="7" y2="4"/>
                <line x1="6" y1="4" x2="11" y2="2"/>
            </svg>`,

            // Blurr Special Powers
            HYPER_BLUR: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" fill="#a855f7" fill-opacity="0.3" stroke="#c084fc"/>
                <line x1="2" y1="7" x2="7" y2="7" stroke="#22c55e"/>
                <line x1="1" y1="12" x2="4" y2="12" stroke="#22c55e"/>
                <line x1="3" y1="17" x2="9" y2="17" stroke="#22c55e"/>
            </svg>`,
            SUPERSONIC_DASH: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3l16 9-16 9" fill="currentColor" fill-opacity="0.15"/>
                <path d="M7 6l10 6-10 6"/>
                <line x1="2" y1="12" x2="21" y2="12" stroke-width="2.5"/>
                <path d="M17 8l4 4-4 4"/>
            </svg>`,

            // Salvage Special Powers
            SCRAP_MAGNET: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 7V4a2 2 0 014 0v3M16 7V4a2 2 0 014 0v3M4 7h4M16 7h4M4 7v6a8 8 0 0016 0V7" fill="currentColor" fill-opacity="0.2"/>
                <path d="M6 17a6 6 0 0012 0"/>
                <path d="M8 19a4 4 0 008 0"/>
                <rect x="11" y="21" width="2" height="2" fill="#84cc16" stroke="none"/>
            </svg>`,
            COMPACTOR_SMASH: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="3" width="16" height="4" rx="1" fill="currentColor" fill-opacity="0.3"/>
                <rect x="4" y="17" width="16" height="4" rx="1" fill="currentColor" fill-opacity="0.3"/>
                <path d="M12 7v4M9 9l3 2 3-2"/>
                <path d="M12 17v-4M9 15l3-2 3 2"/>
                <rect x="10" y="11" width="4" height="2" fill="#84cc16"/>
            </svg>`,
            DUMPSTER_LIFT: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="9" width="16" height="12" rx="1.5" fill="#84cc16" fill-opacity="0.3"/>
                <path d="M3 6l9-3 9 3M4 9l8-3 8 3"/>
                <path d="M1 12h3M20 12h3"/>
                <path d="M7 13v5M12 13v5M17 13v5"/>
                <path d="M9 2l3-1 3 1"/>
            </svg>`,

            // High Tide Special Powers
            TIDAL_SURGE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 18c3-4 6-8 11-8 4 0 7 2 7 5 0 2-2 3-4 3-3 0-4-2-4-4 0-4 4-8 10-8" fill="currentColor" fill-opacity="0.2"/>
                <path d="M2 21c4-2 8-2 12 0 3-1 6-1 8 0"/>
                <circle cx="15" cy="5" r="1.5" fill="#38bdf8"/>
                <circle cx="19" cy="8" r="1" fill="#38bdf8"/>
            </svg>`,
            HYDRO_TORPEDO: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 8h12c2.5 0 4-1.5 5-2-1 2.5-2.5 4-5 4H3V8z" fill="currentColor" fill-opacity="0.25"/>
                <path d="M3 6v4M5 7v2"/>
                <path d="M5 16h12c2.5 0 4-1.5 5-2-1 2.5-2.5 4-5 4H5v-2z" fill="currentColor" fill-opacity="0.25"/>
                <path d="M5 14v4M7 15v2"/>
                <line x1="1" y1="9" x2="3" y2="9"/>
                <line x1="2" y1="17" x2="5" y2="17"/>
            </svg>`,

            // Quickshadow Special Powers
            STEALTH_CLOAK: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a5 5 0 00-5 5v1H5a2 2 0 00-2 2v2c0 6 7 10 9 10s9-4 9-10V10a2 2 0 00-2-2h-2V7a5 5 0 00-5-5z" fill="#0284c7" fill-opacity="0.25"/>
                <circle cx="9" cy="12" r="1.2" fill="#38bdf8"/>
                <circle cx="15" cy="12" r="1.2" fill="#38bdf8"/>
                <path d="M9 16c1.5 1 4.5 1 6 0"/>
                <path d="M4 4l16 16" stroke="#38bdf8" stroke-dasharray="2 2"/>
            </svg>`,
            TURBO_OVERDRIVE: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#38bdf8"/>
                <circle cx="12" cy="12" r="4" fill="#0284c7" fill-opacity="0.3"/>
                <path d="M12 9l3 3-3 3"/>
            </svg>`,
            HOVER_JET: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2.5L19.2 9.5L29 17.2L27.5 22.8L21.5 21.5L22.5 27.5L18.8 25.5L16 24L13.2 25.5L9.5 27.5L10.5 21.5L4.5 22.8L3 17.2L12.8 9.5L16 2.5Z" fill="#06b6d4" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M16 4.8L17.9 10.5H14.1L16 4.8Z" fill="#fde047" stroke="#0f172a" stroke-width="1"/>
                <rect x="14.5" y="12.5" width="3" height="8" rx="1" fill="#f8fafc" stroke="#0f172a" stroke-width="1"/>
                <circle cx="9.6" cy="18.2" r="3.1" fill="#1e293b" stroke="#fde047" stroke-width="1.4"/>
                <circle cx="9.6" cy="18.2" r="1.4" fill="#38bdf8"/>
                <circle cx="22.4" cy="18.2" r="3.1" fill="#1e293b" stroke="#fde047" stroke-width="1.4"/>
                <circle cx="22.4" cy="18.2" r="1.4" fill="#38bdf8"/>
                <path d="M3 16.5L5.2 23.2" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
                <path d="M29 16.5L26.8 23.2" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
                <path d="M11.2 25.8L12.5 29.2M20.8 25.8L19.5 29.2" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            HOVER_JET_BOOST: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2l3 7 6 4-2 4-4-1-3 3-3-3-4 1-2-4 6-4 3-7z" fill="#38bdf8" fill-opacity="0.28"/>
                <circle cx="7.5" cy="13.5" r="2" fill="#fde047"/>
                <circle cx="16.5" cy="13.5" r="2" fill="#fde047"/>
                <path d="M9.5 19l-1 3M14.5 19l1 3M12 18v4" stroke="#f43f5e" stroke-width="2.2"/>
            </svg>`,
            TROPHY: `<svg viewBox="0 0 24 24" class="w-10 h-10 stroke-amber-300 fill-amber-400" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2M4 5h16v6a7 7 0 01-14 0V5zM12 18v3M8 21h8"/>
            </svg>`,

            // Sigma Starship, Space Flight & Lunar Base Icons
            ROCKET: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3C20.5 7 22 12.5 22 18L19 22H13L10 18C10 12.5 11.5 7 16 3Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.6" stroke-linejoin="round"/>
                <path d="M16 3C18.2 5 19.6 7.4 20.4 10H11.6C12.4 7.4 13.8 5 16 3Z" fill="#dc2626"/>
                <circle cx="16" cy="13.5" r="2.6" fill="#38bdf8" stroke="#0f172a" stroke-width="1.2"/>
                <path d="M10 16L5 21L7 24L12 21V16H10Z" fill="#dc2626" stroke="#0f172a" stroke-width="1.4" stroke-linejoin="round"/>
                <path d="M22 16L27 21L25 24L20 21V16H22Z" fill="#dc2626" stroke="#0f172a" stroke-width="1.4" stroke-linejoin="round"/>
                <path d="M13.5 22L16 29L18.5 22H13.5Z" fill="#fbbf24" stroke="#f97316" stroke-width="1.2" stroke-linejoin="round"/>
            </svg>`,
            WRENCH: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a4.5 4.5 0 00-6.1 6.1l-5 5a1.5 1.5 0 002.1 2.1l5-5a4.5 4.5 0 006.1-6.1l-2.3 2.3-2.1-2.1 2.3-2.3z" fill="#fbbf24" stroke="#0f172a" stroke-width="1.6"/>
                <circle cx="5.2" cy="18.8" r="0.8" fill="#0f172a"/>
            </svg>`,
            PLANET: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="7.5" fill="#0284c7" stroke="#0f172a" stroke-width="1.5"/>
                <path d="M8.5 7.5C10 8.5 11.5 8 12.5 9.5C13.5 11 11 12.5 12 14.5C12.8 16 14.5 16.5 16 15.5" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
                <path d="M6.5 13.5C7.8 12.5 9.2 13.2 9.8 14.8C10.2 15.8 9.2 17 8 17.5" fill="#22c55e" stroke="#15803d" stroke-width="1.1"/>
                <ellipse cx="12" cy="12" rx="10.5" ry="3.2" transform="rotate(-22 12 12)" stroke="#38bdf8" stroke-width="1.4" stroke-opacity="0.85"/>
            </svg>`,
            MOON: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="8.5" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.5"/>
                <circle cx="9.2" cy="9.5" r="2.1" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
                <circle cx="15.2" cy="13.8" r="2.6" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
                <circle cx="14.5" cy="8" r="1.2" fill="#94a3b8"/>
                <circle cx="8.5" cy="15.2" r="1.1" fill="#94a3b8"/>
            </svg>`,
            LASER: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12h11" stroke="#22d3ee" stroke-width="3.2"/>
                <path d="M3 12h11" stroke="#f8fafc" stroke-width="1.2"/>
                <polygon points="15,6 22,12 15,18 17,12" fill="#fbbf24" stroke="#f97316" stroke-width="1.2"/>
                <line x1="16" y1="4" x2="18" y2="6" stroke="#38bdf8" stroke-width="1.6"/>
                <line x1="16" y1="20" x2="18" y2="18" stroke="#38bdf8" stroke-width="1.6"/>
            </svg>`,
            TRACTOR: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 4L4 20h16L12 4z" fill="#38bdf8" fill-opacity="0.24" stroke="#22d3ee" stroke-width="1.6"/>
                <path d="M8.5 14h7M6.5 17.5h11" stroke="#38bdf8" stroke-width="1.6" stroke-dasharray="2 1.5"/>
                <circle cx="12" cy="5" r="2.2" fill="#fbbf24" stroke="#0f172a" stroke-width="1.2"/>
            </svg>`,
            ASTEROID: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12,3 19,6 21,13 17,20 9,21 4,16 5,8" fill="#78716c" stroke="#0f172a" stroke-width="1.5"/>
                <circle cx="10" cy="10" r="1.8" fill="#57534e"/>
                <circle cx="15" cy="14.5" r="2.2" fill="#57534e"/>
                <path d="M13 7l3 2-1.5 2.5" stroke="#f97316" stroke-width="1.4"/>
            </svg>`,
            RING: `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="8" stroke="#22d3ee" stroke-width="2.6"/>
                <circle cx="12" cy="12" r="5" stroke="#fbbf24" stroke-width="1.4" stroke-dasharray="3 2"/>
            </svg>`,

            // Solar System Hub, Planets & Saturn Ring Race Icons (32x32)
            SOLAR_SYSTEM: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="13" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="3 2.5" stroke-opacity="0.75"/>
                <circle cx="16" cy="16" r="8.5" stroke="#fbbf24" stroke-width="1.2" stroke-opacity="0.75"/>
                <circle cx="16" cy="16" r="4.2" fill="#facc15" stroke="#ea580c" stroke-width="1.3"/>
                <circle cx="24.5" cy="16" r="2.2" fill="#38bdf8" stroke="#0f172a" stroke-width="1"/>
                <circle cx="8" cy="7.5" r="2.5" fill="#fb923c" stroke="#0f172a" stroke-width="1"/>
                <circle cx="10.5" cy="27.2" r="2.1" fill="#c084fc" stroke="#0f172a" stroke-width="1"/>
            </svg>`,
            RING_RACE: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="16" cy="18" rx="13.5" ry="5.5" transform="rotate(-14 16 18)" stroke="#fde047" stroke-width="3.2"/>
                <ellipse cx="16" cy="18" rx="10.5" ry="4.1" transform="rotate(-14 16 18)" stroke="#38bdf8" stroke-width="1.6" stroke-dasharray="3 2"/>
                <path d="M13 6h10l-2.2 4L23 14H13V6z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.4" stroke-linejoin="round"/>
                <rect x="13" y="6" width="3.2" height="4" fill="#0f172a"/>
                <rect x="16.2" y="10" width="3.2" height="4" fill="#0f172a"/>
                <path d="M13 6v15" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            PLANET_MERCURY: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="11" fill="#a8a29e" stroke="#0f172a" stroke-width="1.8"/>
                <path d="M10 8c4-2.5 9-2 12 1.5" stroke="#e7e5e4" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="12" cy="14" r="2.4" fill="#78716c"/>
                <circle cx="19.5" cy="19" r="3" fill="#78716c"/>
                <circle cx="18.5" cy="11.5" r="1.4" fill="#57534e"/>
            </svg>`,
            PLANET_VENUS: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="11" fill="#f59e0b" stroke="#0f172a" stroke-width="1.8"/>
                <path d="M6.5 13c4-1.8 14-1.8 19 0" stroke="#fde68a" stroke-width="2.4" stroke-linecap="round"/>
                <path d="M6.5 19c4.5 1.8 14 1.8 19 0" stroke="#d97706" stroke-width="2.4" stroke-linecap="round"/>
                <path d="M9.5 16c4 0.8 9 0.8 13 0" stroke="#fef3c7" stroke-width="1.8" stroke-linecap="round"/>
            </svg>`,
            PLANET_EARTH: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="11" fill="#0284c7" stroke="#0f172a" stroke-width="1.8"/>
                <path d="M10 10c2.5-1.5 5.5-.5 6.5 1.5s-1.5 3.5-.5 5.5c.8 1.5 3 2 4.5 1" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
                <path d="M8.5 18.5c1.8-1 3.8 0 4.5 2s-1 4-2.8 4.2" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
                <path d="M19 8.5c2 0 4 1.5 4.5 3.5-1.5 1-3.5 1-5 0" fill="#4ade80"/>
            </svg>`,
            PLANET_MOON: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="11" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.8"/>
                <circle cx="12" cy="12.5" r="2.7" fill="#94a3b8" stroke="#64748b" stroke-width="1"/>
                <circle cx="20" cy="18.5" r="3.2" fill="#94a3b8" stroke="#64748b" stroke-width="1"/>
                <circle cx="19" cy="10.5" r="1.5" fill="#94a3b8"/>
                <circle cx="11.5" cy="20.5" r="1.4" fill="#94a3b8"/>
            </svg>`,
            PLANET_MARS: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="11" fill="#dc2626" stroke="#0f172a" stroke-width="1.8"/>
                <path d="M11 6.2c3-.8 7-.8 10 0" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>
                <circle cx="12.5" cy="15" r="2.6" fill="#991b1b"/>
                <circle cx="20" cy="18.5" r="2.2" fill="#b91c1c"/>
                <path d="M10 21c4 1.2 8 1.2 12 0" stroke="#f97316" stroke-width="1.6" stroke-linecap="round"/>
            </svg>`,
            PLANET_JUPITER: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="11.5" fill="#f59e0b" stroke="#0f172a" stroke-width="1.8"/>
                <path d="M5.5 12.5h21" stroke="#fef3c7" stroke-width="2.6"/>
                <path d="M5 16.5h22" stroke="#b45309" stroke-width="2.4"/>
                <path d="M6.5 20.5h19" stroke="#fde68a" stroke-width="2.2"/>
                <ellipse cx="20" cy="18.5" rx="3" ry="1.9" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.9"/>
                <circle cx="28" cy="9" r="1.6" fill="#fde047"/>
                <circle cx="4" cy="23" r="1.5" fill="#bae6fd"/>
            </svg>`,
            PLANET_SATURN: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="16" cy="16" rx="14.2" ry="4.6" transform="rotate(-18 16 16)" stroke="#fde047" stroke-width="3"/>
                <circle cx="16" cy="16" r="8.2" fill="#eab308" stroke="#0f172a" stroke-width="1.7"/>
                <path d="M8.5 14.5h15" stroke="#fef08a" stroke-width="1.8"/>
                <path d="M9 18h14" stroke="#ca8a04" stroke-width="1.6"/>
                <path d="M3.2 20.5c5.5 1.8 18.5-2.2 25.6-9" stroke="#facc15" stroke-width="2.6" stroke-linecap="round"/>
            </svg>`,
            PLANET_URANUS: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="16" cy="16" rx="4.2" ry="13.5" transform="rotate(14 16 16)" stroke="#a5f3fc" stroke-width="2.2"/>
                <circle cx="16" cy="16" r="8.5" fill="#22d3ee" stroke="#0f172a" stroke-width="1.7"/>
                <path d="M12 10c2 4 2 8 0 12" stroke="#cffafe" stroke-width="1.8" stroke-linecap="round"/>
            </svg>`,
            PLANET_NEPTUNE: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="11" fill="#2563eb" stroke="#0f172a" stroke-width="1.8"/>
                <path d="M6.5 13c5-1.2 14-1.2 19 0" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M7 19c4.5 1.2 13.5 1.2 18 0" stroke="#1d4ed8" stroke-width="2.4" stroke-linecap="round"/>
                <ellipse cx="13.5" cy="16.5" rx="3" ry="1.8" fill="#1e3a8a"/>
            </svg>`,
            PLANET_PLUTO: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="17" r="9.8" fill="#d6d3d1" stroke="#0f172a" stroke-width="1.7"/>
                <path d="M15 19.5c-1.8-1.5-3.2-2.7-3.2-4.2a2.2 2.2 0 014.2-.8 2.2 2.2 0 014.2.8c0 1.5-1.4 2.7-3.2 4.2l-1 .8-1-.8z" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.9"/>
                <circle cx="25.5" cy="8.5" r="3" fill="#94a3b8" stroke="#0f172a" stroke-width="1.3"/>
            </svg>`,
            PLANET_TITAN: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="11" fill="#f59e0b" stroke="#0f172a" stroke-width="1.8"/>
                <circle cx="16" cy="16" r="9" stroke="#fde68a" stroke-width="1.6" stroke-dasharray="4 3"/>
                <path d="M8 14.5c4.5 1.2 11.5 1.2 16 0" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>
                <path d="M9.5 19c4 1 9 1 13 0" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>
            </svg>`,
            CAVE_ENTRANCE: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 26L8 12L16 6L24 12L28 26H4Z" fill="#475569" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M10 26V17C10 13.5 12.5 11.5 16 11.5C19.5 11.5 22 13.5 22 17V26H10Z" fill="#090d16" stroke="#1e293b" stroke-width="1.4"/>
                <path d="M12.5 13L14 16.5L15.5 13" fill="#94a3b8"/>
                <path d="M17.5 13L19 16L20.5 13" fill="#94a3b8"/>
                <circle cx="8" cy="20" r="1.8" fill="#fbbf24"/>
                <circle cx="24" cy="20" r="1.8" fill="#fbbf24"/>
            </svg>`,
            MONOLITH: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 27L13 5H19L21 27H11Z" fill="#334155" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M16 9V23" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round"/>
                <circle cx="16" cy="13" r="2" fill="#fde047"/>
                <path d="M6 27H26" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            WATER_BUOY: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 22L13 9H19L22 22H10Z" fill="#38bdf8" stroke="#0f172a" stroke-width="1.6" stroke-linejoin="round"/>
                <circle cx="16" cy="7" r="2.2" fill="#fde047" stroke="#0f172a" stroke-width="1.2"/>
                <path d="M4 24c3-2 6-2 9 0s6 2 9 0 5-2 6 0" stroke="#7dd3fc" stroke-width="2.2" stroke-linecap="round"/>
            </svg>`,
            COMET: `<svg viewBox="0 0 32 32" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8L18 14L14 18L4 8Z" fill="#38bdf8" fill-opacity="0.7"/>
                <path d="M7 5L20 12L17 15L7 5Z" fill="#fde047" fill-opacity="0.75"/>
                <circle cx="21" cy="19" r="6" fill="#22d3ee" stroke="#0f172a" stroke-width="1.7"/>
                <circle cx="22.5" cy="17.5" r="2" fill="#f8fafc"/>
            </svg>`
        };

if (typeof window !== 'undefined') {
    window.SVG_ICONS = SVG_ICONS;
}

export default SVG_ICONS;
