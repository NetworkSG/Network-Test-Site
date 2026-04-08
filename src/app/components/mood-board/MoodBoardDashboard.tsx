import { useEffect } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { Plus, Trash2, Image, Clock } from "lucide-react"
import { Container } from "@/app/components/shared/Container"
import { SectionLabel } from "@/app/components/shared/SectionLabel"
import { PillButton } from "@/app/components/shared/PillButton"
import { SiteNav } from "@/app/components/SiteNav"
import { SiteFooter } from "@/app/components/shared/SiteFooter"
import { useMoodBoardList } from "@/app/hooks/useMoodBoardList"
import { useAuth } from "@/app/hooks/useAuth"
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png"

export function MoodBoardDashboard() {
  const { boards, createBoard, deleteBoard, syncFromSupabase } = useMoodBoardList()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  // Sync from Supabase on mount
  useEffect(() => {
    if (isLoggedIn) syncFromSupabase()
  }, [isLoggedIn, syncFromSupabase])

  const handleNewBoard = () => {
    const id = createBoard()
    navigate(`/mood-board/create/${id}`)
  }

  const handleOpenBoard = (id: string) => {
    navigate(`/mood-board/create/${id}`)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteBoard(id)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-[#f0ede6]">
      <SiteNav logoImg={imgRectangle1} onLogoClick={() => navigate("/")} />
      <Container className="py-[40px] md:py-[60px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <SectionLabel className="mb-3">
              <span className="inline-block w-8 h-px bg-[#d8d3c8] mr-3" />
              Mood Boards
            </SectionLabel>
            <h1 className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] leading-[1.2]">
              Your boards
            </h1>
            <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#9a9790] mt-1">
              {boards.length} {boards.length === 1 ? 'board' : 'boards'}
            </p>
          </div>
          <button
            onClick={handleNewBoard}
            className="flex items-center gap-2 bg-[#0f0f0d] text-[#fafaf8] rounded-[100px] px-5 py-2.5 font-['DM_Sans',sans-serif] font-medium text-[12px] hover:opacity-80 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Board
          </button>
        </div>

        {/* Board Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-20 md:py-28">
            <div className="w-14 h-14 bg-[#e8e4db] rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="w-6 h-6 text-[#9a9790]" />
            </div>
            <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[24px] text-[#0f0f0d] mb-2">
              No boards yet
            </h3>
            <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] mb-6 max-w-[340px] mx-auto leading-[1.6]">
              Create your first mood board to start collecting renovation inspiration.
            </p>
            <div className="flex justify-center">
              <PillButton size="md" onClick={handleNewBoard}>
                Create Your First Board
              </PillButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
            {/* New Board Card */}
            <motion.button
              onClick={handleNewBoard}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="rounded-[12px] border border-dashed border-[#d8d3c8] bg-transparent h-[220px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#0f0f0d]/30 hover:bg-[#fafaf8]/50 transition-all duration-150"
            >
              <div className="w-10 h-10 rounded-full bg-[#e8e4db] flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#6b6860]" />
              </div>
              <span className="font-['DM_Sans',sans-serif] font-medium text-[13px] text-[#6b6860]">
                New Board
              </span>
            </motion.button>

            {/* Existing Boards */}
            <AnimatePresence>
              {boards.map((board) => (
                <motion.div
                  key={board.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  onClick={() => handleOpenBoard(board.id)}
                  className="rounded-[12px] border border-[#d8d3c8] bg-[#fafaf8] overflow-hidden cursor-pointer group hover:border-[#0f0f0d]/20 transition-all duration-150"
                >
                  {/* Thumbnail */}
                  <div className="h-[140px] bg-[#e8e4db] overflow-hidden">
                    {board.thumbnail ? (
                      <img
                        src={board.thumbnail}
                        alt={board.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-[#d8d3c8]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[18px] text-[#0f0f0d] leading-[1.3] mb-1 truncate">
                      {board.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-['DM_Sans',sans-serif] text-[11px] text-[#9a9790] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(board.updatedAt)} &middot; {board.pinCount} {board.pinCount === 1 ? 'pin' : 'pins'}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, board.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#e8e4db] transition-all duration-150 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#9a9790]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Container>
      <SiteFooter />
    </div>
  )
}
