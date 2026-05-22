'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore, Seat } from '@/store/useFlightStore'

interface SeatMapProps {
  flightId: string
  onSeatSelect: (seat: Seat) => void
}

const classColors = {
  first: {
    available: 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200 text-yellow-800',
    occupied: 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed',
    selected: 'bg-yellow-500 border-yellow-600 text-white',
  },
  business: {
    available: 'bg-blue-100 border-blue-400 hover:bg-blue-200 text-blue-800',
    occupied: 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed',
    selected: 'bg-blue-500 border-blue-600 text-white',
  },
  economy: {
    available: 'bg-green-100 border-green-400 hover:bg-green-200 text-green-800',
    occupied: 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed',
    selected: 'bg-green-500 border-green-600 text-white',
  },
}

export default function SeatMap({ flightId, onSeatSelect }: SeatMapProps) {
  const { selectedSeat } = useFlightStore()
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{ seat: Seat; x: number; y: number } | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Fetch seats
    const fetchSeats = async () => {
      const { data } = await supabase
        .from('seats')
        .select('*')
        .eq('flight_id', flightId)
        .order('seat_number')
      if (data) setSeats(data)
      setLoading(false)
    }

    fetchSeats()

    // Realtime subscription
    const channelName = `seats-${flightId}-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'seats', filter: `flight_id=eq.${flightId}` },
        (payload) => {
          setSeats((prev) =>
            prev.map((s) => (s.id === payload.new.id ? (payload.new as Seat) : s))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [flightId])

  const groupedSeats = {
    first: seats.filter((s) => s.class === 'first'),
    business: seats.filter((s) => s.class === 'business'),
    economy: seats.filter((s) => s.class === 'economy'),
  }

  const groupByRow = (seatList: Seat[]) => {
    const rows: Record<string, Seat[]> = {}
    seatList.forEach((seat) => {
      const row = seat.seat_number.slice(0, -1)
      if (!rows[row]) rows[row] = []
      rows[row].push(seat)
    })
    return rows
  }

  const getSeatStyle = (seat: Seat) => {
    const colors = classColors[seat.class]
    if (selectedSeat?.id === seat.id) return colors.selected
    if (!seat.is_available) return colors.occupied
    return colors.available
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <p className="text-gray-500">Loading seat map...</p>
      </div>
    )
  }

  const renderClass = (className: 'first' | 'business' | 'economy', label: string) => {
    const rows = groupByRow(groupedSeats[className])
    return (
      <div className="mb-8">
        <div className={`text-center py-2 rounded-lg mb-4 font-semibold text-sm
          ${className === 'first' ? 'bg-yellow-100 text-yellow-800' :
            className === 'business' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'}`}>
          {label}
        </div>
        <div className="space-y-2">
          {Object.entries(rows).map(([rowNum, rowSeats]) => (
            <div key={rowNum} className="flex items-center justify-center gap-1">
              <span className="text-xs text-gray-400 w-6 text-right">{rowNum}</span>
              <div className="flex gap-1">
                {rowSeats.slice(0, 3).map((seat) => (
                  <button
                    key={seat.id}
                    disabled={!seat.is_available}
                    onClick={() => seat.is_available && onSeatSelect(seat)}
                    onMouseEnter={(e) => setTooltip({ seat, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                    className={`w-8 h-8 rounded text-xs font-medium border-2 transition ${getSeatStyle(seat)}`}
                  >
                    {seat.seat_number.slice(-1)}
                  </button>
                ))}
              </div>
              <div className="w-4" />
              <div className="flex gap-1">
                {rowSeats.slice(3).map((seat) => (
                  <button
                    key={seat.id}
                    disabled={!seat.is_available}
                    onClick={() => seat.is_available && onSeatSelect(seat)}
                    onMouseEnter={(e) => setTooltip({ seat, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                    className={`w-8 h-8 rounded text-xs font-medium border-2 transition ${getSeatStyle(seat)}`}
                  >
                    {seat.seat_number.slice(-1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-400" />
          <span className="text-xs text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200 border-2 border-gray-300" />
          <span className="text-xs text-gray-600">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500 border-2 border-green-600" />
          <span className="text-xs text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-400" />
          <span className="text-xs text-gray-600">First Class</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400" />
          <span className="text-xs text-gray-600">Business</span>
        </div>
      </div>

      <div className="text-center text-4xl mb-4">✈️</div>
      <div className="text-center text-xs text-gray-400 mb-6">FRONT OF AIRCRAFT</div>

      <div className="overflow-y-auto max-h-[60vh] px-4">
        {renderClass('first', '👑 First Class')}
        {renderClass('business', '💼 Business Class')}
        {renderClass('economy', '🪑 Economy Class')}
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 pointer-events-none"
          style={{ top: tooltip.y - 60, left: tooltip.x - 50 }}
        >
          <p>Seat {tooltip.seat.seat_number}</p>
          <p className="capitalize">{tooltip.seat.class}</p>
          <p>{tooltip.seat.is_available ? '✅ Available' : '❌ Occupied'}</p>
          {tooltip.seat.extra_fee > 0 && <p>+₹{tooltip.seat.extra_fee}</p>}
        </div>
      )}
    </div>
  )
}