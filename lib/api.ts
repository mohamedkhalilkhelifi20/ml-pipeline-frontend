// =============================================================================
// lib/api.ts — Client FastAPI complet : Auth, Users, Clients, History, ML Axes
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// =============================================================================
// Auth — Types & Functions
// =============================================================================

export type UserRole = 'admin' | 'doctor' | 'secretary'

export interface DoctorRegisterRequest {
    email:      string
    password:   string
    full_name:  string
    specialite: string
}

export interface SecretaryCreateRequest {
    full_name:  string
    email:      string
    password:   string
    telephone?: string
    adresse?:   string
}

export interface SecretaryUpdateRequest {
    full_name?:    string
    telephone?:    string
    adresse?:      string
    new_password?: string
}

export interface TokenResponse {
    access_token: string
    token_type:   string
    role:         string
    user_id:      string
    full_name:    string
}

export interface UserOut {
    id:                  string
    email:               string
    full_name:           string
    role:                UserRole
    specialite?:         string
    assigned_doctor_id?: string
    telephone?:          string
    adresse?:            string
    is_active:           boolean
}

export interface SecretaryBasicOut {
    id:         string
    full_name:  string
    email:      string
    telephone?: string
    adresse?:   string
    is_active:  boolean
}

export interface DoctorInfo {
    id:          string
    full_name:   string
    email:       string
    specialite?: string
    nb_clients:  number
    secretary:   SecretaryBasicOut | null
}

export interface DoctorBasicOut {
    id:          string
    full_name:   string
    email:       string
    specialite?: string
}

export interface SecretaryInfo {
    id:              string
    full_name:       string
    email:           string
    role:            string
    assigned_doctor: DoctorBasicOut | null
}

// ── Clients ────────────────────────────────────────────────────────────────────

export interface ClientCreate {
    nom:             string
    prenom:          string
    date_naissance?: string
    sexe?:           'M' | 'F'
    telephone?:      string
    adresse?:        string
    doctor_id?:      string   // optionnel : auto-rempli côté backend pour secrétaire
}

export interface ClientOut {
    id:               string
    numero_dossier:   string
    full_name:        string
    nom:              string
    prenom:           string
    date_naissance?:  string
    sexe?:            string
    telephone?:       string
    adresse?:         string
    doctor_id:        string
    doctor_name?:     string
    secretary_id:     string
    secretary_name?:  string
    created_at:       string
}

// ── Rapports ───────────────────────────────────────────────────────────────────

export interface LabDocument {
    id:            string
    original_name: string
    content_type:  string
    size:          number
    uploaded_at:   string
}

export interface RapportOut {
    id:             string
    axe:            1 | 2 | 3
    patient_nom:    string
    patient_prenom: string
    client_id?:     string
    doctor_id?:     string
    patient_data:   Record<string, unknown>
    prediction:     Record<string, unknown>
    rapport_texte:  string
    modele_llm:     string
    note_medecin?:  string
    documents_lab:  LabDocument[]
    medecin_nom?:   string
    created_at:     string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
    return {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
    }
}

function authOnlyHeaders(token: string): HeadersInit {
    return { 'Authorization': `Bearer ${token}` }
}

// ── Auth API ───────────────────────────────────────────────────────────────────

export async function authLogin(email: string, password: string): Promise<TokenResponse> {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const res = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    form.toString(),
    })
    return handleResponse<TokenResponse>(res)
}

export async function authRegister(data: DoctorRegisterRequest): Promise<UserOut> {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
    })
    return handleResponse<UserOut>(res)
}

export async function authMe(token: string): Promise<UserOut> {
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<UserOut>(res)
}

// ── Users API (admin / secretary) ─────────────────────────────────────────────

export async function listAllUsers(token: string): Promise<UserOut[]> {
    const res = await fetch(`${API_BASE}/users/`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<UserOut[]>(res)
}

export async function listDoctors(token: string): Promise<UserOut[]> {
    const res = await fetch(`${API_BASE}/users/doctors`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<UserOut[]>(res)
}

export async function toggleUserActive(token: string, userId: string): Promise<UserOut> {
    const res = await fetch(`${API_BASE}/users/${userId}/toggle`, {
        method:  'PUT',
        headers: authOnlyHeaders(token),
    })
    return handleResponse<UserOut>(res)
}

// ── Doctor Workspace ───────────────────────────────────────────────────────────

export async function getDoctorProfile(token: string): Promise<DoctorInfo> {
    const res = await fetch(`${API_BASE}/doctor/me`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<DoctorInfo>(res)
}

export async function getDoctorClients(token: string): Promise<ClientOut[]> {
    const res = await fetch(`${API_BASE}/doctor/clients`, {
        headers: authOnlyHeaders(token),
    })
    const data = await handleResponse<{ total: number; clients: ClientOut[] }>(res)
    return data.clients
}

export async function createSecretary(token: string, data: SecretaryCreateRequest): Promise<UserOut> {
    const res = await fetch(`${API_BASE}/doctor/secretary`, {
        method:  'POST',
        headers: authHeaders(token),
        body:    JSON.stringify(data),
    })
    return handleResponse<UserOut>(res)
}

export async function updateSecretary(token: string, data: SecretaryUpdateRequest): Promise<UserOut> {
    const res = await fetch(`${API_BASE}/doctor/secretary`, {
        method:  'PUT',
        headers: authHeaders(token),
        body:    JSON.stringify(data),
    })
    return handleResponse<UserOut>(res)
}

export async function deactivateSecretary(token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/doctor/secretary`, {
        method:  'DELETE',
        headers: authOnlyHeaders(token),
    })
    await handleResponse<unknown>(res)
}

export async function reactivateSecretary(token: string): Promise<UserOut> {
    const res = await fetch(`${API_BASE}/doctor/secretary/reactivate`, {
        method:  'POST',
        headers: authOnlyHeaders(token),
    })
    return handleResponse<UserOut>(res)
}

// ── Secretary Workspace ────────────────────────────────────────────────────────

export async function getSecretaryProfile(token: string): Promise<SecretaryInfo> {
    const res = await fetch(`${API_BASE}/secretary/me`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<SecretaryInfo>(res)
}

export async function getSecretaryClients(token: string): Promise<ClientOut[]> {
    const res = await fetch(`${API_BASE}/secretary/clients`, {
        headers: authOnlyHeaders(token),
    })
    const data = await handleResponse<{ total: number; clients: ClientOut[] }>(res)
    return data.clients
}

// ── Clients CRUD ───────────────────────────────────────────────────────────────

export interface ClientUpdate {
    nom?:            string
    prenom?:         string
    date_naissance?: string
    sexe?:           string
    telephone?:      string
    adresse?:        string
}

export interface ProfileUpdateRequest {
    full_name?:  string
    email?:      string
    telephone?:  string
    adresse?:    string
    specialite?: string
}

export interface ChangePasswordRequest {
    current_password: string
    new_password:     string
}

export async function updateProfile(token: string, data: ProfileUpdateRequest): Promise<UserOut> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
        method:  'PUT',
        headers: authHeaders(token),
        body:    JSON.stringify(data),
    })
    return handleResponse<UserOut>(res)
}

export async function changePassword(token: string, data: ChangePasswordRequest): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
        method:  'PUT',
        headers: authHeaders(token),
        body:    JSON.stringify(data),
    })
    await handleResponse<unknown>(res)
}

export async function updateClient(token: string, clientId: string, data: ClientUpdate): Promise<ClientOut> {
    const res = await fetch(`${API_BASE}/clients/${clientId}`, {
        method:  'PUT',
        headers: authHeaders(token),
        body:    JSON.stringify(data),
    })
    return handleResponse<ClientOut>(res)
}

export async function createClient(token: string, data: ClientCreate): Promise<ClientOut> {
    const res = await fetch(`${API_BASE}/clients/`, {
        method:  'POST',
        headers: authHeaders(token),
        body:    JSON.stringify(data),
    })
    return handleResponse<ClientOut>(res)
}

export async function getMyCreatedClients(token: string): Promise<ClientOut[]> {
    const res = await fetch(`${API_BASE}/clients/my-created`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<ClientOut[]>(res)
}

export async function getMyClients(token: string): Promise<ClientOut[]> {
    const res = await fetch(`${API_BASE}/clients/mine`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<ClientOut[]>(res)
}

export async function getClient(token: string, clientId: string): Promise<ClientOut> {
    const res = await fetch(`${API_BASE}/clients/${clientId}`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<ClientOut>(res)
}

export async function getClientRapports(token: string, clientId: string): Promise<RapportOut[]> {
    const res = await fetch(`${API_BASE}/clients/${clientId}/rapports`, {
        headers: authOnlyHeaders(token),
    })
    const data = await handleResponse<{ total: number; rapports: RapportOut[] }>(res)
    return data.rapports
}

// ── Rendez-vous ───────────────────────────────────────────────────────────────

export interface RendezVousOut {
    id:           string
    client_id:    string
    client_nom:   string
    doctor_id:    string
    doctor_nom:   string
    secretary_id: string
    date_heure:   string   // ISO string
    duree:        number
    motif?:       string
    statut:       string   // confirme | annule | termine
    created_at:   string
}

export interface RendezVousCreate {
    client_id:  string
    date_heure: string     // ISO string
    motif?:     string
}

export interface RendezVousUpdate {
    client_id?:  string
    date_heure?: string    // ISO string
    motif?:      string
}

export interface CreneauInfo {
    heure:     string      // "08:00"
    iso:       string      // "2024-01-15T08:00:00"
    statut:    'libre' | 'pris'
    rdv_id?:   string
    client_id?: string
}

export interface CreneauxResponse {
    date:       string
    jour_ouvre: boolean
    creneaux:   CreneauInfo[]
}

export async function listRendezVous(token: string): Promise<RendezVousOut[]> {
    const res = await fetch(`${API_BASE}/rendezvous/`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<RendezVousOut[]>(res)
}

export async function createRendezVous(token: string, data: RendezVousCreate): Promise<RendezVousOut> {
    const res = await fetch(`${API_BASE}/rendezvous/`, {
        method:  'POST',
        headers: authHeaders(token),
        body:    JSON.stringify(data),
    })
    return handleResponse<RendezVousOut>(res)
}

export async function updateRendezVous(token: string, rdvId: string, data: RendezVousUpdate): Promise<RendezVousOut> {
    const res = await fetch(`${API_BASE}/rendezvous/${rdvId}`, {
        method:  'PUT',
        headers: authHeaders(token),
        body:    JSON.stringify(data),
    })
    return handleResponse<RendezVousOut>(res)
}

export async function cancelRendezVous(token: string, rdvId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/rendezvous/${rdvId}`, {
        method:  'DELETE',
        headers: authOnlyHeaders(token),
    })
    if (res.status === 204) return
    await handleResponse<unknown>(res)
}

export async function getCreneaux(token: string, date: string): Promise<CreneauxResponse> {
    const res = await fetch(`${API_BASE}/rendezvous/creneaux?date=${date}`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<CreneauxResponse>(res)
}

// ── History ────────────────────────────────────────────────────────────────────

export async function listHistory(token: string): Promise<RapportOut[]> {
    const res = await fetch(`${API_BASE}/history/`, {
        headers: authOnlyHeaders(token),
    })
    const data = await handleResponse<{ total: number; rapports: RapportOut[] }>(res)
    return data.rapports
}

export async function listMyHistory(token: string): Promise<RapportOut[]> {
    const res = await fetch(`${API_BASE}/history/`, {
        headers: authOnlyHeaders(token),
    })
    const data = await handleResponse<{ total: number; rapports: RapportOut[] }>(res)
    return data.rapports
}

export async function getHistoryItem(token: string, rapportId: string): Promise<RapportOut> {
    const res = await fetch(`${API_BASE}/history/${rapportId}`, {
        headers: authOnlyHeaders(token),
    })
    return handleResponse<RapportOut>(res)
}

export async function deleteHistoryItem(token: string, rapportId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/history/${rapportId}`, {
        method:  'DELETE',
        headers: authOnlyHeaders(token),
    })
    await handleResponse<unknown>(res)
}

export async function deleteAllRapports(token: string): Promise<number> {
    const res = await fetch(`${API_BASE}/doctor/rapports`, {
        method:  'DELETE',
        headers: authOnlyHeaders(token),
    })
    const data = await handleResponse<{ deleted: number }>(res)
    return data.deleted
}

export async function searchPatientHistory(token: string, nom: string, prenom: string): Promise<RapportOut[]> {
    const res = await fetch(
        `${API_BASE}/history/patient/${encodeURIComponent(nom)}/${encodeURIComponent(prenom)}`,
        { headers: authOnlyHeaders(token) }
    )
    const data = await handleResponse<{ patient: string; total: number; rapports: RapportOut[] }>(res)
    return data.rapports
}

// ── Note médecin & Documents laboratoire ──────────────────────────────────────

// ── Enregistrer prédiction ML sans texte IA ────────────────────────────────

export async function saveMLRapport(
    token:       string,
    axe:         1 | 2 | 3,
    clientId:    string,
    patientData: Record<string, unknown>,
    prediction:  Record<string, unknown>,
): Promise<{ rapport_id: string }> {
    const res = await fetch(`${API_BASE}/history/save-prediction`, {
        method:  'POST',
        headers: authHeaders(token),
        body:    JSON.stringify({ axe, client_id: clientId, patient_data: patientData, prediction }),
    })
    return handleResponse<{ rapport_id: string }>(res)
}

// ── Générer rapport IA Gemini pour un rapport existant (SSE streaming) ────

export async function fetchRapportIA(
    token:     string,
    rapportId: string,
    onChunk:   (text: string) => void,
    onDone:    (rapportId: string) => void,
    onError:   (err: string) => void,
): Promise<void> {
    try {
        const response = await fetch(`${API_BASE}/doctor/rapports/${rapportId}/generate-ia`, {
            method:  'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            try {
                const body = await response.json()
                const raw = body.detail ?? `Erreur serveur ${response.status}`
                onError(sanitizeGeminiError(typeof raw === 'string' ? raw : JSON.stringify(raw)))
            } catch {
                onError(sanitizeGeminiError(`Erreur serveur ${response.status}`))
            }
            return
        }
        const reader  = response.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) { onError('Stream non disponible'); return }
        let buffer = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const content = line.slice(6)
                if (content === '[DONE]') { onDone(rapportId); return }
                if (content.startsWith('[ERROR]')) { onError(content.slice(8)); return }
                try {
                    const parsed = JSON.parse(content)
                    if (parsed.saved && parsed.rapport_id) { onDone(parsed.rapport_id); return }
                    else if (parsed.text) onChunk(parsed.text)
                } catch { /* ignore */ }
            }
        }
        onDone(rapportId)
    } catch (err) {
        onError(err instanceof Error ? err.message : 'Erreur réseau')
    }
}

// ── Générer rapport IA Gemini authentifié via endpoint doctor (avec client) ─

export async function fetchRapportAuthenticated(
    token:      string,
    clientId:   string,
    axe:        1 | 2 | 3,
    patient:    Record<string, unknown>,
    prediction: Record<string, unknown>,
    onChunk:    (text: string) => void,
    onDone:     (rapportId: string) => void,
    onError:    (err: string) => void,
): Promise<void> {
    try {
        const response = await fetch(`${API_BASE}/doctor/clients/${clientId}/rapport/${axe}`, {
            method:  'POST',
            headers: authHeaders(token),
            body:    JSON.stringify({ patient, prediction }),
        })
        if (!response.ok) {
            try {
                const body = await response.json()
                const raw = body.detail ?? `Erreur serveur ${response.status}`
                onError(sanitizeGeminiError(typeof raw === 'string' ? raw : JSON.stringify(raw)))
            } catch {
                onError(sanitizeGeminiError(`Erreur serveur ${response.status}`))
            }
            return
        }
        const reader  = response.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) { onError('Stream non disponible'); return }
        let buffer = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const content = line.slice(6)
                if (content === '[DONE]') { onDone(''); return }
                if (content.startsWith('[ERROR]')) { onError(content.slice(8)); return }
                try {
                    const parsed = JSON.parse(content)
                    if (parsed.saved && parsed.rapport_id) { onDone(parsed.rapport_id); return }
                    else if (parsed.text) onChunk(parsed.text)
                } catch { /* ignore */ }
            }
        }
        onDone('')
    } catch (err) {
        onError(err instanceof Error ? err.message : 'Erreur réseau')
    }
}

export async function updateRapport(
    token: string,
    rapportId: string,
    data: {
        note_medecin?:  string
        rapport_texte?: string
        patient_data?:  Record<string, unknown>
        prediction?:    Record<string, unknown>
    },
): Promise<void> {
    const res = await fetch(`${API_BASE}/doctor/rapports/${rapportId}`, {
        method:  'PATCH',
        headers: authHeaders(token),
        body:    JSON.stringify(data),
    })
    await handleResponse<unknown>(res)
}

export async function updateRapportNote(token: string, rapportId: string, note: string): Promise<void> {
    const res = await fetch(`${API_BASE}/doctor/rapports/${rapportId}/note`, {
        method:  'PUT',
        headers: authHeaders(token),
        body:    JSON.stringify({ note }),
    })
    await handleResponse<unknown>(res)
}

export async function uploadLabDoc(token: string, rapportId: string, file: File): Promise<LabDocument> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE}/doctor/rapports/${rapportId}/lab`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body:    form,
    })
    return handleResponse<LabDocument>(res)
}

export async function downloadLabDoc(
    token:     string,
    rapportId: string,
    fileId:    string,
    filename:  string,
): Promise<void> {
    const res = await fetch(`${API_BASE}/doctor/rapports/${rapportId}/lab/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) {
        let detail = `Erreur ${res.status}`
        try { const b = await res.json(); detail = b.detail ?? detail } catch { /* ignore */ }
        throw new ApiError(res.status, detail)
    }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function deleteLabDoc(token: string, rapportId: string, fileId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/doctor/rapports/${rapportId}/lab/${fileId}`, {
        method:  'DELETE',
        headers: authOnlyHeaders(token),
    })
    await handleResponse<unknown>(res)
}

// -----------------------------------------------------------------------------
// 1. Axe1Input — champs bruts collectés dans le wizard
//    Noms avec alias = noms envoyés au backend (alias Pydantic)
// -----------------------------------------------------------------------------

export interface Axe1RawInput {
    // Démographie
    age: number                   // 1=20-39, 2=40-59, 3=60+
    Race: number                  // 1–5
    'Body Mass Index': number     // 1–4
    'Waist Circumference': number // cm

    // Mode de vie
    smoke: number                           // 0/1
    alcohol: number                         // 0/1
    'sleep disorder': number                // 1=oui, 2=non
    'sleep time': number                    // heures
    'Minutes sedentary activity': number    // 0–1200 min
    depression: number                      // 1/2/3
    'Health Insurance': number              // 1=oui, 2=non

    // Antécédents médicaux
    hypertension: number              // 0/1
    diabetes: number                  // 0/1
    'high cholesterol': number        // 0/1
    'Coronary Heart Disease': number  // 0/1
    'General health condition': number // 1–5

    // Pression artérielle
    'Systolic blood pressure': number
    'Diastolic blood pressure': number

    // Bilan lipidique & glycémie
    'Low-density lipoprotein': number // LDL en mg/dL
    'Fasting Glucose': number         // mg/dL
    Potassium: number                 // mg
    Sodium: number                    // mg

    // Nutrition
    energy: number                              // kcal
    protein: number                             // g
    Carbohydrate: number                        // g
    'Total fat': number                         // g  ← "Total fat" (minuscule)
    'Dietary fiber': number                     // g
    'Total saturated fatty acids': number       // g
    'Total monounsaturated fatty acids': number // g  ← champ requis
    'Total polyunsaturated fatty acids': number // g
}

// -----------------------------------------------------------------------------
// 2. Axe1Output — aligné exactement sur Axe1Output Pydantic
// -----------------------------------------------------------------------------

export interface Axe1Output {
    probability: number           // 0–1
    prediction: number            // 0=Faible risque, 1=Risque élevé
    threshold: number             // seuil de décision
    verdict: string               // "Faible risque" | "Risque élevé"
    engineered_features: Record<string, number> // features calculées backend
}

// -----------------------------------------------------------------------------
// 3. Helper — calcul du risk_level depuis probability
//    (utilisé par ResultCard car l'output n'a pas risk_level)
// -----------------------------------------------------------------------------

export function getRiskLevel(probability: number, threshold: number): 'low' | 'medium' | 'high' {
    // Au-dessus du threshold → décision modèle = risque élevé
    if (probability >= threshold)        return 'high'
    // Entre 70% et 100% du threshold → zone d'attention modérée
    if (probability >= threshold * 0.7)  return 'medium'
    // En dessous de 70% du threshold → faible
    return 'low'
}

// -----------------------------------------------------------------------------
// 4. Valeurs par défaut — placeholders réalistes NHANES
// -----------------------------------------------------------------------------

export const AXE1_DEFAULTS: Axe1RawInput = {
    // Démographie
    age:                3,
    Race:               3,
    'Body Mass Index':  2,
    'Waist Circumference': 90,

    // Mode de vie
    smoke:                          0,
    alcohol:                        0,
    'sleep disorder':               2,
    'sleep time':                   7,
    'Minutes sedentary activity':   480,
    depression:                     1,
    'Health Insurance':             1,

    // Antécédents
    hypertension:               0,
    diabetes:                   0,
    'high cholesterol':         0,
    'Coronary Heart Disease':   0,
    'General health condition': 3,

    // Pression artérielle
    'Systolic blood pressure':  120,
    'Diastolic blood pressure': 80,

    // Lipides & glycémie
    'Low-density lipoprotein': 100,
    'Fasting Glucose':         90,
    Potassium:                 3000,
    Sodium:                    2500,

    // Nutrition
    energy:                              2000,
    protein:                             70,
    Carbohydrate:                        250,
    'Total fat':                         70,
    'Dietary fiber':                     15,
    'Total saturated fatty acids':       25,
    'Total monounsaturated fatty acids': 20,
    'Total polyunsaturated fatty acids': 15,
}

// -----------------------------------------------------------------------------
// 5. API — gestion erreurs Pydantic lisible
// -----------------------------------------------------------------------------

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        this.name = 'ApiError'
    }
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let detail = `HTTP ${res.status}`
        try {
            const body = await res.json()
            if (Array.isArray(body.detail)) {
                // Erreurs de validation Pydantic 422
                detail = body.detail
                    .map((e: { loc: string[]; msg: string }) =>
                        `[${e.loc.join(' → ')}] ${e.msg}`
                    )
                    .join('\n')
            } else if (typeof body.detail === 'string') {
                detail = body.detail
            } else if (body.detail) {
                detail = JSON.stringify(body.detail, null, 2)
            }
        } catch {}
        throw new ApiError(res.status, detail)
    }
    return res.json() as Promise<T>
}

// -----------------------------------------------------------------------------
// 6. predictStroke — envoie directement Axe1RawInput (pas de features engineered
//    côté front car le backend les calcule lui-même via services/predict.py)
// -----------------------------------------------------------------------------

export async function predictStroke(raw: Axe1RawInput): Promise<Axe1Output> {
    const res = await fetch(`${API_BASE}/predict/axe1`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(raw),
    })
    return handleResponse<Axe1Output>(res)
}

// -----------------------------------------------------------------------------
// 7. checkHealth
// -----------------------------------------------------------------------------

export async function checkHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/health`, {
            signal: AbortSignal.timeout(3000),
        })
        return res.ok
    } catch {
        return false
    }
}

// =============================================================================
// Axe 3 — Mortalité AVC (IST) : FDEAD 6 mois + DDEAD 14 jours
// Aligné sur schemas/axe3.py (Axe3FdeadInput / Axe3DdeadInput identiques)
// =============================================================================

// -----------------------------------------------------------------------------
// Axe3Input — 10 champs bruts, communs aux deux modèles FDEAD et DDEAD
// -----------------------------------------------------------------------------

export type RconscType = 'F' | 'D' | 'U'   // Fully / Drowsy / Unconscious
export type RxhepType  = 'H' | 'L' | 'M' | 'N' // High / Low / Medium / None

export interface Axe3Input {
    AGE:        number       // 16–99
    SEX:        SexType
    RSBP:       number       // 60–300 mmHg
    RDELAY:     number       // 0–48 h
    RDEF_SCORE: number       // 0–8 (somme des déficits RDEF1–8)
    RCONSC:     RconscType   // F=Alerte, D=Somnolent, U=Inconscient
    RATRIAL:    BinaryYN
    STYPE:      StrokeType
    RXASP:      BinaryYN     // Aspirine administrée
    RXHEP:      RxhepType    // Héparine : H=haute, L=faible, M=moyenne, N=aucune
}

// -----------------------------------------------------------------------------
// Axe3Output — structure identique pour FDEAD et DDEAD
// -----------------------------------------------------------------------------

export interface Axe3Output {
    probability: number    // 0–1
    prediction:  number    // 0=Survie probable, 1=Décès probable
    threshold:   number    // FDEAD=0.25, DDEAD=0.20
    verdict:     string    // 'Survie probable' | 'Décès probable'
    risk_level:  string    // 'Faible' | 'Modéré' | 'Élevé'
}

// Résultats combinés (les deux modèles en parallèle)
export interface Axe3Results {
    fdead: Axe3Output   // Décès à 6 mois
    ddead: Axe3Output   // Décès à 14 jours
}

// -----------------------------------------------------------------------------
// Valeurs par défaut IST réalistes
// -----------------------------------------------------------------------------

export const AXE3_DEFAULTS: Axe3Input = {
    AGE:        65,
    SEX:        'M',
    RSBP:       160,
    RDELAY:     3.5,
    RDEF_SCORE: 2,
    RCONSC:     'F',
    RATRIAL:    'N',
    STYPE:      'PACS',
    RXASP:      'Y',
    RXHEP:      'N',
}

// -----------------------------------------------------------------------------
// API — deux appels en parallèle via Promise.all
// -----------------------------------------------------------------------------

export async function predictAxe3Fdead(input: Axe3Input): Promise<Axe3Output> {
    const res = await fetch(`${API_BASE}/predict/axe3/fdead`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
    })
    return handleResponse<Axe3Output>(res)
}

export async function predictAxe3Ddead(input: Axe3Input): Promise<Axe3Output> {
    const res = await fetch(`${API_BASE}/predict/axe3/ddead`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
    })
    return handleResponse<Axe3Output>(res)
}

export async function predictAxe3(input: Axe3Input): Promise<Axe3Results> {
    const [fdead, ddead] = await Promise.all([
        predictAxe3Fdead(input),
        predictAxe3Ddead(input),
    ])
    return { fdead, ddead }
}

// =============================================================================
// Axe 2 — Sévérité de l'AVC (IST multiclasse)
// Aligné sur schemas/axe2.py (Axe2Input / Axe2Output)
// =============================================================================

// -----------------------------------------------------------------------------
// 8. Axe2Input — 18 champs bruts collectés dans le wizard
// -----------------------------------------------------------------------------

export type RdefStatus  = 'Y' | 'N' | 'C'
export type SexType     = 'M' | 'F'
export type StrokeType  = 'LACS' | 'PACS' | 'TACS' | 'POCS' | 'OTH'
export type BinaryYN    = 'Y' | 'N'

export interface Axe2Input {
    // Démographie & admission
    AGE:    number      // 16–99
    SEX:    SexType
    RSBP:   number      // 60–300 mmHg
    RDELAY: number      // 0–48 h

    // Déficits neurologiques RDEF1–8 : Y=présent, N=absent, C=cannot assess
    RDEF1: RdefStatus
    RDEF2: RdefStatus
    RDEF3: RdefStatus
    RDEF4: RdefStatus
    RDEF5: RdefStatus
    RDEF6: RdefStatus
    RDEF7: RdefStatus
    RDEF8: RdefStatus

    // Variables cliniques
    STYPE:   StrokeType
    RSLEEP:  BinaryYN
    RATRIAL: BinaryYN
    RCT:     BinaryYN
    RVISINF: BinaryYN
    RHEP24:  BinaryYN
    RASP3:   BinaryYN
}

// -----------------------------------------------------------------------------
// 9. Axe2Output — aligné sur Axe2Output Pydantic
// -----------------------------------------------------------------------------

export interface Axe2Output {
    severity:           'leger' | 'modere' | 'severe'
    severity_label:     string    // 'Léger' | 'Modéré' | 'Sévère'
    prediction:         number    // 0=léger, 1=modéré, 2=sévère
    probability_severe: number
    probability_modere: number
    probability_leger:  number
    threshold:          number    // seuil prioritaire classe sévère (0.30)
    deficit_summary: {
        n_confirmed:  number
        n_uncertain:  number
        deficit_ratio: number
    }
}

// -----------------------------------------------------------------------------
// 10. Valeurs par défaut — profil IST réaliste
// -----------------------------------------------------------------------------

export const AXE2_DEFAULTS: Axe2Input = {
    AGE:    65,
    SEX:    'M',
    RSBP:   150,
    RDELAY: 6,
    RDEF1: 'N',
    RDEF2: 'N',
    RDEF3: 'N',
    RDEF4: 'N',
    RDEF5: 'N',
    RDEF6: 'N',
    RDEF7: 'N',
    RDEF8: 'N',
    STYPE:   'PACS',
    RSLEEP:  'N',
    RATRIAL: 'N',
    RCT:     'Y',
    RVISINF: 'N',
    RHEP24:  'N',
    RASP3:   'N',
}

// -----------------------------------------------------------------------------
// 11. predictAxe2 — POST /predict/axe2
// -----------------------------------------------------------------------------

export async function predictAxe2(input: Axe2Input): Promise<Axe2Output> {
    const res = await fetch(`${API_BASE}/predict/axe2`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
    })
    return handleResponse<Axe2Output>(res)
}

// =============================================================================
// Rapport IA — streaming SSE via Gemini 2.0 Flash
// POST /rapport/axe{n} → text/event-stream
// =============================================================================

function sanitizeGeminiError(raw: string): string {
    if (raw.includes('429') || raw.toLowerCase().includes('too many requests')) {
        return 'Limite de requêtes Gemini atteinte. Veuillez patienter quelques secondes avant de réessayer.'
    }
    if (raw.includes('401') || raw.toLowerCase().includes('unauthorized')) {
        return 'Clé API Gemini invalide ou expirée. Vérifiez la configuration du backend.'
    }
    // Strip URLs (may contain API keys)
    return raw.replace(/https?:\/\/\S+/g, '[URL masquée]').trim()
}

export async function fetchRapport(
    axe: 1 | 2 | 3,
    patient: Record<string, unknown>,
    prediction: Record<string, unknown>,
    onChunk: (text: string) => void,
    onDone:  () => void,
    onError: (err: string) => void,
): Promise<void> {
    try {
        const response = await fetch(`${API_BASE}/rapport/axe${axe}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ patient, prediction }),
        })

        if (!response.ok) {
            try {
                const body = await response.json()
                const raw = body.detail ?? `Erreur serveur ${response.status}`
                onError(sanitizeGeminiError(typeof raw === 'string' ? raw : JSON.stringify(raw)))
            } catch {
                onError(sanitizeGeminiError(`Erreur serveur ${response.status}`))
            }
            return
        }

        const reader  = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) { onError('Stream non disponible'); return }

        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const content = line.slice(6)
                    if (content === '[DONE]') { onDone(); return }
                    if (content.startsWith('[ERROR]')) { onError(content.slice(8)); return }
                    try {
                        const parsed = JSON.parse(content)
                        if (parsed.saved && parsed.rapport_id) {
                            // rapport sauvegardé — tu peux stocker l'ID si besoin
                            console.log('Rapport sauvegardé :', parsed.rapport_id)
                        } else if (parsed.text) {
                            onChunk(parsed.text)
                        }
                    } catch {
                        // ignore malformed lines
                    }
                }
            }
        }

        onDone()
    } catch (err) {
        onError(err instanceof Error ? err.message : 'Erreur réseau')
    }

}
