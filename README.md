# Instance Shape - Panel Administrativo (Hosting & Domains)

Panel de administración integral y portal de clientes para **Instance Shape** (`instanceshape.com`), desarrollado con **Next.js 13.5 (App Router)**, **Prisma ORM (MySQL)** y sincronización en tiempo real con **cPanel / WHM API** y **Spaceship API**.

---

## 🚀 Características Principales

- **Gestión de Servicios de Hosting**:
  - Aprovisionamiento automático y manual de cuentas cPanel en el servidor (`46.224.80.244`).
  - Sincronización en vivo de uso de almacenamiento en disco (`diskused`) y estado operativo mediante WHM API v1.
  - Suspensión y desuspensión preventiva en 1 clic (`whmSuspendAccount` / `whmUnsuspendAccount`).
  - Asignación y cambio de paquetes de recursos (`changepackage`).
- **Gestión de Dominios**:
  - Consulta de disponibilidad y registro directo mediante Spaceship API.
  - Solicitudes de transferencias in-bound con código de autorización (EPP / AuthCode).
  - Bloqueo de transferencia (*Transfer Lock*) y monitorización de vencimientos.
- **Facturación y Recordatorios Automáticos**:
  - Endpoint seguro de cron job (`/api/cron/renewal-reminders`) con token Bearer (`CRON_SECRET`).
  - Notificaciones por correo electrónico a los 30, 15 y 7 días previos al vencimiento del servicio.
  - Módulo de pagos con soporte para métodos directos (Bancolombia, Nequi, Daviplata, Bre-B) y pasarela (Mercado Pago).
- **Control de Acceso y Clientes**:
  - Roles diferenciados: `ADMIN` (gestión completa del servidor y clientes) y `CLIENT` (portal de autoservicio).
  - Sesiones cifradas vía cookies seguras (`iron-session`).

---

## 📚 Documentación del Sistema

Para consultar las especificaciones técnicas y comerciales detalladas, revisa los documentos en la carpeta [`docs/`](./docs/):

1. 📄 [**Modelo de Negocio, Paquetes y Precios** (`docs/BUSINESS_MODEL_AND_PACKAGES.md`)](./docs/BUSINESS_MODEL_AND_PACKAGES.md):  
   Catálogo de los 5 planes oficiales (Bronze, Silver, Gold, Platinum, Diamond), tarifas en COP, cuotas de almacenamiento, ancho de banda, límites antispam y pasarelas de pago.
2. 📄 [**Integración con WHM API y Arquitectura Técnica** (`docs/WHM_INTEGRATION_AND_ARCHITECTURE.md`)](./docs/WHM_INTEGRATION_AND_ARCHITECTURE.md):  
   Protocolo de conexión reseller `shape`, requerimiento mandatorio de `api.version=1`, agentes SSL, resolución de usuarios cPanel y endpoints de aprovisionamiento.
3. 📄 [**Auditoría de Cuentas y Optimización (Right-Sizing)** (`docs/ACCOUNTS_AUDIT_AND_RIGHTSIZING.md`)](./docs/ACCOUNTS_AUDIT_AND_RIGHTSIZING.md):  
   Informe de inventario de recursos ocupados en el servidor, análisis de sobregiro y matriz de candidatos a reducción de plan.
4. 📄 [**Guía de Despliegue en Servidor cPanel** (`DEPLOYMENT_GUIDE_CPANEL.md`)](./DEPLOYMENT_GUIDE_CPANEL.md):  
   Instrucciones para compilación standalone, Node.js Passenger / PM2 y proxy reverso en LiteSpeed.

---

## 🛠️ Stack Tecnológico

- **Frontend & Backend**: Next.js 13.5 (React 18, App Router, TypeScript).
- **Base de Datos**: MySQL con Prisma ORM 6.x.
- **Estilos e Interfaz**: Adminator Dashboard UI adaptado con CSS moderno y componentes modulares.
- **Integraciones Externas**:
  - **cPanel / WHM API v1**: Gestión de cuentas revendedoras (`shape`).
  - **Spaceship Partner API**: Registro y consulta de disponibilidad de dominios.
  - **Nodemailer**: Envío transaccional vía SMTP corporativo.

---

## ⚙️ Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente plantilla:

```ini
# Base de Datos (MySQL)
DATABASE_URL="mysql://usuario:password@localhost:3306/instanceshape_admin"

# Sesión (Mínimo 32 caracteres)
SESSION_SECRET="openssl_rand_base64_32_characters"

# SMTP (Envío de correos de notificación)
SMTP_HOST="mail.instanceshape.com"
SMTP_PORT=465
SMTP_USER="notificaciones@instanceshape.com"
SMTP_PASSWORD="tu_password_smtp"
SMTP_SECURE=true

# WHM API (cPanel Server)
WHM_HOST="46.224.80.244"
WHM_PORT=2087
WHM_USER="shape"
WHM_API_TOKEN="tu_token_generado_en_whm"

# URL de la Aplicación
APP_URL="https://instanceshape.com"
NEXT_PUBLIC_BASE_PATH="/admin"

# Cron Job Secret
CRON_SECRET="token_secreto_para_proteger_el_cron"

# Spaceship API (Registro de dominios)
SPACESHIP_API_KEY="tu_api_key_spaceship"
SPACESHIP_API_SECRET="tu_api_secret_spaceship"
```

---

## 💻 Comandos de Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente de Prisma
npx prisma generate

# 3. Poblar base de datos con datos semilla (paquetes y configuración)
npm run db:seed

# 4. Iniciar servidor de desarrollo local
npm run dev

# 5. Ejecutar análisis estático (Linter)
npm run lint

# 6. Compilar para producción (Standalone build)
npm run build
```

---

## 📂 Estructura del Código

```text
admin/
├── app/                  # Rutas de la aplicación (Next.js App Router)
│   ├── api/              # Endpoints de API REST (auth, clients, domains, hosting, cron)
│   ├── clients/          # Módulo de gestión de clientes
│   ├── dashboard/        # Métricas principales e ingresos
│   ├── domains/          # Módulo de administración y registro de dominios
│   ├── hosting/          # Módulo de gestión y monitoreo de cuentas cPanel
│   ├── packages/         # Módulo de planes de hosting y recursos
│   └── pago/             # Pasarela y registro de comprobantes de pago
├── components/           # Componentes reutilizables (Sidebar, Navbar, Layout)
├── docs/                 # Documentación técnica, comercial y de auditoría
├── lib/                  # Clientes y utilidades (prisma, session, whm-client, spaceship)
├── prisma/               # Esquema de base de datos, migraciones y seeds
└── public/               # Activos estáticos, imágenes y logos
```
