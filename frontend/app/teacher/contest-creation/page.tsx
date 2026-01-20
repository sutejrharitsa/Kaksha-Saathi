"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  X,
  Play,
  Code2,
  FileText,
  TestTube2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;


interface TestCase { id: number; input: string; output: string }
interface ContestTemplateSummary { id: number; title: string }
interface ContestTemplateDetail {
  id: number
  title: string
  description: string
  input_format: string
  output_format: string
  constraints: string
  test_cases: { input_data: string; expected_output: string; is_sample: boolean }[]
}

export default function TeacherContestCreationPage() {
  const router = useRouter()
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const [mode, setMode] = useState<"list" | "create" | "view">("list")
  const [templates, setTemplates] = useState<ContestTemplateSummary[]>([])
  const [selected, setSelected] = useState<ContestTemplateDetail | null>(null)
  const [inClassroom, setInClassroom] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [inputFormat, setInputFormat] = useState("")
  const [outputFormat, setOutputFormat] = useState("")
  const [constraints, setConstraints] = useState("")
  const [sampleTestCases, setSampleTestCases] = useState<TestCase[]>([{ id: 1, input: "", output: "" }])
  const [hiddenTestCases, setHiddenTestCases] = useState<TestCase[]>([{ id: 1, input: "", output: "" }])

  const fetchTemplates = async () => {
    const res = await fetch(`${BACKEND_URL}/contest-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setTemplates(data)
  }

  useEffect(() => {
    if (!token) return
    fetchTemplates()
    fetch(`${BACKEND_URL}/classrooms/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setInClassroom(true))
      .catch(() => setInClassroom(false))
  }, [token])

  const resetCreateForm = () => {
    setTitle(""); setDescription(""); setInputFormat(""); setOutputFormat(""); setConstraints("")
    setSampleTestCases([{ id: 1, input: "", output: "" }])
    setHiddenTestCases([{ id: 1, input: "", output: "" }])
  }

  const addSampleTestCase = () => setSampleTestCases([...sampleTestCases, { id: Date.now(), input: "", output: "" }])
  const removeSampleTestCase = (id: number) => sampleTestCases.length > 1 && setSampleTestCases(sampleTestCases.filter(tc => tc.id !== id))
  const updateSampleTestCase = (id: number, field: "input" | "output", value: string) => 
    setSampleTestCases(sampleTestCases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc))

  const addHiddenTestCase = () => setHiddenTestCases([...hiddenTestCases, { id: Date.now(), input: "", output: "" }])
  const removeHiddenTestCase = (id: number) => hiddenTestCases.length > 1 && setHiddenTestCases(hiddenTestCases.filter(tc => tc.id !== id))
  const updateHiddenTestCase = (id: number, field: "input" | "output", value: string) => 
    setHiddenTestCases(hiddenTestCases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc))

  const handleSaveTemplate = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const payload = {
        title, description, input_format: inputFormat, output_format: outputFormat, constraints,
        time_limit_ms: 1000, memory_limit_kb: 65536,
        test_cases: [
          ...sampleTestCases.map(tc => ({ input_data: tc.input, expected_output: tc.output, is_sample: true })),
          ...hiddenTestCases.map(tc => ({ input_data: tc.input, expected_output: tc.output, is_sample: false })),
        ],
      }
      const res = await fetch(`${BACKEND_URL}/contest-templates/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      resetCreateForm(); setMode("list"); fetchTemplates()
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong")
    } finally { setIsSaving(false) }
  }

  const openTemplate = async (id: number) => {
    const res = await fetch(`${BACKEND_URL}/contest-templates/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setSelected(data); setMode("view")
  }

  const deleteTemplate = async (id: number) => {
    await fetch(`${BACKEND_URL}/contest-templates/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
    fetchTemplates()
  }

  const activateTemplate = async () => {
    if (!selected) return
    const res = await fetch(`${BACKEND_URL}/contest-templates/${selected.id}/activate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const d = await res.json()
      setErrorMessage(d.detail || "Activation failed")
      return
    }
    router.push("/teacher/dashboard")
  }

  return (
    <main className="min-h-screen bg-[#F4F4F7] text-[#111111] antialiased">
      {/* ERROR MODAL */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <Card className="w-[400px] border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] rounded-[2.5rem] overflow-hidden">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto shadow-sm border border-red-100">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black uppercase tracking-tight">Error Detected</h2>
                <p className="text-sm text-black/60 leading-relaxed">{errorMessage}</p>
              </div>
              <Button onClick={() => setErrorMessage(null)} className="w-full h-12 bg-black text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest">
                Dismiss
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <nav className="h-20 bg-white border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-xl">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">Contest <span className="text-indigo-600">Templates</span></h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-black/30">Create and manage coding challenges</p>
            </div>
          </div>
          <div className="flex gap-4">
            {mode !== "list" && (
              <Button variant="ghost" onClick={() => setMode("list")} className="text-[10px] font-black uppercase tracking-widest hover:bg-black/5">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
              </Button>
            )}
            {mode === "list" && (
              <Button onClick={() => { resetCreateForm(); setMode("create") }} className="h-11 px-6 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all">
                <Plus className="w-4 h-4 mr-2" /> New Template
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
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-black/5">
                  <Code2 className="w-10 h-10 text-black/10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight">No Templates Yet</h3>
                  <p className="text-sm text-black/40">Create your first contest template to get started!</p>
                </div>
              </div>
            ) : (
              templates.map((t) => (
                <Card key={t.id} className="bg-white border-none shadow-md rounded-[2rem] hover:shadow-2xl transition-all group overflow-hidden">
                  <CardContent className="p-8 flex items-center justify-between">
                    <div className="cursor-pointer flex-1" onClick={() => openTemplate(t.id)}>
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-tight">{t.title}</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t.id)} className="text-black/10 hover:text-red-500 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* VIEW MODE */}
        {mode === "view" && selected && (
          <div className="max-w-3xl mx-auto animate-in fade-in scale-in-95 duration-500">
            <Card className="bg-white border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] overflow-hidden">
              <div className="p-10 border-b border-black/5 bg-[#FBFBFC] flex items-center gap-6">
                <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl">
                    <Code2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-black/20">Template Overview</p>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">{selected.title}</h2>
                </div>
              </div>
              <CardContent className="p-10 space-y-10">
                {[
                  { label: "Description", content: selected.description, icon: FileText, color: "text-blue-600", bg: "bg-blue-50/50" },
                  { label: "Input Format", content: selected.input_format, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50/50" },
                  { label: "Output Format", content: selected.output_format, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50/50" },
                  { label: "Constraints", content: selected.constraints, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50/50" }
                ].map((item, idx) => (
                  <div key={idx} className={`p-6 rounded-3xl border border-black/[0.02] ${item.bg}`}>
                    <h4 className={`text-[10px] uppercase font-black tracking-widest mb-2 flex items-center gap-2 ${item.color}`}>
                      <item.icon className="w-4 h-4" /> {item.label}
                    </h4>
                    <p className="text-sm font-medium leading-relaxed text-black/80">{item.content}</p>
                  </div>
                ))}

                <div className="pt-6">
                  {inClassroom ? (
                    <Button onClick={activateTemplate} className="w-full h-16 bg-black text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:translate-y-[-2px] transition-all">
                      <Play className="w-4 h-4 mr-2" /> Load contest to Classroom
                    </Button>
                  ) : (
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-center gap-4 text-amber-900">
                      <AlertCircle className="w-6 h-6 shrink-0" />
                      <p className="text-xs font-bold uppercase tracking-tight leading-relaxed">You must create a classroom first to activate contests</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CREATE MODE */}
        {mode === "create" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b border-black/5 bg-[#FBFBFC] flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Problem Details</h2>
              </div>
              <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-1">Problem Title</Label>
                    <Input placeholder="e.g., Two Sum Problem" value={title} onChange={e => setTitle(e.target.value)} className="h-14 bg-[#F4F4F7] border-none rounded-2xl px-6 focus-visible:ring-1 focus-visible:ring-black" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-1">Input Format</Label><Textarea placeholder="Define protocol..." value={inputFormat} onChange={e => setInputFormat(e.target.value)} className="min-h-[120px] bg-[#F4F4F7] border-none rounded-2xl p-6 focus-visible:ring-1 focus-visible:ring-black" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-1">Output Format</Label><Textarea placeholder="Define protocol..." value={outputFormat} onChange={e => setOutputFormat(e.target.value)} className="min-h-[120px] bg-[#F4F4F7] border-none rounded-2xl p-6 focus-visible:ring-1 focus-visible:ring-black" /></div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-1">Description</Label>
                    <Textarea placeholder="Describe challenge details..." value={description} onChange={e => setDescription(e.target.value)} className="min-h-[150px] bg-[#F4F4F7] border-none rounded-2xl p-6 focus-visible:ring-1 focus-visible:ring-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-1">Constraints</Label>
                    <Textarea placeholder="Define limits..." value={constraints} onChange={e => setConstraints(e.target.value)} className="min-h-[100px] bg-[#F4F4F7] border-none rounded-2xl p-6 focus-visible:ring-1 focus-visible:ring-black" />
                  </div>
              </CardContent>
            </Card>

            {/* Test Case Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TestCaseModule title="Sample Test Cases" icon={Eye} color="text-green-600" bg="bg-green-50/50" cases={sampleTestCases} onAdd={addSampleTestCase} onRemove={removeSampleTestCase} onUpdate={updateSampleTestCase} />
              <TestCaseModule title="Hidden Test Cases" icon={EyeOff} color="text-purple-600" bg="bg-purple-50/50" cases={hiddenTestCases} onAdd={addHiddenTestCase} onRemove={removeHiddenTestCase} onUpdate={updateHiddenTestCase} />
            </div>

            <Button onClick={handleSaveTemplate} disabled={isSaving} className="w-full h-20 bg-black text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl hover:translate-y-[-2px] transition-all">
              {isSaving ? <Loader2 className="animate-spin w-6 h-6" /> : <><Save className="w-5 h-5 mr-3" /> Save Contest Template</>}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

function TestCaseModule({ title, icon: Icon, color, bg, cases, onAdd, onRemove, onUpdate }: any) {
  return (
    <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden flex flex-col">
      <div className={`p-8 border-b border-black/5 ${bg} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm"><Icon className={`w-4 h-4 ${color}`} /></div>
            <h2 className="text-xs font-black uppercase tracking-widest">{title}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onAdd} className="rounded-full bg-white shadow-sm border border-black/5"><Plus className="w-4 h-4" /></Button>
      </div>
      <CardContent className="p-8 space-y-6">
          {cases.map((tc: any, i: number) => (
            <div key={tc.id} className="p-6 bg-[#F4F4F7] rounded-3xl space-y-4 relative group">
              <Button variant="ghost" size="icon" onClick={() => onRemove(tc.id)} className="absolute top-4 right-4 text-black/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></Button>
              <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-black/30 ml-1">Input Instance {i+1}</Label>
                    <Textarea value={tc.input} onChange={e => onUpdate(tc.id, "input", e.target.value)} className="min-h-[60px] bg-white border-none rounded-xl text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-black/30 ml-1">Expected Result</Label>
                    <Textarea value={tc.output} onChange={e => onUpdate(tc.id, "output", e.target.value)} className="min-h-[60px] bg-white border-none rounded-xl text-xs" />
                  </div>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  )
}