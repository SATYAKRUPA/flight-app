'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore, Seat } from '@/store/useFlightStore'
import SeatMap from '@/components/seat-map/SeatMap'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SeatsPage() {
  const router = useRouter()
  const { selectedFlight, selectedSeat, setSelectedSeat, setBookingStep } = useFlightStore()

  useEffect(() => {
    if (!selectedFlight) router.push('/search')
  }, [selectedFlight])

  const handleSeatSelect = (seat: Seat) => {
    setSelectedSeat(seat)
  }

  const handleContinue = () => {
    if (!selectedSeat) return
    setBookingStep('passengers')
    router.push('/booking/passengers')
  }

  if (!selectedFlight) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Flight Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-gray-800">
              {selectedFlight.origin} → {selectedFlight.destination}
            </p>
            <p className="text-gray-500 text-sm">
              {formatTime(selectedFlight.departs_at)} · {selectedFlight.flight_no}
            </p>
          </div>
          <p className="text-blue-600 font-bold text-lg">
            ₹{selectedFlight.base_price.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Seat Map */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Select Your Seat
        </h2>
        <SeatMap
          flightId={selectedFlight.id}
          onSeatSelect={handleSeatSelect}
        />
      </div>

      {/* Selected Seat Info */}
      {selectedSeat && (
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 mb-6">
          <p className="font-semibold text-blue-800">
            ✅ Selected: Seat {selectedSeat.seat_number}
          </p>
          <p className="text-blue-600 text-sm capitalize">
            {selectedSeat.class} class
            {selectedSeat.extra_fee > 0 && ` · +₹${selectedSeat.extra_fee} extra`}
          </p>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!selectedSeat}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-lg transition"
      >
        Continue to Passenger Details →
      </button>
    </div>
  )
}