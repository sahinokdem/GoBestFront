"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { fetchWithAuth } from "./fetchWithAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Building2, MapPin, Navigation, Save, Loader2 } from "lucide-react"

type Company = {
  id: number
  name: string
  countryCode: string
  iataCode: string | null
  mode: string
}

type City = {
  id: number
  name: string
  countryCode: string
}

type Station = {
  id: number
  cityId: number
  name: string
  code: string
  stationType: string
  latitude: number
  longitude: number
}

const ccFix = (v: string) => v.trim().toUpperCase().slice(0, 2)
const codeFix = (v: string) => v.trim().toUpperCase()
const iataFix = (v: string) => v.trim().toUpperCase().slice(0, 3)

const AdminDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  // Create maintainer
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [email, setEmail] = useState("")
  const [busyCreate, setBusyCreate] = useState(false)

  // Update company
  const [editId, setEditId] = useState<number | null>(null)
  const editing = useMemo(() => companies.find((c) => c.id === editId) ?? null, [companies, editId])
  const [name, setName] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [iataCode, setIataCode] = useState("")
  const [busyUpdate, setBusyUpdate] = useState(false)

  // City Update state
  const [cities, setCities] = useState<City[]>([])
  const [cityId, setCityId] = useState<number | null>(null)
  const [cityName, setCityName] = useState("")
  const [cityCountry, setCityCountry] = useState("")
  const [cityMsg, setCityMsg] = useState<string | null>(null)
  const [cityBusy, setCityBusy] = useState(false)

  // Station Update state
  const [stations, setStations] = useState<Station[]>([])
  const [stationId, setStationId] = useState<number | null>(null)
  const [stationName, setStationName] = useState("")
  const [stationCode, setStationCode] = useState("")
  const [stationMsg, setStationMsg] = useState<string | null>(null)
  const [stationBusy, setStationBusy] = useState(false)

  const loadCities = async () => {
    try {
      setCityMsg(null)
      const res = await fetch("http://localhost:5293/api/City", { cache: "no-store" })
      if (!res.ok) {
        let why = ""
        try {
          const ct = res.headers.get("content-type") || ""
          if (ct.includes("application/json")) {
            const j = await res.json()
            why = j.details || j.message || JSON.stringify(j)
          } else {
            why = await res.text()
          }
        } catch {}
        throw new Error(why || `HTTP ${res.status}`)
      }
      const data = (await res.json()) as City[]
      setCities(Array.isArray(data) ? data : [])
      if (!cityId && data && data.length > 0) setCityId(data[0].id)
    } catch (e: any) {
      setCityMsg(e?.message || "Could not load cities")
      setCities([])
    }
  }

  useEffect(() => {
    if (cityId == null) return
    const c = cities.find((x) => x.id === cityId)
    if (!c) return
    setCityName(c.name ?? "")
    setCityCountry(c.countryCode ?? "")
  }, [cityId, cities])

  const loadStations = async () => {
    try {
      setStationMsg(null)
      const res = await fetch("http://localhost:5293/api/Station", { cache: "no-store" })
      if (!res.ok) {
        let why = ""
        try {
          const ct = res.headers.get("content-type") || ""
          if (ct.includes("application/json")) {
            const j = await res.json()
            why = j.details || j.message || JSON.stringify(j)
          } else {
            why = await res.text()
          }
        } catch {}
        throw new Error(why || `HTTP ${res.status}`)
      }
      const data = (await res.json()) as Station[]
      setStations(Array.isArray(data) ? data : [])
      if (!stationId && data && data.length > 0) setStationId(data[0].id)
    } catch (e: any) {
      setStationMsg(e?.message || "Could not load stations")
      setStations([])
    }
  }

  useEffect(() => {
    if (stationId == null) return
    const s = stations.find((x) => x.id === stationId)
    if (!s) return
    setStationName(s.name ?? "")
    setStationCode(s.code ?? "")
  }, [stationId, stations])

  useEffect(() => {
    loadCities()
    loadStations()
  }, [])

  const loadCompanies = async () => {
    try {
      const data = await fetchWithAuth<Company[]>("http://localhost:5293/companies", { method: "GET" })
      setCompanies(Array.isArray(data) ? data : [])
      if (!selectedCompanyId && data && data.length > 0) {
        setSelectedCompanyId(data[0].id)
      }
      if (!editId && data && data.length > 0) {
        setEditId(data[0].id)
      }
    } catch (e: any) {
      setMsg(e?.message || "Could not load companies")
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (editId == null) return
    const c = companies.find((x) => x.id === editId)
    if (!c) return
    setName(c.name ?? "")
    setCountryCode(c.countryCode ?? "")
    setIataCode(c.iataCode ?? "")
  }, [editId, companies])

  const clearMessageSoon = () => setTimeout(() => setMsg(null), 2500)
  const isSuccess = (text: string | null) => !!text && /updated|created|assigned/i.test(text)

  const handleCreateMaintainer = async () => {
    if (selectedCompanyId == null) {
      setMsg("Select a company first")
      return
    }
    const e = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setMsg("Enter a valid email")
      return
    }
    try {
      setBusyCreate(true)
      setMsg(null)

      await fetchWithAuth<void>(
        `http://localhost:5293/companyMaintainers/${selectedCompanyId}/users/${encodeURIComponent(e)}`,
        { method: "POST" },
      )

      setMsg("Maintainer created successfully.")
      clearMessageSoon()
      setEmail("")
    } catch (err: any) {
      setMsg(err?.message || "Could not create maintainer")
    } finally {
      setBusyCreate(false)
    }
  }

  const handleUpdateCompany = async () => {
    if (editId == null) {
      setMsg("Select a company to edit")
      return
    }
    const payload = {
      name: name.trim(),
      countryCode: ccFix(countryCode),
      iataCode: iataFix(iataCode),
    }
    if (!payload.name) {
      setMsg("Name is required")
      return
    }
    if (payload.countryCode.length !== 2) {
      setMsg("Country Code must be 2 letters (e.g., TR, DE)")
      return
    }
    if (payload.iataCode && payload.iataCode.length !== 3) {
      setMsg("IATA Code must be 3 letters, or leave it empty")
      return
    }

    try {
      setBusyUpdate(true)
      setMsg(null)

      await fetchWithAuth<void>(`http://localhost:5293/companies/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      setMsg("Updated successfully.")
      clearMessageSoon()

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === editId
            ? {
                ...c,
                name: payload.name,
                countryCode: payload.countryCode,
                iataCode: payload.iataCode || null,
              }
            : c,
        ),
      )
    } catch (err: any) {
      setMsg(err?.message || "Update failed")
    } finally {
      setBusyUpdate(false)
    }
  }

  const handleUpdateCity = async () => {
    if (cityId == null) {
      setCityMsg("Select a city first")
      return
    }
    const payload = {
      name: cityName.trim(),
      countryCode: ccFix(cityCountry),
    }
    if (!payload.name) {
      setCityMsg("City name is required")
      return
    }
    if (payload.countryCode.length !== 2) {
      setCityMsg("Country Code must be 2 letters (e.g., TR, DE)")
      return
    }

    try {
      setCityBusy(true)
      setCityMsg(null)

      await fetchWithAuth<void>(`http://localhost:5293/api/City/${cityId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      setCityMsg("Updated successfully.")
      setTimeout(() => setCityMsg(null), 2500)

      setCities((prev) =>
        prev.map((c) => (c.id === cityId ? { ...c, name: payload.name, countryCode: payload.countryCode } : c)),
      )
    } catch (e: any) {
      setCityMsg(e?.message || "City update failed")
    } finally {
      setCityBusy(false)
    }
  }

  const handleUpdateStation = async () => {
    if (stationId == null) {
      setStationMsg("Select a station first")
      return
    }
    const payload = {
      name: stationName.trim(),
      code: codeFix(stationCode),
    }
    if (!payload.name) {
      setStationMsg("Station name is required")
      return
    }
    if (!payload.code) {
      setStationMsg("Station code is required")
      return
    }

    try {
      setStationBusy(true)
      setStationMsg(null)

      await fetchWithAuth<void>(`http://localhost:5293/api/Station/${stationId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      setStationMsg("Updated successfully.")
      setTimeout(() => setStationMsg(null), 2500)

      setStations((prev) =>
        prev.map((s) => (s.id === stationId ? { ...s, name: payload.name, code: payload.code } : s)),
      )
    } catch (e: any) {
      setStationMsg(e?.message || "Station update failed")
    } finally {
      setStationBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <Alert className={isSuccess(msg) ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertDescription className={isSuccess(msg) ? "text-green-700" : "text-red-700"}>{msg}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="maintainer" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="maintainer">Maintainers</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
        </TabsList>

        <TabsContent value="maintainer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create Company Maintainer
              </CardTitle>
              <CardDescription>Assign a maintainer to manage a specific company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-select">Company</Label>
                <Select
                  value={selectedCompanyId?.toString() || ""}
                  onValueChange={(value: any) => {
                    setSelectedCompanyId(Number(value))
                    setMsg(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>
                            #{c.id} – {c.name} ({c.countryCode})
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {c.mode}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Maintainer Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button onClick={handleCreateMaintainer} disabled={busyCreate} className="w-full">
                {busyCreate ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Maintainer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Update Company
              </CardTitle>
              <CardDescription>Modify company information and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Select
                  value={editId?.toString() || ""}
                  onValueChange={(value: any) => {
                    setEditId(Number(value))
                    setMsg(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        #{c.id} – {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editing && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{editing.mode}</Badge>
                    <span className="text-sm text-gray-600">Current mode</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Company name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-country">Country Code</Label>
                  <Input
                    id="company-country"
                    placeholder="e.g., TR, DE"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    onBlur={() => setCountryCode(ccFix(countryCode))}
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-iata">IATA Code (Optional)</Label>
                  <Input
                    id="company-iata"
                    placeholder="e.g., TK, LH"
                    value={iataCode}
                    onChange={(e) => setIataCode(e.target.value)}
                    onBlur={() => setIataCode(iataFix(iataCode))}
                    maxLength={3}
                  />
                </div>
              </div>

              <Button onClick={handleUpdateCompany} disabled={busyUpdate} className="w-full">
                {busyUpdate ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Company
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Update City
              </CardTitle>
              <CardDescription>Modify city information and country codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city-select">City</Label>
                <Select
                  value={cityId?.toString() || ""}
                  onValueChange={(value: any) => {
                    setCityId(Number(value))
                    setCityMsg(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        #{c.id} — {c.name} ({c.countryCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-name">City Name</Label>
                  <Input
                    id="city-name"
                    placeholder="City name"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city-country">Country Code</Label>
                  <Input
                    id="city-country"
                    placeholder="e.g., TR, DE"
                    value={cityCountry}
                    onChange={(e) => setCityCountry(e.target.value)}
                    onBlur={() => setCityCountry(ccFix(cityCountry))}
                    maxLength={2}
                  />
                </div>
              </div>

              <Button onClick={handleUpdateCity} disabled={cityBusy} className="w-full">
                {cityBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update City
                  </>
                )}
              </Button>

              {cityMsg && (
                <Alert
                  className={cityMsg.includes("success") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}
                >
                  <AlertDescription className={cityMsg.includes("success") ? "text-green-700" : "text-red-700"}>
                    {cityMsg}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Update Station
              </CardTitle>
              <CardDescription>Modify station information and codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="station-select">Station</Label>
                <Select
                  value={stationId?.toString() || ""}
                  onValueChange={(value: any) => {
                    setStationId(Number(value))
                    setStationMsg(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        #{s.id} — {s.name} [{s.code}] · cityId:{s.cityId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="station-name">Station Name</Label>
                  <Input
                    id="station-name"
                    placeholder="Station name"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="station-code">Station Code</Label>
                  <Input
                    id="station-code"
                    placeholder="Station code"
                    value={stationCode}
                    onChange={(e) => setStationCode(e.target.value)}
                    onBlur={() => setStationCode(codeFix(stationCode))}
                  />
                </div>
              </div>

              <Button onClick={handleUpdateStation} disabled={stationBusy} className="w-full">
                {stationBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Station
                  </>
                )}
              </Button>

              {stationMsg && (
                <Alert
                  className={
                    stationMsg.includes("success") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }
                >
                  <AlertDescription className={stationMsg.includes("success") ? "text-green-700" : "text-red-700"}>
                    {stationMsg}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboard
