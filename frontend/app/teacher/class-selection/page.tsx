"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BookOpen, Lock, Sparkles, Users, Code, FileQuestion, ArrowRight, Loader2, Fingerprint } from "lucide-react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;


export default function TeacherClassSelectionPage() {
  const router = useRouter()
  const [className, setClassName] = useState("")
  const [classPassword, setClassPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  useEffect(() => {
    if (!token) return
    const checkStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/classrooms/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.classroom_id) {
          router.replace("/teacher/dashboard")
        }
      } catch { /* silent */ }
    }
    checkStatus()
  }, [router, token])

  const handleCreateClass = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/classrooms/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ room_name: className, password: classPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to create classroom")
      router.push("/teacher/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F4F7] text-[#111111] antialiased flex flex-col items-center justify-center p-6">
      {/* Subtle Grainy Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.012] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="w-full max-w-2xl z-10 space-y-10">
        
        {/* Welcome Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black shadow-2xl mb-2 rotate-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Welcome to Kaksha <span className="text-indigo-600">Saathi</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-black/30">
              Create and manage your classroom
            </p>
          </div>
        </div>

        <Card className="bg-white border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden">
          <div className="p-10 border-b border-black/[0.03] bg-[#FBFBFC] flex flex-col items-center text-center space-y-4">
             <div className="w-12 h-12 bg-black/[0.03] rounded-2xl flex items-center justify-center border border-black/[0.05]">
                <BookOpen className="w-6 h-6 text-black/60" strokeWidth={1.5} />
             </div>
             <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">Create Your Classroom</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-black/30 mt-1">Set up your virtual learning space</p>
             </div>
          </div>

          <CardContent className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Class Name Input */}
              <div className="space-y-2">
                <Label htmlFor="className" className="text-[10px] uppercase tracking-widest text-black/40 font-black ml-1">
                  Class Name
                </Label>
                <div className="relative">
                  <Input
                    id="className"
                    placeholder="e.g., Computer Science 101"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="h-14 bg-[#F4F4F7] border-none rounded-2xl pl-12 focus-visible:ring-1 focus-visible:ring-black font-medium"
                  />
                  <Users className="absolute left-4 top-4.5 w-4 h-4 text-black/20" />
                </div>
              </div>

              {/* Class Password Input */}
              <div className="space-y-2">
                <Label htmlFor="classPassword" className="text-[10px] uppercase tracking-widest text-black/40 font-black ml-1">
                  Class Password
                </Label>
                <div className="relative">
                  <Input
                    id="classPassword"
                    type="password"
                    placeholder="Create a secure password"
                    value={classPassword}
                    onChange={(e) => setClassPassword(e.target.value)}
                    className="h-14 bg-[#F4F4F7] border-none rounded-2xl pl-12 focus-visible:ring-1 focus-visible:ring-black font-medium"
                  />
                  <Lock className="absolute left-4 top-4.5 w-4 h-4 text-black/20" />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 animate-in zoom-in-95">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_red]" />
                <p className="text-[10px] font-black uppercase tracking-tight text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={handleCreateClass}
              disabled={loading || !className || !classPassword}
              className={`w-full h-16 rounded-[2rem] text-[11px] uppercase font-black tracking-[0.2em] transition-all duration-500 ${
                className && classPassword 
                ? "bg-black text-white shadow-2xl hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:translate-y-[-2px]" 
                : "bg-black/5 text-black/20"
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Create Classroom <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            {/* Quick Actions */}
            <div className="pt-10 border-t border-black/[0.03] space-y-6">
              <p className="text-[10px] font-black uppercase text-black/20 tracking-[0.3em] text-center">Quick Actions</p>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton 
                  label="My Quizzes" 
                  icon={FileQuestion} 
                  color="text-blue-600" 
                  onClick={() => router.push("/teacher/quiz-creation")} 
                />
                <QuickActionButton 
                  label="My Contests" 
                  icon={Code} 
                  color="text-emerald-600" 
                  onClick={() => router.push("/teacher/contest-creation")} 
                />
              </div>
              <p className="text-[9px] text-center text-black/30 font-bold uppercase tracking-widest leading-loose">
                Manage your quizzes and contests before creating a class
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function QuickActionButton({ label, icon: Icon, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="h-32 bg-[#FBFBFC] border border-black/[0.03] rounded-[2.5rem] flex flex-col items-center justify-center gap-3 group transition-all hover:bg-white hover:shadow-xl hover:translate-y-[-4px]"
    >
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/[0.02] group-hover:scale-110 transition-transform duration-500">
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-black/60">{label}</span>
    </button>
  )
}