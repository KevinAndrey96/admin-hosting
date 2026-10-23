# Azulática — Fuente Única de Verdad (Single Source of Truth)
**Versión:** 2.2.0 (Producción)  
**Última actualización:** 23 de Octubre de 2026  
**Servidor de Infraestructura:** `46.224.80.244`  
**Aplicación:** el mismo Next.js 13.5 standalone en dos cuentas Passenger  
**Base de Datos de Producción:** MySQL (`shape_hosting` en `127.0.0.1:3306`), compartida  

| Marca | URL del panel | Cuenta | `APP_URL` |
|---|---|---|---|
| Instance Shape | `https://instanceshape.com/admin` | `shape` · Node 24 | `https://instanceshape.com/admin` |
| Azulática | `https://azulatica.com/admin` | `azulatica` · Node 20 | `https://azulatica.com` |

El código vive en este directorio (`Admin/admin`) y en GitHub `KevinAndrey96/admin-hosting` (rama `admin-hosting`). El 2026-10-23 se publicó ahí el fuente compartido (SSO, logo con respaldo, caché de ajustes y marca Azulática). Lo que ya corre en los dos dominios es el standalone desplegado ese mismo día; este commit no vuelve a construir el servidor. Cada cuenta guarda su propio `.env`; no se intercambian secretos al desplegar.

**Keep-warm (hora Colombia), las dos cuentas:** cada 30 min de 08:00 a 19:59 (`0,30 8-19 * * *`) y cada hora de 20:00 a 07:59 (`0 20-23,0-7 * * *`), contra `/admin/signin?w=<timestamp>`. En `shape` también siguen el recordatorio de renovaciones (`0 12 * * *`) y la limpieza de disco de los miércoles (`0 0 * * 3`).  

---

## 1. Principio Rector: El Panel como Fuente Única de Verdad

A partir de esta versión, el **Panel Administrativo de Azulática** se consolida formalmente como la **Fuente Única de Verdad (Single Source of Truth)** para:
1. **Catálogo de Planes y Precios:** Valores autorizados de venta al público en COP y reglas de bonificación/inclusión.
2. **Ciclo de Vida y Estados de Facturación:** Control de pagos, vencimientos y renovaciones.
3. **Registro y Proveedores de Dominios:** Información contrastada con los registradores autorizados vía WHOIS.
4. **Módulo de Tickets y Atención al Cliente:** Hilos de comunicación, estados de resolución y auditoría de soporte.
5. **Historial de Inicios de Sesión y Auditoría:** Registro inmutable de actividad mensual de usuarios.

**WHM (WebHost Manager) y cPanel UAPI** actúan como los motores ejecutores de infraestructura (aprovisionamiento, cambio de recursos, suspensión/reactivación y cuotas de correo), respondiendo automáticamente a las acciones ejecutadas en el panel.

---

## 2. Catálogo Oficial de Planes de Hosting Azulática

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

| Dominio (FQDN) | Registrador Autoritativo | Vencimiento Oficial WHOIS | Precio Venta (COP) | Estado Facturación | Estado Servicio | Notas & Reglas de Negocio |
|---|---|---|---|---|---|---|
| `theagadvantagegroup.com` | Spaceship, Inc. | **02/10/2027** | $49.999 | `PAID` | `ACTIVE` | **Dominio Principal Activo** (vinculado a hosting `theagadvantagegr`). |
| `instanceshape.com` | Namecheap, Inc. | **12/11/2026** | **$0** | `PAID` | `ACTIVE` | **Precio $0 COP:** El hosting Gold/Platinum incluye su propio dominio. |
| `dualbs.com` | Gname.com Pte. Ltd. | **25/01/2027** | $49.999 | `PAID` | `ACTIVE` | **Ajustado a Shape Gold:** Cuenta optimizada con 2 GB disco y 200 GB BW. |
| `mrchorro.app` | Spaceship, Inc. | **02/10/2027** | $69.900 | `PAID` | `ACTIVE` | Activo en Shape Bronze. |
| `frutyexpres.com` | Spaceship, Inc. | **02/10/2027** | $49.999 | `PAID` | `ACTIVE` | Activo en Shape Bronze. |
| `hs-group.com.co` | Namecheap, Inc. | **12/05/2027** | $49.999 | `PAID` | `ACTIVE` | Activo en Shape Gold. |
| `highsolutionssas.com` | Spaceship, Inc. | **19/02/2027** | $49.999 | `PAID` | `ACTIVE` | Activo en Shape Gold. |
| `tamalestolimenseseduard.com` | Spaceship, Inc. | **21/02/2027** | $49.999 | `PAID` | `ACTIVE` | Activo en Shape Gold. |
| `mundialdesillas.com` | Spaceship, Inc. | **27/05/2027** | $49.999 | `PAID` | `ACTIVE` | Activo en Shape Bronze. |
| `webmastercolombia.net` | GoDaddy.com, LLC | **07/05/2031** | $49.999 | `PAID` | `ACTIVE` | Renovado a largo plazo. |
| `tumejorseguridad.com` | Spaceship, Inc. | **31/12/2026** | $49.999 | `PAID` | `ACTIVE` | Activo en Shape Bronze. |
| `nmpsicologiaenevolucion.com` | Squarespace Domains II LLC | **17/10/2027** | $49.999 | `PAID` | `ACTIVE` | Activo en Shape Gold. |
| `ansftranslations.com` | Spaceship, Inc. | **31/08/2027** | $49.999 | `PAID` | `ACTIVE` | Activo en Shape Gold. |
| `garix.com.co` | Spaceship, Inc. | **26/01/2027** | $49.999 | `PAID` | `ACTIVE` | Activo en Shape Silver. |
| `agadvantagegroup.com` | Namecheap, Inc. | **09/08/2026** | $49.999 | `CANCELLED` | `REJECTED` | **Sustituido formalmente** por `theagadvantagegroup.com`. |
| `inttelgo.net` | Desregistrado / Liberado | *Expirado* | $0 | `CANCELLED` | `CANCELLED` | Inactivo. |

---

## 4. Arquitectura de Módulos Implementados

### 4.1. Módulo de Tickets de Soporte Técnico Integral (`/soporte`)
- **Base de Datos (`tickets` y `ticket_messages`):**
  - Modelo `Ticket`: `ticketNumber` autoincremental (`#0001`), `userID`, `subject`, `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `category`, timestamps.
  - Modelo `TicketMessage`: Hilo conversacional con soporte para respuestas del cliente y del equipo de soporte (`isAdmin: boolean`), garantizando trazabilidad completa.
- **Flujo de Estados y Máquina de Estados:**
  - **Apertura:** Todo ticket nuevo inicia en `OPEN`.
  - **Atención de Soporte:** Cuando un administrador responde a un ticket `OPEN`, su estado avanza automáticamente a `IN_PROGRESS`.
  - **Resolución:** El cliente o administrador puede marcar el ticket como `RESOLVED`.
  - **Reapertura Automática:** Si un cliente envía un mensaje adicional a un ticket en estado `RESOLVED` o `CLOSED`, el sistema reabre automáticamente el ticket a `IN_PROGRESS` sin requerir la creación de un nuevo caso.
- **Seguridad y Control de Acceso:**
  - Los clientes únicamente pueden visualizar y responder a sus propios tickets.
  - Los administradores tienen acceso global, filtros avanzados por estado/prioridad/cliente, y facultades para ajustar la prioridad y el estado de cualquier ticket.

### 4.2. Capa de Optimización de Rendimiento y Caché Inteligente
- **Caché en Memoria con TTL (60 Segundos):**
  - Las consultas a cPanel/WHM (`whmListAccounts` y `whmListEmailAccounts`) consumen entre 800ms y 2.5s por solicitud de red.
  - Se implementó una capa de almacenamiento en memoria con TTL de 60 segundos (`lib/whm-client.ts`), reduciendo las respuestas de navegación recurrente y cambio de pestañas a **< 5ms**.
- **Invalidación Reactiva Inmediata:**
  - Cualquier operación de mutación (creación de buzón de correo, edición de cuota, cambio de clave, borrado de casilla, aprovisionamiento o cambio de plan) invalida de inmediato la clave de caché correspondiente, garantizando que el usuario siempre observe el estado real sin demoras.
- **Arquitectura de Conexión Dual (Port 2083 & 2087):**
  - Las llamadas a cPanel UAPI (`Resellers::list_accounts`, `Email::list_pops_with_disk`, etc.) se ejecutan preferencialmente contra el puerto nativo 2083 con cabecera `Authorization: cpanel ${WHM_USER}:${TOKEN}` de ultra-alta velocidad.
  - Si el puerto 2083 no responde o se requiere una función exclusiva de revendedor de WHM, conmuta automáticamente al puerto 2087 (`/json-api/*`).
- **Caché de Assets en Navegador y Servidor Web:**
  - En `next.config.js` se activó la compresión gzip nativa (`compress: true`) y cabeceras inmutables para bundles estáticos:
    - `/_next/static/*`: `Cache-Control: public, max-age=31536000, immutable`.
    - `/static/*`: `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`.
  - En `.htaccess` se configuró mod_deflate y mod_expires para acelerar el renderizado en clientes de baja latencia.

### 4.3. Suite Completa de Pruebas Automatizadas (`npm test`)
- Se implementó una suite integral utilizando el ejecutor nativo de Node.js + `tsx` (`node --import tsx --test 'test/**/*.test.ts'`):
  - **Pruebas Unitarias:**
    - `hosting-price.test.ts`: Pruebas de normalización de Decimales de Prisma, herencia de precios de paquete, anulaciones de precio y caso de precio $0.
    - `domain-utils.test.ts`: Validación de nombres FQDN legítimos, detección de caracteres maliciosos y rechazo de puntos consecutivos (`..`).
    - `whm-client.test.ts`: Formateo de usuarios cPanel (límite de 16 caracteres, prefijo de dígitos) y ciclo de invalidación de caché.
    - `email-dispatch-guardrail.test.ts`: Verificación de cumplimiento del guardrail de correo (`dryRun=true` y sender estándar `no-reply@instanceshape.com`).
  - **Pruebas de Integración:**
    - `business-rules.test.ts`: Verificación del paquete `shape_ssh`, downgrade de `dualbs` a `shape_gold`, consolidación de `theagadvantagegroup.com` y regla de inclusión de dominio a $0 COP.
    - `tickets-validation.test.ts`: Pruebas de campos requeridos, validación de prioridades y máquina de estados de tickets.
  - **Prueba End-to-End (E2E):**
    - `support-ticket-flow.test.ts`: Simulación del ciclo completo de un ticket (creación por cliente -> respuesta de soporte -> resolución -> reapertura por mensaje posterior).
- **Resultado:** 23/23 pruebas aprobadas con ejecución en **~350ms**.

### 4.4. Aprovisionamiento Automático en WHM (One-Click Provisioning)
- **Creación de Hosting (`/hosting/new` y `/api/hosting`):**
  - Switch de aprovisionamiento inmediato en WHM activo por defecto.
  - Generación automática de contraseñas de alta seguridad si no se especifica una clave manual.
  - Creación física de la cuenta en WHM con su paquete correspondiente (`whmCreateAccount`).
- **Aprovisionamiento 1-Clic para Cuentas Existentes (`/api/hosting/[id]/provision`):**
  - Botón directo `⚡ Aprovisionar` en la tabla de hosting para servicios en estado `PENDING` o sin aprovisionar.
  - Modal de confirmación que devuelve las credenciales de acceso listas para copiar y entregar al cliente.

### 4.5. Módulo Completo de Autoservicio de Correos Corporativos (`/emails`)
- **Interfaz y Funcionalidades:**
  - Selector de servicios de hosting con estadísticas de buzones usados vs límite del plan y cuota de almacenamiento.
  - Modales para creación de nuevas cuentas, cambio de contraseña, ajuste de cuota y eliminación.
  - Tarjeta de ayuda con parámetros de configuración para Outlook / Móvil (IMAP 993 SSL, SMTP 465 SSL, Webmail).
- **Backend cPanel UAPI (`/api/emails`):**
  - Integración nativa con `Email::list_pops_with_disk`, `Email::add_pop`, `Email::passwd_pop`, `Email::edit_pop_quota`, `Email::delete_pop`.

### 4.6. Política de Envíos de Correo Electrónico (Email Dispatch Guardrail)
- Persistida en `GEMINI.md`:
  - Queda estrictamente prohibido el despacho automatizado de correos reales a clientes o administradores mediante SMTP en pruebas o comandos interactivos a menos que el usuario lo solicite de manera textual y explícita.
  - Los scripts y crons en modo de prueba deben emplear la bandera `dryRun=true` o mocks de transporte.

### 4.7. Sistema de Badges Reactivos de Soporte en Tiempo Real
- **Endpoint Especializado (`/api/tickets/count`):**
  - Consulta atómica que contabiliza tickets activos en estado `OPEN` o `IN_PROGRESS` (con filtro de urgencia para tickets `HIGH` o `URGENT`).
  - Filtrado según sesión: para administradores contabiliza todos los tickets globales del sistema; para clientes contabiliza sus casos abiertos.
- **Hook Reactivo (`app/hooks/useTicketsCount.ts`):**
  - Mantiene el estado sincronizado en `Sidebar.tsx` y `Topbar.tsx`.
  - Sondeo suave cada 30 segundos y escucha reactiva del evento nativo `tickets:updated` para actualización instantánea.

### 4.8. Monitor de Umbral de Almacenamiento y Alerta Visual de Capacidad
- **Módulo de Cálculo (`lib/disk-threshold.ts`):**
  - Normaliza consumos devueltos por cPanel UAPI (`MB`, `GB`, `KB`) frente a la cuota del paquete de hosting.
  - Establece umbrales inteligentes: **Alerta (≥ 80%)** y **Crítico (≥ 90%)**.
- **Visualización en Panel de Hosting (`/hosting`):**
  - **Banner Superior de Advertencia:** Identifica de inmediato cuentas sobre el 80% (por ejemplo, `dualbs` al 90% con 1.803 MB sobre 2.000 MB tras su downgrade a Gold) indicando megabytes restantes para prevenir rebote de correos o bloqueos de base de datos.
  - **Barras de Progreso Interactivas:** Barra codificada por color (verde/ámbar/rojo) y badge porcentual por cada cuenta.

---

## 5. Procedimiento de Despliegue en Producción (Zero-Downtime)

1. **Generación del Build Standalone:**
   ```bash
   npm run build
   ```
2. **Empaquetado de Artefactos:**
   ```bash
   zip -r admin-deploy-prod.zip .htaccess package.json start-server.js next.config.js tsconfig.json .next/standalone app lib prisma types test -x "*.DS_Store" -x "node_modules/*" -x ".next/cache/*"
   ```
3. **Transferencia Segura al Servidor cPanel:**
   ```bash
   scp -i ~/.ssh/id_ed25519_audit_shape -P 22 admin-deploy-prod.zip shape@46.224.80.244:/mnt/atlas/shape/admin/admin-deploy-prod.zip
   ```
4. **Descompresión y Reciclaje de Procesos Phusion Passenger:**
   ```bash
   ssh -i ~/.ssh/id_ed25519_audit_shape shape@46.224.80.244 "cd /mnt/atlas/shape/admin && unzip -o admin-deploy-prod.zip && pkill -u shape -f next-router-worker 2>/dev/null || true && touch tmp/restart.txt"
   ```
5. **Verificación de Salud:**
   ```bash
   curl -s -k "https://instanceshape.com/admin/api/domains/ping"
   ```

---
*Azulática • Infraestructura Cloud y Soluciones Digitales*
