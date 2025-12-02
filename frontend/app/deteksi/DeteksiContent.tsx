"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

type DetectionMode = "camera" | "upload"
type ModelType = "letters" | "words"

interface DetectionResult {
  id: string
  label: string
  confidence: number
  timestamp: string
  imageData: string
  allPredictions?: {
    letter: string
    confidence: number
  }[]
}

export default function DeteksiContent() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [detectionMode, setDetectionMode] = useState<DetectionMode>("upload")
  const [modelType, setModelType] = useState<ModelType>("letters")

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isRealTimeDetection, setIsRealTimeDetection] = useState(false)
  const [detectionHistory, setDetectionHistory] = useState<DetectionResult[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [currentDetection, setCurrentDetection] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useMockMode, setUseMockMode] = useState(false)
  const [autoMockMode, setAutoMockMode] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  // Log API URL saat component mount
  useEffect(() => {
    console.log("🌐 API_URL configured:", API_URL)
    console.log("🔧 Environment:", process.env.NODE_ENV)
    checkBackendHealth()
  }, [])

  // Check backend health
  const checkBackendHealth = async () => {
    try {
      console.log("🔍 Checking backend health at:", API_URL)
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("✅ Backend is online:", data)
        setBackendStatus('online')
        setAutoMockMode(false)
        setError(null)
      } else {
        console.log("⚠️ Backend responded but not healthy:", response.status)
        setBackendStatus('offline')
      }
    } catch (err) {
      console.error("❌ Backend health check failed:", err)
      setBackendStatus('offline')
    }
  }

  // =====================================================================
  //  UTIL: LABEL & MOCK
  // =====================================================================

  const formatMainLabel = (prediction: string) => {
    if (modelType === "letters") return `Huruf ${prediction}`
    return `Kata ${prediction}`
  }

  const getMockDetection = () => {
    const mockLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    const mockWords = [
      'Adik_P', 'Air', 'Aku', 'Anda', 'Anjing', 'Awalan', 'Awan', 'Ayah', 'Ayam', 'Baca',
      'Bangun', 'Baru', 'Berat', 'Besar', 'Burung', 'Cepat', 'Cerah', 'Danau', 'Dengan', 'Doa',
      'Foto', 'Gelap', 'Gunung', 'Guru', 'Hari', 'Hujan', 'Hutan', 'Ibu', 'Ini',
      'Itu', 'Jam', 'Jendela', 'Jumat', 'Kakak', 'Kamis', 'Kamu', 'Kecil', 'Kelinci', 'Kenyang',
      'Kereta', 'Kerja', 'Kertas', 'Kipas', 'Kita', 'Kolam', 'Kucing', 'Kuda', 'Kursi', 'Lama',
      'Lambat', 'Lapar', 'Lihat', 'Mahal', 'Main', 'Makan', 'Malam', 'Masak', 'Matahari', 'Meja',
      'Mendung', 'Mereka', 'Minggu', 'Minum', 'Mobil', 'Motor', 'Murah', 'Musuh', 'Pagi', 'Panjang',
      'Papan', 'Pendek', 'Pensil', 'Pesawat', 'Pintu', 'Polisi', 'Pulpen', 'Rabu', 'Ringan', 'Roti',
      'Rumah', 'Rumput', 'Sabtu', 'Sama', 'Sapi', 'Sawah', 'Saya', 'Sedang', 'Selasa', 'Senin',
      'Senyum', 'Sore', 'Suasana', 'Sungai', 'Takut', 'Telepon', 'Teman', 'Tentara', 'Terang', 'Tugas',
      'Tulis', 'Tunjuk', 'Ular'
    ]

    const pool = modelType === "letters" ? mockLetters : mockWords
    const randomMain = pool[Math.floor(Math.random() * pool.length)]
    const c = 75 + Math.random() * 20 // 75-95 (dalam persentase)

    return {
      prediction: randomMain,
      confidence: c, // Tetap dalam persentase untuk konsistensi dengan backend
      all_predictions: [
        { letter: randomMain, confidence: c },
        { letter: pool[Math.floor(Math.random() * pool.length)], confidence: c - 15 },
        { letter: pool[Math.floor(Math.random() * pool.length)], confidence: c - 30 },
      ],
    }
  }

  const buildDetectionResult = (
    prediction: string,
    confidence: number,
    imageData: string,
    allPredictions?: { letter: string; confidence: number }[],
  ): DetectionResult => {
    // Backend mengirim confidence dalam persentase (0-100)
    // Kita perlu convert ke desimal (0-1) untuk konsistensi internal
    const confidenceDecimal = confidence > 1 ? confidence / 100 : confidence
    
    // Normalize allPredictions juga jika ada
    const normalizedPredictions = allPredictions?.map(pred => ({
      letter: pred.letter,
      confidence: pred.confidence > 1 ? pred.confidence / 100 : pred.confidence
    }))
    
    return {
      id: Date.now().toString(),
      label: formatMainLabel(prediction),
      confidence: confidenceDecimal,
      timestamp: new Date().toLocaleString("id-ID"),
      imageData,
      allPredictions: normalizedPredictions,
    }
  }

  // =====================================================================
  //  BACKEND CALL
  // =====================================================================

  const tryDetectWithBackend = async (blob: Blob): Promise<any | null> => {
    try {
      const formData = new FormData()
      formData.append("file", blob, "capture.jpg")

      const endpoint = `${API_URL}/api/detect/${modelType}`
      console.log("=".repeat(60))
      console.log("🔵 [FRONTEND] Calling backend:", endpoint)
      console.log("🔵 [FRONTEND] Model Type:", modelType)
      console.log("🔵 [FRONTEND] Blob size:", blob.size, "bytes")
      console.log("🔵 [FRONTEND] Blob type:", blob.type)

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit', // Don't send credentials
      })

      console.log("🔵 [FRONTEND] Response status:", response.status)
      console.log("🔵 [FRONTEND] Response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ [FRONTEND] Response error:", errorText)
        throw new Error(`Backend error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log("✅ [FRONTEND] Backend response:", JSON.stringify(result, null, 2))
      console.log("✅ [FRONTEND] Prediction:", result.prediction)
      console.log("✅ [FRONTEND] Confidence:", result.confidence)
      console.log("=".repeat(60))
      
      setAutoMockMode(false)
      setError(null) // Clear any previous errors
      return result
    } catch (err: any) {
      console.error("❌ [FRONTEND] Backend call failed:", err)
      console.error("❌ [FRONTEND] Error name:", err.name)
      console.error("❌ [FRONTEND] Error message:", err.message)
      
      // Set informative error message based on error type
      if (err.message === 'Failed to fetch') {
        setError(`❌ Tidak dapat terhubung ke backend di ${API_URL}. Pastikan:
1. Backend running di ${API_URL}
2. CORS enabled di backend
3. Tidak ada firewall blocking`)
        console.log("💡 [FRONTEND] Hint: Check if backend is running with: curl " + API_URL + "/health")
      } else {
        setError(`❌ Backend error: ${err.message}`)
      }
      
      console.log("⚠️ [FRONTEND] Switching to mock mode")
      console.log("=".repeat(60))
      setAutoMockMode(true)
      return null
    }
  }

  // =====================================================================
  //  CAMERA HANDLING
  // =====================================================================

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    setStream(null)
    setIsCameraActive(false)
  }

  // =====================================================================
  //  FILE UPLOAD HANDLER
  // =====================================================================

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file gambar (JPG, PNG, WebP)")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string)
      setCurrentDetection(null)
    }
    reader.readAsDataURL(file)
  }

  // =====================================================================
  //  DETEKSI DARI UPLOAD
  // =====================================================================

  const detectFromUpload = async () => {
    if (!uploadedImage) return

    setIsDetecting(true)
    setError(null)
    
    // IMPORTANT: Reset autoMockMode setiap kali deteksi baru
    // Beri backend kesempatan untuk dicoba lagi
    if (!useMockMode) {
      setAutoMockMode(false)
    }

    console.log("🟢 [UPLOAD] Starting detection...")
    console.log("🟢 [UPLOAD] Use Mock Mode:", useMockMode)
    console.log("🟢 [UPLOAD] Auto Mock Mode (before):", autoMockMode)

    try {
      const imgResp = await fetch(uploadedImage)
      const blob = await imgResp.blob()
      console.log("🟢 [UPLOAD] Image blob ready, size:", blob.size)

      let result: any
      
      if (useMockMode) {
        console.log("⚠️ [UPLOAD] Using MANUAL MOCK mode (user enabled)")
        result = getMockDetection()
        console.log("⚠️ [UPLOAD] Mock result:", result)
      } else {
        console.log("🔵 [UPLOAD] Calling REAL backend...")
        const backendResult = await tryDetectWithBackend(blob)
        
        if (backendResult) {
          console.log("✅ [UPLOAD] Backend returned result:", backendResult)
          result = backendResult
        } else {
          console.log("⚠️ [UPLOAD] Backend failed, using AUTO mock")
          result = getMockDetection()
        }
      }

      console.log("📊 [UPLOAD] Final result to display:")
      console.log("   - Prediction:", result.prediction)
      console.log("   - Confidence:", result.confidence)
      console.log("   - All predictions:", result.all_predictions)

      const det = buildDetectionResult(
        result.prediction,
        result.confidence,
        uploadedImage,
        result.all_predictions,
      )

      console.log("📊 [UPLOAD] Detection result built:", det)

      setDetectionHistory((prev) => [det, ...prev].slice(0, 10))
      setCurrentDetection(`${result.prediction} (${result.confidence.toFixed(0)}%)`)
      
      console.log("✅ [UPLOAD] Detection completed successfully")
    } catch (err) {
      console.error("❌ [UPLOAD] Error:", err)
      setError("Deteksi gagal. Menggunakan mock mode untuk testing...")
      setAutoMockMode(true)

      const mock = getMockDetection()
      const det = buildDetectionResult(mock.prediction, mock.confidence, uploadedImage, mock.all_predictions)

      setDetectionHistory((prev) => [det, ...prev].slice(0, 10))
      setCurrentDetection(`${mock.prediction} (${mock.confidence.toFixed(0)}%)`)
    } finally {
      setIsDetecting(false)
    }
  }

  // =====================================================================
  //  CAPTURE & DETECT (CAMERA)
  // =====================================================================

  const captureAndDetect = async (isRealTime = false) => {
    if (!videoRef.current || !canvasRef.current) return

    if (isRealTime && isDetecting) {
      // Hindari overlap call saat realtime
      return
    }

    setIsDetecting(true)
    if (!isRealTime) {
      setError(null)
      // Reset autoMockMode untuk non-realtime capture
      if (!useMockMode) {
        setAutoMockMode(false)
      }
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) {
      if (!isRealTime) setError("Gagal mengakses canvas")
      setIsDetecting(false)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.save()
    context.scale(-1, 1)
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    context.restore()

    canvas.toBlob(async (blob) => {
      if (!blob) {
        if (!isRealTime) setError("Gagal mengambil gambar dari kamera")
        setIsDetecting(false)
        return
      }

      try {
        let result: any
        if (useMockMode) {
          console.log("⚠️ [CAMERA] Using MANUAL MOCK mode")
          result = getMockDetection()
        } else {
          console.log("🔵 [CAMERA] Calling REAL backend...")
          const backendResult = await tryDetectWithBackend(blob)
          result = backendResult || getMockDetection()
        }

        const imageData = canvas.toDataURL("image/jpeg")
        setCurrentDetection(`${result.prediction} (${result.confidence.toFixed(0)}%)`)

        if (!isRealTime) {
          const det = buildDetectionResult(
            result.prediction,
            result.confidence,
            imageData,
            result.all_predictions,
          )
          setDetectionHistory((prev) => [det, ...prev].slice(0, 10))
        }
      } catch (err) {
        console.error("[camera] Error:", err)
        if (!isRealTime) {
          setError("Deteksi gagal. Menggunakan mock mode...")
          setAutoMockMode(true)
        }
      } finally {
        setIsDetecting(false)
      }
    }, "image/jpeg")
  }

  const startRealTimeDetection = () => {
    if (!isCameraActive) return
    setIsRealTimeDetection(true)
    setCurrentDetection(null)
    setError(null)

    // deteksi awal
    captureAndDetect(true)

    detectionIntervalRef.current = setInterval(() => {
      captureAndDetect(true)
    }, 1500)
  }

  const stopRealTimeDetection = () => {
    setIsRealTimeDetection(false)
    setCurrentDetection(null)

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }

  const saveCurrentDetection = () => {
    if (!videoRef.current || !canvasRef.current || !currentDetection) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.save()
    context.scale(-1, 1)
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    context.restore()

    const imageData = canvas.toDataURL("image/jpeg")

    const [rawLabel, confidenceStr] = currentDetection.split(" (")
    const confidencePercentage = Number.parseInt(confidenceStr.replace("%)", ""))
    const confidence = confidencePercentage / 100 // Convert ke desimal

    const result: DetectionResult = {
      id: Date.now().toString(),
      label: formatMainLabel(rawLabel),
      confidence,
      timestamp: new Date().toLocaleString("id-ID"),
      imageData,
    }

    setDetectionHistory((prev) => [result, ...prev].slice(0, 10))
  }

  // =====================================================================
  //  EFFECTS
  // =====================================================================

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [stream])

  useEffect(() => {
    if (detectionMode === "upload" && isCameraActive) {
      stopCamera()
      stopRealTimeDetection()
    }
  }, [detectionMode])

  useEffect(() => {
    if (!isCameraActive && isRealTimeDetection) {
      stopRealTimeDetection()
    }
  }, [isCameraActive])

  // Jika modelType berubah, reset currentDetection (agar label lama tidak misleading)
  useEffect(() => {
    setCurrentDetection(null)
  }, [modelType])

  // =====================================================================
  //  UI
  // =====================================================================

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Deteksi Bahasa Isyarat SIBI</h1>
          <p className="text-gray-600">Pilih metode deteksi dan jenis model (huruf atau kata)</p>

          {/* MODE SELECTION: CAMERA vs UPLOAD */}
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-md border border-gray-200">
              <button
                onClick={() => {
                  setDetectionMode("camera")
                  stopCamera()
                  stopRealTimeDetection()
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  detectionMode === "camera" ? "bg-teal-500 text-white shadow-lg" : "text-gray-700 hover:text-gray-900"
                }`}
              >
                <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Kamera Real-time
              </button>
              <button
                onClick={() => {
                  setDetectionMode("upload")
                  stopCamera()
                  stopRealTimeDetection()
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  detectionMode === "upload" ? "bg-teal-500 text-white shadow-lg" : "text-gray-700 hover:text-gray-900"
                }`}
              >
                <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload File
              </button>
            </div>
          </div>

          {/* MODEL SELECTION: LETTERS vs WORDS */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setModelType("letters")}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  modelType === "letters"
                    ? "bg-indigo-500 text-white shadow"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                Huruf (A–Z)
              </button>
              <button
                onClick={() => setModelType("words")}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  modelType === "words"
                    ? "bg-indigo-500 text-white shadow"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                Kata (102 Kata)
              </button>
            </div>
          </div>

          {/* MOCK MODE SWITCH */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {/* Backend Status Indicator */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              backendStatus === 'online' ? 'bg-green-50 border-green-200' :
              backendStatus === 'offline' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500' :
                backendStatus === 'offline' ? 'bg-red-500' :
                'bg-gray-400'
              } ${backendStatus === 'online' ? 'animate-pulse' : ''}`} />
              <span className={`text-xs font-medium ${
                backendStatus === 'online' ? 'text-green-700' :
                backendStatus === 'offline' ? 'text-red-700' :
                'text-gray-700'
              }`}>
                Backend: {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
              </span>
              <button
                onClick={checkBackendHealth}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-1"
                title="Check backend health"
              >
                ↻
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <input
                type="checkbox"
                checked={useMockMode}
                onChange={(e) => {
                  setUseMockMode(e.target.checked)
                  console.log("🔧 Manual Mock Mode:", e.target.checked ? "ENABLED" : "DISABLED")
                }}
                className="w-4 h-4 text-teal-500 rounded"
              />
              <span className="text-sm text-gray-700">Manual Mock Mode (Demo)</span>
            </label>
            {autoMockMode && (
              <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-yellow-700 text-sm font-medium">Backend gagal sebelumnya - Mode Demo Aktif</span>
                <button
                  onClick={() => {
                    setAutoMockMode(false)
                    setError(null)
                    checkBackendHealth()
                    console.log("🔄 Auto Mock Mode DISABLED - Will try real backend on next detection")
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium px-3 py-1 rounded transition-colors"
                >
                  Reset & Coba Backend Lagi
                </button>
              </div>
            )}
            {!useMockMode && !autoMockMode && backendStatus === 'online' && (
              <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-700 text-sm font-medium">Backend Aktif - Mode Real Detection</span>
              </div>
            )}
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-6 max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium mb-2">Error Koneksi Backend</p>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono bg-red-100 p-2 rounded">{error}</pre>
                  
                  <div className="mt-3 p-3 bg-white rounded border border-red-200">
                    <p className="text-xs font-semibold text-red-900 mb-2">🔧 Troubleshooting:</p>
                    <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                      <li>Pastikan backend FastAPI running di <code className="bg-red-100 px-1 rounded">{API_URL}</code></li>
                      <li>Test backend: buka <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{API_URL}/docs</a> di browser</li>
                      <li>Atau test via terminal: <code className="bg-red-100 px-1 rounded">curl {API_URL}/health</code></li>
                      <li>Jika backend di port lain, set <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> di .env.local</li>
                    </ul>
                  </div>
                </div>
                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: CAMERA / UPLOAD */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {detectionMode === "camera" ? "Kamera Real-time" : "Upload Foto Isyarat"}
              </h2>

              {detectionMode === "camera" ? (
                <>
                  {/* CAMERA VIEW */}
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video mb-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className={`w-full h-full object-cover ${!isCameraActive ? "hidden" : ""}`}
                      style={{ transform: "scaleX(-1)" }}
                    />
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <svg
                          className="w-16 h-16 mb-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-gray-400">Kamera belum aktif</p>
                      </div>
                    )}

                    {isCameraActive && isRealTimeDetection && currentDetection && (
                      <div className="absolute top-4 left-4 right-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-white/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium opacity-90">Terdeteksi:</p>
                            <p className="text-2xl font-bold">{currentDetection}</p>
                          </div>
                          <div className="animate-pulse">
                            <div className="w-3 h-3 bg-white rounded-full" />
                          </div>
                        </div>
                      </div>
                    )}

                    {isCameraActive && isRealTimeDetection && (
                      <div className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                        <span className="animate-pulse">●</span>
                        LIVE DETECTION
                      </div>
                    )}
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  {/* CAMERA CONTROLS */}
                  <div className="flex gap-3 mb-3">
                    {!isCameraActive ? (
                      <button
                        onClick={startCamera}
                        className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.763a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Aktifkan Kamera
                      </button>
                    ) : (
                      <>
                        {!isRealTimeDetection ? (
                          <button
                            onClick={startRealTimeDetection}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Mulai Deteksi Live
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={stopRealTimeDetection}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                                />
                              </svg>
                              Stop Deteksi
                            </button>
                            {currentDetection && (
                              <button
                                onClick={saveCurrentDetection}
                                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                  />
                                </svg>
                                Simpan ke Riwayat
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={stopCamera}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
                        >
                          Matikan
                        </button>
                      </>
                    )}
                  </div>

                  {isCameraActive && !isRealTimeDetection && (
                    <button
                      onClick={() => captureAndDetect(false)}
                      disabled={isDetecting}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {isDetecting ? "Mendeteksi..." : "Ambil Foto & Deteksi"}
                    </button>
                  )}

                  <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-teal-800">
                        <p className="font-semibold mb-1">Cara Penggunaan:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Klik "Aktifkan Kamera" untuk memulai.</li>
                          <li>Pilih model: Huruf (A–Z) atau Kata (102 SIBI).</li>
                          <li>Klik "Mulai Deteksi Live" untuk deteksi berulang.</li>
                          <li>Posisikan tangan Anda dengan isyarat SIBI di depan kamera.</li>
                          <li>Gunakan "Simpan ke Riwayat" untuk menyimpan hasil terbaik.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* UPLOAD VIEW */}
                  <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video mb-4 border-2 border-dashed border-gray-300">
                    {uploadedImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded"
                          className="w-full h-full object-contain"
                        />
                        {isDetecting && (
                          <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                            <div className="bg-white px-6 py-3 rounded-full shadow-lg">
                              <span className="text-teal-600 font-semibold">Mendeteksi...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <svg
                          className="w-16 h-16 mb-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        <p className="text-gray-500 text-center mb-2">Drag & drop atau klik untuk upload</p>
                        <p className="text-gray-400 text-sm">Didukung: JPG, PNG, WebP (maks 5MB)</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      {uploadedImage ? "Pilih Foto Lain" : "Pilih Foto"}
                    </button>
                    {uploadedImage && (
                      <button
                        onClick={detectFromUpload}
                        disabled={isDetecting}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        {isDetecting ? "Mendeteksi..." : "Deteksi Isyarat"}
                      </button>
                    )}
                  </div>

                  {uploadedImage && (
                    <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-teal-900">Hasil Deteksi:</p>
                          {(useMockMode || autoMockMode) && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                              DEMO MODE
                            </span>
                          )}
                          {!useMockMode && !autoMockMode && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              REAL BACKEND
                            </span>
                          )}
                        </div>
                        {currentDetection ? (
                          <div className="bg-white rounded-lg p-3 border-2 border-teal-500">
                            <p className="text-lg font-bold text-teal-600">{currentDetection}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-teal-700">Hasil akan ditampilkan di sini setelah deteksi</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-teal-800">
                        <p className="font-semibold mb-1">Cara Penggunaan:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Klik "Pilih Foto" atau drag & drop gambar ke area upload.</li>
                          <li>Pilih model: Huruf (A–Z) atau Kata (102 SIBI).</li>
                          <li>Pastikan gambar menampilkan isyarat SIBI dengan jelas.</li>
                          <li>Klik "Deteksi Isyarat" untuk memulai analisis.</li>
                          <li>Lihat hasil di panel hasil & riwayat di sebelah kanan.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT: HISTORY */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-bold text-gray-900">Riwayat Deteksi</h2>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {detectionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-12 h-12 text-gray-300 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-500 text-sm">Belum ada riwayat deteksi</p>
                  </div>
                ) : (
                  detectionHistory.map((result) => (
                    <div
                      key={result.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-teal-300 transition-all"
                    >
                      <div className="flex gap-3">
                        <img
                          src={result.imageData || "/placeholder.svg"}
                          alt="Captured"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 mb-1">{result.label}</div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-teal-500 h-2 rounded-full"
                                style={{ width: `${result.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-teal-600">
                              {(result.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{result.timestamp}</div>

                          {result.allPredictions && result.allPredictions.length > 1 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-1">Alternatif lain:</p>
                              <div className="space-y-1">
                                {result.allPredictions?.slice(1, 3).map((pred: { letter: string; confidence: number }, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-600">{pred.letter}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-1">
                                      <div
                                        className="bg-gray-400 h-1 rounded-full"
                                        style={{ width: `${pred.confidence * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-gray-500">
                                      {pred.confidence != null ? (pred.confidence * 100).toFixed(0) : "-"}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {detectionHistory.length > 0 && (
                <button
                  onClick={() => setDetectionHistory([])}
                  className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Hapus Semua Riwayat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}