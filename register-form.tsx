"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

type RegisterResponse = {
  token: string
  id: number
  fullName: string
  email: string
  role: number
}

interface RegisterFormProps {
  onSuccess?: () => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setMessage("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("http://localhost:5293/api/Auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        setMessage(errorData.message || "Registration failed. Please try again.")
        return
      }

      const data: RegisterResponse = await res.json()
      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.role.toString())

      setMessage(`Registration successful! Welcome, ${data.fullName}!`)

      setTimeout(() => {
        onSuccess?.()
        window.location.reload()
      }, 1000)
    } catch (err) {
      setMessage("Network error. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegister()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
      </div>

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
          placeholder="Create a password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
      </div>

      <Button onClick={handleRegister} className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      {message && (
        <Alert className={message.includes("successful") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertDescription className={message.includes("successful") ? "text-green-700" : "text-red-700"}>
            {message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default RegisterForm
