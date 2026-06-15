"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserContextValue {
  id: string | null
  firstName: string
  lastName: string
  email: string
  role: string | null
  loading: boolean
}

const defaultValue: UserContextValue = {
  id: null,
  firstName: "",
  lastName: "",
  email: "",
  role: null,
  loading: true,
}

const UserContext = createContext<UserContextValue>(defaultValue)

export function UserProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<UserContextValue>(defaultValue)

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isMounted) setValue({ ...defaultValue, loading: false })
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, role")
        .eq("id", user.id)
        .single()

      if (!isMounted) return

      setValue({
        id: user.id,
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        email: profile?.email ?? user.email ?? "",
        role: profile?.role ?? null,
        loading: false,
      })
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext)
}
