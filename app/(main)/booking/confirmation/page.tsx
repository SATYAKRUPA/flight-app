'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/store/useFlightStore'
import Link from 'next/link'
import { Suspense } from 'react'

interface BookingDetails {
  pnr_code: string
  total_price: number
  status: string
  booked_at: string
  flights: {
    flight_no: string
    origin: string
    destination: string
    departs_at: string
    arrives_at: string
    aircraft_type: string
  }
  seats: {
    seat_number: string
    class: string
  }
  passengers: {
    full_name: string
    nationality: string
  }[]
}

function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pnr = searchParams.get('pnr')
  const bookingId = searchParams.get('bookingId')
  const { resetStore } = useFlightStore()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pnr || !bookingId) {
      router.push('/search')
      return
    }
    fetchBooking()
  }, [pnr, bookingId])

  const fetchBooking = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('bookings')
      .select(`
        pnr_code,
        total_price,
        status,
        booked_at,
        flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type),
        seats (seat_number, class),
        passengers (full_name, nationality)
      `)
      .eq('id', bookingId)
      .single()

    if (data) setBooking(data as unknown as BookingDetails)
    setLoading(false)
    resetStore()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading booking details...</p>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="max-w-xl mx-auto">
      {/* Success Banner */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500">Your flight has been successfully booked</p>
      </div>

      {/* PNR Card */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white text-center mb-6">
        <p className="text-blue-200 text-sm mb-1">PNR Code</p>
        <p className="text-4xl font-bold tracking-widest">{booking.pnr_code}</p>
        <p className="text-blue-200 text-sm mt-2">Save this for check-in</p>
      </div>

      {/* Booking Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Flight Details</h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Flight</span>
            <span className="font-medium">{booking.flights.flight_no}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Route</span>
            <span className="font-medium">{booking.flights.origin} → {booking.flights.destination}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Departure</span>
            <span className="font-medium">
              {new Date(booking.flights.departs_at).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Aircraft</span>
            <span className="font-medium">{booking.flights.aircraft_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Seat</span>
            <span className="font-medium capitalize">
              {booking.seats.seat_number} · {booking.seats.class}
            </span>
          </div>
          {booking.passengers[0] && (
            <div className="flex justify-between">
              <span className="text-gray-500">Passenger</span>
              <span className="font-medium">{booking.passengers[0].full_name}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="text-gray-700 font-semibold">Total Paid</span>
            <span className="text-blue-600 font-bold text-lg">
              ₹{booking.total_price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/my-bookings"
          className="flex-1 text-center bg-white border-2 border-blue-600 text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-50 transition"
        >
          My Bookings
        </Link>
        <Link
          href="/search"
          className="flex-1 text-center bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Book Another
        </Link>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
}