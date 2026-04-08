import { ImageCard } from "@/app/components/shared/ImageCard"
import { roomStyleOptions } from "@/app/utils/quiz-data"

interface Props {
  selected: string[]
  onSelect: (ids: string[]) => void
}

export function StepRoomStyle({ selected, onSelect }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onSelect(selected.filter(s => s !== id))
    } else if (selected.length < 3) {
      onSelect([...selected, id])
    }
  }

  return (
    <div>
      <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] leading-[1.2] mb-2">
        What room styles speak to you?
      </h2>
      <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6] mb-8">
        Pick up to 3 styles that resonate with your vision.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
        {roomStyleOptions.map(option => (
          <ImageCard
            key={option.id}
            imageUrl={option.imageUrl}
            label={option.label}
            selected={selected.includes(option.id)}
            onClick={() => toggle(option.id)}
          />
        ))}
      </div>
    </div>
  )
}
