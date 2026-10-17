# Instance Shape — Fuente Única de Verdad (Single Source of Truth)
**Versión:** 2.0.0 (Producción)  
**Última actualización:** 17 de Octubre de 2026  
**Servidor de Infraestructura:** `46.224.80.244` (WHM / cPanel `shape` • `instanceshape.com`)  
**Aplicación:** Next.js 13.5 Standalone en Phusion Passenger (`/mnt/atlas/shape/admin`)  
**Base de Datos de Producción:** MySQL (`shape_hosting` en `127.0.0.1:3306`)  

---

## 1. Principio Rector: El Panel como Fuente Única de Verdad

A partir de esta versión, el **Panel Administrativo de Instance Shape** se consolida formalmente como la **Fuente Única de Verdad (Single Source of Truth)** para:
1. **Catálogo de Planes y Precios:** Valores autorizados de venta al público en COP.
2. **Ciclo de Vida y Estados de Facturación:** Control de pagos, vencimientos y renovaciones.
3. **Registro y Proveedores de Dominios:** Información contrastada con los registradores autorizados vía WHOIS.
4. **Historial de Inicios de Sesión y Auditoría:** Registro inmutable de actividad mensual de usuarios.

**WHM (WebHost Manager)** actúa como el motor ejecutor de infraestructura (aprovisionamiento, cambio de recursos, suspensión/reactivación y cuotas de correo), respondiendo automáticamente a las acciones ejecutadas en el panel.

---

## 2. Catálogo Oficial de Planes de Hosting Instance Shape

Todos los paquetes corresponden 1:1 con las definiciones físicas de WHM y cuentan con límites automáticos de antispam y soporte para **LiteSpeed Web Server**.

| Paquete WHM | Nombre Comercial | Espacio en Disco | Ancho de Banda | Cuentas Correo | Dominios Adicionales | Límite Antispam | Tráfico Estimado Soportado | Precio Venta (COP / Año) |
|---|---|---|---|---|---|---|---|---|
| `shape_bronze` | **Shape Bronze** | 500 MB | 50 GB | 5 | 0 | 20 emails / hora | 15.000 – 25.000 visitas/mes | **$39.900** |
| `shape_silver` | **Shape Silver** | 1.000 MB (1 GB) | 100 GB | 5 | 0 | 20 emails / hora | 25.000 – 50.000 visitas/mes | **$79.900** |
| `shape_gold` | **Shape Gold** | 2.000 MB (2 GB) | 200 GB | Ilimitadas | 1 | 60 emails / hora | 50.000 – 100.000 visitas/mes | **$119.900** |
| `shape_platinum` | **Shape Platinum** | 5.000 MB (5 GB) | 500 GB | Ilimitadas | 2 | 60 emails / hora | 100.000 – 250.000 visitas/mes | **$159.900** |
| `shape_diamond` | **Shape Diamond** | 10.000 MB (10 GB) | 1 TB (1.000 GB) | Ilimitadas | Ilimitados | 300 emails / hora | 250.000 – 600.000 visitas/mes | **$299.900** |
| `shape_ssh` | **Shape SSH Transitorio** | Ilimitado | Ilimitado | Ilimitadas | Ilimitados | 300 emails / hora | Paquete transitorio para migraciones y mantenimiento | Uso interno / Exclusivo |

> **Protocolo SSH Transitorio:** Si una cuenta de cliente requiere acceso SSH o importar bases de datos pesadas por consola, se migra temporalmente a `shape_ssh` mediante `whmChangePackage(username, 'shape_ssh')` y se retorna a su plan original una vez finalizado el trabajo.

---

## 3. Registro Oficial de Dominios (Verificado con WHOIS Autoritativo)

Todos los registros fueron auditados y sincronizados en la base de datos de producción (`shape_hosting.domains`):

| Dominio (FQDN) | Registrador Autoritativo | Vencimiento Oficial WHOIS | Precio Venta (COP) | Estado Facturación | Estado Servicio | Salud Web (HTTP Ping) |
|---|---|---|---|---|---|---|
| `theagadvantagegroup.com` | Spaceship, Inc. | **02/10/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `mrchorro.app` | Spaceship, Inc. | **02/10/2027** | $69.900 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `frutyexpres.com` | Spaceship, Inc. | **02/10/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `hs-group.com.co` | Namecheap, Inc. | **12/05/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `highsolutionssas.com` | Spaceship, Inc. | **19/02/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `tamalestolimenseseduard.com` | Spaceship, Inc. | **21/02/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `mundialdesillas.com` | Spaceship, Inc. | **27/05/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `agadvantagegroup.com` | Namecheap, Inc. | **09/08/2026** | $49.999 | `PAID` | `ACTIVE` | 🔴 Caído (Sitio descontinuado/redirigido) |
| `webmastercolombia.net` | GoDaddy.com, LLC | **07/05/2031** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `tumejorseguridad.com` | Spaceship, Inc. | **31/12/2026** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `nmpsicologiaenevolucion.com` | Squarespace Domains II LLC | **17/10/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `instanceshape.com` | Namecheap, Inc. | **12/11/2026** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `dualbs.com` | Gname.com Pte. Ltd. | **25/01/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `ansftranslations.com` | Spaceship, Inc. | **31/08/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `garix.com.co` | Spaceship, Inc. | **26/01/2027** | $49.999 | `PAID` | `ACTIVE` | 🟢 En línea (200 OK) |
| `inttelgo.net` | Desregistrado / Liberado | *Expirado* | $0 | `CANCELLED` | `CANCELLED` | ⚪ Inactivo |
| `portoamericas.com.co` | Desregistrado / Liberado | *Expirado* | $0 | `CANCELLED` | `CANCELLED` | ⚪ Inactivo |

---

## 4. Mejoras Implementadas y Validaciones Técnicas

### 4.1. Seguridad y Comprobantes de Pago (Punto 1)
- **Ruta de Subida (`/api/pago/comprobante`):**
  - Validación estricta de MIME type (JPEG, PNG, GIF, WebP, PDF) con extensión forzada en servidor (previene ataques de doble extensión como `.php.jpg`).
  - Almacenamiento físico en el servidor: `uploads/comprobantes/comprobante_{timestamp}_{userSnippet}.{ext}` con permisos restringidos.
  - Actualización automática de `paymentProofPath` tanto en la tabla `domains` como en `hostings`.
- **Visor Seguro (`/api/pago/comprobante/[filename]`):**
  - Protección estricta contra *Path Traversal* (`path.basename`, chequeo de prefijo).
  - Control de acceso por sesión: Clientes solo pueden ver comprobantes asociados a su propio ID; administradores tienen acceso global.
- **Interfaz de Usuario:**
  - Botón de acceso directo (`📄 Comprobante`) en las tablas de `app/domains/page.tsx` y `app/hosting/page.tsx` para comprobantes subidos.

### 4.2. Sincronización Automática con WHM (Punto 2)
- **Edición de Servicios de Hosting (`app/api/hosting/[id]`):**
  - Si se modifica el paquete en el panel, se invoca `whmChangePackage` para redimensionar de inmediato en cPanel.
  - Si se cambia el estado del servicio a `SUSPENDED` o `ENABLED`, se ejecutan `whmSuspendAccount` o `whmUnsuspendAccount`.
- **Listado de Hosting (`app/api/hosting`):**
  - Fallback por nombre de usuario de cPanel para obtener `diskUsed` incluso si la cuenta no tiene un dominio principal vinculado en la base de datos.

### 4.3. Auditoría de Inicios de Sesión (`LoginHistory`)
- **Migración de Base de Datos:**
  - Nueva tabla `login_history` en MySQL (`id`, `user_id`, `ip_address`, `user_agent`, `created_at`).
  - Registro automático en `/api/auth/login` al iniciar sesión cualquier usuario o administrador.
- **Auditoría Ejecutiva:**
  - El informe diario audita y reporta el número exacto de sesiones abiertas en el mes en curso y la lista de usuarios activos con su rol y última fecha de ingreso.

### 4.4. Cron Diario y Calendario de Recordatorios
- **Ruta del Cron (`/api/cron/renewal-reminders`):**
  - **Diariamente:** Genera el **Informe Ejecutivo Diario** para los administradores vía correo electrónico (`no-reply@instanceshape.com`).
    - Monitoreo HTTP ping de los 17 dominios.
    - Detección inmediata de sitios caídos o con fallas DNS.
    - Renovaciones y valores a recaudar en los próximos 30 días.
    - Auditoría de logins del mes en curso.
    - Tips técnicos de servidor (tráfico soportado, buenas prácticas de correo, caché LiteSpeed).
  - **Días 1, 10 y 20 de cada mes:** Envío automático de recordatorios de cobro a clientes con servicios próximos a vencer.
  - **Seguridad:** Requiere token secreto (`CRON_SECRET`) en cabecera `Authorization: Bearer <token>` o parámetro `?token=<token>`.

---

### 4.5. Integración Continua y Despliegue Automático con GitHub Actions
- **Workflow (`.github/workflows/deploy.yml`):**
  - Se activa automáticamente con cada `git push` a las ramas `admin-hosting` o `main`.
  - Construye la aplicación Next.js standalone en los runners de GitHub (0% consumo de CPU/RAM del servidor cPanel).
  - Empaqueta el release en `admin-deploy-prod.zip`.
  - Transfiere el paquete por SCP y lo descomprime en el servidor (`shape@46.224.80.244`), asegurando la creación de carpetas de almacenamiento y reiniciando Passenger con `touch tmp/restart.txt`.
  - **Secretos de Repositorio Requeridos en GitHub:**
    - `CPANEL_SSH_KEY`: Llave privada SSH para conectar a la cuenta `shape`.
    - `CPANEL_SSH_HOST` (Opcional, defecto `46.224.80.244`).
    - `CPANEL_SSH_USER` (Opcional, defecto `shape`).
    - `CPANEL_SSH_PORT` (Opcional, defecto `22`).

### 4.6. Casilla de Solo Salida `no-reply@instanceshape.com`
- **Configuración UAPI en cPanel:**
  - Creada en el servidor con cuota de 1 GB.
  - Forwarder de rechazo configurado vía Exim UAPI: `:fail: Esta casilla es exclusivamente para notificaciones salientes automáticas y no recibe mensajes.`.
  - Permite autenticación SMTP saliente (puertos 465 SSL / 587 TLS), pero rechaza cualquier correo entrante a nivel SMTP sin almacenar mensajes no deseados en disco.

### 4.7. Resumen Mensual de Servicios a Clientes (Día 1 de Cada Mes)
- **Despacho Automático:**
  - Se ejecuta el día 1 de cada mes (o invocando el cron con `?monthly=true`).
  - Envía a cada cliente activo un reporte visual con sus dominios, hosting, cuotas y capacidad estimada de tráfico.
  - **Llamado a la Acción Destacado:** Resalta un bloque con su nombre de usuario (su correo electrónico) y un botón de acceso directo a `https://instanceshape.com/admin/signin`.
  - Incluye tips prácticos para aprovechar su servidor (LiteSpeed Cache, configuración de correo IMAP/SMTP y certificados SSL).

### 4.8. Corrección de Parámetros de URL en Apache Proxy (.htaccess)
- Se incorporó la bandera `QSA` (Query String Append) en la regla de proxy de `.htaccess`:
  `RewriteRule ^ http://127.0.0.1:3001%{REQUEST_URI} [P,QSA,L]`
  Esto garantiza que parámetros como `?token=...`, `?force=true` o `?monthly=true` pasen intactos desde el puerto 443 al servidor Node.js local en el puerto 3001.

### 4.9. Módulo Completo de Autoservicio de Correos Corporativos
- **Interfaz (`/emails`):**
  - Vista responsiva para clientes y administradores.
  - Selector de servicios de hosting con estadísticas de buzones usados vs límite del plan y cuota de almacenamiento.
  - Tabla interactiva con barras de progreso de consumo de disco por casilla.
  - Modales para creación de nuevas cuentas (con selector de dominio vinculado, generador de claves seguras y selector de cuota), cambio de contraseña, ajuste de cuota y eliminación.
  - Tarjeta de ayuda con parámetros de configuración para Outlook / Móvil (IMAP 993 SSL, SMTP 465 SSL, Webmail).
- **Backend y API cPanel UAPI (`/api/emails`):**
  - Proxy seguro hacia cPanel UAPI vía WHM API 1 (`whmCpanelUapi`):
    - `Email::list_pops_with_disk` (listar cuentas con uso real y cuotas).
    - `Email::add_pop` (crear cuenta con validación de límite del paquete).
    - `Email::passwd_pop` (cambiar contraseña).
    - `Email::edit_pop_quota` (modificar cuota o asignar ilimitada).
    - `Email::delete_pop` (eliminar buzón).
  - Control de acceso por sesión: Clientes solo pueden gestionar buzones de sus propios hostings; administradores tienen gestión global.

### 4.10. Aprovisionamiento Automático en WHM (One-Click Provisioning)
- **Creación de Hosting (`/hosting/new` y `/api/hosting`):**
  - Switch de aprovisionamiento inmediato en WHM activo por defecto.
  - Generación automática de contraseñas de alta seguridad si no se especifica una clave manual.
  - Creación física de la cuenta en WHM con su paquete correspondiente (`whmCreateAccount`).
- **Aprovisionamiento 1-Clic para Cuentas Existentes (`/api/hosting/[id]/provision`):**
  - Botón directo `⚡ Aprovisionar` en la tabla de hosting para servicios en estado `PENDING` o sin aprovisionar.
  - Modal de confirmación que devuelve las credenciales de acceso listas para copiar y entregar al cliente.

### 4.11. Política de Envíos de Correo Electrónico (Email Dispatch Guardrail)
- Persistida en `GEMINI.md`:
  - Queda prohibido el despacho automatizado de correos reales a clientes o administradores mediante SMTP en pruebas o comandos interactivos a menos que el usuario lo solicite expresamente.
  - El template mensual fue ajustado para remover estimaciones de visitas y tips de caché, enfocándose en accesos directos, Webmail y configuración de correo corporativo.

---

## 5. Procedimiento de Despliegue en Producción (Referencia)

El despliegue se realiza directamente vía SSH / Git / Zip sin necesidad de intervención manual en la interfaz web de cPanel:
1. **Generación del Build:**
   ```bash
   npm run build
   ```
2. **Empaquetado Limpio:**
   ```bash
   zip -r admin-deploy-prod.zip .htaccess package.json start-server.js next.config.js tsconfig.json .next/standalone app lib prisma types public -x "*.DS_Store" -x "node_modules/*" -x ".next/cache/*"
   ```
3. **Transferencia Segura:**
   ```bash
   scp -i ~/.ssh/id_ed25519_audit_shape -P 22 admin-deploy-prod.zip shape@46.224.80.244:/mnt/atlas/shape/admin/admin-deploy-prod.zip
   ```
4. **Descompresión y Reinicio en Servidor:**
   ```bash
   ssh -i ~/.ssh/id_ed25519_audit_shape shape@46.224.80.244 "cd /mnt/atlas/shape/admin && unzip -o admin-deploy-prod.zip && touch tmp/restart.txt"
   ```
5. **Verificación de Servicio:**
   ```bash
   curl -s -k -H "Authorization: Bearer <CRON_SECRET>" "https://instanceshape.com/admin/api/cron/renewal-reminders"
   ```

---
*Instance Shape SAS • Infraestructura Cloud y Soluciones Digitales*
