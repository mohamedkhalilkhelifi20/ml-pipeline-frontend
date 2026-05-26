'use client'

// =============================================================================
// app/rendezvous/page.tsx — Agenda des rendez-vous
// Split-panel layout: mini calendar sidebar + agenda list / full calendar
// =============================================================================

import '@/styles/rendezvous.css'
import '@/styles/dashboard.css'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppTopbar from '@/components/AppTopbar'
import {
    listRendezVous,
    createRendezVous,
    updateRendezVous,
    cancelRendezVous,
    getSecretaryClients,
    getDoctorClients,
    getCreneaux,
    RendezVousOut,
    CreneauInfo,
    ClientOut,
} from '@/lib/api'
import {
    addWeeks, subWeeks,
    startOfWeek, endOfWeek,
    addDays, addMonths, subMonths,
    format, isPast, isToday, isFuture, isSameDay,
    parseISO, isSameWeek, isSameMonth,
    startOfMonth, endOfMonth, eachDayOfInterval,
    differenceInCalendarDays,
    getDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Constants ──────────────────────────────────────────────────────────────────

const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAYS_MINI = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const TIME_SLOTS: string[] = []
for (let h = 8; h < 18; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

type FilterMode = 'all' | 'upcoming' | 'today' | 'past' | 'date'
type ViewMode   = 'list' | 'calendar'

interface BookingState {
    iso:       string
    heure:     string
    dateLabel: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getWeekDays(weekStart: Date): Date[] {
    return Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))
}

function rdvKey(rdv: RendezVousOut): string {
    const dt = parseISO(rdv.date_heure)
    return `${format(dt, 'yyyy-MM-dd')}|${format(dt, 'HH:mm')}`
}

function slotKey(day: Date, heure: string): string {
    return `${format(day, 'yyyy-MM-dd')}|${heure}`
}

function endTime(heure: string): string {
    const [h, m] = heure.split(':').map(Number)
    return m === 30
        ? `${String(h + 1).padStart(2, '0')}:00`
        : `${String(h).padStart(2, '0')}:30`
}

function nextRdv(rdvs: RendezVousOut[]): RendezVousOut | null {
    const now = new Date()
    return rdvs
        .filter(r => parseISO(r.date_heure) > now && r.statut === 'confirme')
        .sort((a, b) => parseISO(a.date_heure).getTime() - parseISO(b.date_heure).getTime())[0] ?? null
}

function dateSectionLabel(isoDate: string): string {
    const d    = parseISO(isoDate + 'T00:00:00')
    const diff = differenceInCalendarDays(d, new Date())
    if (diff === 0)  return 'Aujourd\'hui'
    if (diff === 1)  return 'Demain'
    if (diff === -1) return 'Hier'
    if (diff > 1 && diff < 7) return format(d, 'EEEE', { locale: fr })
    return format(d, 'EEEE d MMMM yyyy', { locale: fr })
}

function initials(fullName: string): string {
    return fullName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
    confirme: { label: 'Confirmé', cls: 'rdv-badge--confirme', dot: '#16a34a' },
    annule:   { label: 'Annulé',   cls: 'rdv-badge--annule',   dot: '#dc2626' },
    termine:  { label: 'Terminé',  cls: 'rdv-badge--termine',  dot: '#94a3b8' },
}

// ── Mini Calendar ──────────────────────────────────────────────────────────────

function MiniCalendar({
    rdvs,
    selectedDate,
    onSelectDate,
}: {
    rdvs: RendezVousOut[]
    selectedDate: string | null
    onSelectDate: (iso: string | null) => void
}) {
    const [calMonth, setCalMonth] = useState(new Date())

    const monthStart = startOfMonth(calMonth)
    const monthEnd   = endOfMonth(calMonth)

    // Build grid: start from Monday of the week containing monthStart
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd   = endOfWeek(monthEnd,   { weekStartsOn: 1 })
    const days      = eachDayOfInterval({ start: gridStart, end: gridEnd })

    // Which dates have appointments
    const rdvDateSet = useMemo(() => {
        const s = new Set<string>()
        rdvs.forEach(r => s.add(format(parseISO(r.date_heure), 'yyyy-MM-dd')))
        return s
    }, [rdvs])

    // Count per date (for the dots)
    const rdvCountMap = useMemo(() => {
        const m = new Map<string, number>()
        rdvs.forEach(r => {
            const k = format(parseISO(r.date_heure), 'yyyy-MM-dd')
            m.set(k, (m.get(k) ?? 0) + 1)
        })
        return m
    }, [rdvs])

    const todayStr = format(new Date(), 'yyyy-MM-dd')

    return (
        <div className="rdv-mini-cal">
            {/* Month nav */}
            <div className="rdv-mini-cal-header">
                <button className="rdv-mini-cal-nav" onClick={() => setCalMonth(m => subMonths(m, 1))}>‹</button>
                <span className="rdv-mini-cal-month" style={{ textTransform: 'capitalize' }}>
                    {format(calMonth, 'MMMM yyyy', { locale: fr })}
                </span>
                <button className="rdv-mini-cal-nav" onClick={() => setCalMonth(m => addMonths(m, 1))}>›</button>
            </div>

            {/* Day-of-week headers */}
            <div className="rdv-mini-cal-grid">
                {DAYS_MINI.map((d, i) => (
                    <div key={i} className="rdv-mini-cal-dow">{d}</div>
                ))}

                {/* Day cells */}
                {days.map((day, i) => {
                    const dayStr     = format(day, 'yyyy-MM-dd')
                    const inMonth    = isSameMonth(day, calMonth)
                    const isSelected = selectedDate === dayStr
                    const isT        = dayStr === todayStr
                    const hasRdv     = rdvDateSet.has(dayStr)
                    const count      = rdvCountMap.get(dayStr) ?? 0

                    return (
                        <button
                            key={i}
                            className={[
                                'rdv-mini-cal-day',
                                !inMonth    ? 'rdv-mini-cal-day--out'      : '',
                                isT         ? 'rdv-mini-cal-day--today'    : '',
                                isSelected  ? 'rdv-mini-cal-day--selected' : '',
                                hasRdv && inMonth && !isT && !isSelected ? 'rdv-mini-cal-day--has-rdv' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => onSelectDate(isSelected ? null : dayStr)}
                            title={hasRdv ? `${count} rendez-vous` : undefined}
                        >
                            <span>{format(day, 'd')}</span>
                            {hasRdv && inMonth && (
                                <span className={`rdv-mini-cal-dot${isT || isSelected ? ' rdv-mini-cal-dot--white' : ''}`} />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Jump to today */}
            {!isSameMonth(new Date(), calMonth) && (
                <button
                    className="rdv-mini-cal-today-btn"
                    onClick={() => { setCalMonth(new Date()); onSelectDate(null) }}
                >
                    Revenir à aujourd&apos;hui
                </button>
            )}
        </div>
    )
}

// ── Upcoming card ──────────────────────────────────────────────────────────────

function UpcomingCard({ rdv }: { rdv: RendezVousOut }) {
    const dt     = parseISO(rdv.date_heure)
    const isT    = isToday(dt)
    const diff   = differenceInCalendarDays(dt, new Date())
    const when   = isT ? 'Aujourd\'hui' : diff === 1 ? 'Demain' : format(dt, 'EEEE d MMM', { locale: fr })

    return (
        <div className="rdv-upcoming-card">
            <div className="rdv-upcoming-label">Prochain rendez-vous</div>
            <div className="rdv-upcoming-when" style={{ textTransform: 'capitalize' }}>{when}</div>
            <div className="rdv-upcoming-time">{format(dt, 'HH:mm')} — {endTime(format(dt, 'HH:mm'))}</div>
            <div className="rdv-upcoming-divider" />
            <div className="rdv-upcoming-avatar">{initials(rdv.client_nom)}</div>
            <div className="rdv-upcoming-patient">{rdv.client_nom}</div>
            {rdv.motif && <div className="rdv-upcoming-motif">{rdv.motif}</div>}
        </div>
    )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RendezVousPage() {
    const { user, token, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()

    const isDoctor = user?.role === 'doctor'
    const canEdit  = user?.role === 'secretary' || user?.role === 'admin'

    const [viewMode, setViewMode] = useState<ViewMode>('list')

    // Calendar view state
    const [weekStart, setWeekStart] = useState<Date>(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    )

    // Data
    const [rdvs,    setRdvs]    = useState<RendezVousOut[]>([])
    const [clients, setClients] = useState<ClientOut[]>([])

    // Agenda filters
    const [filterMode,   setFilterMode]   = useState<FilterMode>('upcoming')
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [searchQuery,  setSearchQuery]  = useState('')

    // Booking modal
    const [booking,   setBooking]   = useState<BookingState | null>(null)
    const [selClient, setSelClient] = useState('')
    const [motif,     setMotif]     = useState('')
    const [saving,    setSaving]    = useState(false)
    const [bookErr,   setBookErr]   = useState('')

    // Detail modal
    const [detail,     setDetail]     = useState<RendezVousOut | null>(null)
    const [cancelling, setCancelling] = useState(false)

    // Edit modal
    const [editingRdv,    setEditingRdv]    = useState<RendezVousOut | null>(null)
    const [editDate,      setEditDate]      = useState('')
    const [editHeure,     setEditHeure]     = useState('')
    const [editClientId,  setEditClientId]  = useState('')
    const [editMotif,     setEditMotif]     = useState('')
    const [editSlots,     setEditSlots]     = useState<CreneauInfo[]>([])
    const [editSlotsLoad, setEditSlotsLoad] = useState(false)
    const [editSaving,    setEditSaving]    = useState(false)
    const [editErr,       setEditErr]       = useState('')

    // Auth guard
    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    // Default view by role
    useEffect(() => {
        if (user) setViewMode(isDoctor ? 'list' : 'calendar')
    }, [user, isDoctor])

    // Fetch data
    const refresh = useCallback(async () => {
        if (!token || !user) return
        try {
            const [rdvList, clientList] = await Promise.all([
                listRendezVous(token),
                user.role === 'secretary' ? getSecretaryClients(token) : getDoctorClients(token),
            ])
            setRdvs(rdvList)
            setClients(clientList)
        } catch { /* silent */ }
    }, [token, user])

    useEffect(() => { refresh() }, [refresh])

    // Edit slot fetch
    useEffect(() => {
        if (!editingRdv || !token || !editDate) { setEditSlots([]); return }
        setEditSlotsLoad(true)
        getCreneaux(token, editDate)
            .then(res => {
                if (!res.jour_ouvre) { setEditSlots([]); return }
                const origDate  = format(parseISO(editingRdv.date_heure), 'yyyy-MM-dd')
                const origHeure = format(parseISO(editingRdv.date_heure), 'HH:mm')
                const slots = res.creneaux.map(s =>
                    editDate === origDate && s.heure === origHeure && s.statut === 'pris' && s.rdv_id === editingRdv.id
                        ? { ...s, statut: 'libre' as const }
                        : s
                )
                const now = new Date()
                setEditSlots(slots.filter(s => {
                    const [h, m] = s.heure.split(':').map(Number)
                    const dt = new Date(editDate); dt.setHours(h, m, 0, 0)
                    return dt > now && s.statut === 'libre'
                }))
            })
            .catch(() => setEditSlots([]))
            .finally(() => setEditSlotsLoad(false))
    }, [editDate, editingRdv, token])

    // When user picks a day from mini calendar, switch to date filter
    function handleSelectDate(dateStr: string | null) {
        setSelectedDate(dateStr)
        setFilterMode(dateStr ? 'date' : 'upcoming')
        setSearchQuery('')
    }

    // Filtered agenda
    const filteredRdvs = useMemo(() => {
        let list = [...rdvs]
        const q = searchQuery.toLowerCase().trim()
        if (q) list = list.filter(r => r.client_nom.toLowerCase().includes(q))

        if (filterMode === 'date' && selectedDate) {
            list = list.filter(r => format(parseISO(r.date_heure), 'yyyy-MM-dd') === selectedDate)
        } else if (filterMode === 'today') {
            list = list.filter(r => isToday(parseISO(r.date_heure)))
        } else if (filterMode === 'upcoming') {
            list = list.filter(r => isFuture(parseISO(r.date_heure)) || isToday(parseISO(r.date_heure)))
        } else if (filterMode === 'past') {
            list = list.filter(r => isPast(parseISO(r.date_heure)) && !isToday(parseISO(r.date_heure)))
        }

        return list.sort((a, b) =>
            filterMode === 'past'
                ? parseISO(b.date_heure).getTime() - parseISO(a.date_heure).getTime()
                : parseISO(a.date_heure).getTime() - parseISO(b.date_heure).getTime()
        )
    }, [rdvs, filterMode, selectedDate, searchQuery])

    const groupedRdvs = useMemo(() => {
        const groups: { dateKey: string; items: RendezVousOut[] }[] = []
        const seen = new Map<string, RendezVousOut[]>()
        for (const r of filteredRdvs) {
            const key = format(parseISO(r.date_heure), 'yyyy-MM-dd')
            if (!seen.has(key)) { seen.set(key, []); groups.push({ dateKey: key, items: seen.get(key)! }) }
            seen.get(key)!.push(r)
        }
        return groups
    }, [filteredRdvs])

    // Stats
    const todayCount    = rdvs.filter(r => isToday(parseISO(r.date_heure))).length
    const confirmedCount = rdvs.filter(r => r.statut === 'confirme').length
    const next          = nextRdv(rdvs)

    // Calendar helpers
    const rdvMap      = new Map<string, RendezVousOut>()
    rdvs.forEach(r => rdvMap.set(rdvKey(r), r))
    const weekDays    = getWeekDays(weekStart)
    const weekRdvs    = rdvs.filter(r => isSameWeek(parseISO(r.date_heure), weekStart, { weekStartsOn: 1 }))
    const weekEnd     = addDays(weekStart, 5)
    const navLabel    = `${format(weekStart, 'd MMM', { locale: fr })} — ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`
    const isThisWeek_ = isSameWeek(new Date(), weekStart, { weekStartsOn: 1 })

    // Actions
    function openEdit(rdv: RendezVousOut) {
        const dt = parseISO(rdv.date_heure)
        setEditingRdv(rdv); setEditDate(format(dt, 'yyyy-MM-dd')); setEditHeure(format(dt, 'HH:mm'))
        setEditClientId(rdv.client_id); setEditMotif(rdv.motif ?? ''); setEditErr(''); setDetail(null)
    }

    async function handleEdit() {
        if (!token || !editingRdv || !editHeure || !editClientId) return
        setEditSaving(true); setEditErr('')
        const origDate  = format(parseISO(editingRdv.date_heure), 'yyyy-MM-dd')
        const origHeure = format(parseISO(editingRdv.date_heure), 'HH:mm')
        const payload: Record<string, string> = { motif: editMotif.trim() }
        if (editDate !== origDate || editHeure !== origHeure) payload.date_heure = `${editDate}T${editHeure}:00`
        if (editClientId !== editingRdv.client_id)            payload.client_id  = editClientId
        try {
            await updateRendezVous(token, editingRdv.id, payload)
            setEditingRdv(null); await refresh()
        } catch (e: unknown) {
            setEditErr(e instanceof Error ? e.message : 'Erreur.')
        } finally { setEditSaving(false) }
    }

    async function handleBook() {
        if (!token || !booking || !selClient) return
        setSaving(true); setBookErr('')
        try {
            await createRendezVous(token, { client_id: selClient, date_heure: booking.iso, motif: motif.trim() || undefined })
            setBooking(null); setSelClient(''); setMotif(''); await refresh()
        } catch (e: unknown) {
            setBookErr(e instanceof Error ? e.message : 'Erreur.')
        } finally { setSaving(false) }
    }

    async function handleCancel() {
        if (!token || !detail) return
        setCancelling(true)
        try { await cancelRendezVous(token, detail.id); setDetail(null); await refresh() }
        finally { setCancelling(false) }
    }

    if (isLoading || !user) {
        return (
            <div className="dash-loading">
                <div className="dash-loading-spinner" />
            </div>
        )
    }

    return (
        <div className="rdv-root">
            <AppTopbar />

            <div className="rdv-body">

                {/* ── Page header ── */}
                <div className="rdv-page-header">
                    <div className="rdv-page-header-left">
                        <div className="rdv-page-title-block">
                            <div className="rdv-page-icon">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <rect x="3" y="4" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                                    <path d="M3 9h14" stroke="currentColor" strokeWidth="1.4"/>
                                    <path d="M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                                    <circle cx="7" cy="13" r="1" fill="currentColor"/>
                                    <circle cx="10" cy="13" r="1" fill="currentColor"/>
                                    <circle cx="13" cy="13" r="1" fill="currentColor"/>
                                </svg>
                            </div>
                            <div>
                                <div className="rdv-page-title">Agenda des rendez-vous</div>
                                <div className="rdv-page-subtitle">Lun – Sam &middot; 08 h – 18 h &middot; créneaux de 30 min</div>
                            </div>
                        </div>
                    </div>

                    <div className="rdv-header-actions">
                        {/* View toggle */}
                        <div className="rdv-view-toggle">
                            <button
                                className={`rdv-view-btn${viewMode === 'list' ? ' rdv-view-btn--active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <rect x="1" y="2"   width="12" height="2" rx="1" fill="currentColor"/>
                                    <rect x="1" y="6"   width="12" height="2" rx="1" fill="currentColor"/>
                                    <rect x="1" y="10"  width="12" height="2" rx="1" fill="currentColor"/>
                                </svg>
                                Liste
                            </button>
                            <button
                                className={`rdv-view-btn${viewMode === 'calendar' ? ' rdv-view-btn--active' : ''}`}
                                onClick={() => setViewMode('calendar')}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <rect x="1" y="2.5" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                                    <path d="M1 6.5h12" stroke="currentColor" strokeWidth="1.2"/>
                                    <path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                                Calendrier
                            </button>
                        </div>

                        {/* Calendar-mode nav */}
                        {viewMode === 'calendar' && (
                            <>
                                {!isThisWeek_ && (
                                    <button className="rdv-today-btn" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                                        Aujourd&apos;hui
                                    </button>
                                )}
                                <div className="rdv-nav">
                                    <button className="rdv-nav-btn" onClick={() => setWeekStart(w => subWeeks(w, 1))}>‹</button>
                                    <span className="rdv-nav-label">{navLabel}</span>
                                    <button className="rdv-nav-btn" onClick={() => setWeekStart(w => addWeeks(w, 1))}>›</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    LIST VIEW — split panel
                ════════════════════════════════════════════════════════════════ */}
                {viewMode === 'list' && (
                    <div className="rdv-split">

                        {/* ── LEFT PANEL ────────────────────────────────────────── */}
                        <aside className="rdv-left-panel">

                            {/* Mini stats */}
                            <div className="rdv-panel-stats">
                                <div className="rdv-panel-stat">
                                    <div className="rdv-panel-stat-val rdv-panel-stat-val--blue">{confirmedCount}</div>
                                    <div className="rdv-panel-stat-lbl">Confirmés</div>
                                </div>
                                <div className="rdv-panel-stat-sep" />
                                <div className="rdv-panel-stat">
                                    <div className="rdv-panel-stat-val rdv-panel-stat-val--green">{todayCount}</div>
                                    <div className="rdv-panel-stat-lbl">Aujourd&apos;hui</div>
                                </div>
                                <div className="rdv-panel-stat-sep" />
                                <div className="rdv-panel-stat">
                                    <div className="rdv-panel-stat-val rdv-panel-stat-val--violet">{rdvs.filter(r => isFuture(parseISO(r.date_heure))).length}</div>
                                    <div className="rdv-panel-stat-lbl">À venir</div>
                                </div>
                            </div>

                            {/* Mini calendar */}
                            <MiniCalendar
                                rdvs={rdvs}
                                selectedDate={selectedDate}
                                onSelectDate={handleSelectDate}
                            />

                            {/* Next appointment card */}
                            {next && <UpcomingCard rdv={next} />}

                            {/* Legend */}
                            <div className="rdv-panel-legend">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <div key={key} className="rdv-panel-legend-row">
                                        <span className="rdv-panel-legend-dot" style={{ background: cfg.dot }} />
                                        <span className="rdv-panel-legend-label">{cfg.label}</span>
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* ── RIGHT PANEL ───────────────────────────────────────── */}
                        <main className="rdv-right-panel">

                            {/* Filter bar */}
                            <div className="rdv-agenda-filterbar">
                                <div className="rdv-agenda-filters">
                                    {([
                                        ['upcoming', 'À venir'],
                                        ['today',    'Aujourd\'hui'],
                                        ['all',      'Tous'],
                                        ['past',     'Passés'],
                                    ] as [FilterMode, string][]).map(([mode, label]) => (
                                        <button
                                            key={mode}
                                            className={`rdv-agenda-filter-btn${filterMode === mode ? ' rdv-agenda-filter-btn--active' : ''}`}
                                            onClick={() => { setFilterMode(mode); setSelectedDate(null) }}
                                        >
                                            {label}
                                            <span className="rdv-agenda-filter-count">
                                                {mode === 'all'
                                                    ? rdvs.length
                                                    : mode === 'today'
                                                    ? todayCount
                                                    : mode === 'upcoming'
                                                    ? rdvs.filter(r => isFuture(parseISO(r.date_heure)) || isToday(parseISO(r.date_heure))).length
                                                    : rdvs.filter(r => isPast(parseISO(r.date_heure)) && !isToday(parseISO(r.date_heure))).length
                                                }
                                            </span>
                                        </button>
                                    ))}

                                    {/* Active date filter chip */}
                                    {filterMode === 'date' && selectedDate && (
                                        <button
                                            className="rdv-agenda-filter-btn rdv-agenda-filter-btn--active rdv-agenda-filter-btn--date"
                                            onClick={() => handleSelectDate(null)}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                <rect x="1" y="2" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                                                <path d="M1 5h8" stroke="currentColor" strokeWidth="1"/>
                                                <path d="M3.5 1v2M6.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                            </svg>
                                            {format(parseISO(selectedDate + 'T00:00:00'), 'd MMM', { locale: fr })}
                                            <span style={{ marginLeft: '0.2rem', opacity: 0.7 }}>✕</span>
                                        </button>
                                    )}
                                </div>

                                <div className="rdv-agenda-search-wrap">
                                    <svg className="rdv-agenda-search-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
                                        <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
                                        <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                    </svg>
                                    <input
                                        className="rdv-agenda-search"
                                        type="text"
                                        placeholder="Rechercher un patient…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button className="rdv-agenda-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                                    )}
                                </div>
                            </div>

                            {/* Result count line */}
                            <div className="rdv-agenda-result-line">
                                <span className="rdv-agenda-result-count">{filteredRdvs.length}</span>
                                {' '}rendez-vous
                                {filterMode === 'date' && selectedDate && (
                                    <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                                        {' '}· {format(parseISO(selectedDate + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })}
                                    </span>
                                )}
                            </div>

                            {/* Empty state */}
                            {groupedRdvs.length === 0 && (
                                <div className="rdv-agenda-empty">
                                    <div className="rdv-agenda-empty-icon">
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                            <rect x="6" y="10" width="36" height="32" rx="5" stroke="#cbd5e1" strokeWidth="2"/>
                                            <path d="M6 20h36" stroke="#cbd5e1" strokeWidth="2"/>
                                            <path d="M16 6v8M32 6v8" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
                                            <path d="M16 30h16M16 36h10" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    <div className="rdv-agenda-empty-title">Aucun rendez-vous</div>
                                    <div className="rdv-agenda-empty-sub">
                                        {searchQuery
                                            ? `Aucun patient ne correspond à « ${searchQuery} »`
                                            : filterMode === 'today'    ? 'Pas de rendez-vous aujourd\'hui.'
                                            : filterMode === 'upcoming' ? 'Aucun rendez-vous à venir.'
                                            : filterMode === 'past'     ? 'Aucun rendez-vous passé.'
                                            : filterMode === 'date'     ? 'Aucun rendez-vous ce jour.'
                                            : 'Aucun rendez-vous enregistré.'}
                                    </div>
                                </div>
                            )}

                            {/* Date groups */}
                            <div className="rdv-agenda-groups">
                                {groupedRdvs.map(({ dateKey, items }) => {
                                    const sectionLabel = dateSectionLabel(dateKey)
                                    const sectionFull  = format(parseISO(dateKey + 'T00:00:00'), 'EEEE d MMMM yyyy', { locale: fr })
                                    const isGroupToday = isToday(parseISO(dateKey + 'T00:00:00'))

                                    return (
                                        <div key={dateKey} className="rdv-agenda-group">
                                            <div className={`rdv-agenda-date-header${isGroupToday ? ' rdv-agenda-date-header--today' : ''}`}>
                                                <div className="rdv-agenda-date-dot" />
                                                <div className="rdv-agenda-date-label">{sectionLabel}</div>
                                                {sectionLabel !== sectionFull && (
                                                    <div className="rdv-agenda-date-full" style={{ textTransform: 'capitalize' }}>
                                                        {sectionFull}
                                                    </div>
                                                )}
                                                <div className="rdv-agenda-date-count">{items.length} rdv</div>
                                            </div>

                                            <div className="rdv-agenda-cards">
                                                {items.map(r => {
                                                    const dt        = parseISO(r.date_heure)
                                                    const timeStr   = format(dt, 'HH:mm')
                                                    const pastCard  = isPast(dt) && !isToday(dt)
                                                    const statusCfg = STATUS_CONFIG[r.statut] ?? { label: r.statut, cls: '', dot: '#cbd5e1' }

                                                    return (
                                                        <div
                                                            key={r.id}
                                                            className={[
                                                                'rdv-agenda-card',
                                                                pastCard          ? 'rdv-agenda-card--past'      : '',
                                                                r.statut === 'annule' ? 'rdv-agenda-card--cancelled' : '',
                                                            ].filter(Boolean).join(' ')}
                                                            onClick={() => setDetail(r)}
                                                        >
                                                            {/* Status accent */}
                                                            <div className="rdv-agenda-card-accent" style={{ background: statusCfg.dot }} />

                                                            {/* Avatar */}
                                                            <div className={`rdv-agenda-avatar${pastCard ? ' rdv-agenda-avatar--past' : ''}`}>
                                                                {initials(r.client_nom)}
                                                            </div>

                                                            {/* Body */}
                                                            <div className="rdv-agenda-card-body">
                                                                <div className="rdv-agenda-card-name">{r.client_nom}</div>
                                                                {r.motif && (
                                                                    <div className="rdv-agenda-card-motif">{r.motif}</div>
                                                                )}
                                                                {!isDoctor && r.doctor_nom && (
                                                                    <div className="rdv-agenda-card-doctor">Dr. {r.doctor_nom}</div>
                                                                )}
                                                            </div>

                                                            {/* Right */}
                                                            <div className="rdv-agenda-card-right">
                                                                <div className="rdv-agenda-time-pill">
                                                                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                                                        <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                                                                        <path d="M5.5 3v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                                                    </svg>
                                                                    {timeStr} — {endTime(timeStr)}
                                                                </div>
                                                                <span className={`rdv-agenda-badge ${statusCfg.cls}`}>
                                                                    {statusCfg.label}
                                                                </span>
                                                            </div>

                                                            <div className="rdv-agenda-card-arrow">›</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </main>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    CALENDAR VIEW
                ════════════════════════════════════════════════════════════════ */}
                {viewMode === 'calendar' && (
                    <>
                        {/* Stat strip for calendar mode */}
                        <div className="rdv-stats-strip">
                            <div className="rdv-stat-card rdv-stat-card--blue">
                                <div className="rdv-stat-icon">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <rect x="2" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                                        <path d="M2 8h14" stroke="currentColor" strokeWidth="1.3"/>
                                        <path d="M6 2v4M12 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <div>
                                    <div className="rdv-stat-value">{weekRdvs.length}</div>
                                    <div className="rdv-stat-label">RDV cette semaine</div>
                                </div>
                            </div>
                            <div className="rdv-stat-card rdv-stat-card--green">
                                <div className="rdv-stat-icon">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                                        <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <div>
                                    <div className="rdv-stat-value">{todayCount}</div>
                                    <div className="rdv-stat-label">Aujourd&apos;hui</div>
                                </div>
                            </div>
                            <div className="rdv-stat-card rdv-stat-card--violet">
                                <div className="rdv-stat-icon">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                                        <path d="M8 5.5v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                        <path d="M13.5 13.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <div>
                                    <div className="rdv-stat-value" style={{ fontSize: next ? '0.82rem' : undefined, paddingTop: next ? '0.15rem' : undefined }}>
                                        {next ? `${format(parseISO(next.date_heure), 'HH:mm')} · ${next.client_nom.split(' ')[0]}` : '—'}
                                    </div>
                                    <div className="rdv-stat-label">Prochain rendez-vous</div>
                                </div>
                            </div>
                        </div>

                        <div className="rdv-calendar-wrap">
                            <div className="rdv-col-headers">
                                <div className="rdv-col-header-empty" />
                                {weekDays.map((day, i) => (
                                    <div key={i} className={`rdv-col-header${isToday(day) ? ' rdv-col-header--today' : ''}`}>
                                        <div className="rdv-col-header-day">{DAYS_FR[i]}</div>
                                        <div className="rdv-col-header-date">{format(day, 'd')}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="rdv-grid-body">
                                <div className="rdv-time-col">
                                    {TIME_SLOTS.map(t => (
                                        <div key={t} className="rdv-time-label">{t}</div>
                                    ))}
                                </div>
                                {weekDays.map((day, di) => (
                                    <div key={di} className={`rdv-day-col${isToday(day) ? ' rdv-day-col--today' : ''}`}>
                                        {TIME_SLOTS.map(heure => {
                                            const rdv = rdvMap.get(slotKey(day, heure))
                                            const [h, m] = heure.split(':').map(Number)
                                            const slotDt = new Date(day); slotDt.setHours(h, m, 0, 0)
                                            const past = isPast(slotDt)

                                            if (rdv) return (
                                                <div key={heure} className="rdv-slot" onClick={() => setDetail(rdv)}>
                                                    <div className={`rdv-event${rdv.statut === 'annule' ? ' rdv-event--cancelled' : ''}`}>
                                                        <div className="rdv-event-name">{rdv.client_nom}</div>
                                                        {rdv.motif && <div className="rdv-event-motif">{rdv.motif}</div>}
                                                    </div>
                                                </div>
                                            )
                                            if (past) return <div key={heure} className="rdv-slot rdv-slot--past" />
                                            return (
                                                <div
                                                    key={heure}
                                                    className="rdv-slot rdv-slot--free"
                                                    onClick={() => {
                                                        if (!canEdit) return
                                                        const iso = `${format(day, 'yyyy-MM-dd')}T${heure}:00`
                                                        setBooking({ iso, heure, dateLabel: format(day, 'EEEE d MMMM', { locale: fr }) })
                                                        setSelClient(''); setMotif(''); setBookErr('')
                                                    }}
                                                >
                                                    {canEdit && (
                                                        <div className="rdv-slot-add"><span>+</span><span>{heure}</span></div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Booking modal ── */}
            {booking && (
                <div className="rdv-modal-overlay" onClick={() => setBooking(null)}>
                    <div className="rdv-modal" onClick={e => e.stopPropagation()}>
                        <div className="rdv-modal-header">
                            <div className="rdv-modal-header-icon">📋</div>
                            <div className="rdv-modal-header-title">Nouveau rendez-vous</div>
                            <div className="rdv-modal-header-sub">Réserver un créneau pour un patient</div>
                            <button className="rdv-modal-close" onClick={() => setBooking(null)}>✕</button>
                        </div>
                        <div className="rdv-modal-body">
                            <div className="rdv-modal-slot-display">
                                <div className="rdv-modal-slot-icon">🕐</div>
                                <div className="rdv-modal-slot-text">
                                    <div className="rdv-modal-slot-date" style={{ textTransform: 'capitalize' }}>{booking.dateLabel}</div>
                                    <div className="rdv-modal-slot-time">{booking.heure} — {endTime(booking.heure)} (30 min)</div>
                                </div>
                            </div>
                            <div className="rdv-modal-field">
                                <label className="rdv-modal-label">Patient *</label>
                                <select className="rdv-modal-select" value={selClient} onChange={e => setSelClient(e.target.value)}>
                                    <option value="">— Sélectionner un patient —</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                </select>
                            </div>
                            <div className="rdv-modal-field">
                                <label className="rdv-modal-label">Motif (optionnel)</label>
                                <textarea className="rdv-modal-textarea" placeholder="Consultation, suivi, bilan..." value={motif} onChange={e => setMotif(e.target.value)} rows={3} />
                            </div>
                            {bookErr && <div className="rdv-modal-error">{bookErr}</div>}
                            <div className="rdv-modal-actions">
                                <button className="rdv-modal-btn-secondary" onClick={() => setBooking(null)}>Annuler</button>
                                <button className="rdv-modal-btn-primary" disabled={!selClient || saving} onClick={handleBook}>
                                    {saving ? <><span className="rdv-spinner" /> Réservation...</> : <>✓ Confirmer</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail modal ── */}
            {detail && (
                <div className="rdv-modal-overlay" onClick={() => setDetail(null)}>
                    <div className="rdv-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="rdv-detail-header">
                            <div className="rdv-detail-avatar">{initials(detail.client_nom)}</div>
                            <div>
                                <div className="rdv-modal-header-title">{detail.client_nom}</div>
                                <div className="rdv-modal-header-sub" style={{ textTransform: 'capitalize' }}>
                                    {format(parseISO(detail.date_heure), 'EEEE d MMMM yyyy', { locale: fr })}
                                </div>
                            </div>
                            <button className="rdv-modal-close" onClick={() => setDetail(null)}>✕</button>
                        </div>
                        <div className="rdv-detail-body">
                            <div className="rdv-detail-row">
                                <div className="rdv-detail-icon">🕐</div>
                                <div>
                                    <div className="rdv-detail-label">Horaire</div>
                                    <div className="rdv-detail-value">
                                        {format(parseISO(detail.date_heure), 'HH:mm')} —{' '}
                                        {format(new Date(parseISO(detail.date_heure).getTime() + 30 * 60000), 'HH:mm')}
                                        <span style={{ color: '#94a3b8', fontWeight: 400 }}> (30 min)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rdv-detail-row">
                                <div className="rdv-detail-icon">🩺</div>
                                <div>
                                    <div className="rdv-detail-label">Médecin</div>
                                    <div className="rdv-detail-value">Dr. {detail.doctor_nom}</div>
                                </div>
                            </div>
                            {detail.motif && (
                                <div className="rdv-detail-row">
                                    <div className="rdv-detail-icon">📝</div>
                                    <div>
                                        <div className="rdv-detail-label">Motif</div>
                                        <div className="rdv-detail-value">{detail.motif}</div>
                                    </div>
                                </div>
                            )}
                            <div className="rdv-detail-row">
                                <div className="rdv-detail-icon">📌</div>
                                <div>
                                    <div className="rdv-detail-label">Statut</div>
                                    <div className="rdv-detail-value">
                                        <span className={`rdv-agenda-badge ${STATUS_CONFIG[detail.statut]?.cls ?? ''}`}>
                                            {STATUS_CONFIG[detail.statut]?.label ?? detail.statut}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {canEdit && detail.statut === 'confirme' && (
                                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
                                    <button className="rdv-modal-btn-primary" style={{ flex: 1 }} onClick={() => openEdit(detail)}>
                                        ✏️ Modifier
                                    </button>
                                    <button className="rdv-cancel-btn" style={{ flex: 1, marginTop: 0 }} disabled={cancelling} onClick={handleCancel}>
                                        {cancelling ? 'Annulation...' : '🗑 Annuler le RDV'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit modal ── */}
            {editingRdv && (
                <div className="rdv-modal-overlay" onClick={() => setEditingRdv(null)}>
                    <div className="rdv-modal" onClick={e => e.stopPropagation()}>
                        <div className="rdv-modal-header">
                            <div className="rdv-modal-header-icon">✏️</div>
                            <div className="rdv-modal-header-title">Modifier le rendez-vous</div>
                            <div className="rdv-modal-header-sub">{editingRdv.client_nom}</div>
                            <button className="rdv-modal-close" onClick={() => setEditingRdv(null)}>✕</button>
                        </div>
                        <div className="rdv-modal-body">
                            <div className="rdv-modal-field">
                                <label className="rdv-modal-label">Patient *</label>
                                <select className="rdv-modal-select" value={editClientId} onChange={e => setEditClientId(e.target.value)}>
                                    <option value="">— Sélectionner —</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                </select>
                            </div>
                            <div className="rdv-modal-field">
                                <label className="rdv-modal-label">Date *</label>
                                <input type="date" className="rdv-modal-input" value={editDate} min={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={e => { setEditDate(e.target.value); setEditHeure('') }} />
                            </div>
                            <div className="rdv-modal-field">
                                <label className="rdv-modal-label">
                                    Créneau *
                                    {editSlotsLoad && <span style={{ marginLeft: '0.5rem', color: '#94a3b8', fontWeight: 400 }}>Chargement...</span>}
                                </label>
                                {editDate && !editSlotsLoad && editSlots.length === 0 && (
                                    <div className="rdv-modal-error" style={{ marginBottom: 0 }}>
                                        Aucun créneau disponible ce jour.
                                    </div>
                                )}
                                {editSlots.length > 0 && (
                                    <select className="rdv-modal-select" value={editHeure} onChange={e => setEditHeure(e.target.value)}>
                                        <option value="">— Choisir un créneau —</option>
                                        {editSlots.map(s => (
                                            <option key={s.heure} value={s.heure}>{s.heure} — {endTime(s.heure)}</option>
                                        ))}
                                    </select>
                                )}
                                {editDate === format(parseISO(editingRdv.date_heure), 'yyyy-MM-dd') && editSlots.length === 0 && !editSlotsLoad && (
                                    <select className="rdv-modal-select" value={editHeure} onChange={e => setEditHeure(e.target.value)}>
                                        <option value={format(parseISO(editingRdv.date_heure), 'HH:mm')}>
                                            {format(parseISO(editingRdv.date_heure), 'HH:mm')} — {endTime(format(parseISO(editingRdv.date_heure), 'HH:mm'))} (créneau actuel)
                                        </option>
                                    </select>
                                )}
                            </div>
                            <div className="rdv-modal-field">
                                <label className="rdv-modal-label">Motif (optionnel)</label>
                                <textarea className="rdv-modal-textarea" placeholder="Consultation, suivi, bilan..." value={editMotif} onChange={e => setEditMotif(e.target.value)} rows={2} />
                            </div>
                            {editErr && <div className="rdv-modal-error">{editErr}</div>}
                            <div className="rdv-modal-actions">
                                <button className="rdv-modal-btn-secondary" onClick={() => setEditingRdv(null)}>Annuler</button>
                                <button className="rdv-modal-btn-primary" disabled={!editClientId || !editHeure || editSaving} onClick={handleEdit}>
                                    {editSaving ? <><span className="rdv-spinner" /> Enregistrement...</> : <>✓ Enregistrer</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
