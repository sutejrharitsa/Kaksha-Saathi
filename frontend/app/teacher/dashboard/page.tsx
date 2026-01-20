"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BookOpen,
  Code,
  PlayCircle,
  Trophy,
  Trash2,
  XCircle,
  MessageCircle,
  X,
  Users,
  Download,
  Sparkles,
  StopCircle,
  Eye,
  Award,
  AlertCircle,
  Activity,
  CheckCircle2,
  ChevronRight,
} from "lucide-react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;


export default function TeacherDashboard() {
  const router = useRouter()
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const [doubts, setDoubts] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [quizActive, setQuizActive] = useState(false)
  const [contestActive, setContestActive] = useState(false)
  const [quizExists, setQuizExists] = useState(false)
  const [contestExists, setContestExists] = useState(false)
  const [classInfo, setClassInfo] = useState<any>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [showSubmissions, setShowSubmissions] = useState(false)
  const [submissionsTitle, setSubmissionsTitle] = useState("")
  const [submissions, setSubmissions] = useState<any[]>([])

  
  // ---------------- POLLING (UNCHANGED) ----------------
  useEffect(() => {
    if (!token) {
      router.push("/")
      return
    }
    const headers = { Authorization: `Bearer ${token}` }
    const poll = async () => {
      try {
        const statusRes = await fetch(`${BACKEND_URL}/classrooms/status`, { headers })
        const statusData = await statusRes.json()

        if (!statusRes.ok) {
          setErrorMessage(statusData.detail || "Connection to server failed.")
          return
        }

        setQuizActive(statusData.quiz_active)
        setContestActive(statusData.contest_active)
        setQuizExists(statusData.quiz_exists ?? false)
        setContestExists(statusData.contest_exists ?? false)

        const infoRes = await fetch(`${BACKEND_URL}/classrooms/info`, { headers })
        if (infoRes.ok) setClassInfo(await infoRes.json())

        const doubtsRes = await fetch(`${BACKEND_URL}/doubts`, { headers })
        if (doubtsRes.ok) {
          const d = await doubtsRes.json()
          setDoubts(d.doubts)
        }

        const lbRes = await fetch(`${BACKEND_URL}/classrooms/leaderboard`, { headers })
        if (lbRes.ok) {
          const l = await lbRes.json()
          setLeaderboard(l.leaderboard)
        }
      } catch (err: any) {
        setErrorMessage("Network error: Server is unreachable.")
      }
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [router, token])

  // ---------------- HELPERS (UNCHANGED) ----------------
  const safePost = async (endpoint: string) => {
    setErrorMessage(null)
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.detail || "Operation failed")
      }
    } catch (err: any) {
      setErrorMessage("Request failed.")
    }
  }

  const safeDelete = async (endpoint: string) => {
    setErrorMessage(null)
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.detail || "Delete failed")
      } else {
        if (endpoint.includes("quiz")) setSuccessMessage("Quiz data has been deleted.")
        if (endpoint.includes("contest")) setSuccessMessage("Contest data has been deleted.")
        if (endpoint.includes("doubts")) setSuccessMessage("Doubts cleared.")
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: any) {
      setErrorMessage("Request failed.")
    }
  }

  const openSubmissions = async (type: "quiz" | "contest") => {
    setErrorMessage(null)
    try {
      const endpoint = type === "quiz" ? "/quizzes/submissions" : "/contests/submissions"
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.detail || "Failed to load submissions")
      } else {
        setSubmissions(data.submissions ?? data)
        setSubmissionsTitle(type === "quiz" ? "Quiz Submissions" : "Contest Submissions")
        setShowSubmissions(true)
      }
    } catch (err: any) {
      setErrorMessage("Network error.")
    }
  }

  const handleEndClass = async () => {
    setErrorMessage(null)
    try {
      const res = await fetch(`${BACKEND_URL}/classrooms/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        setErrorMessage(data.detail || "Failed to end class")
        return
      }
      localStorage.removeItem("access_token")
      router.push("/")
    } catch (e) {
      setErrorMessage("Network error.")
    }
  }

  const handleDownloadPDF = async () => {
    setErrorMessage(null)
    try {
      const res = await fetch(`${BACKEND_URL}/classrooms/leaderboard/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setErrorMessage("Failed to download PDF")
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "leaderboard.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      setErrorMessage("Download failed.")
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground antialiased relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* ERROR STATUS BAR */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] animate-in slide-in-from-top duration-300">
          <div className="glass bg-destructive/10 text-destructive border-destructive/20 px-6 py-4 rounded-2xl flex items-center justify-between shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="hover:bg-destructive/10 rounded-full p-1 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* SUCCESS NOTIFICATION */}
      {successMessage && (
        <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-8 duration-500">
          <div className="glass bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-xl">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">{successMessage}</span>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION */}
      <nav className="h-20 glass border-b border-white/40 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-primary">Kaksha Saathi</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Teacher Dashboard</p>
            </div>
          </div>
          {classInfo && (
            <div className="flex items-center gap-3 px-6 py-2 bg-primary/5 rounded-2xl border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_oklch(var(--primary))] animate-pulse" />
              <div className="text-left font-mono">
                <p className="text-[9px] text-primary/70 font-black uppercase">Room Code</p>
                <p className="text-lg font-bold tracking-tighter text-primary">{classInfo.room_code}</p>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden relative z-10">

        {/* LEFT COLUMN - Actions */}
        <div className="lg:col-span-4 space-y-6 flex flex-col h-full overflow-y-auto pr-2 pb-20">
          {/* Create Content Card */}
          <div className="glass rounded-[2rem] p-1 flex-shrink-0 hover:shadow-lg transition-all duration-300">
            <div className="p-6 border-b border-white/40">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Create Content
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <Button onClick={() => router.push("/teacher/quiz-creation")} className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-all shadow-md group">
                <span className="group-hover:translate-x-1 transition-transform inline-flex items-center">Make Quiz <ChevronRight className="w-3 h-3 ml-2 opacity-50" /></span>
              </Button>
              <Button onClick={() => router.push("/teacher/contest-creation")} className="w-full h-14 bg-white text-primary border border-primary/10 hover:bg-primary/5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-sm group">
                <span className="group-hover:translate-x-1 transition-transform inline-flex items-center">Make Contest <Code className="w-3 h-3 ml-2 opacity-50" /></span>
              </Button>
            </div>
          </div>

          {/* Control Panel Card */}
          <div className="glass rounded-[2rem] p-1 flex-shrink-0 hover:shadow-lg transition-all duration-300">
            <div className="p-6 border-b border-white/40">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" /> Control Panel
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <Button onClick={() => safePost(quizActive ? "/quizzes/deactivate" : "/quizzes/start")} className={`w-full h-14 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-sm ${quizActive
                  ? 'bg-accent/10 text-accent-foreground border border-accent/20 hover:bg-accent/20'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                }`}>
                {quizActive ? <><StopCircle className="w-4 h-4 mr-2" /> Deactivate Quiz</> : <><PlayCircle className="w-4 h-4 mr-2" /> Activate Quiz</>}
              </Button>
              <Button onClick={() => safePost(contestActive ? "/contests/deactivate" : "/contests/start")} className={`w-full h-14 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-sm ${contestActive
                  ? 'bg-accent/10 text-accent-foreground border border-accent/20 hover:bg-accent/20'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                }`}>
                {contestActive ? <><StopCircle className="w-4 h-4 mr-2" /> Deactivate Contest</> : <><PlayCircle className="w-4 h-4 mr-2" /> Activate Contest</>}
              </Button>
            </div>
          </div>

          {/* Manage Card */}
          <div className="glass rounded-[2rem] p-1 flex-shrink-0 hover:shadow-lg transition-all duration-300">
            <div className="p-6 border-b border-white/40">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" /> Manage Results
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" disabled={!quizActive} onClick={() => openSubmissions("quiz")} className="h-12 border rounded-xl font-bold uppercase text-[9px] hover:bg-background">View Quiz Submissions</Button>
                <Button variant="outline" disabled={!contestActive} onClick={() => openSubmissions("contest")} className="h-12 border rounded-xl font-bold uppercase text-[9px] hover:bg-background">View Contest Submissions</Button>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/5">
                <Button variant="ghost" onClick={() => safeDelete("/quizzes/delete")} className="h-12 rounded-xl font-bold uppercase text-[9px] text-destructive hover:bg-destructive/5 hover:text-destructive">Delete Quiz</Button>
                <Button variant="ghost" onClick={() => safeDelete("/contests/delete")} className="h-12 rounded-xl font-bold uppercase text-[9px] text-destructive hover:bg-destructive/5 hover:text-destructive">Delete Contest</Button>
              </div>
            </div>
          </div>

          <Button variant="destructive" onClick={handleEndClass} className="w-full h-16 bg-destructive text-destructive-foreground rounded-[2rem] font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all mt-auto flex-shrink-0">
            <XCircle className="w-5 h-5 mr-3" /> End Class Session
          </Button>
        </div>

        {/* MIDDLE COLUMN - Student Doubts */}
        <div className="lg:col-span-4 h-full flex flex-col min-h-0">
          <div className="glass rounded-[3rem] flex-1 flex flex-col overflow-hidden shadow-2xl relative group min-h-0 hover:-translate-y-1 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

            <div className="p-8 border-b border-white/40 flex flex-row items-center gap-4 flex-shrink-0 relative z-10">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm"><MessageCircle className="w-6 h-6" /></div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">Doubts</CardTitle>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">{doubts.length} Pending Questions</p>
              </div>
            </div>

            <div className="flex-1 min-h-0 relative z-10">
              <ScrollArea className="h-full w-full p-6">
                <div className="space-y-4 pb-4">
                    {doubts.map((d) => (
                    <div key={d.id} className="group p-5 bg-white/60 backdrop-blur-md rounded-[1.5rem] border border-white/60 hover:border-primary/30 hover:bg-white/80 transition-all flex justify-between items-start gap-3 shadow-sm">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary uppercase flex-shrink-0">
                            {d.student_name[0]}
                          </div>
                          <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider truncate min-w-0">{d.student_name}</p>
                        </div>
                        <p className="text-sm font-medium text-foreground/90 leading-relaxed pl-1 break-all">{d.content}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => safeDelete(`/doubts/${d.id}`)} className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  {doubts.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/30 gap-4">
                      <MessageCircle className="w-12 h-12 stroke-[1.5]" />
                      <p className="text-xs font-bold uppercase tracking-widest">No matching doubts</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="p-6 border-t border-white/40 flex-shrink-0 relative z-10 bg-white/30 backdrop-blur-xl">
              <Button variant="outline" onClick={() => safeDelete("/doubts")} disabled={!doubts.length} className="w-full h-12 border-destructive/20 text-destructive rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" /> Clear All Doubts
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Leaderboard */}
        <div className="lg:col-span-4 h-full flex flex-col min-h-0 space-y-6">
          <div className="glass rounded-[2.5rem] p-6 grid grid-cols-2 gap-4 flex-shrink-0 hover:shadow-lg transition-all duration-300">
            <div className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-colors ${quizActive ? 'bg-accent/5 border-accent/20' : 'bg-background/40 border-transparent'
              }`}>
              <div className={`w-3 h-3 rounded-full ${quizActive ? 'bg-accent shadow-[0_0_10px_oklch(var(--accent))] animate-pulse' : 'bg-muted-foreground/20'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${quizActive ? 'text-accent-foreground' : 'text-muted-foreground'}`}>Quiz Status</span>
            </div>
            <div className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-colors ${contestActive ? 'bg-accent/5 border-accent/20' : 'bg-background/40 border-transparent'
              }`}>
              <div className={`w-3 h-3 rounded-full ${contestActive ? 'bg-accent shadow-[0_0_10px_oklch(var(--accent))] animate-pulse' : 'bg-muted-foreground/20'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${contestActive ? 'text-accent-foreground' : 'text-muted-foreground'}`}>Contest Status</span>
            </div>
          </div>

          <div className="glass rounded-[3rem] flex-1 flex flex-col overflow-hidden shadow-2xl relative group min-h-0 hover:-translate-y-1 transition-all duration-500">
            <div className="p-8 border-b border-white/40 bg-white/20 backdrop-blur-md flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20"><Trophy className="w-5 h-5 text-accent-foreground" /></div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">Leaderboard</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDownloadPDF} className="rounded-xl bg-white/50 border border-white/60 hover:bg-primary hover:text-white transition-all shadow-sm"><Download className="w-4 h-4" /></Button>
            </div>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full w-full p-6">
                <div className="space-y-2 pb-4">
                  {leaderboard.map((s, i) => (
                    <div key={i} className={`flex justify-between items-center p-5 rounded-2xl transition-all ${i === 0
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl scale-[1.02]'
                        : 'bg-white/40 border border-transparent hover:border-primary/20 hover:bg-white/80'
                      }`}>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-bold font-mono ${i === 0 ? 'text-primary-foreground/50' : 'text-muted-foreground/50'}`}>0{i + 1}</span>
                        <span className="font-bold text-xs uppercase tracking-tight">{s.name}</span>
                      </div>
                      <span className={`text-sm font-mono font-bold ${i === 0 ? 'text-primary-foreground' : 'text-primary'}`}>{s.score} pts</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/30 gap-4">
                      <Trophy className="w-12 h-12 stroke-[1.5]" />
                      <p className="text-xs font-bold uppercase tracking-widest">No students yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
              {/* SUBMISSIONS MODAL OVERLAY */}
      {showSubmissions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop with heavy blur */}
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-xl animate-in fade-in duration-300" 
            onClick={() => setShowSubmissions(false)} 
          />
          
          {/* Modal Content */}
          <div className="glass w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-8 duration-500">
            
            {/* Header */}
            <div className="p-8 border-b border-white/40 flex justify-between items-center bg-white/40 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{submissionsTitle}</h2>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{submissions.length} Total Entries</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSubmissions(false)}
                className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* List Area */}
            <ScrollArea className="flex-1 px-8 py-4">
              <div className="flex flex-col gap-3 py-4"> {/* Changed to flex-col for 'one below the other' */}
                {submissions.length > 0 ? (
                  submissions.map((sub, idx) => (
                    <div 
                      key={idx} 
                      className="group p-5 bg-white/50 hover:bg-white/80 border border-white/60 hover:border-primary/30 rounded-2xl flex items-center justify-between transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground uppercase tracking-tight">
                            {sub.student_name || sub.username || "Anonymous Student"}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            Submitted at {sub.timestamp ? new Date(sub.timestamp).toLocaleTimeString() : "Just now"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[9px] uppercase font-black text-primary/40 tracking-tighter">Result</p>
                          <p className="font-mono font-bold text-primary text-lg">
                            {typeof sub.score === 'number' ? `${sub.score} pts` : "DONE"}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground/30 gap-4">
                    <AlertCircle className="w-16 h-16 stroke-[1]" />
                    <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Awaiting first submission...</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-6 border-t border-white/40 bg-white/20 text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                End of List
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}