"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { DetectionResult } from "@/types/DetectionResult" // Adjust the import path as necessary

export default function DeteksiContent() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [detectionMode, setDetectionMode] = useState<"camera" | "upload">("camera")
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsCameraActive(false)
    }
  }

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
    }
    reader.readAsDataURL(file)
  }

  const getMockDetection = () => {
    const mockLetters = ["A", "B", "C", "D", "E", "I", "L", "M", "N", "O", "P", "R", "S", "T", "U", "V", "W", "Y"]
    const randomLetter = mockLetters[Math.floor(Math.random() * mockLetters.length)]
    const confidence = 75 + Math.random() * 20 // 75-95%

    return {
      prediction: randomLetter,
      confidence: confidence,
      all_predictions: [
        { letter: randomLetter, confidence: confidence },
        { letter: mockLetters[Math.floor(Math.random() * mockLetters.length)], confidence: confidence - 15 },
        { letter: mockLetters[Math.floor(Math.random() * mockLetters.length)], confidence: confidence - 30 },
      ],
    }
  }

  const tryDetectWithBackend = async (blob: Blob, isRealTime: boolean): Promise<any | null> => {
    try {
      const formData = new FormData()
      formData.append("file", blob, "capture.jpg")

      console.log("[v0] Trying to reach backend at:", `${API_URL}/api/detect`)

      const response = await fetch(`${API_URL}/api/detect`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Backend detection successful:", result)
      setAutoMockMode(false)
      return result
    } catch (err) {
      console.warn("[v0] Backend failed, switching to mock mode:", err)
      setAutoMockMode(true)
      return null
    }
  }

  const detectFromUpload = async () => {
    if (!uploadedImage) return

    setIsDetecting(true)
    setError(null)

    console.log("[v0] Starting detection from upload")

    try {
      if (useMockMode || autoMockMode) {
        console.log("[v0] Using mock mode for upload")
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay
        const result = getMockDetection()

        const detectionResult: DetectionResult = {
          id: Date.now().toString(),
          label: `Huruf ${result.prediction}`,
          confidence: result.confidence / 100,
          timestamp: new Date().toLocaleString("id-ID"),
          imageData: uploadedImage,
          allPredictions: result.all_predictions,
        }

        setDetectionHistory((prev) => [detectionResult, ...prev].slice(0, 10))
        setCurrentDetection(`${result.prediction} (${result.confidence.toFixed(0)}%)`)
        setIsDetecting(false)
        return
      }

      const response = await fetch(uploadedImage)
      const blob = await response.blob()

      console.log("[v0] Blob size:", blob.size, "bytes")

      const result = await tryDetectWithBackend(blob, false)

      if (!result) {
        console.log("[v0] Backend failed, using mock result")
        const mockResult = getMockDetection()
        const detectionResult: DetectionResult = {
          id: Date.now().toString(),
          label: `Huruf ${mockResult.prediction}`,
          confidence: mockResult.confidence / 100,
          timestamp: new Date().toLocaleString("id-ID"),
          imageData: uploadedImage,
          allPredictions: mockResult.all_predictions,
        }

        setDetectionHistory((prev) => [detectionResult, ...prev].slice(0, 10))
        setCurrentDetection(`${mockResult.prediction} (${mockResult.confidence.toFixed(0)}%)`)
        setIsDetecting(false)
        return
      }

      const detectionResult: DetectionResult = {
        id: Date.now().toString(),
        label: `Huruf ${result.prediction}`,
        confidence: result.confidence / 100,
        timestamp: new Date().toLocaleString("id-ID"),
        imageData: uploadedImage,
        allPredictions: result.all_predictions,
      }

      setDetectionHistory((prev) => [detectionResult, ...prev].slice(0, 10))
      setCurrentDetection(`${result.prediction} (${result.confidence.toFixed(0)}%)`)
      setIsDetecting(false)
    } catch (err) {
      console.error("[v0] Error detecting from upload:", err)
      setError("Deteksi gagal. Menggunakan mock mode untuk testing...")
      setAutoMockMode(true)

      const mockResult = getMockDetection()
      const detectionResult: DetectionResult = {
        id: Date.now().toString(),
        label: `Huruf ${mockResult.prediction}`,
        confidence: mockResult.confidence / 100,
        timestamp: new Date().toLocaleString("id-ID"),
        imageData: uploadedImage,
        allPredictions: mockResult.all_predictions,
      }

      setDetectionHistory((prev) => [detectionResult, ...prev].slice(0, 10))
      setCurrentDetection(`${mockResult.prediction} (${mockResult.confidence.toFixed(0)}%)`)
      setIsDetecting(false)
    }
  }

  const captureAndDetect = async (isRealTime = false) => {
    if (!videoRef.current || !canvasRef.current) return

    if (isRealTime && isDetecting) {
      console.log("[v0] Skipping detection - already in progress")
      return
    }

    console.log("[v0] Starting capture and detect, isRealTime:", isRealTime)

    setIsDetecting(true)
    if (!isRealTime) {
      setError(null)
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      context.save()
      context.scale(-1, 1)
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      context.restore()

      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error("[v0] Failed to create blob from canvas")
          if (!isRealTime) {
            setError("Gagal mengambil gambar dari kamera")
          }
          setIsDetecting(false)
          return
        }

        try {
          let result = await tryDetectWithBackend(blob, isRealTime)

          if (!result) {
            result = getMockDetection()
          }

          const imageData = canvas.toDataURL("image/jpeg")

          setCurrentDetection(`${result.prediction} (${result.confidence.toFixed(0)}%)`)

          if (!isRealTime) {
            const detectionResult: DetectionResult = {
              id: Date.now().toString(),
              label: `Huruf ${result.prediction}`,
              confidence: result.confidence / 100,
              timestamp: new Date().toLocaleString("id-ID"),
              imageData: imageData,
              allPredictions: result.all_predictions,
            }

            setDetectionHistory((prev) => [detectionResult, ...prev].slice(0, 10))
          }

          setIsDetecting(false)
        } catch (err) {
          console.error("[v0] Error detecting:", err)
          if (!isRealTime) {
            setError("Deteksi gagal. Menggunakan mock mode...")
            setAutoMockMode(true)
          } else {
            console.error("[v0] Real-time detection error (silent):", err)
          }
          setIsDetecting(false)
        }
      }, "image/jpeg")
    }
  }

  const startRealTimeDetection = () => {
    console.log("[v0] Starting real-time detection")
    setIsRealTimeDetection(true)
    setCurrentDetection(null)
    setError(null)

    captureAndDetect(true)

    detectionIntervalRef.current = setInterval(() => {
      console.log("[v0] Running periodic detection")
      captureAndDetect(true)
    }, 1500)
  }

  const stopRealTimeDetection = () => {
    console.log("[v0] Stopping real-time detection")
    setIsRealTimeDetection(false)
    setCurrentDetection(null)

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }

  const saveCurrentDetection = async () => {
    if (!videoRef.current || !canvasRef.current || !currentDetection) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      context.save()
      context.scale(-1, 1)
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      context.restore()

      const imageData = canvas.toDataURL("image/jpeg")

      const [label, confidenceStr] = currentDetection.split(" (")
      const confidence = Number.parseInt(confidenceStr.replace("%)", "")) / 100

      const detectionResult: DetectionResult = {
        id: Date.now().toString(),
        label: `Huruf ${label}`,
        confidence: confidence,
        timestamp: new Date().toLocaleString("id-ID"),
        imageData: imageData,
      }

      setDetectionHistory((prev) => [detectionResult, ...prev].slice(0, 10))
    }
  }

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
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

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Deteksi Bahasa Isyarat SIBI</h1>
          <p className="text-gray-600">Pilih metode deteksi: kamera real-time atau upload file gambar</p>

          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap mb-6">
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

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <input
                type="checkbox"
                checked={useMockMode}
                onChange={(e) => setUseMockMode(e.target.checked)}
                className="w-4 h-4 text-teal-500 rounded"
              />
              <span className="text-sm text-gray-700">Manual Mock Mode</span>
            </label>
            {autoMockMode && (
              <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200 flex items-center gap-2">
                <span className="text-yellow-700 text-sm font-medium">Backend tidak tersedia - Mode Demo Aktif</span>
                <button
                  onClick={() => setAutoMockMode(false)}
                  className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
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
                <p className="text-sm text-red-800 font-medium">Info</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {detectionMode === "camera" ? "Kamera Real-time" : "Upload Foto Isyarat"}
              </h2>

              {detectionMode === "camera" ? (
                <>
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
                            <div className="w-3 h-3 bg-white rounded-full"></div>
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
                          <li>Klik tombol "Aktifkan Kamera" untuk memulai</li>
                          <li>Klik "Mulai Deteksi Live" untuk deteksi otomatis secara real-time</li>
                          <li>Posisikan tangan Anda dengan isyarat SIBI di depan kamera</li>
                          <li>Hasil akan muncul otomatis di layar setiap 1.5 detik</li>
                          <li>Klik "Simpan ke Riwayat" untuk menyimpan hasil deteksi</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                        <p className="text-sm font-semibold text-teal-900">Hasil Deteksi:</p>
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
                          <li>Klik "Pilih Foto" atau drag & drop gambar ke area upload</li>
                          <li>Pastikan gambar menampilkan isyarat SIBI dengan jelas</li>
                          <li>Klik "Deteksi Isyarat" untuk memulai analisis</li>
                          <li>Lihat hasil deteksi di panel riwayat</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

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
                                style={{
                                  width: `${result.confidence * 100}%`,
                                }}
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
                                {result.allPredictions.slice(1, 3).map((pred, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-600">{pred.letter}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-1">
                                      <div
                                        className="bg-gray-400 h-1 rounded-full"
                                        style={{ width: `${pred.confidence}%` }}
                                      />
                                    </div>
                                    <span className="text-gray-500">{pred.confidence.toFixed(0)}%</span>
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
