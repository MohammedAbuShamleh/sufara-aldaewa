import { ReactNode } from 'react'

/**
 * عناصر الفلترة الموحّدة للوحة الإدارة (النسخة الثانية).
 *
 * الصفحة الحالية تستعمل أربعة أنماط لنفس الفكرة: <select> أصلي، و dropdown مخصّص
 * بخمسين سطراً وclick-outside، ومجموعة أزرار متلاصقة، ومفتاح تبديل. الفرق بينها
 * شكليّ لا وظيفيّ، فوحّدناها هنا في نمط واحد: عنوان فوق العنصر، نفس الارتفاع،
 * نفس الحواف، ونفس لون التركيز.
 */

/** ارتفاع وحواف موحّدة لكل عناصر التحكّم — مصدر واحد بدل تكرار الأصناف. */
const CONTROL =
  'w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm text-darkGray ' +
  'focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={CONTROL + ' pr-9'}
        />
      </div>
    </Field>
  )
}

export interface Option {
  value: string
  label: string
}

/**
 * قائمة اختيار أصلية — تحلّ محلّ الـ dropdown المخصّص.
 * المتصفح يتكفّل بالتمرير والبحث بالحروف وإغلاق القائمة، فلا نكتبها بأنفسنا.
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  allLabel,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Option[]
  allLabel: string
  disabled?: boolean
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={CONTROL + ' disabled:opacity-50 disabled:cursor-not-allowed'}
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

/** مجموعة خيارات قصيرة تُعرض كلها دفعةً واحدة (٢–٤ خيارات). */
export function SegmentedField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Option[]
}) {
  return (
    <Field label={label}>
      <div className="inline-flex h-11 w-full rounded-xl border border-slate-200 bg-white overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value || 'all'}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-2 text-xs font-semibold transition-all border-l border-slate-100 last:border-l-0 ${
              value === opt.value ? 'bg-teal text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Field>
  )
}

export function ToggleField({
  label,
  checked,
  onChange,
  onLabel,
  offLabel,
  title,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  onLabel: string
  offLabel: string
  title?: string
}) {
  return (
    <Field label={label}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        title={title}
        className={`${CONTROL} flex items-center justify-between gap-2 font-semibold ${
          checked ? 'border-teal bg-teal/5 text-teal' : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <span>{checked ? onLabel : offLabel}</span>
        <span
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
            checked ? 'bg-teal' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
              checked ? 'right-0.5' : 'left-0.5'
            }`}
          />
        </span>
      </button>
    </Field>
  )
}

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

/** متصفّح الشهور — سهمان ونصّ، بنفس ارتفاع بقية العناصر. */
export function MonthField({
  label,
  month,
  year,
  onChange,
}: {
  label: string
  month: number
  year: number
  onChange: (m: number, y: number) => void
}) {
  const step = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y--
    }
    if (m > 12) {
      m = 1
      y++
    }
    onChange(m, y)
  }

  const arrow =
    'h-11 w-10 flex-shrink-0 grid place-items-center rounded-xl border border-slate-200 bg-white ' +
    'text-slate-500 hover:bg-slate-50 hover:text-teal transition-all'

  return (
    <Field label={label}>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => step(-1)} className={arrow} aria-label="الشهر السابق">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1 h-11 grid place-items-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-darkGray whitespace-nowrap">
          {MONTH_NAMES[month - 1]} {year}
        </div>
        <button type="button" onClick={() => step(1)} className={arrow} aria-label="الشهر التالي">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </Field>
  )
}

/**
 * حاوية شريط الفلترة: شبكة موحّدة، وعدّاد للنتيجة، وزر مسح يظهر فقط حين
 * يوجد فلتر فعّال — فلا يزحم الشريط بزرّ لا يفعل شيئاً.
 */
export function FilterBar({
  children,
  activeCount,
  onClear,
  resultLabel,
}: {
  children: ReactNode
  activeCount: number
  onClear: () => void
  resultLabel?: ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{children}</div>
      {(activeCount > 0 || resultLabel) && (
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
          {resultLabel && <span className="text-xs text-slate-500">{resultLabel}</span>}
          {activeCount > 0 && (
            <button type="button" onClick={onClear} className="text-xs font-semibold text-coral hover:underline mr-auto">
              مسح الفلاتر ({activeCount})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** بطاقة قسم موحّدة — حدّ خفيف بدل الظل الثقيل، فلا تتصارع الأقسام بصرياً. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-slate-200 ${className}`}>{children}</div>
}

export { MONTH_NAMES }
