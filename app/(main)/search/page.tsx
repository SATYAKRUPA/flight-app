'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/store/useFlightStore'

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata']

export default function SearchPage() {
  const router = useRouter()
  const { setSearchQuery, setBookingStep } = useFlightStore()

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [passengerCount, setPassengerCount] = useState(1)
  const [flightClass, setFlightClass] = useState<'economy' | 'business' | 'first'>('economy')
  const [error, setError] = useState('')

  const handleSearch = () => {
    if (!origin || !destination || !date) {
      setError('Please fill all fields')
      return
    }
    if (origin === destination) {
      setError('Origin and destination cannot be same')
      return
    }

    setSearchQuery({ origin, destination, date, passengerCount, class: flightClass })
    setBookingStep('flights')
    router.push('/flights')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Find Your Perfect Flight ✈️
          </h1>
          <p className="text-gray-500">Search from hundreds of flights at best prices</p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select City</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select City</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
              <select
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <div className="flex gap-3">
              {(['economy', 'business', 'first'] as const).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setFlightClass(cls)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium capitalize transition ${
                    flightClass === cls
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {cls === 'first' ? '👑 First' : cls === 'business' ? '💼 Business' : '🪑 Economy'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={handleSearch}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl text-lg transition"
          >
            Search Flights 🔍
          </button>
        </div>
      </div>
    </div>
  )
}