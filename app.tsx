"use client"

import { useEffect, useState, useRef } from "react"
import { fetchWithAuth } from "./fetchWithAuth"
import MaintainerDashboard from "./maintainer-dashboard"
import AdminDashboard from "./admin-dashboard"
import LoginForm from "./login-form"
import RegisterForm from "./register-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LogOut,
  User,
  MapPin,
  Search as SearchIcon,
  CreditCard,
  Plane,
  Train,
  Bus,
  Calendar,
  Users,
  Shield,
  Clock,
} from "lucide-react"

type BookingResponse = {
  bookingId: number
  totalPrice: number
  status: string
  bookingTime: string
}

interface City {
  id: number
  name: string
  countryCode: string
}

interface Leg {
  order: number
  serviceId: number
  serviceCode: string
  companyName: string
  companyMode: string
  originCity: string
  destCity: string
  departure: string
  arrival: string
  seatTypeName: string
  price: number
}

interface Itinerary {
  itineraryId: number
  summary: string
  totalLegs: number
  totalDuration: string
  totalPrice: number
  legs: Leg[]
}

interface Booking {
  id: number
  originCity: string
  destCity: string
  totalPrice: number
  status: string
  departure: string
  arrival: string
  bookingTime: string
}

type Company = {
  id: number
  name: string
  countryCode: string
  iataCode: string | null
  mode: string
}

const getModeIcon = (mode: string) => {
  switch (mode.toLowerCase()) {
    case "flight":
      return <Plane className="h-4 w-4" />
    case "train":
      return <Train className="h-4 w-4" />
    case "bus":
      return <Bus className="h-4 w-4" />
    default:
      return <MapPin className="h-4 w-4" />
  }
}

const App = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [iataCode, setIataCode] = useState("")

  const [cities, setCities] = useState<City[]>([])
  const [originId, setOriginId] = useState(1)
  const [destId, setDestId] = useState(2)
  const [travelDate, setTravelDate] = useState("2025-08-03")
  const [passengers, setPassengers] = useState(1)
  const [mode, setMode] = useState(0)
  const [groupedRoutes, setGroupedRoutes] = useState<Map<number, Itinerary[]>>(new Map())
  const [msg, setMsg] = useState<string | null>(null)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [bookingsDialogOpen, setBookingsDialogOpen] = useState(false)

  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState(0)

  const isMaintainer = role === 1
  const isAdmin = role === 2

  // scroll hedefi: sonuçlar
  const resultsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      setLoggedIn(!!token)
      setRole(Number(localStorage.getItem("role") || "0"))
    }
  }, [])

  const [bookings, setBookings] = useState<Booking[] | null>(null)

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    // alert() yok — sessiz çıkış
    setLoggedIn(false)
    setRole(0)
    // UI temiz olsun diye yenilemek istersen:
    window.location.reload()
  }

  const handleFetchBookings = async () => {
    if (!loggedIn) {
      // alert yerine direkt auth dialog
      setAuthDialogOpen(true)
      return
    }

    try {
      const data = await fetchWithAuth<Booking[]>("http://localhost:5293/api/bookings", { method: "GET" })

      if (!data || data.length === 0) {
        setMsg("You have no bookings yet")
        setBookings(null)
      } else {
        setMsg(null)
        setBookings(data)
      }
      setBookingsDialogOpen(true)
    } catch (err: any) {
      setMsg(err.message || "Could not fetch bookings")
    }
  }

  const fetchCities = async () => {
    const res = await fetch("http://localhost:5293/api/City")
    setCities(await res.json())
  }

  const fetchCompanies = async () => {
    try {
      const data = await fetchWithAuth<Company[] | undefined>("http://localhost:5293/companies", { method: "GET" })
      setCompanies(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setMsg(e?.message || "Could not load companies")
      setCompanies([])
    }
  }

  const fetchRoutes = async () => {
    setGroupedRoutes(new Map())
    setMsg(null)

    const res = await fetch("http://localhost:5293/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        travelDate,
        originCityId: originId,
        destCityId: destId,
        passengers,
        mode,
      }),
    })

    if (!res.ok) {
      let text = ""
      try {
        const body = await res.clone().json()
        text = body.message || JSON.stringify(body)
      } catch {
        text = await res.text()
      }
      setMsg(text || "No routes found")
      return
    }

    const raw: Itinerary[] = await res.json()

    const enriched = raw.map((it) => ({
      ...it,
      totalPrice: it.legs.reduce((acc, l) => acc + l.price, 0),
    }))

    const grouped = new Map<number, Itinerary[]>()
    for (const it of enriched) {
      if (!it.legs.length) continue
      const sid = it.legs[0].serviceId
      if (!grouped.has(sid)) grouped.set(sid, [])
      grouped.get(sid)!.push(it)
    }

    setGroupedRoutes(grouped)

    // Sonuçlar yüklendiğinde sayfada hemen görünür olsun:
    queueMicrotask(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  useEffect(() => {
    fetchCities()
    fetchCompanies()
  }, [])

  const showSearchForm = !isMaintainer && !isAdmin

  // ★ BOOK: alert() yok, login yoksa dialog aç
  const handleBook = async (itineraryId: number) => {
    if (!loggedIn) {
      setAuthDialogOpen(true)
      return
    }
    try {
      const data = await fetchWithAuth<BookingResponse>("http://localhost:5293/api/bookings", {
        method: "POST",
        body: JSON.stringify({ itineraryId }),
      })

      // Başarılı — popup yok. Sessizce “My Bookings”i gösterelim:
      setMsg(null)
      await handleFetchBookings()
      setBookingsDialogOpen(true)
    } catch (err: any) {
      // 401/403 gelirse auth aç
      const m = String(err?.message || "")
      if (/401|403|unauth/i.test(m)) {
        setAuthDialogOpen(true)
        return
      }
      // Genel hata: üstteki kırmızı msg kartında görünsün
      setMsg(`Booking error: ${m}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GoBest</h1>
            <p className="text-gray-600">Your ultimate travel planning companion</p>
          </div>

          <div className="flex items-center gap-4">
            {loggedIn ? (
              <>
                {!isMaintainer && !isAdmin && (
                  <Button variant="outline" onClick={handleFetchBookings}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    My Bookings
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <User className="h-4 w-4 mr-2" />
                    Sign In / Register
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Welcome to GoBest</DialogTitle>
                    <DialogDescription>
                      Sign in to your account or create a new one to start booking your travels.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                      <LoginForm onSuccess={() => setAuthDialogOpen(false)} />
                    </TabsContent>
                    <TabsContent value="register">
                      <RegisterForm onSuccess={() => setAuthDialogOpen(false)} />
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Bookings Modal */}
        <Dialog open={bookingsDialogOpen} onOpenChange={setBookingsDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                My Bookings
              </DialogTitle>
              <DialogDescription>View and manage your travel bookings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {bookings && bookings.length > 0 ? (
                bookings.map((booking) => (
                  <Card key={booking.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Booking #{booking.id}</h3>
                        <p className="text-sm text-gray-600">
                          {booking.originCity} → {booking.destCity}
                        </p>
                        <p className="text-sm text-gray-500">{new Date(booking.departure).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                          {booking.status}
                        </Badge>
                        <p className="text-lg font-bold text-green-600 mt-1">€{booking.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookings found</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Role-based Dashboards */}
        {loggedIn && isMaintainer && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Company Maintainer Dashboard</CardTitle>
              <CardDescription>Manage your company information and service schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <MaintainerDashboard />
            </CardContent>
          </Card>
        )}

        {loggedIn && isAdmin && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>Manage companies, cities, stations, and maintainers</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminDashboard />
            </CardContent>
          </Card>
        )}

        {/* Search Form - Only show for regular users */}
        {(!loggedIn || (!isMaintainer && !isAdmin)) && (
          <>
        <Card className="mb-10 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <SearchIcon className="h-6 w-6" />
              Find Your Perfect Journey
            </CardTitle>
            <CardDescription>Search and book transportation across multiple providers</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
              {/* From */}
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="origin" className="text-base">From</Label>
              <Select
                value={originId?.toString()}
                onValueChange={(v:any)=>setOriginId(Number(v))}
                disabled={!cities.length}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select origin city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To */}
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="destination" className="text-base">To</Label>
              <Select
                value={destId?.toString()}
                onValueChange={(v:any)=>setDestId(Number(v))}
                disabled={!cities.length}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select destination city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


              {/* Date */}
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="date" className="text-base">Date</Label>
                <Input id="date" type="date" value={travelDate}
                      onChange={(e)=>setTravelDate(e.target.value)}
                      className="h-12 text-base" />
              </div>

              {/* Passengers */}
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="passengers" className="text-base">Passengers</Label>
                <Input id="passengers" type="number" min={1} value={passengers}
                      onChange={(e)=>setPassengers(Number(e.target.value))}
                      className="h-12 text-base" />
              </div>

              {/* Mode */}
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="mode" className="text-base">Mode</Label>
                <Select value={mode.toString()} onValueChange={(v:any)=>setMode(Number(v))}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All</SelectItem>
                    <SelectItem value="1">Bus</SelectItem>
                    <SelectItem value="2">Train</SelectItem>
                    <SelectItem value="3">Flight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <div className="flex items-end lg:col-span-2">
                <Button onClick={fetchRoutes} className="w-full h-12 text-base">
                  <SearchIcon className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


            {/* ★ Search Results — her zaman Search formunun HEMEN ALTINDA */}
            <div ref={resultsRef}>
              {groupedRoutes.size > 0 && (
                <div className="space-y-4 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Available Routes</h2>
                  {[...groupedRoutes.entries()].map(([serviceId, itineraries]) => {
                    const { companyName, companyMode } = itineraries[0].legs[0]
                    const minPrice = Math.min(...itineraries.map((it) => it.totalPrice))

                    return (
                      <Card key={serviceId}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getModeIcon(companyMode)}
                              <div>
                                <CardTitle className="text-lg">{companyName}</CardTitle>
                                <CardDescription className="capitalize">{companyMode}</CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-lg font-semibold">
                              from €{minPrice.toFixed(2)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {itineraries.map((it) => {
                              const customSummary =
                                `${it.totalLegs} legs · ` + `${it.totalDuration.slice(0, 5).replace(":", " h ")} m`
                              const seatChain = it.legs.map((l) => l.seatTypeName).join(" - ")

                              return (
                                <div
                                  key={it.itineraryId}
                                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                                      <span>{customSummary}</span>
                                      <Separator orientation="vertical" className="h-4" />
                                      <span>{seatChain}</span>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900">€{it.totalPrice.toFixed(2)}</div>
                                  </div>
                                  <Button onClick={() => handleBook(it.itineraryId)}>Book Now</Button>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Hata Mesajı (üstte sonuçların da üstünde göstermek istersen buraya alabilirsin) */}
            {msg && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-600">{msg}</p>
                </CardContent>
              </Card>
            )}

            {/* ★ Landing — her zaman EN ALTA */}
            <div className="space-y-8">
              <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardContent className="p-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4">Why Choose GoBest?</h2>
                    <p className="text-xl opacity-90 mb-8">
                      Your one-stop solution for seamless travel planning and booking
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <SearchIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Smart Search</h3>
                    <p className="text-gray-600">
                      Find the best routes across multiple transportation modes - flights, trains, and buses all in one
                      place.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Secure Booking</h3>
                    <p className="text-gray-600">
                      Book with confidence using our secure payment system and get instant confirmation for your travels.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="space-y-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <Clock className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Real-time Updates</h3>
                    <p className="text-gray-600">
                      Stay informed with live updates on your bookings, delays, and schedule changes.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gray-50">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Travel Made Simple</h3>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-center gap-3">
                          <Plane className="h-5 w-5 text-blue-500" />
                          Compare flights from multiple airlines
                        </li>
                        <li className="flex items-center gap-3">
                          <Train className="h-5 w-5 text-green-500" />
                          Book train tickets across different operators
                        </li>
                        <li className="flex items-center gap-3">
                          <Bus className="h-5 w-5 text-orange-500" />
                          Find bus routes for budget-friendly travel
                        </li>
                        <li className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-purple-500" />
                          Flexible date search for best prices
                        </li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                        <h4 className="text-xl font-semibold mb-2">Join Thousands of Happy Travelers</h4>
                        <p className="text-gray-600">Experience hassle-free booking and exceptional customer service</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Bookings List (sayfa içi liste — modal dışında da gösteriliyordu; bıraktım) */}
        {bookings && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                My Bookings
              </CardTitle>
              <CardDescription>Your recent travel bookings and reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold">
                          {b.originCity} → {b.destCity}
                        </span>
                      </div>
                      <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Price</p>
                        <p className="font-semibold">€{b.totalPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Departure</p>
                        <p className="font-semibold">{new Date(b.departure).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Arrival</p>
                        <p className="font-semibold">{new Date(b.arrival).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      Booked on: {new Date(b.bookingTime).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App
