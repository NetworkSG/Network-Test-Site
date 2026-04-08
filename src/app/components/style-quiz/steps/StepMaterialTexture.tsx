import { ImageCard } from "@/app/components/shared/ImageCard"
import { materialTextureOptions } from "@/app/utils/quiz-data"

interface Props {
  selected: string[]
  onSelect: (ids: string[]) => void
}

export function StepMaterialTexture({ selected, onSelect }: Props) {
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
        Which materials & textures appeal to you?
      </h2>
      <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6] mb-8">
        Pick up to 3 materials you'd love to see in your home.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-[10px]">
        {materialTextureOptions.map(option => (
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
