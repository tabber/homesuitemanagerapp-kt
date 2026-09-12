import Link from "next/link"

// Persistent footer for authenticated pages so Privacy/Terms are always
// reachable, matching the public landing-page footer.
export function AppFooter() {
  return (
    <footer className="border-t border-sage/30 mt-8 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-muted">
        <p>&copy; 2026 HomeSuite. All rights reserved.</p>
        <nav className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-navy transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-navy transition-colors">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
