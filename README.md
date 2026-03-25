# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Supabase (CRUD Backend)

This project includes a **Supabase-backed CRUD page** (accessible at `/admin`) that lets you manage portfolio items.

### ✅ Setup
1. Create a new project at https://app.supabase.com
2. Create a table named **`portfolio_items`** with columns (minimal):
   - `id` (int, primary key, auto-increment)
   - `title` (text)
   - `category` (text)
   - `description` (text)
   - `image_url` (text)
   - `video_url` (text) — used for type `video`
   - `type` (text) — should be `foto` or `video`
3. Copy your **Project URL** and **anon key** into a local `.env` file based on `.env.example`:

```bash
cp .env.example .env
# then edit .env to add your Supabase credentials
```

4. (Optional tetapi direkomendasikan) Buat bucket storage bernama `portfolio` dan set agar **public** (agar URL bisa diakses secara langsung). Ini digunakan untuk menyimpan file gambar/video yang diunggah dari perangkat.

### 🚀 Run
- Dev server: `npm run dev`
- Open http://localhost:5173/admin to access the CRUD interface.

### 💡 Notes
- If Supabase is not configured, the landing page will use mock data.
