"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

type LoginResponse = {
  token: {
    token: string
    id: number
    fullName: string
    email: string
    role: number
  }
}

interface LoginFormProps {
  onSuccess?: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setMsg("Please fill in all fields")
      return
    }

    setLoading(true)
    setMsg("")

    try {
      const res = await fetch("http://localhost:5293/api/Auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        setMsg("Invalid email or password")
        return
      }

      const data: LoginResponse = await res.json()
      const jwt = data.token.token

      localStorage.setItem("token", jwt)
      localStorage.setItem("role", data.token.role.toString())

      setMsg(`Welcome back, ${data.token.fullName}!`)

      setTimeout(() => {
        onSuccess?.()
        window.location.reload()
      }, 1000)
    } catch (err) {
      console.error(err)
      setMsg("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
      </div>

      <Button onClick={handleLogin} className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {msg && (
        <Alert className={msg.includes("Welcome") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertDescription className={msg.includes("Welcome") ? "text-green-700" : "text-red-700"}>
            {msg}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default LoginForm
