# 🎨 GoBest — Frontend

> 🇬🇧 For English: [README.md](README.md)

**GoBest**'in web arayüzü — uçak, otobüs ve tren seferlerini birleştiren çok modlu bir seyahat rezervasyon platformu. Bu uygulama kullanıcı tarafıdır; [GoBest backend](https://github.com/sahinokdem/GoBestBackend) ile bir REST API üzerinden konuşur.

> Kısaca: rol bazlı bir seyahat rezervasyon arayüzü — müşteriler çok bacaklı rotaları arayıp satın alır, şirket yöneticileri (maintainer) kendi seferlerini yönetir, adminler platformun referans verisini yönetir.

---

## 🚀 Teknoloji

- **Framework:** Next.js 15 (App Router) + React 19
- **Dil:** TypeScript
- **Stil:** Tailwind CSS 4
- **Bileşenler:** shadcn/ui (Radix UI primitives)
- **Form & Doğrulama:** React Hook Form + Zod
- **Auth:** JWT tabanlı, rol farkındalıklı (Customer / Company Maintainer / Admin)

---

## 👥 Rol Bazlı Deneyim

GoBest üç rolü destekler, her birinin kendi arayüzü vardır.

### Customer — Ara & Satın Al

Müşteriler tüm ulaşım türlerini tek bir formdan arar (kalkış, varış, tarih, yolcu, mod) ve bir rota listesi alır — bacak bazlı detaylar ve koltuk tipi fiyatlarıyla birlikte **aktarmalı rota seçenekleri** dahil.

![Arama formu](docs/search-form.png)

![Arama sonuçları — 2 bacaklı rota](docs/search-results-2leg.png)

![Arama sonuçları — koltuk tipli 3 bacaklı rota](docs/search-results-3leg.png)

Satın almadan önce kimlik doğrulama, bir giriş / kayıt modal'ı üzerinden yapılır.

![Giriş / Kayıt](docs/auth-modal.png)

### Company Maintainer — Servis Yönetimi

Şirket yöneticileri kendi şirketlerinin bilgilerini ve sefer programlarını yönetir; kalkış/varış saatlerini ayarlamak için bir servis saati editörü dahil.

![Company Maintainer paneli](docs/maintainer-dashboard.png)

![Servis saati editörü](docs/maintainer-service-editor.png)

### Admin — Platform Verisi Yönetimi

Adminler platformun referans verisini yönetir — şirket yöneticisi (maintainer) oluşturma ve şirket, şehir, istasyon bilgilerini düzenleme (çoğu zaman harici servis API'sinden gelen eksik veriyi tamamlama).

![Admin — maintainer oluştur](docs/admin-create-maintainer.png)

![Admin — şirket güncelle](docs/admin-update-company.png)

![Admin — şehir güncelle](docs/admin-update-city.png)

---

## 🎯 Landing

Landing sayfası ürünü ve temel değerini tanıtır: uçak, tren ve otobüsü tek yerde karşılaştırma ve esnek tarih araması.

![Landing — Why Choose GoBest](docs/landing-why.png)

![Landing — özellikler](docs/landing-features.png)

---

## 🛠️ Lokal Kurulum

```bash
npm install
npm run dev
```

Uygulama, [GoBest backend](https://github.com/sahinokdem/GoBestBackend)'in çalışıyor ve erişilebilir olmasını bekler; başlatmadan önce API adresini ilgili ortam değişkeniyle yapılandır.

Production build:

```bash
npm run build
npm run start
```
