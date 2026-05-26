'use client'

// =============================================================================
// components/NoteBlock.tsx — Bloc note médicale (axe result pages + history)
// =============================================================================

import { useState, useCallback } from 'react'
import { toast }                  from 'sonner'
import { updateRapportNote }      from '@/lib/api'
import '@/styles/note-block.css'

interface NoteBlockProps {
    rapportId?: string | null   // si null → note non encore sauvegardée (collectée par le parent)
    token?:     string | null
    note:       string
    onChange:   (note: string) => void
    onSaved?:   () => void
    readOnly?:  boolean
}

export default function NoteBlock({
    rapportId, token, note, onChange, onSaved, readOnly = false,
}: NoteBlockProps) {
    const [saving, setSaving] = useState(false)

    const handleSave = useCallback(async () => {
        if (!token || !rapportId) return
        setSaving(true)
        toast.promise(
            updateRapportNote(token, rapportId, note)
                .then(() => { onSaved?.() })
                .finally(() => setSaving(false)),
            {
                loading: 'Enregistrement de la note…',
                success: 'Note enregistrée.',
                error:   'Erreur lors de l\'enregistrement.',
            }
        )
    }, [token, rapportId, note, onSaved])

    const canSave = !!(rapportId && token)

    return (
        <div className="note-block">
            <div className="note-block__header">
                <div className="note-block__title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Note médicale
                </div>
                {!canSave && !readOnly && (
                    <span className="note-block__hint">
                        Sera sauvegardée avec le rapport
                    </span>
                )}
            </div>

            {readOnly ? (
                <div className="note-block__display">{note || <em style={{ color: '#94a3b8' }}>Aucune note.</em>}</div>
            ) : (
                <textarea
                    className="note-block__textarea"
                    placeholder="Observations cliniques, recommandations, suivi du patient…"
                    value={note}
                    onChange={e => onChange(e.target.value)}
                    rows={4}
                />
            )}

            {canSave && !readOnly && (
                <div className="note-block__footer">
                    <button
                        className="note-block__save-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Enregistrement…' : '💾 Enregistrer la note'}
                    </button>
                </div>
            )}
        </div>
    )
}
