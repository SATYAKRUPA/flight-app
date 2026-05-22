'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore, Flight } from '@/store/useFlightStore'
import { createClient } from '@/lib/supabase/client'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(departs: string, arrives: string) {
  const diff = new Date(arrives).getTime() - new Date(departs).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

export default function FlightsPage() {
  const router = useRouter()
  const { searchQuery, setSelectedFlight, setBookingStep } = useFlightStore()
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)

useEffect(() => {
    if (!searchQuery) {
      router.push('/search')
      return
    }

    const fetchFlights = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('origin', searchQuery.origin)
        .eq('destination', searchQuery.destination)
        .eq('status', 'scheduled')
        .gt('departs_at', new Date().toISOString())
        .order('departs_at', { ascending: true })

      if (!error && data) setFlights(data)
      setLoading(false)
    }

    fetchFlights()
  }, [searchQuery])
  

  const handleSelect = (flight: Flight) => {
    setSelectedFlight(flight)
    setBookingStep('seats')
    router.push('/booking/seats')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">✈️</div>
          <p className="text-gray-500 text-lg">Searching flights...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {searchQuery?.origin} → {searchQuery?.destination}
        </h2>
        <p className="text-gray-500">
          {searchQuery?.date} · {searchQuery?.passengerCount} Passenger · {searchQuery?.class}
        </p>
      </div>

      {/* No flights */}
      {flights.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No flights found</h3>
          <p className="text-gray-500 mb-6">Try a different date or route</p>
          <button
            onClick={() => router.push('/search')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Back to Search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {flights.map((flight) => (
            <div
              key={flight.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Flight Info */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{formatTime(flight.departs_at)}</p>
                    <p className="text-gray-500 text-sm">{flight.origin}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">{formatDuration(flight.departs_at, flight.arrives_at)}</p>
                    <div className="flex items-center gap-1">
                      <div className="h-[2px] w-16 bg-gray-300"></div>
                      <span className="text-gray-400">✈️</span>
                      <div className="h-[2px] w-16 bg-gray-300"></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Non-stop</p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{formatTime(flight.arrives_at)}</p>
                    <p className="text-gray-500 text-sm">{flight.destination}</p>
                  </div>
                </div>

                {/* Price & Book */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{flight.aircraft_type}</p>
                    <p className="text-xs text-gray-400">Flight {flight.flight_no}</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{flight.base_price.toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleSelect(flight)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
                  >
                    Select →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}