import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type FlightClass = 'economy' | 'business' | 'first'

export interface SearchQuery {
  origin: string
  destination: string
  date: string
  passengerCount: number
  class: FlightClass
}

export interface Flight {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: string
  base_price: number
}

export interface Seat {
  id: string
  flight_id: string
  seat_number: string
  class: FlightClass
  is_available: boolean
  extra_fee: number
}

export interface PassengerForm {
  full_name: string
  nationality: string
  dob: string
  // passport_no excluded from persist via partialize
  passport_no?: string
}

type BookingStep = 'search' | 'flights' | 'seats' | 'passengers' | 'confirmation'

interface FlightStore {
  // Search
  searchQuery: SearchQuery | null
  setSearchQuery: (query: SearchQuery) => void

  // Selected flight
  selectedFlight: Flight | null
  setSelectedFlight: (flight: Flight) => void

  // Selected seat
  selectedSeat: Seat | null
  setSelectedSeat: (seat: Seat) => void

  // Booking step
  bookingStep: BookingStep
  setBookingStep: (step: BookingStep) => void

  // Passenger form
  passengerForm: PassengerForm | null
  setPassengerForm: (data: PassengerForm) => void

  // Reset
  resetStore: () => void
}

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      searchQuery: null,
      setSearchQuery: (query) => set({ searchQuery: query }),

      selectedFlight: null,
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),

      selectedSeat: null,
      setSelectedSeat: (seat) => set({ selectedSeat: seat }),

      bookingStep: 'search',
      setBookingStep: (step) => set({ bookingStep: step }),

      passengerForm: null,
      setPassengerForm: (data) => set({ passengerForm: data }),

      resetStore: () => set({
        searchQuery: null,
        selectedFlight: null,
        selectedSeat: null,
        bookingStep: 'search',
        passengerForm: null,
      }),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),
      // passport_no sensitive field exclude chesthamu
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        bookingStep: state.bookingStep,
        passengerForm: state.passengerForm
          ? {
              full_name: state.passengerForm.full_name,
              nationality: state.passengerForm.nationality,
              dob: state.passengerForm.dob,
              // passport_no intentionally excluded
            }
          : null,
      }),
    }
  )
)