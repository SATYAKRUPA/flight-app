'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/store/useFlightStore'
import { createClient } from '@/lib/supabase/client'

export default function PassengersPage() {
  const router = useRouter()
  const { selectedFlight, selectedSeat, setPassengerForm, setBookingStep, resetStore } = useFlightStore()

  const [fullName, setFullName] = useState('')
  const [passportNo, setPassportNo] = useState('')
  const [nationality, setNationality] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedFlight || !selectedSeat) router.push('/search')
  }, [selectedFlight, selectedSeat])

  const handleBooking = async () => {
    if (!fullName || !passportNo || !nationality || !dob) {
      setError('Please fill all fields')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Reserve seat via RPC
    const { data: seatReserved } = await supabase.rpc('reserve_seat', {
      p_seat_id: selectedSeat!.id,
      p_flight_id: selectedFlight!.id,
    })

    if (!seatReserved) {
      setError('Sorry! This seat was just booked by someone else. Please select another seat.')
      setLoading(false)
      return
    }

    // Calculate total price
    const totalPrice = selectedFlight!.base_price + selectedSeat!.extra_fee

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        flight_id: selectedFlight!.id,
        seat_id: selectedSeat!.id,
        total_price: totalPrice,
        status: 'confirmed',
      })
      .select()
      .single()

    if (bookingError || !booking) {
      setError('Booking failed. Please try again.')
      setLoading(false)
      return
    }

    // Insert passenger details
    await supabase.from('passengers').insert({
      booking_id: booking.id,
      full_name: fullName,
      passport_no: passportNo,
      nationality,
      dob,
    })

    // Save form (without passport for persist)
    setPassengerForm({ full_name: fullName, nationality, dob, passport_no: passportNo })
    setBookingStep('confirmation')

    router.push(`/booking/confirmation?pnr=${booking.pnr_code}&bookingId=${booking.id}`)
  }

  if (!selectedFlight || !selectedSeat) return null

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
          <span className="text-sm text-gray-500">Flight</span>
        </div>
        <div className="h-[2px] w-8 bg-blue-600" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
          <span className="text-sm text-gray-500">Seat</span>
        </div>
        <div className="h-[2px] w-8 bg-blue-600" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
          <span className="text-sm font-semibold text-blue-600">Passenger</span>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 mb-6">
        <p className="font-semibold text-blue-800">
          {selectedFlight.origin} → {selectedFlight.destination}
        </p>
        <p className="text-blue-600 text-sm">
          Seat {selectedSeat.seat_number} · {selectedSeat.class} class · 
          ₹{(selectedFlight.base_price + selectedSeat.extra_fee).toLocaleString()}
        </p>
      </div>

      {/* Passenger Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Passenger Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="As per passport"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
            <input
              type="text"
              value={passportNo}
              onChange={(e) => setPassportNo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. A1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Indian"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-4">{error}</p>
        )}

        <button
          onClick={handleBooking}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-lg transition mt-6"
        >
          {loading ? 'Booking...' : 'Confirm Booking ✈️'}
        </button>
      </div>
    </div>
  )
}