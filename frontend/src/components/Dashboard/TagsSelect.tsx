import { useTags, type Tag } from '../../constants/tags'

interface TagsSelectProps {
  /** معرّفات الصفات المختارة */
  value: number[]
  onChange: (ids: number[]) => void
  label?: string
}

/**
 * اختيار متعدد للصفات (checkboxes). المستخدم قد يحمل عدة صفات في آنٍ واحد.
 * الصفات تصنيف فقط ولا تمنح أي صلاحية.
 */
export function TagsSelect({ value, onChange, label = 'الصفات' }: TagsSelectProps) {
  const tags = useTags()

  const toggle = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-darkGray mb-1">{label}</label>
      {tags.length === 0 ? (
        <p className="text-xs text-slate-400 py-1">لا توجد صفات</p>
      ) : (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 bg-lightBlueGray p-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const active = value.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-teal text-white border-teal'
                    : 'bg-white text-darkGray border-gray-300 hover:border-teal'
                }`}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** عرض صفات المستخدم كشرائح صغيرة (chips) للقراءة فقط. */
export function TagChips({ tags, className = '' }: { tags?: Tag[] | null; className?: string }) {
  if (!tags || tags.length === 0) return <span className="text-slate-300">—</span>
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gold/10 text-gold border border-gold/20 whitespace-nowrap"
        >
          {tag.name}
        </span>
      ))}
    </div>
  )
}
