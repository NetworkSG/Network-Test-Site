import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "@/app/hooks/useAuth"
import { AuthModal } from "@/app/components/shared/AuthModal"
import { MoodBoardDashboard } from "./MoodBoardDashboard"

export function MoodBoardGate() {
  const { isLoggedIn } = useAuth()
  const [showAuth, setShowAuth] = useState(!isLoggedIn)
  const navigate = useNavigate()

  if (!isLoggedIn) {
    return (
      <AuthModal
        open={showAuth}
        onClose={() => {
          setShowAuth(false)
          navigate("/mood-board")
        }}
        onSuccess={() => setShowAuth(false)}
      />
    )
  }

  return <MoodBoardDashboard />
}
