'use client'

// =============================================================================
// components/MenuButton.tsx — Bouton hamburger qui ouvre la Sidebar
// =============================================================================

import '@/styles/sidebar.css'
import { useSidebar } from '@/contexts/SidebarContext'

export default function MenuButton() {
    const { toggle } = useSidebar()

    return (
        <button className="menu-btn" onClick={toggle} aria-label="Ouvrir le menu">
            <span />
            <span />
            <span />
        </button>
    )
}
