// نوع البرنامج المشترك فيه الداعية
export type ProgramType = 'scientific' | 'dawah' | 'joint'

export const PROGRAM_OPTIONS: { value: ProgramType; label: string }[] = [
  { value: 'scientific', label: 'البرنامج العلمي' },
  { value: 'dawah', label: 'البرنامج الدعوي' },
  { value: 'joint', label: 'البرنامج المشترك' },
]

export function programLabel(type: string | null | undefined): string {
  if (type === 'scientific') return 'البرنامج العلمي'
  if (type === 'dawah') return 'البرنامج الدعوي'
  if (type === 'joint') return 'البرنامج المشترك'
  return ''
}
