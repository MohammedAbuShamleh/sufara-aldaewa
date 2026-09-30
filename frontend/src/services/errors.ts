/**
 * استخراج رسالة الخطأ من ردّ الخادم دون اللجوء إلى `any`.
 *
 * ردود Laravel تأتي على شكلين: رسالة واحدة في `message`، أو أخطاء تحقّق
 * مفهرسة بالحقل في `errors`. نأخذ أول ما نجده، وإلا فالرسالة الاحتياطية.
 */
interface ApiErrorShape {
  response?: {
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }
}

export function errorMessage(err: unknown, fallback: string): string {
  const data = (err as ApiErrorShape)?.response?.data
  if (typeof data?.message === 'string' && data.message) return data.message

  const firstField = Object.values(data?.errors ?? {})[0]
  if (Array.isArray(firstField) && typeof firstField[0] === 'string') return firstField[0]

  return fallback
}
