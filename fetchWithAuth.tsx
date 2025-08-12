export async function fetchWithAuth<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token")

  const headers = new Headers(init.headers || {})
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(url, { ...init, headers })

  // ✦ Non-OK: message + details önceliği
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const ct = res.headers.get("Content-Type") || ""
      if (ct.includes("application/json")) {
        const j = await res.json()
        // details varsa onu göster, yoksa message
        message = j.details || j.message || JSON.stringify(j)
      } else {
        message = await res.text()
      }
    } catch {
      /* yoksay */
    }

    if (res.status === 401 || res.status === 403) {
      // Clear invalid token
      localStorage.removeItem("token")
      localStorage.removeItem("role")
      // Trigger auth dialog by dispatching a custom event
      window.dispatchEvent(new CustomEvent("auth-required"))
      throw new Error("Authentication required. Please log in.")
    }

    throw new Error(message || "Request failed")
  }

  // ✦ OK ama boş gövde (204 veya content-length: 0)
  if (res.status === 204) {
    // @ts-expect-error: T void olabilir
    return undefined
  }
  const len = res.headers.get("content-length")
  if (len === "0") {
    // @ts-expect-error
    return undefined
  }

  // ✦ JSON varsa parse et
  const ct = res.headers.get("Content-Type") || ""
  if (ct.includes("application/json")) {
    return (await res.json()) as T
  }
  // ✦ JSON değilse text dön (nadir)
  return (await res.text()) as unknown as T
}
