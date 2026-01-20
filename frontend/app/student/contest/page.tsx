"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Play,
  Send,
  ArrowLeft,
  Trophy,
  Clock,
  AlertCircle,
  ChevronRight,
  Terminal,
  Cpu,
  Loader2,
  CheckCircle2,
  XCircle,
  Code2
} from "lucide-react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;


const LANGUAGE_MAP: Record<string, number> = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
}

export default function StudentContestPage() {
  const router = useRouter()
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const [question, setQuestion] = useState<any>(null)
  const [samples, setSamples] = useState<any[]>([])
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("cpp")
  const [judgeResult, setJudgeResult] = useState<any>(null)
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"description" | "testcases">("description")
  const [resultTab, setResultTab] = useState<"result" | "tips">("tips")

  useEffect(() => {
    if (!token) {
      router.push("/")
      return
    }
    const load = async () => {
      try {
        const q = await fetch(`${BACKEND_URL}/contests/question`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!q.ok) {
          router.push("/student/dashboard")
          return
        }
        setQuestion(await q.json())
        const s = await fetch(`${BACKEND_URL}/contests/sample-tests`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (s.ok) setSamples(await s.json())
      } catch (e) {
        console.error("Failed to sync contest", e)
      }
    }
    load()
  }, [router, token])

  // Fullscreen and tab detection
  useEffect(() => {
    // Request fullscreen on mount
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen()
      } catch (err) {
        console.log("Fullscreen request failed:", err)
      }
    }

    enterFullscreen()

    // Auto-submit on visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden && !submitted && !alreadySubmitted) {
        submitCode()
      }
    }

    // Auto-submit on fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submitted && !alreadySubmitted) {
        submitCode()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [submitted, alreadySubmitted, code, language, token])

  const runCode = async () => {
    if (!token) return
    setLoading(true)
    setJudgeResult(null)
    setResultTab("result")
    try {
      const res = await fetch(`${BACKEND_URL}/contests/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          source_code: code,
          language_id: LANGUAGE_MAP[language],
          input_data: samples.map((s) => s.input_data).join("\n"),
        }),
      })
      setJudgeResult(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const submitCode = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/contests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ source_code: code || "", language_id: LANGUAGE_MAP[language] }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.detail?.toLowerCase().includes("already")) {
          setAlreadySubmitted(true)
          setTimeout(() => router.push("/student/dashboard"), 3000)
        }
        return
      }
      setScore(data.score)
      setSubmitted(true)
      setTimeout(() => router.push("/student/dashboard"), 3000)
    } finally {
      setLoading(false)
    }
  }

  if (!question) return (
    <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <Cpu className="w-12 h-12 text-black/10" />
        <p className="text-[10px] uppercase tracking-[0.4em] font-black text-black/40">Loading contest...</p>
      </div>
    </div>
  )

  return (
    <main className="h-screen bg-[#FBFBFC] text-[#1D1D1F] flex flex-col overflow-hidden antialiased">
      {/* Header */}
      <div className="h-14 border-b border-black/[0.03] bg-white flex items-center justify-between px-6 flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/student/dashboard")}
            className="text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
          <div className="h-4 w-[1px] bg-black/10"></div>
          <h1 className="text-sm font-bold tracking-tight uppercase tabular-nums">{question.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-tighter font-black text-black/40">Contest Mode</span>
        </div>
      </div>

      {(submitted || alreadySubmitted) ? (
        <div className="flex-1 flex items-center justify-center bg-[#FBFBFC]">
          <Card className="max-w-md w-full bg-white border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem]">
            <CardContent className="text-center space-y-8 py-16">
              <div className="w-20 h-20 mx-auto bg-black rounded-[2rem] flex items-center justify-center shadow-2xl">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tighter uppercase">
                  {submitted ? "Submission Successful!" : "Already Submitted"}
                </h3>
                {submitted && score !== null && (
                  <div className="flex items-center justify-center gap-3 text-4xl font-black">
                    <Trophy className="w-8 h-8 text-amber-500" />
                    Score: {score}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2 pt-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-black/40 font-bold">
                  <Clock className="w-3 h-3" /> Redirecting to dashboard...
                </div>
                <div className="w-48 h-1.5 bg-black/5 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-black rounded-full animate-progress-fast"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL - Problem Description */}
          <div className="w-1/2 border-r border-black/[0.03] flex flex-col bg-white overflow-hidden">
            <div className="h-12 border-b border-black/[0.03] flex items-center px-4 gap-2 bg-[#FBFBFC]">
              <button
                onClick={() => setActiveTab("description")}
                className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all relative h-full ${
                  activeTab === "description" ? "text-black" : "text-black/30 hover:text-black/60"
                }`}
              >
                Description
                {activeTab === "description" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
              </button>
              <button
                onClick={() => setActiveTab("testcases")}
                className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all relative h-full ${
                  activeTab === "testcases" ? "text-black" : "text-black/30 hover:text-black/60"
                }`}
              >
                Test Cases
                {activeTab === "testcases" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {activeTab === "description" ? (
                <div className="max-w-xl space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black tracking-tighter text-black uppercase">{question.title}</h2>
                    <p className="text-[15px] text-black/70 leading-relaxed">{question.description}</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { l: "Input Format", c: question.input_format, s: "bg-blue-50/50" },
                      { l: "Output Format", c: question.output_format, s: "bg-emerald-50/50" },
                      { l: "Constraints", c: question.constraints, s: "bg-amber-50/50" }
                    ].map((item, i) => (
                      <div key={i} className={`p-6 rounded-[1.5rem] border border-black/[0.02] ${item.s}`}>
                        <h3 className="text-[9px] uppercase tracking-widest font-black opacity-40 mb-2 flex items-center gap-2">
                          <ChevronRight className="w-3 h-3" /> {item.l}
                        </h3>
                        <p className="text-sm font-bold text-black/80">{item.c}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-black/30 px-2">All Test Cases</h3>
                  {samples.map((s, i) => (
                    <div key={i} className="p-6 rounded-[2rem] bg-[#FBFBFC] border border-black/[0.03] space-y-4 shadow-sm">
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-black">
                            {i + 1}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Test Case {i+1}</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold uppercase text-black/30">Input</p>
                            <pre className="p-3 bg-white rounded-xl text-xs font-mono border border-black/[0.03]">{s.input_data}</pre>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold uppercase text-black/30">Expected Output</p>
                            <pre className="p-3 bg-white rounded-xl text-xs font-mono border border-black/[0.03]">{s.expected_output}</pre>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - Editor Side */}
          <div className="w-1/2 flex flex-col bg-white">
            {/* Editor Top Bar (Dark to match editor) */}
            <div className="h-12 flex items-center justify-between px-6 bg-[#050505] border-b border-white/5">
              <div className="flex items-center gap-3 text-white/30">
                <Code2 className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest font-black">Code</span>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-36 h-7 bg-white/5 border-white/10 text-white text-[10px] font-bold rounded-lg uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/10 text-white text-[10px]">
                  <SelectItem value="cpp">C++ 17</SelectItem>
                  <SelectItem value="python">Python 3</SelectItem>
                  <SelectItem value="java">Java 11</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DARK CODE EDITOR AREA */}
            <div className="flex-1 bg-[#050505]">
               <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Write your code here..."
                className="h-full w-full font-mono text-sm bg-transparent text-white/80 p-8 border-0 rounded-none resize-none focus:ring-0 caret-white leading-relaxed"
              />
            </div>

            {/* WHITE BOTTOM CONSOLE PANEL */}
            <div className="h-[40%] border-t border-black/[0.03] flex flex-col bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                <div className="h-10 border-b border-black/[0.03] flex items-center px-6 bg-[#FBFBFC]">
                    <div className="flex gap-4 h-full">
                        <button
                          onClick={() => setResultTab("tips")}
                          className={`text-[9px] uppercase tracking-widest font-black transition-all relative h-full ${
                            resultTab === "tips" ? "text-black" : "text-black/30 hover:text-black/60"
                          }`}
                        >
                          Tips
                          {resultTab === "tips" && <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black" />}
                        </button>
                        <button
                          onClick={() => setResultTab("result")}
                          className={`text-[9px] uppercase tracking-widest font-black transition-all relative h-full ${
                            resultTab === "result" ? "text-black" : "text-black/30 hover:text-black/60"
                          }`}
                        >
                          {judgeResult ? "Test Result" : "Result"}
                          {resultTab === "result" && <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black" />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-6 font-mono overflow-y-auto">
                    {resultTab === "tips" ? (
                        <div className="flex items-start gap-3 bg-amber-50 p-5 rounded-2xl border border-amber-100">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-1" />
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase text-amber-900 tracking-widest">Quick Tips</h4>
                                <ul className="text-[11px] text-amber-800 space-y-1 font-sans font-medium">
                                    <li>• Test your code with sample inputs before submitting</li>
                                    <li>• Consider edge cases and boundary conditions</li>
                                    <li>• Check time and space complexity requirements</li>
                                </ul>
                            </div>
                        </div>
                    ) : judgeResult ? (
                        <div className="space-y-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                judgeResult.status?.id === 3 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                                {judgeResult.status?.id === 3 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {judgeResult.status?.description}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-bold uppercase text-black/30">Output</p>
                                <pre className="text-xs text-black/70 bg-black/[0.02] p-4 rounded-xl border border-black/[0.03] overflow-auto max-h-32">
                                    {judgeResult.compile_output || judgeResult.stderr || judgeResult.stdout || "No output captured."}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                           <p className="text-black/10 text-[9px] uppercase tracking-[0.3em] font-black">Run your code to see results here</p>
                        </div>
                    )}
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="h-16 border-t border-black/[0.03] flex items-center justify-end gap-3 px-6 bg-[#FBFBFC]">
                    <Button 
                      onClick={runCode} 
                      disabled={loading || !code.trim()} 
                      variant="outline"
                      className="h-10 px-8 border-2 border-black text-black text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-black hover:text-white transition-all duration-300 shadow-sm"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Play className="w-4 h-4 mr-2" /> Run</>}
                    </Button>
                    <Button 
                      onClick={submitCode} 
                      disabled={loading} 
                      className="h-10 px-8 bg-black text-white text-[10px] uppercase font-black tracking-widest rounded-xl shadow-lg hover:translate-y-[-2px] transition-all duration-300"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send className="w-4 h-4 mr-2" /> Submit</>}
                    </Button>
                </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-progress-fast { animation: progress 3.5s ease-in-out forwards; }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </main>
  )
}