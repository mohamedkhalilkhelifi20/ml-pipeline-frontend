import '@/styles/globals.css'
import type { Metadata } from 'next'
import React from 'react'

import { SidebarProvider } from '@/contexts/SidebarContext'
import { AuthProvider }    from '@/contexts/AuthContext'
import Sidebar             from '@/components/Sidebar'
import ToasterProvider     from '@/components/ToasterProvider'

export const metadata: Metadata = {
    title:       'StrokeAI — Prédiction du risque d\'AVC',
    description: 'Évaluation clinique basée sur LightGBM / NHANES — Gestion patients et rapports IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" data-scroll-behavior="smooth">
            <body>
                <AuthProvider>
                    <SidebarProvider>
                        <Sidebar />
                        {children}
                        <ToasterProvider />
                    </SidebarProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
