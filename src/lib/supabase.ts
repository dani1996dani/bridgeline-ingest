import { createClient } from '@supabase/supabase-js'
import 'server-only'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// We export a function or a lazy-initialized client to avoid crashing on module load
// if environment variables are missing (e.g. during build or if not configured yet).
// For simplicity in this project, we'll keep the export but make it safe.

export const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : (null as unknown as ReturnType<typeof createClient>)
// We type it as the client type to avoid TS errors in imports,
// but the runtime check in routes will catch the null.

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    'WARNING: Supabase URL or Service Role Key is missing from environment variables.'
  )
}
