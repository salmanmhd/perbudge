import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Landing } from "@/components/landing/landing"

export default async function LandingPage() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")
  return <Landing />
}
