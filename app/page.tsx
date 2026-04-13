'use client'

// =============================================================================
// app/page.tsx — Landing page StrokeAI
// 3 axes de prédiction cliquables avec descriptions et visuels
// =============================================================================

import '@/styles/home.css'
import Link from 'next/link'
import MenuButton from '@/components/MenuButton'

// --------------------------------------------------------------------------
// SVG Illustrations inline par axe
// --------------------------------------------------------------------------

function SvgAxe1() {
    return (
        <svg className="home-card-visual-svg" viewBox="0 0 280 180" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            {/* Neural network nodes */}
            <circle cx="40" cy="90" r="14" stroke="white" strokeWidth="1.5"/>
            <circle cx="40" cy="50" r="10" stroke="white" strokeWidth="1.5"/>
            <circle cx="40" cy="130" r="10" stroke="white" strokeWidth="1.5"/>
            <circle cx="120" cy="70" r="14" stroke="white" strokeWidth="1.5"/>
            <circle cx="120" cy="110" r="14" stroke="white" strokeWidth="1.5"/>
            <circle cx="200" cy="90" r="16" stroke="white" strokeWidth="1.5"/>
            <circle cx="255" cy="90" r="10" stroke="white" strokeWidth="1.5"/>
            {/* Connections */}
            <line x1="54" y1="90" x2="106" y2="70"  stroke="white" strokeWidth="1"/>
            <line x1="54" y1="90" x2="106" y2="110" stroke="white" strokeWidth="1"/>
            <line x1="50" y1="50" x2="106" y2="70"  stroke="white" strokeWidth="1"/>
            <line x1="50" y1="130" x2="106" y2="110" stroke="white" strokeWidth="1"/>
            <line x1="134" y1="70"  x2="184" y2="90" stroke="white" strokeWidth="1"/>
            <line x1="134" y1="110" x2="184" y2="90" stroke="white" strokeWidth="1"/>
            <line x1="216" y1="90" x2="245" y2="90" stroke="white" strokeWidth="1"/>
            {/* Filled nodes */}
            <circle cx="40" cy="90" r="5" fill="white" opacity="0.4"/>
            <circle cx="120" cy="70" r="5" fill="white" opacity="0.4"/>
            <circle cx="120" cy="110" r="5" fill="white" opacity="0.4"/>
            <circle cx="200" cy="90" r="6" fill="white" opacity="0.6"/>
        </svg>
    )
}

function SvgAxe2() {
    return (
        <svg className="home-card-visual-svg" viewBox="0 0 280 180" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            {/* Severity bars */}
            <rect x="30" y="130" width="38" height="30"  rx="4" fill="white" opacity="0.5"/>
            <rect x="82" y="100" width="38" height="60"  rx="4" fill="white" opacity="0.6"/>
            <rect x="134" y="65" width="38" height="95"  rx="4" fill="white" opacity="0.7"/>
            {/* Labels */}
            <text x="49"  y="150" fill="white" fontSize="9" textAnchor="middle" opacity="0.6">léger</text>
            <text x="101" y="150" fill="white" fontSize="9" textAnchor="middle" opacity="0.6">modéré</text>
            <text x="153" y="150" fill="white" fontSize="9" textAnchor="middle" opacity="0.6">sévère</text>
            {/* Arrow up */}
            <path d="M210 130 L230 80 L250 130" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            <line x1="210" y1="130" x2="250" y2="130" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
            {/* Classification circle */}
            <circle cx="230" cy="50" r="18" stroke="white" strokeWidth="1.5" opacity="0.4"/>
            <text x="230" y="55" fill="white" fontSize="14" textAnchor="middle" opacity="0.6">3</text>
        </svg>
    )
}

function SvgAxe3() {
    return (
        <svg className="home-card-visual-svg" viewBox="0 0 280 180" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            {/* ECG / heartbeat line */}
            <polyline
                points="10,90 50,90 65,50 75,130 90,70 105,110 120,90 170,90 185,55 195,125 210,80 220,100 235,90 270,90"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                fill="none" opacity="0.7"
            />
            {/* Axis */}
            <line x1="10" y1="90" x2="270" y2="90" stroke="white" strokeWidth="0.5" opacity="0.2"/>
            {/* Time markers */}
            <line x1="80"  y1="82" x2="80"  y2="98" stroke="white" strokeWidth="1" opacity="0.3"/>
            <text x="80"  y="110" fill="white" fontSize="7" textAnchor="middle" opacity="0.4">14j</text>
            <line x1="200" y1="82" x2="200" y2="98" stroke="white" strokeWidth="1" opacity="0.3"/>
            <text x="200" y="110" fill="white" fontSize="7" textAnchor="middle" opacity="0.4">6m</text>
            {/* Threshold line */}
            <line x1="10" y1="68" x2="270" y2="68" stroke="white" strokeWidth="1"
                strokeDasharray="5 4" opacity="0.25"/>
            <text x="16" y="63" fill="white" fontSize="7" opacity="0.4">seuil</text>
        </svg>
    )
}

// --------------------------------------------------------------------------
// Données des axes
// --------------------------------------------------------------------------

const AXES = [
    {
        id:        'axe1',
        href:      '/axe1',
        axeTag:    'Axe 1',
        modelTag:  'LightGBM',
        icon:      '🎯',
        title:     'Risque d\'AVC',
        desc:      'Évaluation du risque individuel d\'accident vasculaire cérébral à partir du profil NHANES — données démographiques, biologiques et comportementales.',
        features: [
            '37 features NHANES (biologie, nutrition, mode de vie)',
            'Feature engineering : pulse_pressure, fat_ratio…',
            'Threshold optimisé à 0.25 (rappel sévère)',
        ],
        dataset:   'NHANES — population générale US',
        svg:       <SvgAxe1 />,
        color:     'axe1',
    },
    {
        id:        'axe2',
        href:      '/axe2',
        axeTag:    'Axe 2',
        modelTag:  'CalibratedClassifierCV',
        icon:      '📊',
        title:     'Sévérité de l\'AVC',
        desc:      'Classification IST en 3 niveaux de sévérité (léger / modéré / sévère) à partir du bilan neurologique et clinique à l\'admission.',
        features: [
            '18 features IST — déficits RDEF1-8, score neurologique',
            'Classe sévère traitée avec seuil prioritaire ≥ 0.30',
            '19 435 patients — split 80/20 stratifié',
        ],
        dataset:   'IST — International Stroke Trial',
        svg:       <SvgAxe2 />,
        color:     'axe2',
    },
    {
        id:        'axe3',
        href:      '/axe3',
        axeTag:    'Axe 3',
        modelTag:  '2 × Logistic Regression',
        icon:      '💀',
        title:     'Mortalité post-AVC',
        desc:      'Prédiction parallèle du décès à 14 jours (DDEAD) et à 6 mois (FDEAD) via deux modèles IST calibrés — admission, neurologie et traitement.',
        features: [
            'DDEAD — décès à 14 jours · seuil 0.20',
            'FDEAD — décès à 6 mois · seuil 0.25',
            'Inférence parallèle Promise.all sur les 2 endpoints',
        ],
        dataset:   'IST — International Stroke Trial',
        svg:       <SvgAxe3 />,
        color:     'axe3',
    },
]

// --------------------------------------------------------------------------
// Page principale
// --------------------------------------------------------------------------

export default function HomePage() {
    return (
        <div className="home-page">

            {/* ── Navbar ── */}
            <nav className="home-nav">
                <div className="home-nav-left">
                    <MenuButton />
                    <div className="home-nav-logo">🧠</div>
                    <span className="home-nav-title">Stroke<span>AI</span></span>
                </div>
                <div className="home-nav-badge">Pipeline ML — v1.0</div>
            </nav>

            {/* ── Hero ── */}
            <section className="home-hero">
                <div className="home-hero-inner">
                    <div className="home-hero-tag">
                        <span className="home-hero-tag-dot" />
                        Prédiction clinique multi-axes
                    </div>

                    <h1 className="home-hero-title">
                        StrokeAI<br />
                        <span>Prédiction AVC</span>
                    </h1>

                    <p className="home-hero-sub">
                        Pipeline Machine Learning complet pour l&apos;évaluation du risque,
                        de la sévérité et de la mortalité post-AVC — basé sur les datasets
                        NHANES et IST International Stroke Trial.
                    </p>

                    <div className="home-hero-stats">
                        <div className="home-stat">
                            <span className="home-stat-value">3</span>
                            <span className="home-stat-label">Modèles ML</span>
                        </div>
                        <div className="home-stat">
                            <span className="home-stat-value">19 435</span>
                            <span className="home-stat-label">Patients IST</span>
                        </div>
                        <div className="home-stat">
                            <span className="home-stat-value">37+</span>
                            <span className="home-stat-label">Features NHANES</span>
                        </div>
                        <div className="home-stat">
                            <span className="home-stat-value">4</span>
                            <span className="home-stat-label">Endpoints API</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section axes ── */}
            <section className="home-section">
                <div className="home-section-header">
                    <h2 className="home-section-title">Choisissez un axe de prédiction</h2>
                    <p className="home-section-sub">
                        Cliquez sur une carte pour accéder au formulaire de saisie et tester le modèle
                    </p>
                </div>

                <div className="home-cards">
                    {AXES.map((ax) => (
                        <Link
                            key={ax.id}
                            href={ax.href}
                            className={`home-card home-card--${ax.color}`}
                        >
                            {/* Visual zone */}
                            <div className="home-card-visual">
                                {ax.svg}
                                <span className="home-card-axe-tag">{ax.axeTag}</span>
                                <span className="home-card-model-tag">{ax.modelTag}</span>
                                <span className="home-card-visual-icon">{ax.icon}</span>
                            </div>

                            {/* Body */}
                            <div className="home-card-body">
                                <div className="home-card-title">{ax.title}</div>
                                <p className="home-card-desc">{ax.desc}</p>

                                <ul className="home-card-features">
                                    {ax.features.map((f, i) => (
                                        <li key={i} className="home-card-feature">
                                            <span className="home-card-feature-dot" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <div className="home-card-cta">
                                    <span>Tester le modèle</span>
                                    <span className="home-card-cta-arrow">→</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="home-footer">
                StrokeAI Pipeline ML
                <span>·</span>
                NHANES &amp; IST Datasets
                <span>·</span>
                FastAPI + Next.js
                <span>·</span>
                2025 – 2026
            </footer>

        </div>
    )
}
