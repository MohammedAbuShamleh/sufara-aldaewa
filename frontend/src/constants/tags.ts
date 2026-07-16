// صفات التصنيف (Tags) — طبقة تصنيف متعددة للمستخدم لأغراض الفرز والفلترة فقط.
// لا تمنح أي صلاحية؛ الرؤية محكومة بالدور (role) وحده.
import { useEffect, useState } from 'react'
import api from '../services/api'

export interface Tag {
  id: number
  name: string
}

// كاش بسيط داخل الجلسة حتى لا نعيد جلب الصفات في كل شاشة
let cachedTags: Tag[] | null = null
let inflight: Promise<Tag[]> | null = null

export async function fetchTags(): Promise<Tag[]> {
  if (cachedTags) return cachedTags
  if (!inflight) {
    inflight = api
      .get('/tags')
      .then((res) => {
        cachedTags = res.data as Tag[]
        return cachedTags
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** خُطّاف لجلب قائمة كل الصفات (لملء قوائم الاختيار والفلترة). */
export function useTags(): Tag[] {
  const [tags, setTags] = useState<Tag[]>(cachedTags ?? [])

  useEffect(() => {
    let active = true
    fetchTags()
      .then((list) => {
        if (active) setTags(list)
      })
      .catch((err) => console.error('Error loading tags:', err))
    return () => {
      active = false
    }
  }, [])

  return tags
}
