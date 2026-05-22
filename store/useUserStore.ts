import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Session } from '@supabase/supabase-js'

interface Booking {
  id: string
  pnr_code: string
  status: string
  total_price: number
  flight_id: string
  seat_id: string
  booked_at: string
}

interface UserStore {
  session: Session | null
  setSession: (session: Session | null) => void

  cachedBookings: Booking[]
  setCachedBookings: (bookings: Booking[]) => void

  resetUser: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),

      cachedBookings: [],
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),

      resetUser: () => set({
        session: null,
        cachedBookings: [],
      }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      // Only session token persist cheyyi
      partialize: (state) => ({
        session: state.session,
      }),
    }
  )
)