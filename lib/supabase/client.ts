import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Reuse a single browser client. Creating a new client on every call spins up
// multiple auth instances, which can leave a request without the session /
// apikey headers (reads succeed from cache while writes 400 with
// "No API key found in request").
let browserClient: SupabaseClient | undefined

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    // Fail loudly instead of sending a keyless request that PostgREST rejects
    // with a confusing 400 "No `apikey` request header ... was found".
    throw new Error(
      "[v0] Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required."
    )
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
      global: {
        // Explicitly pin the apikey on every request (GET and PATCH/POST alike)
        // so it can never be dropped from a mutation.
        headers: { apikey: supabaseKey },
      },
    })
  }

  return browserClient
}
