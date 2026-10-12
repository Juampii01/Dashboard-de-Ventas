# Eternity · Dashboard de ventas

App web del equipo de ventas (Next.js + Supabase). Proyecto principal: Maestria.

- **Plan y estado:** [`docs/plan.md`](docs/plan.md) (léelo primero)
- **Publicar:** [`docs/GUIA-PUBLICAR.md`](docs/GUIA-PUBLICAR.md)
- **Conectar GoHighLevel:** [`docs/GUIA-GHL.md`](docs/GUIA-GHL.md)
- **Auditoría del código (36 puntos):** [`docs/Arreglar-dashboard.md`](docs/Arreglar-dashboard.md)

- **App publicada:** https://dashboard-de-ventas-iota.vercel.app (Vercel + Supabase en la nube; cada commit a `main` se publica solo y tiene que ir firmado por `eternitydevzz`).
- **Cómo está montado GHL en Maestria:** [`docs/GUIA-GHL.md`](docs/GUIA-GHL.md), sección «Cómo está montado en Maestria».

En local (solo para programar y pasar tests; la app publicada no lo necesita): Docker Desktop abierto, Supabase local y `npm run dev` (puerto 3100 en esta máquina). Tests: `npm test`. Docker va apagado por defecto: se enciende para los tests de integración y se apaga después. Variables: copia `.env.example` como `.env.local`.
