'use client'

// =============================================================================
// components/RapportIA.tsx — Rapport IA Gemini (streaming SSE)
//   • Mode anonyme  : fetchRapport (pas de client)
//   • Mode client   : fetchRapportAuthenticated (avec clientId + token) — sauve dans le dossier
//   • Mode dossier  : fetchRapportIA (rapportId existant — met à jour rapport_texte)
// =============================================================================

import { useState, useCallback } from 'react'
import { fetchRapport, fetchRapportAuthenticated, fetchRapportIA } from '@/lib/api'
import '@/styles/rapport-ia.css'

interface RapportIAProps {
  axe:            1 | 2 | 3
  patient:        Record<string, unknown>
  prediction:     Record<string, unknown>
  patientNom?:    string
  patientPrenom?: string
  className?:     string
  // Auth mode (saves to patient dossier)
  token?:         string
  clientId?:      string
  // Dossier mode (updates existing rapport)
  rapportId?:     string
  onSaved?:       (rapportId: string) => void
}

type Status    = 'idle' | 'loading' | 'streaming' | 'done' | 'error'
type CopyState = 'idle' | 'copied'

const AXE_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Risque AVC',
  2: 'Sévérité AVC',
  3: 'Mortalité AVC',
}

// ── Inline markdown parser ───────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g
  let last = 0, idx = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[1]) parts.push(<strong key={idx++}>{match[1]}</strong>)
    else if (match[2]) parts.push(<em key={idx++}>{match[2]}</em>)
    else if (match[3]) parts.push(<code key={idx++} className="raia__code">{match[3]}</code>)
    last = regex.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  if (parts.length === 0) return text
  if (parts.length === 1) return parts[0]
  return <>{parts}</>
}

function renderMarkdown(text: string, isStreaming: boolean): React.ReactNode {
  if (!text) return null
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let elIdx = 0
  const flushList = () => {
    if (!listItems.length) return
    elements.push(<ul key={`ul-${elIdx++}`} className="raia__ul">{listItems}</ul>)
    listItems = []
  }
  lines.forEach((line, i) => {
    const isLast = i === lines.length - 1
    if (line.startsWith('# '))       { flushList(); elements.push(<h2 key={elIdx++} className="raia__h1">{parseInline(line.slice(2))}</h2>) }
    else if (line.startsWith('## ')) { flushList(); elements.push(<h3 key={elIdx++} className="raia__h2">{parseInline(line.slice(3))}</h3>) }
    else if (line.startsWith('### ')){ flushList(); elements.push(<h4 key={elIdx++} className="raia__h3">{parseInline(line.slice(4))}</h4>) }
    else if (/^[-*] /.test(line))   { listItems.push(<li key={`li-${i}`} className="raia__li">{parseInline(line.slice(2))}</li>) }
    else if (/^\d+\. /.test(line)) {
      flushList()
      const m = line.match(/^(\d+)\. (.*)$/)
      if (m) elements.push(<div key={elIdx++} className="raia__li raia__li--numbered"><span className="raia__li-num">{m[1]}.</span><span>{parseInline(m[2])}</span></div>)
    }
    else if (/^---+$/.test(line.trim())) { flushList(); elements.push(<hr key={elIdx++} className="raia__hr" />) }
    else if (line.trim() === '') flushList()
    else { flushList(); elements.push(<p key={elIdx++} className="raia__p">{parseInline(line)}{isLast && isStreaming && <span className="rapport-ia__cursor" aria-hidden />}</p>) }
  })
  flushList()
  return <>{elements}</>
}

function stripMarkdown(text: string): string {
  return text.replace(/#{1,6}\s+/g, '').replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1').replace(/^[-*] /gm, '• ').trim()
}

// ── Icons ────────────────────────────────────────────────────────────────────

function SparkleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity=".15"/></svg>
}
function CopyIcon() {
  return <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden><rect x="2" y="4" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 4V3a1 1 0 011-1h6a1 1 0 011 1v8a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden><path d="M2.5 8l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function RefreshIcon() {
  return <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden><path d="M2 7.5A5.5 5.5 0 1 1 7.5 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M2 4.5v3H5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RapportIA({
  axe, patient, prediction, className,
  token, clientId, rapportId, onSaved,
}: RapportIAProps) {
  const [status,    setStatus]    = useState<Status>('idle')
  const [report,    setReport]    = useState('')
  const [errorMsg,  setErrorMsg]  = useState('')
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [savedId,   setSavedId]   = useState<string | null>(null)

  const generate = useCallback(() => {
    setStatus('loading')
    setReport('')
    setErrorMsg('')
    setSavedId(null)

    const onChunk = (chunk: string) => { setStatus('streaming'); setReport(prev => prev + chunk) }
    const onDone  = (id: string)    => { setStatus('done'); if (id) { setSavedId(id); onSaved?.(id) } }
    const onError = (err: string)   => { setErrorMsg(err); setStatus('error') }

    if (rapportId && token) {
      // Mode dossier : met à jour un rapport ML existant
      fetchRapportIA(token, rapportId, onChunk, onDone, onError)
    } else if (clientId && token) {
      // Mode client authentifié : crée un nouveau rapport lié au patient
      fetchRapportAuthenticated(token, clientId, axe, patient, prediction, onChunk, onDone, onError)
    } else {
      // Mode anonyme
      fetchRapport(axe, patient, prediction, onChunk, () => onDone(''), onError)
    }
  }, [axe, patient, prediction, token, clientId, rapportId, onSaved])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(stripMarkdown(report))
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2200)
    } catch { /* silent */ }
  }, [report])

  const isActive   = status === 'streaming' || status === 'done'
  const isStreaming = status === 'streaming'
  const modeLabel  = rapportId ? 'Enregistrer dans ce dossier' : clientId ? 'Enregistrer dans le dossier patient' : 'Générer le rapport IA'

  return (
    <div className={['rapport-ia', `rapport-ia--axe${axe}`, isStreaming ? 'rapport-ia--streaming' : '', className ?? ''].filter(Boolean).join(' ')}>

      {/* Header */}
      <div className="rapport-ia__header">
        <div className="rapport-ia__title">
          <span className="rapport-ia__title-icon"><SparkleIcon /></span>
          <span>Analyse IA — Gemini</span>
          <span className={`rapport-ia__badge rapport-ia__badge--axe${axe}`}>
            Axe {axe} · {AXE_LABELS[axe]}
          </span>
        </div>
        {savedId && (
          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
            ✓ Enregistré dans le dossier
          </span>
        )}
      </div>

      {/* Body */}
      <div className="rapport-ia__body">

        {status === 'idle' && (
          <div className="rapport-ia__idle">
            <p className="rapport-ia__idle-desc">
              Générez une <strong>analyse clinique approfondie</strong> par Gemini Flash, basée
              sur les données du patient et les résultats du modèle ML.
              {(clientId || rapportId) && (
                <span style={{ display: 'block', marginTop: '0.4rem', color: '#7c3aed', fontWeight: 600, fontSize: '0.8rem' }}>
                  ✓ Cette analyse sera sauvegardée automatiquement dans le dossier médical.
                </span>
              )}
            </p>
            <button className={`rapport-ia__btn-generate rapport-ia__btn-generate--axe${axe}`} onClick={generate}>
              <SparkleIcon />
              {modeLabel}
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="rapport-ia__loading">
            <div className="rapport-ia__dots"><span /><span /><span /></div>
            <div>
              <div className="rapport-ia__loading-title">Analyse en cours…</div>
              <div className="rapport-ia__loading-sub">Connexion à Gemini Flash · Génération du rapport clinique</div>
            </div>
          </div>
        )}

        {isActive && (
          <>
            <div className="rapport-ia__content">{renderMarkdown(report, isStreaming)}</div>
            {status === 'done' && (
              <>
                <div className="rapport-ia__actions">
                  <button className={['rapport-ia__btn-action', copyState === 'copied' ? 'rapport-ia__btn-action--copied' : ''].join(' ')} onClick={handleCopy}>
                    {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
                    {copyState === 'copied' ? 'Copié !' : 'Copier le texte'}
                  </button>
                  <button className="rapport-ia__btn-action" onClick={generate}>
                    <RefreshIcon />
                    Régénérer
                  </button>
                </div>
                <div className="rapport-ia__disclaimer">
                  <span className="rapport-ia__disclaimer-icon">⚠️</span>
                  <span className="rapport-ia__disclaimer-text">
                    Ce rapport est généré par IA et fourni à titre informatif uniquement.
                    Il ne constitue pas un avis médical et ne remplace pas la consultation d&apos;un professionnel de santé.
                  </span>
                </div>
              </>
            )}
          </>
        )}

        {status === 'error' && (
          <div className="rapport-ia__error">
            <div className="rapport-ia__error-header"><span>⚠️</span><span>Erreur de génération</span></div>
            <p className="rapport-ia__error-msg">{errorMsg}</p>
            <button className="rapport-ia__btn-action" onClick={generate}><RefreshIcon />Réessayer</button>
          </div>
        )}
      </div>
    </div>
  )
}
