"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
export default function LoginPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pageType, setPageType] = useState("login")

  const router = useRouter()

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    console.log("Login form submitted")
    if (pageType === "login") {
      const res = await axios.post(`${BASE_URL}/user/login`, {
        email,
        password,
      })
      if (res.status === 200) {
        const data = res.data.data
        // const  = data?.loggedInUser._id
        const { fullName, email, _id: userId } = data?.loggedInUser
        const token = data?.accessToken
        localStorage.setItem("token", token)
        localStorage.setItem("fullName", fullName)
        localStorage.setItem("email", email)
        localStorage.setItem("userId", userId)
        router.push("/dashboard")
        toast.success("Login successful", {
          description: "You have successfully logged in",
        })
      } else {
        toast.error(res.data?.msg)
      }
      console.log(res)
    } else {
      const res = await axios.post(`${BASE_URL}/user/register`, {
        email,
        password,
        fullName,
      })
      if (res.data.status === 201) {
        toast.success("User created successfully", {
          description: "Please login, to continue using your account",
        })
      }
      console.log(res.data)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md border shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {pageType === "login"
              ? "Sign in to your account to continue"
              : "Register your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {pageType === "register" && (
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  className="h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                className="h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="mt-6 h-11 w-full bg-primary font-medium text-primary-foreground hover:bg-primary/90"
            >
              {pageType === "login" ? "Sign In" : "Register"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {pageType === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                onClick={() =>
                  setPageType(pageType === "login" ? "register" : "login")
                }
                className="ml-2 font-medium text-primary hover:text-primary/80"
              >
                {pageType === "login" ? "Register" : "Login"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
