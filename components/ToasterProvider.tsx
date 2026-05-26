'use client'
import { Toaster } from 'sonner'
export default function ToasterProvider() {
    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{ style: { fontFamily: 'inherit', fontSize: '0.85rem' } }}
        />
    )
}
