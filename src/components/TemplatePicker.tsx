import type { ReelTemplate } from '../lib/reelTypes'

type TemplatePickerProps = {
  value: ReelTemplate
  onChange: (next: ReelTemplate) => void
}

const TEMPLATE_DESCRIPTIONS: Record<ReelTemplate, string> = {
  grid: 'Grid of thumbnails + lightbox',
  showcase: 'Featured video first',
  playlist: 'Sidebar playlist + main player',
}

function TemplateButton({
  template,
  label,
  value,
  onClick,
}: {
  template: ReelTemplate
  label: string
  value: ReelTemplate
  onClick: (t: ReelTemplate) => void
}) {
  const selected = template === value
  return (
    <button
      type="button"
      onClick={() => onClick(template)}
      className={[
        'rounded-xl border px-4 py-3 text-left transition',
        selected
          ? 'border-zinc-200 bg-white ring-2 ring-zinc-900'
          : 'border-zinc-200 bg-white hover:bg-zinc-50',
      ].join(' ')}
    >
      <div className="text-sm font-semibold text-zinc-900">{label}</div>
      <div className="mt-1 text-xs text-zinc-600">{TEMPLATE_DESCRIPTIONS[template]}</div>
    </button>
  )
}

export default function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  return (
    <div>
      <div className="mb-2 text-left text-sm font-medium text-zinc-700">Display template</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <TemplateButton template="showcase" label="Showcase" value={value} onClick={onChange} />
        <TemplateButton template="playlist" label="Playlist" value={value} onClick={onChange} />
        <TemplateButton template="grid" label="Grid" value={value} onClick={onChange} />
      </div>
    </div>
  )
}
