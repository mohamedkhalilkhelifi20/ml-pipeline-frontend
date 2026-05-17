import '@/styles/globals.css'
import type { Metadata } from 'next'
import React from 'react'

import { SidebarProvider } from '@/contexts/SidebarContext'
import { AuthProvider }    from '@/contexts/AuthContext'
import Sidebar             from '@/components/Sidebar'

export const metadata: Metadata = {
    title:       'StrokeAI — Prédiction du risque d\'AVC',
    description: 'Évaluation clinique basée sur LightGBM / NHANES — Gestion patients et rapports IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr">
            <body>
                <AuthProvider>
                    <SidebarProvider>
                        <Sidebar />
                        {children}
                    </SidebarProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
