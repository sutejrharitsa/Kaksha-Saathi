"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  MessageCircle, 
  Trophy, 
  LogOut, 
  BookOpen, 
  Code, 
  Send, 
  Sparkles, 
  Zap, 
  Users, 
  Award,
  ChevronRight
} from "lucide-react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;


export default function StudentDashboard() {
  const router = useRouter()
  const [doubts, setDoubts] = useState<any[]>([])
  const [newDoubt, setNewDoubt] = useState("")
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [quizActive, setQuizActive] = useState(false)
  const [contestActive, setContestActive] = useState(false)
  const [classInfo, setClassInfo] = useState<{ room_code: string, teacher_name: string } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  const name = typeof window !== "undefined" ? localStorage.getItem("name") || "" : ""
  const email = typeof window !== "undefined" ? localStorage.getItem("email") || "" : ""

  // Fullscreen and tab-switching enforcement
  useEffect(() => {
    if (!token || !isFullscreen) return

    const leaveClassroom = async () => {
      try {
        await fetch(`${BACKEND_URL}/classrooms/leave`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (e) {
        console.error("Failed to leave classroom:", e)
      } finally {
        router.push("/")
      }
    }

    // Monitor fullscreen changes
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        leaveClassroom()
      }
    }

    // Monitor tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        leaveClassroom()
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [token, router, isFullscreen])

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } catch (e) {
      console.error("Failed to enter fullscreen:", e)
      alert("Please allow fullscreen mode to continue")
    }
  }

  useEffect(() => {
    if (!token) { router.push("/"); return }
    const headers = { Authorization: `Bearer ${token}` }
    const poll = async () => {
      try {
        const statusRes = await fetch(`${BACKEND_URL}/classrooms/status`, { headers })
        const statusData = await statusRes.json()
        if (!statusRes.ok || statusData.current_classroom_id === null) {
          router.push("/student/join"); return
        }
        setQuizActive(statusData.quiz_active)
        setContestActive(statusData.contest_active)

        const infoRes = await fetch(`${BACKEND_URL}/classrooms/info`, { headers })
        if (infoRes.ok) setClassInfo(await infoRes.json())

        const doubtsRes = await fetch(`${BACKEND_URL}/doubts`, { headers })
        if (doubtsRes.ok) {
          const d = await doubtsRes.json()
          setDoubts(d.doubts)
        }

        const lbRes = await fetch(`${BACKEND_URL}/classrooms/leaderboard/student`, { headers })
        if (lbRes.ok) {
          const l = await lbRes.json()
          setLeaderboard(l.leaderboard)
        }
      } catch (e) {}
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [router, token])

  const submitDoubt = async () => {
    if (!newDoubt.trim() || !token) return
    await fetch(`${BACKEND_URL}/doubts/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: newDoubt }),
    })
    setNewDoubt("")
  }

  const leaveClassroom = async () => {
    if (!token) return
    try {
      await fetch(`${BACKEND_URL}/classrooms/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (e) {
      console.error("Failed to leave classroom:", e)
    } finally {
      router.push("/")
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F4F7] text-[#111111] antialiased">
      {/* Fullscreen Entry Modal */}
      {!isFullscreen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-12 max-w-md text-center shadow-2xl">
            <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-3">Enter Fullscreen</h2>
            <p className="text-sm text-black/60 mb-8 leading-relaxed">
              To ensure a focused learning environment, you must enter fullscreen mode. 
              Exiting fullscreen or switching tabs will automatically remove you from the class.
            </p>
            <Button 
              onClick={enterFullscreen}
              className="w-full h-14 bg-black text-white rounded-xl font-bold uppercase text-sm tracking-widest hover:bg-black/90"
            >
              Enter Fullscreen & Continue
            </Button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="h-20 bg-white border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase">Kaksha Saathi</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-black/30">Student Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 border-r border-black/5 pr-8">
               <div className="text-right">
                  <p className="text-sm font-bold tracking-tight">{name}</p>
                  <p className="text-[10px] font-medium text-black/40">{email}</p>
               </div>
               <Avatar className="h-10 w-10 border shadow-md">
                  <AvatarFallback className="bg-black text-white text-xs font-bold uppercase">{name[0]}</AvatarFallback>
               </Avatar>
            </div>
            <Button
              variant="ghost"
              onClick={() => leaveClassroom()}
              className="text-destructive hover:bg-destructive/10 font-medium rounded-xl h-10 px-4"
            >
              <LogOut className="w-4 h-4 mr-2" /> Leave
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Doubts Column */}
        <div className="lg:col-span-4 flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex items-center gap-2 mb-4 px-2">
            <MessageCircle className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-black/40">Doubts</h2>
          </div>
          <Card className="flex-1 bg-white border-none shadow-xl rounded-[2rem] overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-6 bg-[#FBFBFC]">
              <div className="space-y-4">
                {doubts.map((d, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-black/[0.03] shadow-sm">
                    <div className="flex items-center gap-2 mb-2 font-bold text-[10px] text-indigo-600 uppercase tracking-tight">
                      {d.student_name}
                    </div>
                    <p className="text-sm font-medium text-black/80">{d.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-6 bg-white border-t">
              <div className="relative">
                <Input
                  placeholder="Type your doubt here..."
                  value={newDoubt}
                  onChange={(e) => setNewDoubt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitDoubt()}
                  className="h-14 bg-[#F4F4F7] border-none rounded-xl pr-14 focus-visible:ring-1 focus-visible:ring-black"
                />
                <button onClick={submitDoubt} className="absolute right-4 top-4 w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                  <Send className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Teacher Info Card (Bigger) */}
          <div className="p-10 bg-black rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden flex flex-col justify-end min-h-[280px]">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-pulse" />
                 <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Teacher Active</span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/30 mb-1">Teacher</p>
                <h2 className="text-4xl font-black tracking-tighter">{classInfo?.teacher_name || "..."}</h2>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <div>
                   <p className="text-[9px] uppercase font-bold text-white/20">Room Code</p>
                   <p className="font-mono text-xl font-bold tracking-widest">{classInfo?.room_code}</p>
                </div>
                <Users className="w-8 h-8 text-white/20" />
              </div>
            </div>
          </div>

          {/* Action Buttons (Smaller) */}
          <div className="space-y-4">
            <ActionTab 
              active={quizActive} 
              icon={BookOpen} 
              label="Take Quiz" 
              onClick={() => router.push("/student/quiz")} 
            />
            <ActionTab 
              active={contestActive} 
              icon={Code} 
              label="Take Contest" 
              onClick={() => router.push("/student/contest")} 
            />
          </div>
        </div>

        {/* Leaderboard Column */}
        <div className="lg:col-span-4 flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-black/40">Leaderboard</h2>
          </div>
          <Card className="flex-1 bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden flex flex-col p-4">
            <ScrollArea className="flex-1 px-2">
              <div className="space-y-2">
                {leaderboard.map((s, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                    idx === 0 ? 'bg-black text-white shadow-xl' : 'bg-[#FBFBFC]'
                  }`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black ${idx === 0 ? 'text-white/20' : 'text-black/10'}`}>0{idx + 1}</span>
                      <p className="font-black text-xs uppercase tracking-tight">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-bold ${idx === 0 ? 'text-white/40' : 'text-black/30'}`}>{s.score}</span>
                       {idx === 0 && <Award className="w-4 h-4 text-amber-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

      </div>
    </main>
  )
}

function ActionTab({ active, icon: Icon, label, onClick }: any) {
  return (
    <button
      disabled={!active}
      onClick={onClick}
      className={`group relative h-20 w-full rounded-[1.5rem] px-8 flex items-center justify-between transition-all duration-300 border-2 ${
        active 
        ? 'bg-white border-black/5 shadow-md hover:shadow-xl hover:translate-y-[-2px]' 
        : 'bg-gray-100 border-transparent opacity-40 grayscale cursor-not-allowed'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-black text-white' : 'bg-black/5 text-black/20'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-black uppercase tracking-widest">{label}</h3>
          <div className="flex items-center gap-2 mt-1">
             <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-black/10'}`} />
             <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-emerald-600' : 'text-black/20'}`}>
               {active ? 'Active Now' : 'Inactive'}
             </span>
          </div>
        </div>
      </div>
      <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${active ? 'text-black/20' : 'hidden'}`} />
    </button>
  )
}