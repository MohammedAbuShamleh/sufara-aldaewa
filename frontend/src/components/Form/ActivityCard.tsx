interface ActivityCardProps {
    activity: any
    index: number
    updateActivity: (index: number, field: string, value: any) => void
    fields: Array<{
        key: string
        label: string
        type: 'text' | 'date' | 'textarea' | 'number'
        placeholder?: string
    }>
}

export function ActivityCard({ activity, index, updateActivity, fields }: ActivityCardProps) {
    return (
        <div className="activity-card bg-white rounded-2xl shadow-soft border border-teal/10 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-lightBlueGray">
                <span className="text-sm font-bold text-teal">النشاط #{index + 1}</span>
            </div>

            {fields.map((field) => (
                <div key={field.key}>
                    <label className="block text-xs font-semibold text-darkGray mb-1">
                        {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                        <textarea
                            value={activity[field.key] || ''}
                            onChange={(e) => updateActivity(index, field.key, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal focus:border-teal min-h-[80px]"
                            placeholder={field.placeholder || ''}
                        />
                    ) : (
                        <input
                            type={field.type}
                            value={activity[field.key] || (field.type === 'number' ? 0 : '')}
                            onChange={(e) => updateActivity(index, field.key, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal focus:border-teal"
                            placeholder={field.placeholder || ''}
                            min={field.type === 'number' ? 0 : undefined}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}
