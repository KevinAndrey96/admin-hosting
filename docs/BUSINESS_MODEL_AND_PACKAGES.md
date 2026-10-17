# Modelo de Negocio, Paquetes y Precios - Instance Shape
*Versión: 1.0 (2026-2027)*  
*Moneda Oficial: COP (Pesos Colombianos)*  
*Infraestructura: Cloud cPanel & LiteSpeed Server (46.224.80.244 / Reseller `shape`)*

---

## 1. Visión General del Negocio

**Instance Shape** (`instanceshape.com`) es una plataforma especializada en alojamiento web de alta velocidad, registro automatizado de dominios y gestión integral de servicios digitales para profesionales, pymes y agencias en Colombia e Hispanoamérica.

### Propuesta de Valor
- **Almacenamiento NVMe/SSD de alta velocidad** con aislamiento de recursos.
- **Seguridad integral y WAF con Imunify360** (detección proactiva de malware y limpieza en tiempo real).
- **Certificados SSL Let's Encrypt automáticos e ilimitados** para todos los dominios y subdominios.
- **Soporte multiversión de PHP, Node.js y Python** mediante CloudLinux Passenger.
- **WordPress Toolkit** con gestión centralizada de actualizaciones y mitigación de vulnerabilidades.
- **Facturación y Recordatorios Automatizados** mediante cron jobs diarios y enlaces directos a pasarelas de pago.

---

## 2. Catálogo Oficial de Paquetes de Hosting

Los paquetes están creados de forma idéntica en la base de datos del panel (`hosting_packages`) y en el servidor WHM (`listpkgs`), garantizando una sincronización 1:1.

| Parámetro | Bronze (`shape_bronze`) | Silver (`shape_silver`) | Gold ⭐ (`shape_gold`) | Platinum (`shape_platinum`) | Diamond (`shape_diamond`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Color Identificador** | `#CD7F32` (Bronce) | `#C0C0C0` (Plata) | `#FFD700` (Oro) | `#E5E4E2` (Platino) | `#B9F2FF` (Diamante) |
| **Precio Anual (COP)** | **$159.900** | **$199.999** | **$289.999** | **$499.999** | **$819.999** |
| **Equivalente Mensual** | ~$13.325 / mes | ~$16.666 / mes | ~$24.166 / mes | ~$41.666 / mes | ~$68.333 / mes |
| **Almacenamiento SSD (QUOTA)** | **500 MB** | **1.000 MB (1 GB)** | **2.000 MB (2 GB)** | **5.000 MB (5 GB)** | **10.000 MB (10 GB)** |
| **Transferencia Mensual (BWLIMIT)** | 50.000 MB (50 GB) | 100.000 MB (100 GB) | 200.000 MB (200 GB) | 500.000 MB (500 GB) | 1.000.000 MB (1 TB) |
| **Buzones de Correo (MAXPOP)** | 5 cuentas | 5 cuentas | **Ilimitadas** | **Ilimitadas** | **Ilimitadas** |
| **Límite Antispam (Correos/Hora)** | **20 / hora** | **20 / hora** | **60 / hora** | **60 / hora** | **300 / hora** |
| **Dominios Incluidos** | 1 | 1 | 1 | 1 | 1 |
| **Dominios Addon (Sitios Web)** | 0 | 0 | **1 adicional (2 sitios)** | **2 adicionales (3 sitios)** | **Ilimitados** |
| **Dominios Alias / Parqueados** | 1 | 1 | 1 | 1 | 1 |
| **Terminal SSH (`HASSHELL`)** | Bajo solicitud | Bajo solicitud | Bajo solicitud | Bajo solicitud | Bajo solicitud |
| **Bases de Datos MySQL** | Ilimitadas | Ilimitadas | Ilimitadas | Ilimitadas | Ilimitadas |
| **Subdominios y Cuentas FTP** | Ilimitados | Ilimitados | Ilimitados | Ilimitados | Ilimitados |

### Descripción y Perfil Recomendado por Plan
1. **Bronze (`shape_bronze`)**: Diseñado para landing pages, sitios informativos, profesionales independientes y marcas personales con tráfico incipiente.
2. **Silver (`shape_silver`)**: Para pequeñas empresas, portafolios y blogs con contenidos multimedia y tráfico recurrente.
3. **Gold (`shape_gold`) - Más Popular**: Diseñado para tiendas WooCommerce, proyectos dinámicos y clientes que requieren cuentas de correo ilimitadas o alojar un segundo sitio web independiente.
4. **Platinum (`shape_platinum`)**: Para plataformas corporativas, e-commerce de alto volumen y academias virtuales con gran cantidad de archivos o correos históricos.
5. **Diamond (`shape_diamond`)**: Solución empresarial para agencias digitales, portales multi-sitio y aplicaciones con alta demanda de almacenamiento y procesamiento.

---

## 3. Servicios Complementarios de Dominios

Los dominios se gestionan a través de la integración con **Spaceship API** y registradores externos:

| Servicio | Precio Anual (COP) | Observaciones |
| :--- | :---: | :--- |
| **Registro / Renovación `.com`** | **$49.999** | Incluye privacidad WHOIS gratuita y gestión de zonas DNS. |
| **Registro / Renovación `.com.co` / `.co`** | **$49.999 - $69.900** | Regulado por tarifas oficiales de extensión territorial. |
| **Transferencia de Dominio In-Bound** | **$49.999** | Incluye renovación automática de 1 año al completar la transferencia. |
| **Migración Web cPanel a cPanel** | **$0 (Gratis)** | Asistencia técnica de traslado sin costo para clientes nuevos. |

---

## 4. Métodos de Pago y Condiciones Comerciales

El módulo de pagos del panel (`/pago`) admite los siguientes mecanismos de recaudo:

### 1. Métodos Directos (Sin Comisión - 0%)
- **Bancolombia**: Transferencia a cuenta de ahorros corporativa / QR.
- **Nequi**: Envío digital a número autorizado.
- **Daviplata**: Transferencia inmediata desde la app Daviplata.
- **Bre-B**: Pagos inmediatos interbancarios mediante llave interoperable.

### 2. Pasarela Digital Automatizada
- **Mercado Pago**: Admite tarjetas de crédito (Visa, Mastercard, Amex), tarjetas de débito y PSE.
  - *Comisión transaccional:* +5.0% sobre el valor del servicio.

---

## 5. Ciclo de Facturación y Automatización de Cobro

1. **Vigencia:** Todos los contratos se liquidan con ciclo anual (12 meses).
2. **Cron de Recordatorios (`/api/cron/renewal-reminders`):**
   - Se ejecuta diariamente a las 12:00 PM (`0 12 * * *`).
   - Requiere autenticación Bearer con `CRON_SECRET`.
   - Envía avisos automáticos por correo a los clientes a los 30 días, 15 días y 7 días previos al vencimiento.
3. **Manejo de Impagos:**
   - La suspensión se realiza mediante API WHM (`whmSuspendAccount`), preservando la totalidad de archivos, bases de datos y buzones.
   - Tras el pago y verificación del comprobante en el panel, la desuspensión es inmediata en 1 clic (`whmUnsuspendAccount`).
