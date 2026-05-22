'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Booking {
  id: string
  pnr_code: string
  status: string
  total_price: number
  booked_at: string
  flight_id: string
  seat_id: string
  flights: {
    flight_no: string
    origin: string
    destination: string
    departs_at: string
    arrives_at: string
    base_price: number
  }
  seats: {
    seat_number: string
    class: string
  }
  passengers: {
    full_name: string
  }[]
}

interface AlternateFlight {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  base_price: number
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  rescheduled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function MyBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelDialog, setCancelDialog] = useState<string | null>(null)
  const [rescheduleDialog, setRescheduleDialog] = useState<Booking | null>(null)
  const [alternateFlights, setAlternateFlights] = useState<AlternateFlight[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('bookings')
      .select(`
        id, pnr_code, status, total_price, booked_at, flight_id, seat_id,
        flights (flight_no, origin, destination, departs_at, arrives_at, base_price),
        seats (seat_number, class),
        passengers (full_name)
      `)
      .order('booked_at', { ascending: false })

    if (data) setBookings(data as unknown as Booking[])
    setLoading(false)
  }

  const handleCancel = async (bookingId: string) => {
    setActionLoading(true)
    const supabase = createClient()

    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
    })

    if (error) {
      setMessage(`❌ ${error.message}`)
    } else {
      setMessage('✅ Booking cancelled successfully!')
      fetchBookings()
    }

    setCancelDialog(null)
    setActionLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleRescheduleOpen = async (booking: Booking) => {
    setRescheduleDialog(booking)
    const supabase = createClient()

    const { data } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', booking.flights.origin)
      .eq('destination', booking.flights.destination)
      .eq('status', 'scheduled')
      .neq('id', booking.flight_id)
      .gt('departs_at', new Date().toISOString())

    if (data) setAlternateFlights(data)
  }

  const handleReschedule = async (newFlight: AlternateFlight) => {
    if (!rescheduleDialog) return
    setActionLoading(true)
    const supabase = createClient()

    const feeDiff = Math.max(0, newFlight.base_price - rescheduleDialog.flights.base_price)

    // Insert reschedule record
    const { error: rescheduleError } = await supabase.from('reschedules').insert({
      booking_id: rescheduleDialog.id,
      old_flight_id: rescheduleDialog.flight_id,
      new_flight_id: newFlight.id,
      fee_charged: feeDiff,
    })

    if (rescheduleError) {
      setMessage('❌ Reschedule failed. Please try again.')
      setActionLoading(false)
      return
    }

    // Update booking
    await supabase
      .from('bookings')
      .update({
        flight_id: newFlight.id,
        status: 'rescheduled',
        total_price: rescheduleDialog.total_price + feeDiff,
      })
      .eq('id', rescheduleDialog.id)

    setMessage(`✅ Rescheduled! ${feeDiff > 0 ? `Extra fee: ₹${feeDiff}` : 'No extra fee.'}`)
    setRescheduleDialog(null)
    fetchBookings()
    setActionLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading bookings...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Bookings ✈️</h1>

      {/* Message */}
      {message && (
        <div className="bg-gray-100 rounded-xl px-4 py-3 mb-4 text-sm font-medium text-gray-700">
          {message}
        </div>
      )}

      {/* No bookings */}
      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
          <p className="text-gray-500 mb-6">Search and book your first flight!</p>
          <button
            onClick={() => router.push('/search')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Search Flights
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-gray-800 text-lg">
                    {booking.flights.origin} → {booking.flights.destination}
                  </p>
                  <p className="text-gray-500 text-sm">
                    PNR: <span className="font-mono font-bold text-blue-600">{booking.pnr_code}</span>
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[booking.status]}`}>
                  {booking.status}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400">Flight</p>
                  <p className="font-medium text-sm">{booking.flights.flight_no}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Departure</p>
                  <p className="font-medium text-sm">
                    {new Date(booking.flights.departs_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Seat</p>
                  <p className="font-medium text-sm capitalize">
                    {booking.seats.seat_number} · {booking.seats.class}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="font-bold text-blue-600">₹{booking.total_price.toLocaleString()}</p>
                </div>
              </div>

              {/* Passenger */}
              {booking.passengers[0] && (
                <p className="text-sm text-gray-500 mb-4">
                  👤 {booking.passengers[0].full_name}
                </p>
              )}

              {/* Actions */}
              {booking.status !== 'cancelled' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRescheduleOpen(booking)}
                    className="flex-1 border-2 border-blue-500 text-blue-600 font-medium py-2 rounded-lg hover:bg-blue-50 transition text-sm"
                  >
                    🔄 Reschedule
                  </button>
                  <button
                    onClick={() => setCancelDialog(booking.id)}
                    className="flex-1 border-2 border-red-400 text-red-500 font-medium py-2 rounded-lg hover:bg-red-50 transition text-sm"
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Dialog */}
      {cancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Cancel Booking?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone.
              Cancellations within 2 hours of departure are not allowed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelDialog(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancel(cancelDialog)}
                disabled={actionLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Dialog */}
      {rescheduleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Reschedule Flight</h3>
            <p className="text-gray-500 text-sm mb-4">
              Select an alternative flight on the same route:
            </p>

            {alternateFlights.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No alternate flights available</p>
            ) : (
              <div className="space-y-3">
                {alternateFlights.map((flight) => {
                  const feeDiff = Math.max(0, flight.base_price - rescheduleDialog.flights.base_price)
                  return (
                    <div
                      key={flight.id}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">{flight.flight_no}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(flight.departs_at).toLocaleString('en-IN')}
                          </p>
                          {feeDiff > 0 && (
                            <p className="text-xs text-orange-500">+₹{feeDiff} extra fee</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleReschedule(flight)}
                          disabled={actionLoading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => setRescheduleDialog(null)}
              className="w-full mt-4 border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}