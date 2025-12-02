"use client"

import Link from "next/link"

export default function BerandaContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            Deteksi Live Dengan Deep Learning
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Deteksi Bahasa Isyarat Indonesia
          </h1>
          <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="text-teal-500">Dengan</span> <span className="text-orange-500">CNN</span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            TemanIsyarat menggunakan deep learning untuk mengenali dan menerjemahkan Bahasa
            Isyarat Indonesia secara real-time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/deteksi"
              className="px-12 py-5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              Mulai Deteksi
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            {/* <button className="px-8 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-all hover:scale-105">
              Pelajari Lebih Lanjut
            </button> */}
          </div>
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section className="py-20 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Cara Kerja</h2>
            <p className="text-lg text-gray-600">Proses mudah dalam 3 langkah sederhana</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-orange-400 flex items-center justify-center text-white text-2xl font-bold mb-6">
                01
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Buka Kamera Real-time</h3>
              <p className="text-gray-600 leading-relaxed">
                Aktifkan kamera untuk menangkap gerakan isyarat SIBI yang ingin Anda deteksi secara langsung.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-orange-400 flex items-center justify-center text-white text-2xl font-bold mb-6">
                02
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Proses Deteksi Dengan CNN</h3>
              <p className="text-gray-600 leading-relaxed">
                Sistem ini menggunakan model Deep Learning berbasis Convolutional Neural Network (CNN) yang telah dilatih dengan ribuan data bahasa isyarat SIBI.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-orange-400 flex items-center justify-center text-white text-2xl font-bold mb-6">
                03
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hasil Deteksi</h3>
              <p className="text-gray-600 leading-relaxed">
                Dapatkan hasil terjemahan isyarat dalam bentuk teks dengan tingkat akurasi tinggi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Unggulan Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Fitur Unggulan</h2>
            <p className="text-lg text-gray-600">Teknologi canggih untuk pengalaman deteksi isyarat terbaik</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-teal-100 hover:border-teal-300 transition-all">
              <div className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Deteksi Real-time</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sistem dapat membaca gerakan tangan dari kamera dan menampilkan hasil deteksi secara instan.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-teal-100 hover:border-teal-300 transition-all">
              <div className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Powered by Deep Learning (CNN)</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Website ini menggunakan deep learning dengan arsitektur Convolutional Neural Network (CNN) dan dilatih menggunakan ribuan citra bahasa isyarat SIBI
              </p>
            </div>
                    {/* Feature 3 */}
        <div className="bg-white rounded-2xl p-6 border-2 border-teal-100 hover:border-teal-300 transition-all">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aman & Privat</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Data Anda diproses dengan aman tanpa penyimpanan atau pembagian informasi pribadi.
          </p>
        </div>





            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-teal-100 hover:border-teal-300 transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hasil Akurat</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dapatkan confidence score tinggi dengan saran alternatif deteksi untuk verifikasi maksimal.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
