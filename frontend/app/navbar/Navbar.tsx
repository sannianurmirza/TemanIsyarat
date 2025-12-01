"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">TemanIsyarat</div>
              {/* <div className="text-xs text-gray-600">Detector</div> */}
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                pathname === "/"
                  ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/deteksi"
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                pathname === "/deteksi"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Deteksi
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
