"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  ArrowLeft,
  Save,
  X,
  Play,
  Trash2,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ClipboardList,
} from "lucide-react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;


interface QuizTemplate { id: number; title: string }
interface Question {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
}

export default function TeacherQuizCreationPage() {
  const router = useRouter()
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const [mode, setMode] = useState<"list" | "create" | "view">("list")
  const [templates, setTemplates] = useState<QuizTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: number; title: string; questions: Question[] } | null>(null)
  const [inClassroom, setInClassroom] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState<Question[]>([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "" }])

  useEffect(() => {
    if (!token) return
    fetch(`${BACKEND_URL}/quiz-templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setTemplates)
    fetch(`${BACKEND_URL}/classrooms/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setInClassroom(true)).catch(() => setInClassroom(false))
  }, [token])

  const addQuestion = () => setQuestions([...questions, { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "" }])
  const removeQuestion = (idx: number) => questions.length > 1 && setQuestions(questions.filter((_, i) => i !== idx))
  const updateQuestion = (idx: number, field: keyof Question, value: string) => {
    const copy = [...questions]; copy[idx][field] = value; setQuestions(copy)
  }

  const validate = () => {
    if (!title.trim()) return false
    return questions.every(q => q.question_text.trim() && q.option_a.trim() && q.option_b.trim() && q.option_c.trim() && q.option_d.trim() && q.correct_option)
  }

  const resetCreateForm = () => {
    setTitle(""); setQuestions([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "" }])
  }

  const saveTemplate = async () => {
    if (isSaving) return
    if (!validate()) { setErrorMessage("All fields must be filled."); return }
    setIsSaving(true)
    try {
      const res = await fetch(`${BACKEND_URL}/quiz-templates/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, questions }),
      })
      if (!res.ok) throw new Error((await res.json()).detail || "Failed to create template")
      const templatesRes = await fetch(`${BACKEND_URL}/quiz-templates`, { headers: { Authorization: `Bearer ${token}` } })
      setTemplates(await templatesRes.json()); resetCreateForm(); setMode("list")
    } catch (err: any) { setErrorMessage(err.message || "Something went wrong") } finally { setIsSaving(false) }
  }

  const openTemplate = async (id: number) => {
    const res = await fetch(`${BACKEND_URL}/quiz-templates/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    setSelectedTemplate(await res.json()); setMode("view")
  }

  const deleteTemplate = async (id: number) => {
    await fetch(`${BACKEND_URL}/quiz-templates/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const activateTemplate = async () => {
    if (!selectedTemplate) return
    const res = await fetch(`${BACKEND_URL}/quiz-templates/${selectedTemplate.id}/activate`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { setErrorMessage((await res.json()).detail); return }
    router.push("/teacher/dashboard")
  }

  return (
    <main className="min-h-screen bg-[#F4F4F7] text-[#111111] antialiased">
      {/* ERROR MODAL */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <Card className="w-[400px] border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100"><AlertCircle className="w-8 h-8 text-red-500" /></div>
              <div className="space-y-2">
                <h2 className="text-xl font-black uppercase tracking-tight">Error</h2>
                <p className="text-sm text-black/60 leading-relaxed">{errorMessage}</p>
              </div>
              <Button onClick={() => setErrorMessage(null)} className="w-full h-12 bg-black text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest">Dismiss</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <nav className="h-20 bg-white border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-xl"><FileQuestion className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">Quiz <span className="text-indigo-600">Templates</span></h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-black/30">Create and manage quizzes</p>
            </div>
          </div>
          <div className="flex gap-4">
            {mode !== "list" && (
              <Button variant="ghost" onClick={() => setMode("list")} className="text-[10px] font-black uppercase tracking-widest hover:bg-black/5"><ArrowLeft className="w-4 h-4 mr-2" /> Back to List</Button>
            )}
            {mode === "list" && (
              <Button onClick={() => { resetCreateForm(); setMode("create") }} className="h-11 px-6 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all">
                <Plus className="w-4 h-4 mr-2" /> New Quiz Template
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        {/* LIST MODE */}
        {mode === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {templates.length === 0 ? (
              <div className="col-span-full py-24 text-center space-y-6">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-black/5"><FileQuestion className="w-10 h-10 text-black/10" /></div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight">No Quiz Templates Yet</h3>
                  <p className="text-sm text-black/40">Create your first quiz template to get started!</p>
                </div>
              </div>
            ) : (
              templates.map((t) => (
                <Card key={t.id} className="bg-white border-none shadow-md rounded-[2rem] hover:shadow-2xl transition-all group overflow-hidden">
                  <CardContent className="p-8 flex items-center justify-between">
                    <div className="cursor-pointer flex-1" onClick={() => openTemplate(t.id)}>
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ClipboardList className="w-5 h-5 text-indigo-600" /></div>
                      <h3 className="font-black text-sm uppercase tracking-tight">{t.title}</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t.id)} className="text-black/10 hover:text-red-500 rounded-xl"><Trash2 className="w-5 h-5" /></Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* VIEW MODE */}
        {mode === "view" && selectedTemplate && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <Card className="bg-white border-none shadow-xl rounded-[3rem] overflow-hidden">
              <div className="p-10 border-b border-black/5 bg-[#FBFBFC] flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl"><FileQuestion className="w-6 h-6 text-white" /></div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">{selectedTemplate.title}</h2>
                    <p className="text-[10px] uppercase font-black text-black/20 tracking-widest mt-1">{selectedTemplate.questions.length} Questions Registered</p>
                  </div>
                </div>
                {inClassroom && (
                  <Button onClick={activateTemplate} className="h-14 px-8 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-indigo-200 hover:translate-y-[-2px] transition-all">
                    <Play className="w-4 h-4 mr-2" /> Load Quiz to Classroom
                  </Button>
                )}
              </div>
              <div className="p-10 grid grid-cols-1 gap-6">
                {selectedTemplate.questions.map((q, i) => (
                  <div key={i} className="p-8 bg-[#F4F4F7] rounded-[2.5rem] space-y-6 border border-black/[0.02]">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-xs font-black flex-shrink-0">{i + 1}</div>
                      <p className="text-lg font-bold tracking-tight leading-relaxed">{q.question_text}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                      {['a', 'b', 'c', 'd'].map((opt) => (
                        <div key={opt} className={`p-4 rounded-xl border-2 flex items-center justify-between ${q.correct_option === opt.toUpperCase() ? 'bg-white border-indigo-600 shadow-sm' : 'bg-black/[0.02] border-transparent'}`}>
                          <span className={`text-xs font-bold ${q.correct_option === opt.toUpperCase() ? 'text-indigo-600' : 'text-black/40'}`}>{(q as any)[`option_${opt}`]}</span>
                          {q.correct_option === opt.toUpperCase() && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* CREATE MODE */}
        {mode === "create" && (
          <ScrollArea className="h-[calc(100vh-160px)] pr-4 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
              <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-black/5 bg-[#FBFBFC] flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Sparkles className="w-5 h-5 text-white" /></div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Quiz Information</h2>
                </div>
                <CardContent className="p-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-1">Quiz Title</Label>
                    <Input placeholder="e.g., Chapter 1 Assessment" value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 bg-[#F4F4F7] border-none rounded-2xl px-6 focus-visible:ring-1 focus-visible:ring-black font-medium" />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {questions.map((q, i) => (
                  <Card key={i} className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden group">
                    <div className="p-8 border-b border-black/5 bg-[#FBFBFC] flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black text-sm">{i + 1}</div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Question Details</h3>
                      </div>
                      <Button variant="ghost" size="icon" disabled={questions.length === 1} onClick={() => removeQuestion(i)} className="text-black/10 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></Button>
                    </div>
                    <CardContent className="p-8 space-y-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-1">Question Text</Label>
                        <Input placeholder="Enter your question..." value={q.question_text} onChange={(e) => updateQuestion(i, "question_text", e.target.value)} className="h-14 bg-[#F4F4F7] border-none rounded-2xl px-6 focus-visible:ring-1 focus-visible:ring-black font-medium" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['a', 'b', 'c', 'd'].map((o) => (
                          <div key={o} className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-black/30 ml-1">Option {o.toUpperCase()}</Label>
                            <Input placeholder={`Option ${o.toUpperCase()} content...`} value={(q as any)[`option_${o}`]} onChange={(e) => updateQuestion(i, `option_${o}` as keyof Question, e.target.value)} className="h-12 bg-[#F4F4F7] border-none rounded-xl px-4 focus-visible:ring-1 focus-visible:ring-indigo-600" />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-4 border-t border-black/5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-1">Correct Answer</Label>
                        <Select value={q.correct_option} onValueChange={(v) => updateQuestion(i, "correct_option", v)}>
                          <SelectTrigger className="h-14 bg-black text-white border-none rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest">
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                          <SelectContent className="bg-black text-white border-white/10">
                            {["A", "B", "C", "D"].map((o) => <SelectItem key={o} value={o} className="uppercase font-bold text-[10px] tracking-widest">Option {o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" onClick={addQuestion} className="w-full h-16 border-2 border-dashed border-black/10 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all">
                <Plus className="w-4 h-4 mr-2" /> Add Another Question
              </Button>

              <Button onClick={saveTemplate} disabled={isSaving} className="w-full h-20 bg-black text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl hover:translate-y-[-2px] transition-all sticky bottom-0">
                {isSaving ? <Loader2 className="animate-spin w-6 h-6" /> : <><Save className="w-5 h-5 mr-3" /> Save Quiz Template</>}
              </Button>
            </div>
          </ScrollArea>
        )}
      </div>
    </main>
  )
}