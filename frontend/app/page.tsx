"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { GraduationCap, ArrowRight, User, Mail, Fingerprint, ShieldAlert, Loader2 } from "lucide-react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;
console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);


export default function LoginPage() {
  const router = useRouter()

  // 🔹 YOUR ORIGINAL STATES
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"student" | "teacher" | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🔹 YOUR EXACT API LOGIC
  const handleContinue = async () => {
    if (!name || !email || !role) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || "Login failed")
      }

      const { access_token, id } = data

      // Store auth data exactly as you had it
      localStorage.setItem("access_token", access_token)
      localStorage.setItem("role", role)
      localStorage.setItem("user_id", String(id))
      localStorage.setItem("name", name)
      localStorage.setItem("email", email)

      // Role-based routing
      if (role === "student") {
        router.push("/student/join")
      } else {
        router.push("/teacher/class-selection")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#FBFBFC] text-[#1D1D1F] antialiased">
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="w-full max-w-[420px] z-10 space-y-10">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-black/[0.03]">
            <Fingerprint className="w-6 h-6 text-black/80" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-light tracking-tight text-black">
            Kaksha <span className="font-medium">Saathi</span>
          </h1>
        </div>

        <Card className="bg-white/70 backdrop-blur-2xl border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-10 space-y-8">
            
            {/* Form Inputs */}
            <div className="space-y-7">
              <div className="relative group">
                <Label className="text-[10px] uppercase tracking-widest text-black/40 mb-2 block ml-1 font-bold">Full Name</Label>
                <div className="relative">
                   <Input
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 bg-black/[0.02] border-black/[0.05] focus-visible:ring-0 focus-visible:border-black rounded-xl px-4 transition-all"
                  />
                  <User className="absolute right-4 top-3.5 w-4 h-4 text-black/10" />
                </div>
              </div>

              <div className="relative group">
                <Label className="text-[10px] uppercase tracking-widest text-black/40 mb-2 block ml-1 font-bold">Email Address</Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-black/[0.02] border-black/[0.05] focus-visible:ring-0 focus-visible:border-black rounded-xl px-4 transition-all"
                  />
                  <Mail className="absolute right-4 top-3.5 w-4 h-4 text-black/10" />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-black/30 font-bold ml-1">Access Level</span>
              <RadioGroup
                value={role}
                onValueChange={(value) => setRole(value as any)}
                className="flex p-1 bg-black/[0.03] rounded-xl border border-black/[0.02]"
              >
                {["student", "teacher"].map((r) => (
                  <Label
                    key={r}
                    htmlFor={r}
                    className={`flex-1 flex items-center justify-center h-10 rounded-lg text-[10px] uppercase tracking-widest font-bold cursor-pointer transition-all duration-300 ${
                      role === r 
                      ? "bg-white text-black shadow-sm scale-[1.02]" 
                      : "text-black/40 hover:text-black/60"
                    }`}
                  >
                    <RadioGroupItem value={r} id={r} className="sr-only" />
                    {r}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* API Error Handling */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 animate-in zoom-in-95">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <p className="text-[11px] text-red-700 font-bold uppercase tracking-tight">{error}</p>
              </div>
            )}

            {/* Submit Button with Loading State */}
            <Button
              onClick={handleContinue}
              disabled={!name || !email || !role || loading}
              className={`w-full h-14 rounded-2xl text-[11px] uppercase font-bold tracking-[0.2em] transition-all duration-500 ${
                name && email && role 
                ? "bg-black text-white hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:translate-y-[-2px]" 
                : "bg-black/5 text-black/20"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Request Access <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-[10px] text-black/30 text-center tracking-wide uppercase font-medium">
          Secure Identity Verification System
        </p>
      </div>
    </main>
  )
}