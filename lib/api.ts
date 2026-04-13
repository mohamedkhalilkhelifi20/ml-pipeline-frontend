// =============================================================================
// lib/api.ts — Client FastAPI · Axe 1 Stroke Risk
// Aligné exactement sur schemas/axe1.py (Axe1Input / Axe1Output)
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
