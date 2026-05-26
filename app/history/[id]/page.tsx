'use client'

// =============================================================================
// app/history/[id]/page.tsx
// Rapport médical complet : lecture · note · modifier · re-prédire · documents
// =============================================================================

import '@/styles/history.css'
import '@/styles/rapport-ia.css'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams }  from 'next/navigation'
import Link                      from 'next/link'
import { toast }                 from 'sonner'
import { useAuth }               from '@/contexts/AuthContext'
import AppTopbar                 from '@/components/AppTopbar'
import RapportIA                 from '@/components/RapportIA'
import NoteBlock                 from '@/components/NoteBlock'
import {
    getHistoryItem, deleteHistoryItem,
    updateRapport,
    uploadLabDoc, downloadLabDoc, deleteLabDoc,
    predictStroke, predictAxe2, predictAxe3,
    RapportOut, LabDocument,
} from '@/lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const AXE_META: Record<number, { label: string; icon: string; color: string }> = {
    1: { label: 'Risque AVC',    icon: '🎯', color: '#3b82f6' },
    2: { label: 'Sévérité AVC',  icon: '📊', color: '#8b5cf6' },
    3: { label: 'Mortalité AVC', icon: '💀', color: '#ef4444' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })

const fmtSize = (b: number) =>
    b < 1024 ? `${b} o` : b < 1048576 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1048576).toFixed(1)} Mo`

const isProb = (k: string) =>
    k.toLowerCase().includes('prob') || k.toLowerCase().includes('probability')

const fmtVal = (k: string, v: unknown): string =>
    isProb(k) && typeof v === 'number' ? `${(v * 100).toFixed(1)} %` : String(v ?? '—')

const riskCls = (k: string, v: unknown) => {
    if (typeof v !== 'number' || !isProb(k)) return ''
    return v >= 0.6 ? 'history-pred-value--high' : v >= 0.3 ? 'history-pred-value--medium' : 'history-pred-value--low'
}

const fileIcon = (ct: string) =>
    ct.includes('pdf') ? '📄' : ct.includes('image') ? '🖼️' : ct.includes('word') ? '📝' : '📎'

// ─────────────────────────────────────────────────────────────────────────────
// Inline markdown renderer
// ─────────────────────────────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    const rx = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g
    let last = 0, idx = 0, m: RegExpExecArray | null
    while ((m = rx.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index))
        if      (m[1]) parts.push(<strong key={idx++}>{m[1]}</strong>)
        else if (m[2]) parts.push(<em     key={idx++}>{m[2]}</em>)
        else if (m[3]) parts.push(<code   key={idx++} className="raia__code">{m[3]}</code>)
        last = rx.lastIndex
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts.length <= 1 ? (parts[0] ?? text) : <>{parts}</>
}

function Markdown({ text }: { text: string }) {
    const els: React.ReactNode[] = []; let lis: React.ReactNode[] = []; let i = 0
    const flush = () => { if (!lis.length) return; els.push(<ul key={`u${i++}`} className="raia__ul">{lis}</ul>); lis = [] }
    text.split('\n').forEach((line, ln) => {
        if      (line.startsWith('# '))   { flush(); els.push(<h2 key={i++} className="raia__h1">{parseInline(line.slice(2))}</h2>) }
        else if (line.startsWith('## '))  { flush(); els.push(<h3 key={i++} className="raia__h2">{parseInline(line.slice(3))}</h3>) }
        else if (line.startsWith('### ')) { flush(); els.push(<h4 key={i++} className="raia__h3">{parseInline(line.slice(4))}</h4>) }
        else if (/^[-*] /.test(line))     { lis.push(<li key={`l${ln}`} className="raia__li">{parseInline(line.slice(2))}</li>) }
        else if (/^\d+\. /.test(line))    {
            flush(); const m = line.match(/^(\d+)\. (.*)$/)
            if (m) els.push(<div key={i++} className="raia__li raia__li--numbered"><span className="raia__li-num">{m[1]}.</span><span>{parseInline(m[2])}</span></div>)
        }
        else if (/^---+$/.test(line.trim())) { flush(); els.push(<hr key={i++} className="raia__hr" />) }
        else if (line.trim() === '') flush()
        else { flush(); els.push(<p key={i++} className="raia__p">{parseInline(line)}</p>) }
    })
    flush(); return <>{els}</>
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const AXE3_SUB_LABELS: Record<string, string> = {
    fdead: 'Décès à 6 mois',
    ddead: 'Décès à 14 jours',
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function PredSubCard({ label, obj }: { label: string; obj: Record<string, unknown> }) {
    const SKIP = new Set(['threshold'])
    const entries = Object.entries(obj).filter(([k]) => !SKIP.has(k))
    return (
        <div className="history-pred-subcard">
            <div className="history-pred-subcard-title">{label}</div>
            <div className="history-pred-grid">
                {entries.map(([k, v]) => (
                    <div key={k} className="history-pred-item">
                        <div className="history-pred-label">{k.replace(/_/g, ' ')}</div>
                        <div className={`history-pred-value ${riskCls(k, v)}`}>{fmtVal(k, v)}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function PredGrid({ entries }: { entries: [string, unknown][] }) {
    const SKIP_KEYS = new Set(['engineered_features', 'deficit_summary'])
    const flat    = entries.filter(([k, v]) => !SKIP_KEYS.has(k) && !isPlainObject(v))
    const nested  = entries.filter(([k, v]) => !SKIP_KEYS.has(k) && isPlainObject(v)) as [string, Record<string, unknown>][]
    const engineered = entries.find(([k]) => k === 'engineered_features')?.[1]

    return (
        <>
            {flat.length > 0 && (
                <div className="history-pred-grid">
                    {flat.map(([k, v]) => (
                        <div key={k} className="history-pred-item">
                            <div className="history-pred-label">{k.replace(/_/g, ' ')}</div>
                            <div className={`history-pred-value ${riskCls(k, v)}`}>{fmtVal(k, v)}</div>
                        </div>
                    ))}
                </div>
            )}
            {nested.map(([k, obj]) => (
                <PredSubCard
                    key={k}
                    label={AXE3_SUB_LABELS[k] ?? k.replace(/_/g, ' ')}
                    obj={obj}
                />
            ))}
            {engineered != null && (
                <details className="no-print" style={{ marginTop: '0.75rem' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.7rem', color: '#64748b', userSelect: 'none' }}>
                        Features calculées →
                    </summary>
                    <div className="history-pred-grid" style={{ marginTop: '0.6rem', opacity: 0.85 }}>
                        {Object.entries(engineered as Record<string, number>).map(([k, v]) => (
                            <div key={k} className="history-pred-item">
                                <div className="history-pred-label">{k.replace(/_/g, ' ')}</div>
                                <div className="history-pred-value">{Number(v).toFixed(3)}</div>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </>
    )
}

function SectionCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return <div className={`history-section-card ${className}`} style={style}>{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <div className="history-section-title">{children}</div>
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function HistoryDetailPage() {
    const { user, token, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()
    const { id } = useParams() as { id: string }

    // ── Data ────────────────────────────────────────────────────────────────
    const [report,       setReport]       = useState<RapportOut | null>(null)
    const [loading,      setLoading]      = useState(true)
    const [fetchError,   setFetchError]   = useState<string | null>(null)
    const [rapportTexte, setRapportTexte] = useState('')
    const [labDocs,      setLabDocs]      = useState<LabDocument[]>([])
    const [copied,       setCopied]       = useState(false)

    // ── Edit mode ───────────────────────────────────────────────────────────
    const [editing,       setEditing]       = useState(false)
    const [editNote,      setEditNote]      = useState('')
    const [editPatData,   setEditPatData]   = useState<Record<string, unknown>>({})
    const [predicting,    setPredicting]    = useState(false)
    const [newPrediction, setNewPrediction] = useState<Record<string, unknown> | null>(null)
    const [saving,        setSaving]        = useState(false)

    // ── Lab docs ────────────────────────────────────────────────────────────
    const [uploading,    setUploading]    = useState(false)
    const [downloading,  setDownloading]  = useState<string | null>(null)
    const [deletingDoc,  setDeletingDoc]  = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isDoctor = user?.role === 'doctor' || user?.role === 'admin'

    // ── Load report ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    const loadReport = useCallback(() => {
        if (!token || !id) return
        setLoading(true)
        getHistoryItem(token, id)
            .then(r => {
                setReport(r)
                setRapportTexte(r.rapport_texte ?? '')
                setLabDocs(r.documents_lab ?? [])
            })
            .catch(e => setFetchError(e.message))
            .finally(() => setLoading(false))
    }, [token, id])

    useEffect(() => { loadReport() }, [loadReport])

    // ── Edit mode ────────────────────────────────────────────────────────────

    const openEdit = useCallback(() => {
        if (!report) return
        setEditNote(report.note_medecin ?? '')
        setEditPatData({ ...report.patient_data })
        setNewPrediction(null)
        setEditing(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [report])

    const cancelEdit = useCallback(() => {
        setEditing(false)
        setNewPrediction(null)
    }, [])

    // ── Re-predict ───────────────────────────────────────────────────────────

    const handleRepredict = useCallback(async () => {
        if (!report) return
        setPredicting(true)
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = editPatData as any
            let result: Record<string, unknown>
            if (report.axe === 1)      result = await predictStroke(data) as unknown as Record<string, unknown>
            else if (report.axe === 2) result = await predictAxe2(data)   as unknown as Record<string, unknown>
            else {
                const r = await predictAxe3(data)
                result = { fdead: r.fdead, ddead: r.ddead } as unknown as Record<string, unknown>
            }
            setNewPrediction(result)
            toast.success('Nouvelle prédiction calculée — enregistrez pour sauvegarder.')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur de prédiction.')
        } finally {
            setPredicting(false)
        }
    }, [report, editPatData])

    // ── Save edit ─────────────────────────────────────────────────────────────

    const handleSaveEdit = useCallback(async () => {
        if (!token || !report) return
        setSaving(true)
        const payload: Parameters<typeof updateRapport>[2] = {
            note_medecin: editNote,
            patient_data: editPatData,
            ...(newPrediction ? { prediction: newPrediction } : {}),
        }
        toast.promise(
            updateRapport(token, report.id, payload)
                .then(() => {
                    setReport(prev => prev ? {
                        ...prev,
                        note_medecin: editNote,
                        patient_data: editPatData,
                        ...(newPrediction ? { prediction: newPrediction } : {}),
                    } : prev)
                    setEditing(false)
                    setNewPrediction(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                })
                .finally(() => setSaving(false)),
            { loading: 'Enregistrement…', success: 'Rapport mis à jour.', error: 'Erreur lors de la sauvegarde.' }
        )
    }, [token, report, editNote, editPatData, newPrediction])

    // ── Delete report ────────────────────────────────────────────────────────

    const handleDelete = useCallback(() => {
        if (!token || !report) return
        toast(`Supprimer le rapport de ${report.patient_prenom} ${report.patient_nom} ?`, {
            description: 'Cette action est irréversible. Les documents associés seront supprimés.',
            action: {
                label: 'Supprimer définitivement',
                onClick: async () => {
                    try {
                        await deleteHistoryItem(token, report.id)
                        toast.success('Rapport supprimé.')
                        router.push('/history')
                    } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
                    }
                },
            },
            cancel: { label: 'Annuler', onClick: () => {} },
            duration: 10000,
        })
    }, [token, report, router])

    // ── Copy AI text ─────────────────────────────────────────────────────────

    const handleCopy = useCallback(() => {
        const text = rapportTexte || report?.rapport_texte || ''
        if (!text) return
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [rapportTexte, report])

    // ── Lab: upload ───────────────────────────────────────────────────────────

    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !token || !report) return
        setUploading(true)
        toast.promise(
            uploadLabDoc(token, report.id, file)
                .then(doc => setLabDocs(prev => [...prev, doc]))
                .finally(() => {
                    setUploading(false)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                }),
            { loading: `Import de « ${file.name} »…`, success: 'Document ajouté au dossier.', error: 'Échec de l\'import.' }
        )
    }, [token, report])

    // ── Lab: download (authenticated) ─────────────────────────────────────────

    const handleDownload = useCallback(async (doc: LabDocument) => {
        if (!token || !report) return
        setDownloading(doc.id)
        try {
            await downloadLabDoc(token, report.id, doc.id, doc.original_name)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur de téléchargement.')
        } finally {
            setDownloading(null)
        }
    }, [token, report])

    // ── Lab: delete ───────────────────────────────────────────────────────────

    const handleDeleteDoc = useCallback((doc: LabDocument) => {
        if (!token || !report) return
        toast(`Supprimer « ${doc.original_name} » ?`, {
            action: {
                label: 'Supprimer',
                onClick: async () => {
                    setDeletingDoc(doc.id)
                    try {
                        await deleteLabDoc(token, report.id, doc.id)
                        setLabDocs(prev => prev.filter(d => d.id !== doc.id))
                        toast.success('Document supprimé.')
                    } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
                    } finally { setDeletingDoc(null) }
                },
            },
            cancel: { label: 'Annuler', onClick: () => {} },
            duration: 7000,
        })
    }, [token, report])

    // ── Guards ────────────────────────────────────────────────────────────────

    if (isLoading || !user) {
        return <div className="dash-loading"><div className="dash-loading-spinner" /></div>
    }

    if (loading) {
        return (
            <div className="history-detail-root">
                <AppTopbar />
                <div className="history-detail-body">
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="dash-skeleton" style={{ height: 80, marginBottom: 12, borderRadius: 14 }} />
                    ))}
                </div>
            </div>
        )
    }

    if (fetchError || !report) {
        return (
            <div className="history-detail-root">
                <AppTopbar />
                <div className="history-detail-body">
                    <Link href="/history" className="history-back" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
                        ← Retour à l&apos;historique
                    </Link>
                    <div className="clients-error">{fetchError ?? 'Rapport introuvable.'}</div>
                </div>
            </div>
        )
    }

    const meta         = AXE_META[report.axe] ?? AXE_META[1]
    const predEntries  = Object.entries(report.prediction ?? {})
    const patEntries   = Object.entries(report.patient_data ?? {})
    const displayTexte = rapportTexte || report.rapport_texte || ''
    const displayNote  = report.note_medecin ?? ''

    return (
        <div className="history-detail-root">
            <AppTopbar />

            <div className="history-detail-body">

                {/* ── Breadcrumb ── */}
                <div className="history-detail-breadcrumb no-print">
                    <Link href="/history" className="history-back">← Historique</Link>
                    <span className="history-bc-sep">/</span>
                    <span className="history-page-title">{report.patient_prenom} {report.patient_nom}</span>
                </div>

                {/* ── Hero ── */}
                <div className="history-detail-hero">
                    <div className={`history-detail-axe-icon history-detail-axe-icon--${report.axe}`}>
                        {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="history-detail-patient-name">
                            {report.patient_prenom} {report.patient_nom}
                        </div>
                        <div className="history-detail-meta">
                            {meta.label}
                            <span className="history-meta-dot">·</span>
                            {fmtDate(report.created_at)}
                            {report.medecin_nom && (
                                <><span className="history-meta-dot">·</span>Dr. {report.medecin_nom}</>
                            )}
                        </div>
                        <div className="history-hero-badges">
                            {displayTexte   && <span className="history-badge history-badge--ai">✨ Analyse IA</span>}
                            {displayNote    && <span className="history-badge history-badge--note">✏️ Note</span>}
                            {labDocs.length > 0 && (
                                <span className="history-badge history-badge--lab">
                                    📎 {labDocs.length} document{labDocs.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="history-hero-actions no-print">
                        <button className="history-action-btn history-action-btn--print" onClick={() => window.print()}>
                            <PrintIcon /> Imprimer
                        </button>
                        {isDoctor && !editing && (
                            <button className="history-action-btn history-action-btn--edit" onClick={openEdit}>
                                <EditIcon /> Modifier
                            </button>
                        )}
                        {isDoctor && (
                            <button className="history-action-btn history-action-btn--delete" onClick={handleDelete}>
                                <TrashIcon /> Supprimer
                            </button>
                        )}
                    </div>
                </div>

                {/* ═══════════════ READ MODE ═══════════════ */}
                {!editing && (
                    <>
                        {/* Prediction */}
                        {predEntries.length > 0 && (
                            <SectionCard>
                                <SectionTitle>Résultats de prédiction</SectionTitle>
                                <PredGrid entries={predEntries} />
                            </SectionCard>
                        )}

                        {/* Patient data */}
                        {patEntries.length > 0 && (
                            <SectionCard>
                                <SectionTitle>Données patient — {patEntries.length} variables</SectionTitle>
                                <div className="history-data-grid">
                                    {patEntries.map(([k, v]) => (
                                        <div key={k} className="history-data-item">
                                            <div className="history-data-key">{k.replace(/_/g, ' ')}</div>
                                            <div className="history-data-val">{String(v ?? '—')}</div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {/* Note médicale */}
                        {displayNote && (
                            <SectionCard className="history-note-section">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <SectionTitle>✏️ Note médicale</SectionTitle>
                                    {isDoctor && (
                                        <button className="history-copy-btn no-print" onClick={openEdit}>
                                            Modifier
                                        </button>
                                    )}
                                </div>
                                <div className="history-note-display">{displayNote}</div>
                            </SectionCard>
                        )}

                        {/* Rapport IA */}
                        {displayTexte && (
                            <SectionCard>
                                <div className="history-section-ai-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <SectionTitle>✨ Analyse IA — Gemini</SectionTitle>
                                        {report.modele_llm && (
                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                                {report.modele_llm}
                                            </span>
                                        )}
                                    </div>
                                    <button className="history-copy-btn no-print" onClick={handleCopy}>
                                        {copied ? '✓ Copié !' : '⎘ Copier'}
                                    </button>
                                </div>
                                <div className="history-rapport-markdown">
                                    <Markdown text={displayTexte} />
                                </div>
                            </SectionCard>
                        )}

                        {/* Generate / Regenerate AI */}
                        {isDoctor && (
                            <RapportIA
                                axe={report.axe}
                                patient={report.patient_data}
                                prediction={report.prediction}
                                token={token ?? undefined}
                                rapportId={report.id}
                                onSaved={() => loadReport()}
                            />
                        )}

                        {/* Lab documents */}
                        {isDoctor && (
                            <SectionCard className="history-lab-section no-print">
                                <div className="history-lab-header">
                                    <SectionTitle>📎 Documents laboratoire</SectionTitle>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {uploading && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Import…</span>}
                                        <button
                                            className="history-lab-upload-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            <UploadIcon /> Importer un document
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.csv,.xls,.xlsx"
                                            onChange={handleUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>

                                {labDocs.length === 0 ? (
                                    <div className="history-lab-empty">
                                        <span style={{ fontSize: '2rem', opacity: 0.3 }}>📋</span>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: '#334155' }}>
                                                Aucun document
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                Importez des analyses, comptes-rendus, ordonnances…
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="history-lab-list">
                                        {labDocs.map(doc => (
                                            <div key={doc.id} className="history-lab-item">
                                                <span className="history-lab-icon">{fileIcon(doc.content_type)}</span>
                                                <div className="history-lab-info">
                                                    <div className="history-lab-name">{doc.original_name}</div>
                                                    <div className="history-lab-meta">
                                                        {fmtSize(doc.size)} · {fmtDate(doc.uploaded_at)}
                                                    </div>
                                                </div>
                                                <div className="history-lab-actions">
                                                    <button
                                                        className="history-lab-btn history-lab-btn--download"
                                                        onClick={() => handleDownload(doc)}
                                                        disabled={downloading === doc.id}
                                                    >
                                                        {downloading === doc.id ? (
                                                            'Téléchargement…'
                                                        ) : (
                                                            <><DownloadIcon /> Télécharger</>
                                                        )}
                                                    </button>
                                                    <button
                                                        className="history-lab-btn history-lab-btn--delete"
                                                        onClick={() => handleDeleteDoc(doc)}
                                                        disabled={deletingDoc === doc.id}
                                                        title="Supprimer ce document"
                                                    >
                                                        {deletingDoc === doc.id ? '…' : <TrashSmIcon />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>
                        )}
                    </>
                )}

                {/* ═══════════════ EDIT MODE ═══════════════ */}
                {editing && (
                    <>
                        {/* Edit banner */}
                        <div className="history-edit-banner no-print">
                            <div className="history-edit-banner-left">
                                <EditIcon />
                                Mode modification — corrigez les données, re-prédisez si nécessaire, puis enregistrez.
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <button className="history-edit-cancel-btn" onClick={cancelEdit}>
                                    Annuler
                                </button>
                                <button className="history-edit-save-btn" onClick={handleSaveEdit} disabled={saving}>
                                    {saving ? 'Enregistrement…' : '💾 Enregistrer'}
                                </button>
                            </div>
                        </div>

                        {/* Note médicale */}
                        <NoteBlock note={editNote} onChange={setEditNote} token={null} />

                        {/* Patient data form */}
                        <SectionCard style={{ marginTop: '1rem' } as React.CSSProperties}>
                            <SectionTitle>Données patient — modifier les inputs</SectionTitle>
                            <div className="history-edit-fields-grid">
                                {Object.entries(editPatData).map(([key, value]) => (
                                    <div key={key} className="history-edit-field">
                                        <label className="history-edit-label">{key.replace(/_/g, ' ')}</label>
                                        <input
                                            className="history-edit-input"
                                            type={typeof value === 'number' ? 'number' : 'text'}
                                            step="any"
                                            value={String(value ?? '')}
                                            onChange={e => setEditPatData(prev => ({
                                                ...prev,
                                                [key]: typeof value === 'number'
                                                    ? (parseFloat(e.target.value) || 0)
                                                    : e.target.value,
                                            }))}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                                <button
                                    className="history-repredict-btn"
                                    onClick={handleRepredict}
                                    disabled={predicting}
                                >
                                    {predicting ? (
                                        <><SpinIcon /> Calcul en cours…</>
                                    ) : (
                                        <><RefreshIcon /> Prédire à nouveau</>
                                    )}
                                </button>
                            </div>
                        </SectionCard>

                        {/* New prediction result */}
                        {newPrediction && (
                            <SectionCard className="history-new-pred-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <span className="history-new-pred-badge">Nouveau résultat</span>
                                    <SectionTitle>Prédiction recalculée</SectionTitle>
                                </div>
                                <PredGrid entries={Object.entries(newPrediction)} />
                                <p style={{ fontSize: '0.72rem', color: '#7c3aed', marginTop: '0.75rem', fontWeight: 500 }}>
                                    ✓ Cliquez sur «&nbsp;Enregistrer&nbsp;» pour mettre à jour le rapport avec ce résultat.
                                </p>
                            </SectionCard>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Icon helpers (inline to avoid extra files)
// ─────────────────────────────────────────────────────────────────────────────

function PrintIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
        </svg>
    )
}

function EditIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
    )
}

function TrashIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
        </svg>
    )
}

function TrashSmIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
        </svg>
    )
}

function UploadIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
    )
}

function DownloadIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
    )
}

function SpinIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }} aria-hidden>
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
    )
}

function RefreshIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M2 12a10 10 0 1 0 10-10"/><polyline points="2 2 2 8 8 8"/>
        </svg>
    )
}
