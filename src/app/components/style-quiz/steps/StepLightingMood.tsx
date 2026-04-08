import { ImageCard } from "@/app/components/shared/ImageCard"
import { lightingMoodOptions } from "@/app/utils/quiz-data"

interface Props {
  selected: string | null
  onSelect: (id: string) => void
}

export function StepLightingMood({ selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] leading-[1.2] mb-2">
        What lighting mood do you prefer?
      </h2>
      <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6] mb-8">
        Choose the atmosphere that feels most inviting.
      </p>
      <div className="grid grid-cols-2 gap-[10px]">
        {lightingMoodOptions.map(option => (
          <ImageCard
            key={option.id}
            imageUrl={option.imageUrl}
            label={option.label}
            selected={selected === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  )
}
