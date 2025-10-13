import { z } from 'zod'

export const Kpis = z.object({
  waiting_now: z.number(),
  answered_today: z.number(),
  agents_online: z.number(),
  updated_at: z.string(),
})
export type Kpis = z.infer<typeof Kpis>
