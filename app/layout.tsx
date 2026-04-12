import '@/styles/globals.css'
import type { Metadata } from 'next'
import React from "react";

export const metadata: Metadata = {
    title: 'StrokeAI — Prédiction du risque d\'AVC',
    description: 'Évaluation clinique basée sur LightGBM / NHANES',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr">
        <body>{children}</body>
        </html>
    )
}
