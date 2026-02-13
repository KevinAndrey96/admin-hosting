# Guía de Despliegue cPanel (Admin)

## 1. En tu computadora

### 1.1 Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto (igual que en Moon). Puedes copiar desde `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y configura:
- `DATABASE_URL` - Requerido para Prisma (SQLite, PostgreSQL o MySQL)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Opcional, para mapas de Google

### 1.2 Generar el build

En la raíz del proyecto:

```bash
npm run build
```

Espera a que termine. Deberías tener `.next/standalone/server.js` y `.next/static/`.

### 1.3 Generar el ZIP

```bash
chmod +x create-deploy-zip.sh
./create-deploy-zip.sh
```

Esto crea un archivo como `admin-deploy-YYYYMMDD-HHMMSS.zip`. El ZIP contiene:
- Todo el código de la aplicación (incluyendo la carpeta `.next/`)
- El archivo `.env.local` con las variables de entorno (si existe)
- **No** incluye `node_modules` (se instalan en el servidor)

---

## 2. En cPanel

### 2.1 Limpiar y extraer el ZIP

1. Abre **File Manager** en cPanel.
2. Ve a la carpeta donde vivirá la app. Si usas **Application root: admin**, ve a la carpeta **`admin`** (ej. `public_html/admin` o `admin` en tu home).
3. **Borra todo** dentro de esa carpeta, incluyendo `.htaccess` si existía. (El ZIP incluye el `.htaccess` requerido.)
4. Sube el archivo **`admin-deploy-YYYYMMDD-HHMMSS.zip`** a esa misma carpeta (ej. dentro de `admin`).
5. Clic derecho en el ZIP → **Extract**.
6. Después de extraer, verifica que la carpeta contenga: `.htaccess`, `.env.local`, `.next/`, `app/`, `lib/`, `prisma/`, `public/`, `package.json`, `start-server.js`, etc.

**Nota**: Si usas SQLite, asegúrate de que el archivo `dev.db` (o la ruta que uses en DATABASE_URL) exista o que Prisma pueda crearlo. En producción con PostgreSQL/MySQL, configura la URL en `.env.local`.

**Estructura objetivo** (carpeta app, ej. `admin/`):

```
admin/
  .htaccess
  .env.local
  .next/
    standalone/
      server.js
    static/
  app/
  lib/
  prisma/
  types/
  public/
  package.json
  start-server.js
  next.config.js
  tsconfig.json
```

---

## 3. Crear / configurar la aplicación Node.js en cPanel

1. En cPanel, abre **Node.js** (o "Setup Node.js App" / "Application Manager").
2. Si la app "admin" ya existe, edítala; si no, **Create application**.
3. Configura:

| Campo | Valor |
|-------|--------|
| **Node.js version** | `22.18.0` (o la versión 22.x disponible) |
| **Application mode** | `Production` |
| **Application root** | `admin` (ruta relativa a tu home) |
| **Application URL** | Tu dominio o subdominio para el admin |
| **Application startup file** | `start-server.js` |

4. Guarda la configuración.

### 3.1 Instalar dependencias (Run NPM Install)

1. En la misma pantalla de la app **admin**, haz clic en **Run NPM Install**.
2. Espera a que termine.
3. No ejecutes `npm install` manualmente; usa solo esta opción de cPanel.

### 3.2 Variables de entorno

**No necesitas configurarlas manualmente en cPanel** si subiste el archivo `.env.local` en el paso 2.1.

El script `start-server.js` carga automáticamente las variables desde `.env.local` al iniciar.

### 3.3 Iniciar la app

- Haz clic en **RESTART** (o **Start** si estaba detenida).
- Confirma que el estado sea "Running".

---

## 4. Migraciones de base de datos (Prisma)

Si usas PostgreSQL o MySQL en producción, ejecuta las migraciones después del deploy. Puedes hacerlo por SSH:

```bash
cd admin
npx prisma migrate deploy
```

O si usas SQLite, asegúrate de que el archivo de base de datos tenga permisos de escritura.

---

## Resumen rápido

| Paso | Dónde | Acción |
|------|--------|--------|
| 1 | Local | Crear `.env.local` desde `.env.local.example` |
| 2 | Local | `npm run build` |
| 3 | Local | `./create-deploy-zip.sh` |
| 4 | cPanel File Manager | Borrar contenido de `admin`, subir ZIP y extraer |
| 5 | cPanel Node.js | Crear/editar app: root `admin`, startup `start-server.js`, Node 22 |
| 6 | cPanel Node.js | Run NPM Install |
| 7 | cPanel Node.js | Restart App |
