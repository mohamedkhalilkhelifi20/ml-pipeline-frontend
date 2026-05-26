'use client'

import '@/styles/dashboard.css'
import React, { useState } from 'react'
import { updateClient, ClientOut, ApiError } from '@/lib/api'

export default function EditClientModal({
    token, client, onClose, onSaved,
}: {
    token:   string
    client:  ClientOut
    onClose: () => void
    onSaved: (c: ClientOut) => void
}) {
    const [nom,           setNom]           = useState(client.nom)
    const [prenom,        setPrenom]        = useState(client.prenom)
    const [sexe,          setSexe]          = useState(client.sexe ?? '')
    const [dateNaissance, setDateNaissance] = useState(client.date_naissance ?? '')
    const [telephone,     setTelephone]     = useState(client.telephone ?? '')
    const [adresse,       setAdresse]       = useState(client.adresse ?? '')
    const [saving,        setSaving]        = useState(false)
    const [error,         setError]         = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!nom.trim() || !prenom.trim()) {
            setError('Le nom et le prénom sont obligatoires.')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const updated = await updateClient(token, client.id, {
                nom:            nom.trim(),
                prenom:         prenom.trim(),
                sexe:           sexe || undefined,
                date_naissance: dateNaissance || undefined,
                telephone:      telephone.trim() || undefined,
                adresse:        adresse.trim()   || undefined,
            })
            onSaved(updated)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="dash-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="dash-modal">
                <div className="dash-modal-header">
                    <div>
                        <div className="dash-modal-title">✏️ Modifier le dossier patient</div>
                        <div className="dash-modal-subtitle">{client.numero_dossier} — {client.full_name}</div>
                    </div>
                    <button className="dash-modal-close" onClick={onClose}>✕</button>
                </div>

                {error && <div className="dash-modal-error">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="dash-modal-row2">
                        <div className="dash-modal-field">
                            <label className="dash-modal-label">Prénom *</label>
                            <input className="dash-modal-input" type="text"
                                placeholder="Ahmed" value={prenom}
                                onChange={e => setPrenom(e.target.value)} />
                        </div>
                        <div className="dash-modal-field">
                            <label className="dash-modal-label">Nom *</label>
                            <input className="dash-modal-input" type="text"
                                placeholder="Bensalem" value={nom}
                                onChange={e => setNom(e.target.value)} />
                        </div>
                    </div>

                    <div className="dash-modal-row2">
                        <div className="dash-modal-field">
                            <label className="dash-modal-label">Sexe</label>
                            <select className="dash-modal-input" style={{ appearance: 'none' }}
                                value={sexe} onChange={e => setSexe(e.target.value)}>
                                <option value="">Non renseigné</option>
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                            </select>
                        </div>
                        <div className="dash-modal-field">
                            <label className="dash-modal-label">Date de naissance</label>
                            <input className="dash-modal-input" type="date" style={{ colorScheme: 'light' }}
                                value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} />
                        </div>
                    </div>

                    <div className="dash-modal-row2">
                        <div className="dash-modal-field">
                            <label className="dash-modal-label">Téléphone</label>
                            <input className="dash-modal-input" type="tel"
                                placeholder="+216 99 123 456" value={telephone}
                                onChange={e => setTelephone(e.target.value)} />
                        </div>
                        <div className="dash-modal-field">
                            <label className="dash-modal-label">Adresse</label>
                            <input className="dash-modal-input" type="text"
                                placeholder="Tunis, Tunisie" value={adresse}
                                onChange={e => setAdresse(e.target.value)} />
                        </div>
                    </div>

                    <div className="dash-modal-actions">
                        <button type="button" className="dash-modal-btn-secondary" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="dash-modal-btn-primary" disabled={saving}>
                            {saving ? (
                                <>
                                    <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                    Enregistrement…
                                </>
                            ) : '✓ Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
