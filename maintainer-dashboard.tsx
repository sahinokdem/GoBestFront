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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Building2, Clock, Plus, Minus, RotateCcw, Save, Loader2 } from "lucide-react"

type Company = {
  id: number
  name: string
  countryCode: string
  iataCode: string | null
  mode: string
}

const ccFix = (v: string) => v.trim().toUpperCase().slice(0, 2)
const iataFix = (v: string) => v.trim().toUpperCase().slice(0, 3)

type ServiceLite = {
  id: number
  serviceCode: string
  originCity: string
  destCity: string
  companyName: string
}

const toLocalInputValue = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const toUtcIso = (datetimeLocal: string): string => {
  if (!datetimeLocal) throw new Error("Invalid date")
  const d = new Date(datetimeLocal)
  return d.toISOString()
}

const shiftHours = (datetimeLocal: string, hours: number): string => {
  if (!datetimeLocal) return datetimeLocal
  const d = new Date(datetimeLocal)
  d.setHours(d.getHours() + hours)
  return toLocalInputValue(d)
}

const MaintainerDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [iataCode, setIataCode] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selected = useMemo(() => companies.find((c) => c.id === selectedId) || null, [companies, selectedId])

  const [services, setServices] = useState<ServiceLite[]>([])
  const [servicesMsg, setServicesMsg] = useState<string | null>(null)
  const [servicesLoading, setServicesLoading] = useState(false)
  const [svcFilter, setSvcFilter] = useState("")
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [departureLocal, setDepartureLocal] = useState<string>("")
  const [arrivalLocal, setArrivalLocal] = useState<string>("")

  const loadCompanies = async () => {
    try {
      const list = await fetchWithAuth<Company[]>("http://localhost:5293/companies", { method: "GET" })
      setCompanies(list || [])
      if (!selectedId && list && list.length > 0) {
        setSelectedId(list[0].id)
      }
    } catch (err: any) {
      setMsg(err.message || "Could not load companies")
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (selectedId == null) return
    const c = companies.find((x) => x.id === selectedId)
    if (!c) return
    setName(c.name ?? "")
    setCountryCode(c.countryCode ?? "")
    setIataCode(c.iataCode ?? "")
  }, [selectedId, companies])

  const handleUpdate = async () => {
    if (selectedId === null) {
      setMsg("Select a company first")
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

    setMsg(null)
    setLoading(true)
    try {
      await fetchWithAuth<void>(`http://localhost:5293/companies/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      setMsg("Updated successfully.")
      setTimeout(() => setMsg(null), 2500)

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selectedId
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
      setMsg(err.message || "Update failed")
    } finally {
      setLoading(false)
    }
  }

 const loadServices = async () => {
  try {
    setServicesLoading(true);
    setServicesMsg(null);

    const data = await fetchWithAuth<ServiceLite[] | undefined>(
      "http://localhost:5293/services/company",
      { method: "GET", cache: "no-store" as RequestCache }
    );

    const list = Array.isArray(data) ? data : [];
    setServices(list);

    // ★ Otoseçim: ilk servis
    if (!selectedServiceId && list.length > 0) {
      setSelectedServiceId(list[0].id);
    }

    if (list.length === 0) {
      setServicesMsg("No services found.");
    }
  } catch (e: any) {
    setServicesMsg(e?.message || "Could not load services");
    console.error("loadServices error:", e);
  } finally {
    setServicesLoading(false);
  }
};


  useEffect(() => {
    loadServices()
  }, [])

  const filteredServices = useMemo(() => {
    const q = svcFilter.trim().toLowerCase()
    if (!q) return services
    return services.filter(
      (s) =>
        s.serviceCode.toLowerCase().includes(q) ||
        s.originCity.toLowerCase().includes(q) ||
        s.destCity.toLowerCase().includes(q),
    )
  }, [svcFilter, services])

  useEffect(() => {
    setDepartureLocal("")
    setArrivalLocal("")
  }, [selectedServiceId])

  const handleSvcShift = (h: number) => {
    setDepartureLocal((v) => shiftHours(v, h))
    setArrivalLocal((v) => shiftHours(v, h))
  }

  const handleSvcSetNow = () => {
    const now = new Date()
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    setDepartureLocal(toLocalInputValue(now))
    setArrivalLocal(toLocalInputValue(in2h))
  }

  const handleSvcUpdate = async () => {
    if (selectedServiceId == null) {
      setServicesMsg("Select a service first")
      return
    }
    if (!departureLocal || !arrivalLocal) {
      setServicesMsg("Both departure and arrival are required.")
      return
    }

    const dep = new Date(departureLocal).getTime()
    const arr = new Date(arrivalLocal).getTime()
    if (isFinite(dep) && isFinite(arr) && arr < dep) {
      setServicesMsg("Arrival must be after departure.")
      return
    }

    let departureIso = ""
    let arrivalIso = ""
    try {
      departureIso = toUtcIso(departureLocal)
      arrivalIso = toUtcIso(arrivalLocal)
    } catch {
      setServicesMsg("Invalid datetime values.")
      return
    }

    try {
      setServicesLoading(true)
      setServicesMsg(null)

      await fetchWithAuth<void>(`http://localhost:5293/services/${selectedServiceId}`, {
        method: "PUT",
        body: JSON.stringify({
          departureTime: departureIso,
          arrivalTime: arrivalIso,
        }),
      })

      setServicesMsg(`Service #${selectedServiceId} updated!`)
    } catch (err: any) {
      setServicesMsg(err?.message || "Update failed")
    } finally {
      setServicesLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Company Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>Update your company details and information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-select">Company</Label>
            <Select value={selectedId?.toString() || ""} onValueChange={(value: any) => setSelectedId(Number(value))}>
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

          {selected && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selected.mode}</Badge>
                <span className="text-sm text-gray-600">Current mode</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country Code</Label>
              <Input
                id="country"
                placeholder="e.g., TR, DE"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                onBlur={() => setCountryCode(ccFix(countryCode))}
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iata">IATA Code (Optional)</Label>
              <Input
                id="iata"
                placeholder="e.g., TK, LH"
                value={iataCode}
                onChange={(e) => setIataCode(e.target.value)}
                onBlur={() => setIataCode(iataFix(iataCode))}
                maxLength={3}
              />
            </div>
          </div>

          <Button onClick={handleUpdate} disabled={loading} className="w-full">
            {loading ? (
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

          {msg && (
            <Alert className={msg.includes("success") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription className={msg.includes("success") ? "text-green-700" : "text-red-700"}>
                {msg}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Service Time Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Service Time Editor
          </CardTitle>
          <CardDescription>Update departure and arrival times for your services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-filter">Filter Services</Label>
            <Input
              id="service-filter"
              placeholder="Search by code, origin, or destination"
              value={svcFilter}
              onChange={(e) => setSvcFilter(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-select">Service</Label>
            <Select
              value={selectedServiceId?.toString() || ""}
              onValueChange={(value: any) => setSelectedServiceId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {filteredServices.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    #{s.id} · {s.serviceCode} · {s.originCity} → {s.destCity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Time</Label>
              <Input
                id="departure"
                type="datetime-local"
                value={departureLocal}
                onChange={(e) => setDepartureLocal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrival">Arrival Time</Label>
              <Input
                id="arrival"
                type="datetime-local"
                value={arrivalLocal}
                onChange={(e) => setArrivalLocal(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSvcShift(-1)} disabled={servicesLoading}>
              <Minus className="h-4 w-4 mr-1" />
              -1h
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSvcShift(+1)} disabled={servicesLoading}>
              <Plus className="h-4 w-4 mr-1" />
              +1h
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSvcShift(+2)} disabled={servicesLoading}>
              <Plus className="h-4 w-4 mr-1" />
              +2h
            </Button>
            <Button variant="outline" size="sm" onClick={handleSvcSetNow} disabled={servicesLoading}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Set Now/+2h
            </Button>
            <Button
              onClick={handleSvcUpdate}
              disabled={servicesLoading || selectedServiceId == null}
              className="ml-auto"
            >
              {servicesLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Service
                </>
              )}
            </Button>
          </div>

          {servicesMsg && (
            <Alert
              className={servicesMsg.includes("updated!") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}
            >
              <AlertDescription className={servicesMsg.includes("updated!") ? "text-green-700" : "text-red-700"}>
                {servicesMsg}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MaintainerDashboard
