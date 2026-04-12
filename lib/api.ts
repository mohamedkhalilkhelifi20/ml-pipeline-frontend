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
