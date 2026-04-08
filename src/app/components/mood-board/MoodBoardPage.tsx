import { useState, useCallback, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { Plus, StickyNote, Trash2, Upload, Link as LinkIcon, X, Cloud, ArrowLeft, Send, CheckCircle } from "lucide-react"
import { Container } from "@/app/components/shared/Container"
import { PillButton } from "@/app/components/shared/PillButton"
import { Input } from "@/app/components/ui/input"
import { ColorSwatch } from "@/app/components/shared/ColorSwatch"
import { SiteNav } from "@/app/components/SiteNav"
import { SiteFooter } from "@/app/components/shared/SiteFooter"
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png"
import { useLocalStorage } from "@/app/hooks/useLocalStorage"
import { useColorExtractor } from "@/app/hooks/useColorExtractor"
import { useMoodBoardSync } from "@/app/hooks/useMoodBoardSync"
import { useMoodBoardList } from "@/app/hooks/useMoodBoardList"
import { useAuth } from "@/app/hooks/useAuth"
import { resolveImageUrl } from "@/app/utils/image-url-resolver"
import type { BoardPin, MoodBoard } from "@/app/utils/mood-board-types"

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function MoodBoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const storageKey = `network-mood-board-${boardId}`

  const emptyBoard: MoodBoard = {
    id: boardId || generateId(),
    name: 'Untitled Board',
    pins: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const [board, setBoard] = useLocalStorage<MoodBoard>(storageKey, emptyBoard)
  const { isLoggedIn } = useAuth()
  const { updateBoardSummary } = useMoodBoardList()
  useMoodBoardSync(board, setBoard)

  // Keep board list summary in sync
  useEffect(() => {
    updateBoardSummary(board)
  }, [board, updateBoardSummary])
  const [showUpload, setShowUpload] = useState(false)
  const [showGetMatched, setShowGetMatched] = useState(false)
  const [matchSubmitted, setMatchSubmitted] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { extract } = useColorExtractor()

  const addImagePin = useCallback(async (imageUrl: string) => {
    const colors = await extract(imageUrl)
    const pin: BoardPin = {
      id: generateId(),
      type: 'image',
      imageUrl,
      colors,
      label: '',
      createdAt: Date.now(),
    }
    setBoard(b => ({ ...b, pins: [...b.pins, pin], updatedAt: Date.now() }))
  }, [extract, setBoard])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const url = URL.createObjectURL(file)
      await addImagePin(url)
    }
    setShowUpload(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUrlAdd = async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setUrlError('')
    const { imageUrl, error } = await resolveImageUrl(urlInput.trim())
    if (!imageUrl) {
      setUrlError(error || 'Could not load image from this URL.')
      setUrlLoading(false)
      return
    }
    await addImagePin(imageUrl)
    setUrlInput('')
    setUrlError('')
    setUrlLoading(false)
    setShowUpload(false)
  }

  const addNote = () => {
    const pin: BoardPin = {
      id: generateId(),
      type: 'note',
      note: 'Double-click to edit...',
      colors: [],
      createdAt: Date.now(),
    }
    setBoard(b => ({ ...b, pins: [...b.pins, pin], updatedAt: Date.now() }))
  }

  const deletePin = (id: string) => {
    setBoard(b => ({ ...b, pins: b.pins.filter(p => p.id !== id), updatedAt: Date.now() }))
  }

  const updatePinLabel = (id: string, label: string) => {
    setBoard(b => ({
      ...b,
      pins: b.pins.map(p => p.id === id ? { ...p, label } : p),
      updatedAt: Date.now(),
    }))
  }

  const updatePinNote = (id: string, note: string) => {
    setBoard(b => ({
      ...b,
      pins: b.pins.map(p => p.id === id ? { ...p, note } : p),
      updatedAt: Date.now(),
    }))
  }

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return
    setBoard(b => {
      const pins = [...b.pins]
      const [moved] = pins.splice(dragIndex, 1)
      pins.splice(targetIndex, 0, moved)
      return { ...b, pins, updatedAt: Date.now() }
    })
    setDragIndex(null)
  }

  const handleSubmitMatch = () => {
    // TODO: Send board data to Supabase / edge function for the Network team to review
    // For now, just mark as submitted
    setMatchSubmitted(true)
  }

  const allColors = [...new Set(board.pins.flatMap(p => p.colors))]

  return (
    <div className="min-h-screen bg-[#f0ede6]">
      <SiteNav logoImg={imgRectangle1} onLogoClick={() => navigate("/")} />
      <Container className="py-[40px] md:py-[60px]">
        {/* Back to boards */}
        <button
          onClick={() => navigate('/mood-board/create')}
          className="flex items-center gap-2 font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] hover:opacity-60 transition-opacity duration-150 cursor-pointer mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> All boards
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            {editingName ? (
              <input
                autoFocus
                value={board.name}
                onChange={e => setBoard(b => ({ ...b, name: e.target.value }))}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] bg-transparent outline-none border-b-2 border-[#0f0f0d]"
              />
            ) : (
              <h1
                onClick={() => setEditingName(true)}
                className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] leading-[1.2] cursor-pointer hover:opacity-60 transition-opacity duration-150"
              >
                {board.name}
              </h1>
            )}
            <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#9a9790] mt-1">
              {board.pins.length} {board.pins.length === 1 ? 'pin' : 'pins'}
              {isLoggedIn && (
                <span className="inline-flex items-center gap-1 ml-2 text-[#9a9790]">
                  <Cloud className="w-3 h-3" /> Synced
                </span>
              )}
              {!isLoggedIn && ' · Click title to rename'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 border border-[#d8d3c8] rounded-[100px] px-5 py-2.5 font-['DM_Sans',sans-serif] font-medium text-[12px] text-[#0f0f0d] hover:bg-[#e8e4db] transition-colors duration-150 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Image
            </button>
            <button
              onClick={addNote}
              className="flex items-center gap-2 border border-[#d8d3c8] rounded-[100px] px-5 py-2.5 font-['DM_Sans',sans-serif] font-medium text-[12px] text-[#0f0f0d] hover:bg-[#e8e4db] transition-colors duration-150 cursor-pointer"
            >
              <StickyNote className="w-3.5 h-3.5" /> Add Note
            </button>
            {board.pins.length > 0 && (
              <button
                onClick={() => setShowGetMatched(true)}
                className="flex items-center gap-2 bg-[#0f0f0d] text-[#fafaf8] rounded-[100px] px-5 py-2.5 font-['DM_Sans',sans-serif] font-medium text-[12px] hover:opacity-80 active:scale-[0.98] transition-all duration-150 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Get Matched
              </button>
            )}
          </div>
        </div>

        {/* Color Palette Bar */}
        {allColors.length > 0 && (
          <div className="mb-6 p-4 bg-[#fafaf8] rounded-[12px] border border-[#d8d3c8]">
            <span className="font-['DM_Sans',sans-serif] font-semibold text-[11px] text-[#9a9790] uppercase tracking-[0.12em] block mb-3">
              Extracted Palette
            </span>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {allColors.map((color, i) => (
                <ColorSwatch key={i} color={color} size={36} showLabel />
              ))}
            </div>
          </div>
        )}

        {/* Board Grid */}
        {board.pins.length === 0 ? (
          <div className="text-center py-24 md:py-32">
            <div className="w-14 h-14 bg-[#e8e4db] rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-[#9a9790]" />
            </div>
            <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[24px] text-[#0f0f0d] mb-2">
              Start your mood board
            </h3>
            <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] mb-6 max-w-[360px] mx-auto leading-[1.6]">
              Upload images or add notes to build your renovation inspiration board.
            </p>
            <div className="flex justify-center">
              <PillButton size="md" onClick={() => setShowUpload(true)}>
                Add Your First Image
              </PillButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
            <AnimatePresence>
              {board.pins.map((pin, index) => (
                <motion.div
                  key={pin.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`relative rounded-[12px] overflow-hidden bg-[#fafaf8] border border-[#d8d3c8] group cursor-grab active:cursor-grabbing ${
                    dragIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  {pin.type === 'image' ? (
                    <>
                      <img
                        src={pin.imageUrl}
                        alt={pin.label || 'Mood board pin'}
                        className="w-full aspect-[4/3] object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget
                          const original = img.dataset.original || pin.imageUrl || ''
                          // First failure: try proxying through weserv
                          if (!img.dataset.retried) {
                            img.dataset.retried = '1'
                            img.dataset.original = original
                            img.src = `https://images.weserv.nl/?url=${encodeURIComponent(original)}&w=800&q=80`
                            return
                          }
                          // Final failure: show placeholder
                          img.style.display = 'none'
                          const parent = img.parentElement
                          if (parent && !parent.querySelector('.img-fallback')) {
                            const fallback = document.createElement('div')
                            fallback.className = 'img-fallback w-full aspect-[4/3] bg-[#e8e4db] flex items-center justify-center'
                            fallback.innerHTML = '<span style="font-family:DM Sans,sans-serif;font-size:12px;color:#9a9790">Image could not be loaded</span>'
                            parent.prepend(fallback)
                          }
                        }}
                      />
                      {pin.colors.length > 0 && (
                        <div className="absolute bottom-12 left-3 flex gap-1">
                          {pin.colors.slice(0, 5).map((c, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full border border-white/50"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}
                      <div className="p-3 border-t border-[#d8d3c8]">
                        <input
                          type="text"
                          value={pin.label || ''}
                          onChange={e => updatePinLabel(pin.id, e.target.value)}
                          placeholder="Add a label..."
                          className="w-full font-['DM_Sans',sans-serif] text-[12px] text-[#0f0f0d] placeholder:text-[#9a9790] bg-transparent outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div
                      className="p-5 min-h-[140px]"
                      onDoubleClick={() => setEditingNote(pin.id)}
                    >
                      {editingNote === pin.id ? (
                        <textarea
                          autoFocus
                          value={pin.note || ''}
                          onChange={e => updatePinNote(pin.id, e.target.value)}
                          onBlur={() => setEditingNote(null)}
                          className="w-full h-full min-h-[100px] font-['DM_Sans',sans-serif] text-[13px] text-[#0f0f0d] bg-transparent outline-none resize-none leading-[1.6]"
                        />
                      ) : (
                        <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#0f0f0d] leading-[1.6] whitespace-pre-wrap">
                          {pin.note}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => deletePin(pin.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-[#fafaf8]/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-[#fafaf8] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#6b6860]" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Container>

      {/* Get Matched Modal */}
      <AnimatePresence>
        {showGetMatched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => { setShowGetMatched(false); setMatchSubmitted(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#fafaf8] rounded-[12px] border border-[#d8d3c8] w-full max-w-[440px] p-6 md:p-8 text-center"
            >
              {matchSubmitted ? (
                <>
                  <div className="w-14 h-14 bg-[#e8e4db] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-[#6b6860]" />
                  </div>
                  <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[24px] text-[#0f0f0d] mb-2">
                    Board submitted!
                  </h3>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6] mb-6 max-w-[320px] mx-auto">
                    Our team will review your mood board and match you with interior designers whose style aligns with your vision. We'll be in touch within 1–2 business days.
                  </p>
                  <button
                    onClick={() => { setShowGetMatched(false); setMatchSubmitted(false) }}
                    className="bg-[#0f0f0d] text-[#fafaf8] rounded-[100px] px-7 py-3 font-['DM_Sans',sans-serif] font-medium text-[13px] hover:opacity-80 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-[#e8e4db] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-6 h-6 text-[#6b6860]" />
                  </div>
                  <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[24px] text-[#0f0f0d] mb-2">
                    Get matched with designers
                  </h3>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6] mb-2 max-w-[340px] mx-auto">
                    Submit your mood board to the Network team. We'll review your inspiration and match you with vetted interior designers whose portfolio aligns with your style.
                  </p>
                  <p className="font-['DM_Sans',sans-serif] text-[11px] text-[#9a9790] mb-6">
                    {board.pins.length} {board.pins.length === 1 ? 'pin' : 'pins'} &middot; {allColors.length} colours extracted
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleSubmitMatch}
                      className="w-full bg-[#0f0f0d] text-[#fafaf8] rounded-[100px] px-7 py-3 font-['DM_Sans',sans-serif] font-medium text-[13px] hover:opacity-80 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                    >
                      Submit for matching
                    </button>
                    <button
                      onClick={() => setShowGetMatched(false)}
                      className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] hover:opacity-60 transition-opacity duration-150 cursor-pointer"
                    >
                      Not yet
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#fafaf8] rounded-[12px] border border-[#d8d3c8] w-full max-w-[480px] p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[24px] text-[#0f0f0d]">
                  Add Image
                </h3>
                <button onClick={() => setShowUpload(false)} className="text-[#9a9790] hover:opacity-60 cursor-pointer transition-opacity duration-150">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="font-['DM_Sans',sans-serif] font-semibold text-[11px] text-[#9a9790] uppercase tracking-[0.12em] block mb-2">
                  Upload from device
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[#d8d3c8] rounded-[12px] p-8 text-center cursor-pointer hover:border-[#0f0f0d]/30 hover:bg-[#f0ede6] transition-all duration-150"
                >
                  <Upload className="w-7 h-7 text-[#9a9790] mx-auto mb-2" />
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860]">
                    Click to browse or drag files here
                  </p>
                  <p className="font-['DM_Sans',sans-serif] text-[11px] text-[#9a9790] mt-1">
                    JPG, PNG, WebP
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="font-['DM_Sans',sans-serif] font-semibold text-[11px] text-[#9a9790] uppercase tracking-[0.12em] block mb-2">
                  Or paste a link
                </label>
                <p className="font-['DM_Sans',sans-serif] text-[11px] text-[#9a9790] mb-2">
                  Paste any image URL, or a link from Instagram, Pinterest, etc. We'll extract the image automatically.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
                    placeholder="https://www.instagram.com/p/... or image URL"
                    onKeyDown={e => e.key === 'Enter' && !urlLoading && handleUrlAdd()}
                    disabled={urlLoading}
                  />
                  <button
                    onClick={handleUrlAdd}
                    disabled={!urlInput.trim() || urlLoading}
                    className="flex items-center gap-1.5 bg-[#0f0f0d] text-[#fafaf8] rounded-[10px] px-4 font-['DM_Sans',sans-serif] font-medium text-[12px] disabled:opacity-30 hover:opacity-80 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap"
                  >
                    {urlLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <LinkIcon className="w-3.5 h-3.5" />
                    )}
                    {urlLoading ? 'Loading...' : 'Add'}
                  </button>
                </div>
                {urlError && (
                  <p className="font-['DM_Sans',sans-serif] text-[11px] text-red-500 mt-2">{urlError}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SiteFooter />
    </div>
  )
}
