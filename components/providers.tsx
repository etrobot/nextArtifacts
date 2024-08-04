'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { useEffect, useState } from 'react'

export function Providers({ children, ...props }: ThemeProviderProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <>{children}</>
    }

    return (
        <NextThemesProvider {...props}>
            {children}
        </NextThemesProvider>
    )
}