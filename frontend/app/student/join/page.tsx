"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, Lock, Hash, Loader2, ShieldCheck } from "lucide-react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;


export default function StudentJoinPage() {
  const router = useRouter()
  const [classCode, setClassCode] = useState("")
  const [classPassword, setClassPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem("access_token")
      if (!token) return
      try {
        const res = await fetch(`${BACKEND_URL}/classrooms/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok && data.current_classroom_id !== null) {
          setInfoMessage("Active session detected. Redirecting...")
          setTimeout(() => router.push("/student/dashboard"), 1200)
        }
      } catch (e) { /* silent fail */ }
    }
    checkStatus()
  }, [router])

  const handleJoinClass = async () => {
    if (!classCode || !classPassword) return
    const token = localStorage.getItem("access_token")
    if (!token) { setError("Authentication required."); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/classrooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ room_code: classCode, password: classPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Invalid Credentials")
      router.push("/student/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#F4F4F7] text-[#111111] antialiased">
      {/* Subtle Grainy Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.012] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="w-full max-w-[420px] z-10 space-y-10">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black shadow-xl mb-2">
            <Users className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">
            Portal <span className="text-indigo-600">Entry</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-black/30">
            Secure Classroom Access
          </p>
        </div>

        <Card className="bg-white border-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-10 space-y-8">
            
            {/* Redirecting/Success Notification */}
            {infoMessage && (
              <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-2 duration-500">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <p className="text-[11px] font-bold uppercase tracking-tight text-indigo-600">{infoMessage}</p>
              </div>
            )}

            <div className="space-y-7">
              {/* Class Code */}
              <div className="relative group">
                <Label htmlFor="classCode" className="text-[10px] uppercase tracking-widest text-black/40 mb-2 block ml-1 font-bold">
                  Classroom Token
                </Label>
                <div className="relative">
                  <Input
                    id="classCode"
                    placeholder="0 0 0 0 0 0"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="h-14 bg-[#F4F4F7] border-none rounded-2xl text-center text-xl font-mono tracking-[0.4em] focus-visible:ring-1 focus-visible:ring-black transition-all"
                  />
                  <Hash className="absolute right-4 top-5 w-4 h-4 text-black/10" />
                </div>
              </div>

              {/* Password */}
              <div className="relative group">
                <Label htmlFor="classPassword" className="text-[10px] uppercase tracking-widest text-black/40 mb-2 block ml-1 font-bold">
                  Access Key
                </Label>
                <div className="relative">
                  <Input
                    id="classPassword"
                    type="password"
                    placeholder="••••••••"
                    value={classPassword}
                    onChange={(e) => setClassPassword(e.target.value)}
                    className="h-14 bg-[#F4F4F7] border-none rounded-2xl pl-5 text-md focus-visible:ring-1 focus-visible:ring-black transition-all"
                  />
                  <Lock className="absolute right-4 top-5 w-4 h-4 text-black/10" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 animate-in zoom-in-95">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <p className="text-[11px] font-bold uppercase tracking-tight text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={handleJoinClass}
              disabled={loading || !classCode || !classPassword}
              className={`w-full h-14 rounded-2xl text-[11px] uppercase font-bold tracking-[0.2em] transition-all duration-500 ${
                classCode && classPassword 
                ? "bg-black text-white shadow-xl hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:translate-y-[-2px]" 
                : "bg-black/5 text-black/20"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Authorize Entry <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Guidance Section */}
        <div className="px-2">
          <div className="p-6 bg-white rounded-[2rem] border border-black/[0.03] shadow-sm space-y-3">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse" />
                <p className="text-[9px] font-black uppercase text-black/30 tracking-widest">System Guidance</p>
             </div>
             <p className="text-[11px] text-black/60 leading-relaxed font-medium">
               Tokens are 6-digit alphanumeric strings provided by instructors. Keys are case-sensitive.
             </p>
          </div>
        </div>
      </div>
    </main>
  )
}