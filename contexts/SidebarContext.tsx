'use client'

// =============================================================================
// contexts/SidebarContext.tsx — Contexte global pour l'état de la sidebar
// =============================================================================

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface SidebarContextValue {
    isOpen: boolean
    open:   () => void
    close:  () => void
    toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
    isOpen: false,
    open:   () => {},
    close:  () => {},
    toggle: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)

    const open   = useCallback(() => setIsOpen(true),       [])
    const close  = useCallback(() => setIsOpen(false),      [])
    const toggle = useCallback(() => setIsOpen(p => !p),    [])

    return (
        <SidebarContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
        </SidebarContext.Provider>
    )
}

export const useSidebar = () => useContext(SidebarContext)
