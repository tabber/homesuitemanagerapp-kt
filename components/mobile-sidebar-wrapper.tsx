"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"

interface MobileSidebarWrapperProps {
  children: React.ReactNode
}

export function MobileSidebarWrapper({ children }: MobileSidebarWrapperProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-[var(--sidebar-bg)] text-white md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container — a real `transform` anchors the fixed <aside> child to
          this wrapper and slides it off-screen on mobile. md: resets to no transform
          so the sidebar sits at the viewport edge on desktop. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 md:static md:inset-auto md:z-auto md:w-auto md:[transform:none] ${
          isOpen ? "[transform:translateX(0)]" : "[transform:translateX(-100%)]"
        }`}
        onClick={() => setIsOpen(false)}
      >
        {/* Close button inside sidebar on mobile */}
        <button
          className="absolute top-4 right-4 z-50 p-1 text-white/70 hover:text-white md:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </>
  )
}
