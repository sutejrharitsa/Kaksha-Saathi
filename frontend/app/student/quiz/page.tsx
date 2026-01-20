"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Send, CheckCircle, Trophy, Clock, ArrowLeft, Award, CheckCircle2, Cpu } from "lucide-react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;


type QuizQuestion = {
  id: number
  question_text: string
  options: { key: string; value: string }[]
}

export default function StudentQuizPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [score, setScore] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  useEffect(() => {
    if (!token) {
      router.push("/")
      return
    }

    const loadQuiz = async () => {
      const res = await fetch(`${BACKEND_URL}/quizzes/active`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (!res.ok || data.length === 0) {
        router.push("/student/dashboard")
        return
      }

      setQuestions(
        data.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          options: [
            { key: "A", value: q.option_a },
            { key: "B", value: q.option_b },
            { key: "C", value: q.option_c },
            { key: "D", value: q.option_d },
          ],
        }))
      )

      setLoading(false)
    }

    loadQuiz()
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
        handleSubmit()
      }
    }

    // Auto-submit on fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submitted && !alreadySubmitted) {
        handleSubmit()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [submitted, alreadySubmitted, answers, token])

  const handleSubmit = async () => {
    if (!token) return

    const res = await fetch(`${BACKEND_URL}/quizzes/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (typeof data.detail === "string" && data.detail.toLowerCase().includes("already")) {
        setAlreadySubmitted(true)
        setTimeout(() => router.push("/student/dashboard"), 3000)
      }
      return
    }

    setScore(data.score)
    setSubmitted(true)
    setTimeout(() => router.push("/student/dashboard"), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <Cpu className="w-12 h-12 text-black/10" />
          <p className="text-[10px] uppercase tracking-[0.4em] font-black text-black/40">Loading quiz...</p>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const answeredCount = Object.keys(answers).length
  const progressPercentage = (answeredCount / questions.length) * 100

  return (
    <main className="min-h-screen bg-[#F4F4F7] text-[#111111] antialiased flex flex-col">
      {/* Header Bar */}
      <nav className="h-16 bg-white border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/student/dashboard")}
              className="text-[10px] uppercase tracking-widest font-black text-black/40 hover:text-black transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Dashboard
            </button>
            <div className="h-4 w-[1px] bg-black/10"></div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <h1 className="text-sm font-black uppercase tracking-tight">Quiz Time</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black/60">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>
        </div>
      </nav>

      {/* Content Container */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8">
          {(submitted || alreadySubmitted) ? (
            <Card className="bg-white border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden">
              <CardContent className="text-center py-20 px-10 space-y-8">
                <div className="w-24 h-24 mx-auto bg-black rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tighter uppercase italic">
                    {submitted ? "Quiz Submitted!" : "Already Submitted"}
                  </h3>
                  {submitted && (
                    <div className="flex flex-col items-center pt-4">
                      <p className="text-[10px] uppercase font-black text-black/20 tracking-widest mb-1">Your Score</p>
                      <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-amber-500" />
                        <p className="text-6xl font-black tracking-tighter tabular-nums">{score}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 pt-8">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-black/40 font-bold">
                    <Clock className="w-3 h-3" />
                    Redirecting to dashboard...
                  </div>
                  <div className="w-48 h-1.5 bg-black/5 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-black rounded-full animate-progress-sync"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Question Sidebar Tracker */}
              <div className="lg:col-span-3 space-y-4">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-black/20 px-1">Navigation</p>
                <div className="p-4 bg-white rounded-[2rem] shadow-sm grid grid-cols-4 gap-2 border border-black/[0.02]">
                  {questions.map((q, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`h-10 rounded-xl text-[10px] font-black transition-all ${
                        index === currentQuestion
                          ? "bg-black text-white shadow-lg scale-110"
                          : answers[q.id]
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                          : "bg-[#F4F4F7] text-black/30 hover:bg-black/5"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Question Card */}
              <Card className="lg:col-span-9 bg-white border-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden flex flex-col">
                {/* Visual Progress Line */}
                <div className="w-full h-1 bg-black/5">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-700 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <div className="p-10 space-y-10">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Question {currentQuestion + 1}</p>
                      <h2 className="text-2xl font-bold tracking-tight text-black leading-tight">
                        {question.question_text}
                      </h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4F4F7] flex items-center justify-center text-xs font-black">
                      {currentQuestion + 1}/{questions.length}
                    </div>
                  </div>

                  {/* Options */}
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) =>
                      setAnswers((prev) => ({ ...prev, [question.id]: value }))
                    }
                    className="grid grid-cols-1 gap-4"
                  >
                    {question.options.map((option, index) => (
                      <Label
                        key={option.key}
                        className={`group flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all duration-300 cursor-pointer ${
                          answers[question.id] === option.key
                            ? "bg-black text-white border-black shadow-xl"
                            : "bg-[#FBFBFC] border-transparent hover:border-black/10"
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${
                              answers[question.id] === option.key
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-white border-black/5 text-black/40"
                            }`}
                          >
                            {option.key}
                          </div>
                          <span className="text-sm font-bold uppercase tracking-tight">{option.value}</span>
                        </div>
                        <RadioGroupItem value={option.key} className="sr-only" />
                        {answers[question.id] === option.key && <CheckCircle className="w-5 h-5 text-indigo-400" />}
                      </Label>
                    ))}
                  </RadioGroup>

                  {/* Navigation Actions */}
                  <div className="pt-8 border-t border-black/5 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      disabled={currentQuestion === 0}
                      onClick={() => setCurrentQuestion((q) => q - 1)}
                      className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    {currentQuestion === questions.length - 1 ? (
                      <Button
                        onClick={handleSubmit}
                        className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all hover:translate-y-[-2px]"
                      >
                        Submit Quiz
                        <Send className="w-3 h-3 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setCurrentQuestion((q) => q + 1)}
                        className="h-12 px-10 bg-black hover:bg-black/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all hover:translate-y-[-2px]"
                      >
                        Next Question
                        <ChevronRight className="w-3 h-3 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .animate-progress-sync {
          animation: progress 3s linear forwards;
        }
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </main>
  )
}