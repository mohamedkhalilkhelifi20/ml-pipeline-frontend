<div align="center">

# 🧠 StrokeAI — Pipeline ML de Prédiction AVC

<p>
  <img src="https://img.shields.io/badge/Next.js-16.2.3-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
</p>

<p>
  <img src="https://img.shields.io/badge/LightGBM-Axe%201-F4C430?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Logistic%20Regression-Axe%202%20%26%203-8B5CF6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Dataset-NHANES%20%26%20IST-0EA5E9?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Patients-19%20435-EF4444?style=for-the-badge" />
</p>

<p>
  <img src="https://img.shields.io/badge/status-en%20développement-yellow?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/ML%20Project-2025--2026-blueviolet?style=flat-square" />
</p>

**Pipeline Machine Learning complet pour l'évaluation clinique du risque, de la sévérité et de la mortalité post-AVC.**  
*Basé sur les datasets NHANES (population générale US) et IST (International Stroke Trial — 19 435 patients).*

</div>

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Axes de prédiction](#-axes-de-prédiction)
- [Architecture](#-architecture)
- [Structure du projet](#-structure-du-projet)
- [Installation & Lancement](#-installation--lancement)
- [API Backend](#-api-backend)
- [Stack technique](#-stack-technique)
- [Datasets](#-datasets)

---

## 🗺️ Vue d'ensemble

StrokeAI est un pipeline ML clinique en **3 axes indépendants** :

| Axe | Objectif | Modèle | Dataset | Cible |
|-----|----------|--------|---------|-------|
| **Axe 1** | Risque d'AVC | LightGBM | NHANES | Binaire (0/1) |
| **Axe 2** | Sévérité de l'AVC | CalibratedClassifierCV (LR) | IST | 3 classes |
| **Axe 3** | Mortalité post-AVC | CalibratedClassifierCV (LR) × 2 | IST | Binaire × 2 |

Chaque axe dispose de :
- Un **wizard de saisie** multi-étapes (3 à 4 étapes)
- Une **inférence backend** via FastAPI
- Une **page de résultats** avec jauge de risque, recommandations cliniques et export JSON

---

## 🎯 Axes de prédiction

### Axe 1 — Risque d'AVC (LightGBM)

> **Dataset :** NHANES — population générale américaine  
> **Threshold :** 0.25 (optimisé pour le rappel)

**4 étapes :** Profil démographique → Mode de vie → Santé & antécédents → Biologie & nutrition

**Features clés :**
- 37 features brutes NHANES (démographie, biologie, nutrition, comportement)
- Feature engineering : `pulse_pressure`, `fat_ratio`, `fat_sat_ratio`, etc.
- Données biologiques : LDL, glycémie à jeun, potassium, sodium
- Données nutritionnelles : énergie, protéines, glucides, lipides (7 types)

```
Inputs (37) → Feature Engineering → LightGBM → P(AVC) vs threshold 0.25 → Verdict
```

---

### Axe 2 — Sévérité de l'AVC (IST)

> **Dataset :** IST — 19 435 patients, 112 variables  
> **Threshold sévère :** P(sévère) ≥ 0.30 (classe prioritaire)

**3 étapes :** Démographie & admission → Déficits neurologiques → Variables cliniques

**Features clés :**
- 18 features IST à l'admission (T=0, sans data leakage)
- 8 déficits neurologiques RDEF1–RDEF8 encodés Y/N/C
- Feature engineering : `RDEF_score`, `RDEF_uncertain`, `deficit_ratio`
- Variables cliniques : STYPE (OCSP), RATRIAL, RCT, RVISINF, RHEP24, RASP3

**Cible construite :**
```
severity_score = RDEF_score + 2 × RCONSC_factor
léger: 0–3  |  modéré: 4–6  |  sévère: 7+
Distribution : 49.9% / 41.7% / 8.4%
```

---

### Axe 3 — Mortalité post-AVC (IST)

> **Dataset :** IST — mêmes 19 435 patients  
> **Deux modèles en parallèle :** DDEAD (14j, threshold 0.20) + FDEAD (6m, threshold 0.25)

**3 étapes :** Profil & admission → Bilan neurologique → Traitement (RXASP/RXHEP)

**Features clés :**
- AGE, SEX, RSBP, RDELAY (délai AVC → admission)
- RDEF_SCORE (0–8), RCONSC (F/D/U), RATRIAL, STYPE
- RXASP (aspirine Y/N), RXHEP (héparine H/L/M/N)

**Inférence parallèle :**
```javascript
const [fdead, ddead] = await Promise.all([
  POST /predict/axe3/fdead,
  POST /predict/axe3/ddead
])
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│              Next.js 16 · React 19                   │
│                                                      │
│  / (Landing)  →  /axe1  →  /axe2  →  /axe3          │
│                                                      │
│  Sidebar partagée · MenuButton · SidebarContext      │
└──────────────────┬───────────────────────────────────┘
                   │  HTTP / JSON
                   ▼
┌──────────────────────────────────────────────────────┐
│                    BACKEND                           │
│               FastAPI · Python 3.10+                 │
│                                                      │
│  POST /predict/axe1          → LightGBM              │
│  POST /predict/axe2          → CalibratedClassifierCV│
│  POST /predict/axe3/fdead    → LogisticRegression    │
│  POST /predict/axe3/ddead    → LogisticRegression    │
│  GET  /health                → {"status": "ok"}      │
└──────────────────────────────────────────────────────┘
```

---

## 📁 Structure du projet

```
ml-pipeline-frontend/
│
├── app/
│   ├── layout.tsx              # Root layout — SidebarProvider + Sidebar
│   ├── page.tsx                # Landing page (3 cartes axes cliquables)
│   ├── axe1/page.tsx           # Wizard Axe 1 — 4 étapes
│   ├── axe2/page.tsx           # Wizard Axe 2 — 3 étapes
│   └── axe3/page.tsx           # Wizard Axe 3 — 3 étapes
│
├── components/
│   ├── Sidebar.tsx             # Sidebar navigation partagée
│   ├── MenuButton.tsx          # Bouton hamburger (toggle sidebar)
│   ├── axe1/                   # Composants Axe 1
│   │   ├── ProgressBar.tsx
│   │   ├── StepProfil.tsx
│   │   ├── StepVie.tsx
│   │   ├── StepSante.tsx
│   │   ├── StepBiologie.tsx
│   │   └── ResultCard.tsx
│   ├── axe2/                   # Composants Axe 2
│   │   ├── ProgressBarAxe2.tsx
│   │   ├── StepDemographie.tsx
│   │   ├── StepDeficits.tsx
│   │   ├── StepClinique.tsx
│   │   └── ResultAxe2.tsx
│   └── axe3/                   # Composants Axe 3
│       ├── ProgressBarAxe3.tsx
│       ├── StepProfilAxe3.tsx
│       ├── StepNeurologie.tsx
│       ├── StepTraitement.tsx
│       └── ResultAxe3.tsx
│
├── contexts/
│   └── SidebarContext.tsx      # État global sidebar (isOpen/toggle/close)
│
├── lib/
│   └── api.ts                  # Client FastAPI + types TypeScript
│
├── styles/
│   ├── home.css                # Landing page
│   ├── sidebar.css             # Sidebar + MenuButton
│   ├── wizard.css              # Layout partagé wizard
│   ├── progressbar.css         # Barre de progression
│   ├── result-card.css         # Résultats (partagé)
│   ├── step-profil.css         # Layout étapes (partagé)
│   ├── step-vie.css            # Toggles, sliders (partagé)
│   ├── axe1/                   # CSS spécifiques Axe 1
│   │   ├── step-sante.css
│   │   └── step-biologie.css
│   ├── axe2/                   # CSS spécifiques Axe 2
│   │   ├── step-demographie.css
│   │   ├── step-deficits.css
│   │   ├── step-clinique.css
│   │   └── result-axe2.css
│   └── axe3/                   # CSS spécifiques Axe 3
│       ├── step-profil-axe3.css
│       ├── step-neurologie.css
│       ├── step-traitement.css
│       └── result-axe3.css
```

---

## 🚀 Installation & Lancement

### Prérequis

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- Backend FastAPI démarré sur `http://localhost:8000`

### Frontend

```bash
# Cloner le repo
git clone <url-repo>
cd ml-pipeline-frontend

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

> Ouvrir [http://localhost:3000](http://localhost:3000)

### Backend (FastAPI)

```bash
# Depuis le dossier backend
cd backend/

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

> API disponible sur [http://localhost:8000](http://localhost:8000)  
> Documentation Swagger : [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔌 API Backend

### Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/health` | Vérification backend |
| `POST` | `/predict/axe1` | Prédiction risque AVC (LightGBM) |
| `POST` | `/predict/axe2` | Prédiction sévérité IST (3 classes) |
| `POST` | `/predict/axe3/fdead` | Prédiction mortalité 6 mois |
| `POST` | `/predict/axe3/ddead` | Prédiction mortalité 14 jours |

### Exemple de réponse `/predict/axe1`

```json
{
  "probability": 0.342,
  "prediction": 1,
  "threshold": 0.25,
  "verdict": "Risque élevé détecté",
  "engineered_features": {
    "pulse_pressure": 52,
    "fat_ratio": 0.38,
    "fat_sat_ratio": 0.31
  }
}
```

### Exemple de réponse `/predict/axe2`

```json
{
  "severity": "sévère",
  "severity_label": "Sévère",
  "prediction": 2,
  "probability_severe": 0.41,
  "probability_modere": 0.35,
  "probability_leger": 0.24,
  "threshold": 0.30,
  "deficit_summary": {
    "n_confirmed": 5,
    "n_uncertain": 2,
    "deficit_ratio": 0.625
  }
}
```

### Exemple de réponse `/predict/axe3/fdead`

```json
{
  "probability": 0.31,
  "prediction": 1,
  "threshold": 0.25,
  "verdict": "Risque de décès à 6 mois",
  "risk_level": "Élevé"
}
```

---

## 🛠️ Stack technique

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Next.js** | 16.2.3 | Framework App Router |
| **React** | 19.2.4 | UI |
| **TypeScript** | 5 | Typage statique |
| **CSS Modules** | — | Styles par composant |
| **DM Sans** | — | Typographie (Google Fonts) |

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| **FastAPI** | ≥ 0.100 | API REST |
| **scikit-learn** | — | CalibratedClassifierCV, LogisticRegression |
| **LightGBM** | — | Modèle Axe 1 |
| **pandas / numpy** | — | Preprocessing |
| **joblib** | — | Sérialisation des modèles |
| **uvicorn** | — | Serveur ASGI |

---

## 📊 Datasets

### NHANES — National Health and Nutrition Examination Survey

- **Source :** CDC / US Population
- **Usage :** Axe 1 — Risque d'AVC
- **Features sélectionnées :** 37 (démographie, biologie, nutrition, comportement)
- **Target :** AVC déclaré (binaire 0/1)

### IST — International Stroke Trial

- **Référence :** Sandercock et al., 1997
- **Patients :** 19 435
- **Variables :** 112
- **Usage :** Axe 2 (sévérité) & Axe 3 (mortalité)
- **Split :** 80/20 stratifié → Train : 15 534 / Test : 3 884

```
Variables temporelles (éviter le data leakage) :
  T=0   (Admission)    → ✅ utilisables pour Axe 2 & 3
  T=14j (Sortie)       → ❌ leakage temporel
  T=6m  (Suivi)        → ❌ leakage temporel
```

---

<div align="center">

**StrokeAI** — Projet ML 2025–2026  
NHANES · IST · FastAPI · Next.js · LightGBM · Logistic Regression

</div>
