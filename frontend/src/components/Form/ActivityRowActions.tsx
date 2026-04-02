import '../../styles/theme.css'

const DELETE_CONFIRM_MESSAGE = 'هل أنت متأكد من حذف هذا النشاط؟ لا يمكن التراجع عن هذا الإجراء.'

interface ActivityRowActionsProps {
  rowId: string
  onDelete: () => void
  onEdit: () => void
  isEditing?: boolean
  compact?: boolean
}

export function ActivityRowActions({ rowId, onDelete, onEdit, isEditing, compact }: ActivityRowActionsProps) {
  const handleDelete = () => {
    if (window.confirm(DELETE_CONFIRM_MESSAGE)) {
      onDelete()
    }
  }

  const handleEdit = () => {
    if (!isEditing) {
      const el = document.getElementById(rowId)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    onEdit()
  }

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button
        type="button"
        onClick={handleEdit}
        className={`
          inline-flex items-center gap-1 rounded-lg font-semibold transition-all duration-200
          ${compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}
          ${isEditing
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-teal hover:text-white'
          }
        `}
        title={isEditing ? 'حفظ التعديل' : 'تعديل النشاط'}
      >
        {isEditing ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            حفظ
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            تعديل
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        className={`
          inline-flex items-center gap-1 rounded-lg font-semibold transition-all duration-200
          ${compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}
          bg-slate-100 text-slate-400 hover:bg-coral hover:text-white
        `}
        title="حذف النشاط"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {!compact && 'حذف'}
      </button>
    </div>
  )
}
