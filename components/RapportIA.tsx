'use client'

// =============================================================================
// components/RapportIA.tsx — Rapport IA Gemini 2.0 Flash (streaming SSE)
// =============================================================================

import { useState, useCallback } from 'react'
import { fetchRapport } from '@/lib/api'
import '@/styles/rapport-ia.css'

// ── Props ────────────────────────────────────────────────────────────────────

interface RapportIAProps {
  axe: 1 | 2 | 3
  patient: Record<string, unknown>
  prediction: Record<string, unknown>
  patientNom?: string
  patientPrenom?: string
  className?: string
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
  let last = 0
  let idx  = 0
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

// ── Block markdown renderer ──────────────────────────────────────────────────

function renderMarkdown(text: string, isStreaming: boolean): React.ReactNode {
  if (!text) return null

  const lines: string[]          = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[]  = []
  let elIdx = 0

  const flushList = () => {
    if (listItems.length === 0) return
    elements.push(<ul key={`ul-${elIdx++}`} className="raia__ul">{listItems}</ul>)
    listItems = []
  }

  lines.forEach((line, i) => {
    const isLast = i === lines.length - 1

    if (line.startsWith('# ')) {
      flushList()
      elements.push(<h2 key={elIdx++} className="raia__h1">{parseInline(line.slice(2))}</h2>)
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(<h3 key={elIdx++} className="raia__h2">{parseInline(line.slice(3))}</h3>)
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(<h4 key={elIdx++} className="raia__h3">{parseInline(line.slice(4))}</h4>)
    } else if (/^[-*] /.test(line)) {
      listItems.push(
        <li key={`li-${i}`} className="raia__li">{parseInline(line.slice(2))}</li>,
      )
    } else if (/^\d+\. /.test(line)) {
      flushList()
      const numMatch = line.match(/^(\d+)\. (.*)$/)
      if (numMatch) {
        elements.push(
          <div key={elIdx++} className="raia__li raia__li--numbered">
            <span className="raia__li-num">{numMatch[1]}.</span>
            <span>{parseInline(numMatch[2])}</span>
          </div>,
        )
      }
    } else if (/^---+$/.test(line.trim())) {
      flushList()
      elements.push(<hr key={elIdx++} className="raia__hr" />)
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={elIdx++} className="raia__p">
          {parseInline(line)}
          {isLast && isStreaming && <span className="rapport-ia__cursor" aria-hidden="true" />}
        </p>,
      )
    }
  })

  flushList()
  return <>{elements}</>
}

// ── Plain-text stripper (for clipboard) ─────────────────────────────────────

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*] /gm, '• ')
    .trim()
}

// ── Icons ────────────────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity=".15"/>
      <path d="M12 2l1.6 4.8L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.2L12 2z" fill="currentColor" fillOpacity=".5"/>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2.5 8l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2 7.5A5.5 5.5 0 1 1 7.5 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M2 4.5v3H5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GeminiIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" fillOpacity=".2"/>
      <path d="M12 6l1.5 4.5L18 12l-4.5 1.5L12 18l-1.5-4.5L6 12l4.5-1.5L12 6z" fill="currentColor"/>
    </svg>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RapportIA({ axe, patient, prediction, className }: RapportIAProps) {
  const [status,    setStatus]    = useState<Status>('idle')
  const [report,    setReport]    = useState('')
  const [errorMsg,  setErrorMsg]  = useState('')
  const [copyState, setCopyState] = useState<CopyState>('idle')

  const generate = useCallback(() => {
    setStatus('loading')
    setReport('')
    setErrorMsg('')

    fetchRapport(
      axe,
      patient,
      prediction,
      (chunk) => {
        setStatus('streaming')
        setReport(prev => prev + chunk)
      },
      () => setStatus('done'),
      (err) => {
        setErrorMsg(err)
        setStatus('error')
      },
    )
  }, [axe, patient, prediction])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(stripMarkdown(report))
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2200)
    } catch {
      // clipboard API unavailable — silent fallback
    }
  }, [report])

  const isActive    = status === 'streaming' || status === 'done'
  const isStreaming  = status === 'streaming'

  return (
    <div className={[
      'rapport-ia',
      `rapport-ia--axe${axe}`,
      isStreaming ? 'rapport-ia--streaming' : '',
      className ?? '',
    ].filter(Boolean).join(' ')}>

      {/* ── Header ── */}
      <div className="rapport-ia__header">
        <div className="rapport-ia__title">
          <span className="rapport-ia__title-icon"><SparkleIcon /></span>
          <span>Analyse IA</span>
          <span className={`rapport-ia__badge rapport-ia__badge--axe${axe}`}>
            Axe {axe} · {AXE_LABELS[axe]}
          </span>
        </div>
        <div className="rapport-ia__powered">
          <div className="rapport-ia__powered-dot" />
           phi3:mini · local
        </div>
      </div>

      {/* ── Body ── */}
      <div className="rapport-ia__body">

        {/* Idle */}
        {status === 'idle' && (
          <div className="rapport-ia__idle">
            <p className="rapport-ia__idle-desc">
              Générez une <strong>analyse clinique approfondie</strong> basée sur les données
              du patient et les résultats du modèle ML, rédigée par phi3:mini&nbsp;2.0&nbsp;Flash.
            </p>
            <button
              className={`rapport-ia__btn-generate rapport-ia__btn-generate--axe${axe}`}
              onClick={generate}
            >
              <SparkleIcon />
              Générer le rapport IA
            </button>
          </div>
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div className="rapport-ia__loading">
            <div className="rapport-ia__dots">
              <span /><span /><span />
            </div>
            <div>
              <div className="rapport-ia__loading-title">Analyse en cours…</div>
              <div className="rapport-ia__loading-sub">
                Connexion à phi3:mini 2.0 Flash · Génération du rapport clinique
              </div>
            </div>
          </div>
        )}

        {/* Streaming + Done */}
        {isActive && (
          <>
            <div className="rapport-ia__content">
              {renderMarkdown(report, isStreaming)}
            </div>

            {status === 'done' && (
              <>
                <div className="rapport-ia__actions">
                  <button
                    className={[
                      'rapport-ia__btn-action',
                      copyState === 'copied' ? 'rapport-ia__btn-action--copied' : '',
                    ].join(' ')}
                    onClick={handleCopy}
                  >
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
                    Ce rapport est généré par intelligence artificielle (phi3:mini 2.0 Flash)
                    et fourni à titre informatif uniquement. Il ne constitue pas un avis médical
                    et ne remplace pas la consultation d&apos;un professionnel de santé qualifié.
                  </span>
                </div>
              </>
            )}
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="rapport-ia__error">
            <div className="rapport-ia__error-header">
              <span>⚠️</span>
              <span>Erreur de génération</span>
            </div>
            <p className="rapport-ia__error-msg">{errorMsg}</p>
            <button className="rapport-ia__btn-action" onClick={generate}>
              <RefreshIcon />
              Réessayer
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
