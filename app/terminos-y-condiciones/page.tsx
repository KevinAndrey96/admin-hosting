import AdminLayout from '../components/AdminLayout';
import Link from 'next/link';

export default function TerminosPage() {
  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: 'var(--c-bkg-body)', minHeight: '100%', padding: '24px' }}>
        <div className="row mB-20">
          <div className="col-12">
            <Link href="/hosting" className="c-primary fsz-sm td-n mB-10 d-ib fw-500">← Volver</Link>
            <h4 className="m-0 mT-5 c-grey-900">Términos y condiciones de uso del servicio</h4>
            <p className="c-grey-600 fsz-sm mT-10 mB-30">
              Última actualización: febrero 2026. Le recomendamos leer detenidamente el presente documento antes de utilizar nuestros servicios.
            </p>

            <div className="c-grey-800 fsz-sm lh-1-8" style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
{`1. ACEPTACIÓN DE LOS TÉRMINOS

Al acceder a este sitio web, utilizar cualquiera de los servicios ofrecidos a través del mismo, crear una cuenta de usuario, realizar cualquier compra o transacción, o de cualquier otra forma interactuar con la plataforma, usted (en adelante, "el Usuario", "usted" o "el Cliente") declara haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones de Uso del Servicio (en adelante, "los Términos"), así como nuestra Política de Privacidad y cualquier otro documento o política que se incorpore por referencia a los presentes Términos. Si usted no está de acuerdo con alguno de los términos aquí establecidos, le solicitamos que se abstenga de utilizar nuestros servicios de forma inmediata.

La aceptación de los presentes Términos constituye un acuerdo legalmente vinculante entre usted y el proveedor del servicio (en adelante, "el Proveedor", "nosotros", "nuestro" o "la Empresa"). La continuación del uso de los servicios con posterioridad a cualquier modificación de los presentes Términos constituirá su aceptación de dichas modificaciones. Es responsabilidad del Usuario revisar periódicamente los presentes Términos para estar informado de cualquier cambio.


2. DEFINICIONES Y ALCANCE

A los efectos de los presentes Términos, se entenderá por:

"Servicios": todos y cada uno de los productos, servicios, funcionalidades, herramientas, aplicaciones, plataformas y recursos que el Proveedor pone a disposición de los Usuarios a través del sitio web, incluyendo pero no limitándose a: registro y gestión de dominios de internet, servicios de alojamiento web (hosting), correo electrónico, y cualquier otro servicio que pueda ser ofrecido ahora o en el futuro.

"Sitio web" o "Plataforma": el sitio web operado por el Proveedor, incluyendo todas sus páginas, subdominios, aplicaciones asociadas y cualquier otro medio digital a través del cual se presten los Servicios.

"Usuario" o "Cliente": toda persona natural o jurídica que acceda al Sitio web, utilice los Servicios, posea una cuenta registrada o de cualquier otra forma interactúe con la Plataforma.

"Contenido": cualquier información, dato, texto, imagen, archivo, software, código o cualquier otro material que sea cargado, publicado, transmitido, almacenado o de cualquier otra forma puesto a disposición a través de los Servicios.

"Cuenta": el espacio personal o corporativo creado por el Usuario en la Plataforma que permite acceder a los Servicios y gestionar los mismos.

Los presentes Términos se aplican a todos los Usuarios del Sitio web y a todos los Servicios ofrecidos, sin excepción. Ciertos Servicios pueden estar sujetos a términos adicionales o condiciones específicas que se comunicarán al Usuario en el momento de la contratación o utilización de dicho Servicio específico. En caso de conflicto entre los presentes Términos generales y los términos específicos de un Servicio, prevalecerán los términos específicos del Servicio en cuestión en la medida de dicho conflicto.

2.1. ALIANZAS ESTRATÉGICAS

Trabajamos en alianza estratégica con COBOL INGENIERÍA SAS para determinados servicios de hosting e infraestructura web. Las condiciones adicionales de las secciones 3.2 y 5.3 se aplicarán cuando corresponda a los servicios contratados.


3. DESCRIPCIÓN DE LOS SERVICIOS

El Proveedor ofrece una variedad de servicios relacionados con la presencia en internet, incluyendo entre otros: el registro y renovación de nombres de dominio, servicios de alojamiento web que permiten la publicación de sitios web en internet, cuentas de correo electrónico, y otros servicios complementarios que puedan ser ofrecidos de forma ocasional o permanente. La descripción detallada de cada Servicio, sus características, limitaciones técnicas, precios y condiciones particulares se encuentra disponible en el Sitio web al momento de la contratación.

El Proveedor se reserva el derecho de modificar, ampliar, restringir, suspender o discontinuar temporal o permanentemente cualquiera de los Servicios, o cualquier aspecto, característica o funcionalidad de los mismos, en cualquier momento y sin necesidad de previo aviso, cuando así lo considere conveniente por razones técnicas, comerciales, legales o de cualquier otra índole. El Usuario acepta que el Proveedor no será responsable ante él ni ante terceros por cualquier modificación, suspensión o discontinuación de los Servicios o de cualquier parte de los mismos.

Los Servicios se prestan "tal cual" y "según disponibilidad". El Proveedor no garantiza que los Servicios serán ininterrumpidos, libres de errores, seguros o que satisfagan los requisitos específicos del Usuario. El Usuario reconoce y acepta que el uso de los Servicios es bajo su propio riesgo y responsabilidad.

3.1. DOMINIOS: PROPIEDAD, MODELO RESELLER Y ALCANCE DEL SERVICIO

Los nombres de dominio registrados a través de nuestra Plataforma son de propiedad exclusiva del Usuario. Si bien el registro se gestiona y administra a través de nuestros sistemas, el Usuario es el titular legítimo del dominio y puede disponer de él libremente para lo que requiera: transferirlo a otro registrador, apuntarlo a los servidores que prefiera, utilizarlo con el proveedor de hosting de su elección, o realizar cualquier otra gestión que considere conveniente. Nos comprometemos a facilitar los procesos de transferencia, liberación o cambio de nameservers cuando el Usuario lo solicite, porque entendemos que su dominio le pertenece.

Operamos como plataforma de reseller (revendedor). Utilizamos a Spaceship como proveedor técnico de registro en el backend, pero es nosotros quienes le prestamos el servicio directamente a usted: gestionamos el registro, la renovación, las consultas WHOIS, el bloqueo de transferencias y toda la administración del dominio desde nuestra Plataforma. Usted contrata con nosotros y nosotros nos encargamos de que su dominio esté correctamente registrado y operativo. Esta transparencia en nuestro modelo de negocio refleja nuestro compromiso con la confianza y la claridad en la relación con nuestros clientes.

Para ofrecerle un servicio ágil y a precios competitivos, es importante establecer con claridad el alcance de nuestra responsabilidad. No nos hacemos responsables por aspectos que quedan fuera de nuestra administración directa del dominio. Esto incluye, entre otros: soporte técnico para la configuración de su sitio web, configuración de correos corporativos (cuentas de correo, MX, SPF, DKIM, etc.), soporte en el desarrollo o mantenimiento del sitio web, problemas de rendimiento o lentitud de la página web, compatibilidad con plugins o aplicaciones de terceros, y cualquier asunto relacionado con el hosting, el diseño o el contenido de su sitio. Nosotros nos enfocamos en que su dominio esté registrado, renovado a tiempo y disponible; el resto de la infraestructura (hosting, correo, sitio web) puede estar en manos de otros proveedores o del propio Usuario, y sobre esos aspectos no tenemos control ni responsabilidad.

Confiamos en que al dejar sus dominios con nosotros recibirá un servicio transparente, sin sorpresas en los precios, con la seguridad de que su dominio es suyo y de que estamos comprometidos con facilitarle su gestión. Nuestra prioridad es que usted tenga el control y la tranquilidad sobre su presencia en internet.

3.2. HOSTING (SERVICIOS DE ALOJAMIENTO WEB)

Cuando el Proveedor ofrezca servicios de hosting (incluyendo aquellos prestados en alianza con nuestros aliados estratégicos), se aplicarán las siguientes condiciones adicionales:

Comunicación y panel: La administración del hosting se realiza a través del panel de control indicado en el Sitio web. Las notificaciones sobre cambios en el servicio o en este acuerdo se considerarán entregadas cuando se publiquen en el panel o se envíen al correo electrónico del contacto administrativo registrado. El Cliente debe mantener su información de contacto actualizada. El Proveedor no venderá ni revelará información de contacto del Cliente a terceros, salvo que la ley lo requiera o el Cliente lo autorice expresamente.

Facturación y vencimiento: Los pagos de hosting son efectivos en la fecha de aniversario de contratación. Las facturas se envían aproximadamente quince (15) días calendario antes del vencimiento. Si el pago no se recibe antes de la fecha de vencimiento, la cuenta será suspendida y podrá aplicarse un cargo de reactivación. Las cuentas suspendidas por más de ocho (8) días calendario pueden ser eliminadas. Se mantienen copias de seguridad adicionales por aproximadamente 30 días; su recuperación está sujeta a solicitud al área de soporte y puede aplicar cargos adicionales.

Medios de pago: Puede aplicar un cargo adicional por transacción en pagos con tarjeta de crédito, PayPal o consignación bancaria, según se indique en el Sitio web.

Cancelación: El Cliente puede cancelar una cuenta de hosting en cualquier momento a través del panel de control. La aprobación de transferencias o generación de backups puede estar sujeta al paz y salvo por cualquier concepto pendiente.

Backups: La política estándar de retención de backups es de 24 horas. El Cliente dispone de medios para generar sus propios backups a través del panel de control. El Proveedor no será responsable por pérdidas de información por daños de hardware, accesos no autorizados o cualquier otra causa, salvo que se especifique en un contrato adicional. No se garantiza la disponibilidad de los backups automáticos. El Cliente debe mantener sus propios backups de archivos web, bases de datos y correo electrónico.

Disponibilidad: No se garantiza que la disponibilidad del servidor sea continua e ininterrumpida debido a posibles problemas en la red, averías en equipos u otras contingencias. En servidores compartidos, pueden producirse problemas técnicos imputables a terceros. El Cliente renuncia a reclamar responsabilidad por fallos, lentitud o errores debidos a causas fuera del control del Proveedor.

Límite de responsabilidad por hosting: Si el Proveedor incumpliera sus compromisos por un servicio ineficiente por más de 24 horas, la responsabilidad se limitará, como máximo, al importe cobrado por los servicios de hosting durante dicho periodo. En ningún caso se exigirán responsabilidades por pérdida de información, interrupción del negocio o daños a terceros.

Fuerza mayor: No se responsabiliza al Proveedor por interrupciones motivadas por causas de fuerza mayor o fuera de su control (modem, sistema operativo del usuario, firewall, software de conexión, virus, red telefónica, satélite, enrutadores, etc.), ni por actos de terceros como hacking o cracking.

Precios: Los planes de hosting, dominios y servicios cloud están sujetos a cambios sin previo aviso. Los precios se confirman hasta por un máximo de cinco (5) días calendario, salvo indicación contraria.


4. ELEGIBILIDAD Y REGISTRO

Para utilizar los Servicios, el Usuario debe ser mayor de edad según la legislación aplicable en su jurisdicción, tener la capacidad legal para obligarse contractualmente, y no estar legalmente impedido de utilizar los Servicios. Si el Usuario actúa en nombre de una persona jurídica, declara tener la autorización suficiente para vincular a dicha persona jurídica con los presentes Términos.

El registro en la Plataforma requiere proporcionar información veraz, exacta, actual y completa. El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su Cuenta. El Usuario debe notificar inmediatamente al Proveedor cualquier uso no autorizado de su Cuenta o cualquier otra brecha de seguridad.

El Proveedor se reserva el derecho de rechazar, suspender o cancelar cualquier Cuenta o el acceso a los Servicios, en cualquier momento y a su sola discreción, sin necesidad de indicar causa, especialmente en casos de incumplimiento de los presentes Términos, conducta fraudulenta, o cuando así lo exija la ley o las autoridades competentes.


5. OBLIGACIONES DEL USUARIO

El Usuario se compromete a utilizar los Servicios de conformidad con la ley aplicable, los presentes Términos, y las buenas costumbres. El Usuario se obliga a no utilizar los Servicios para fines ilegales, fraudulentos, abusivos, difamatorios, obscenos, que infrinjan derechos de terceros, que promuevan la violencia, el odio o la discriminación, que contengan malware o código malicioso, que constituyan spam o envío masivo de comunicaciones no solicitadas, o que de cualquier otra forma puedan dañar al Proveedor, a otros Usuarios o a terceros.

5.1. PROPIEDAD DE LA INFORMACIÓN Y RESPONSABILIDAD DEL CONTENIDO

El Usuario es el único y exclusivo dueño de toda la información, datos, archivos, bases de datos, correos electrónicos, sitios web y cualquier otro Contenido que cargue, publique, almacene o transmita a través de los Servicios. El Proveedor no reclama propiedad alguna sobre el Contenido del Usuario. El Usuario es plena y exclusivamente responsable de todo lo que se publique, aloje, distribuya o ponga a disposición del público a través de los sitios web, servidores, cuentas de correo o cualquier otro recurso asociado a los Servicios contratados.

El Proveedor NO se hace responsable en ningún caso por el Contenido alojado, publicado o transmitido por el Usuario en sus servidores, sitios web, cuentas de correo o cualquier otro medio. El Proveedor actúa únicamente como proveedor de infraestructura técnica de alojamiento y no ejerce control editorial sobre el Contenido de los Usuarios. Cualquier reclamación, demanda, sanción administrativa, acción legal o responsabilidad que derive del Contenido publicado por el Usuario será asumida íntegramente por el Usuario, quien exonera al Proveedor de toda responsabilidad al respecto.

5.2. USO INDEBIDO Y SANCIONES

Se considera uso indebido de los Servicios toda actividad que viole la ley, los presentes Términos o las políticas de uso aceptable. El Proveedor se reserva el derecho de aplicar sanciones que incluyen, sin limitarse a: advertencia escrita, suspensión temporal del servicio, terminación inmediata del contrato sin derecho a reembolso, y reporte a las autoridades competentes, cuando tenga conocimiento o sospecha fundada de que el Usuario está realizando o ha realizado cualquiera de las siguientes actividades prohibidas:

— Spam, correo no deseado o envío masivo de comunicaciones comerciales no solicitadas (correo electrónico, mensajes SMS, comentarios en foros, etc.);
— Alojamiento, distribución, promoción o enlace a contenido pornográfico, obsceno, de explotación sexual o que involucre menores;
— Promoción, venta, distribución o facilitación del acceso a drogas, sustancias controladas, estupefacientes o productos ilegales;
— Contenido que promueva la violencia, el terrorismo, el extremismo o actividades delictivas;
— Phishing, fraude electrónico, suplantación de identidad o estafas;
— Malware, virus, troyanos, ransomware o cualquier código malicioso;
— Piratería, infracción de derechos de autor, marcas o propiedad intelectual;
— Hosting de sitios de apuestas ilegales o juegos de azar no autorizados;
— Lavado de activos, evasión fiscal o actividades financieras ilícitas;
— Difamación, calumnia, injuria o acoso a terceros;
— Contenido que promueva el odio, la discriminación racial, étnica, religiosa o por orientación sexual;
— Violación de la privacidad de terceros o publicación de datos personales sin consentimiento;
— Minería de criptomonedas no autorizada o uso excesivo de recursos del servidor;
— Revendedores o proxies que faciliten el acceso a contenido ilegal;
— Cualquier otra actividad que el Proveedor considere, a su sola discreción, contraria a la ley, la moral o el orden público.

La detección de uso indebido puede realizarse por denuncia de terceros, monitoreo automatizado, solicitud de autoridades o revisión interna. El Proveedor podrá actuar de forma inmediata sin necesidad de previo aviso cuando la gravedad del caso lo requiera o cuando la ley así lo exija. El Usuario acepta que la aplicación de sanciones no genera derecho a reembolso ni a reclamación alguna contra el Proveedor.

El Usuario se compromete a realizar copias de seguridad de su Contenido. El Proveedor no garantiza la conservación indefinida de los datos y no será responsable por la pérdida de Contenido del Usuario por cualquier causa.

5.3. PÓLIZA DE USO ACEPTABLE Y LÍMITES DE RECURSOS (HOSTING)

Adicionalmente a lo establecido en la sección 5.2, en servicios de hosting compartido se aplican las siguientes restricciones:

Correo electrónico: Operamos bajo política de tolerancia cero al spam. El envío de correo masivo no solicitado (UBE) desde, hacia o a través de nuestros servicios puede resultar en suspensión o terminación inmediata. Las listas de correo deben cumplir estándares de doble opt-in. Está prohibido reenviar cadenas de correo, suplantar identidad, personificar a otros o usar servidores de correo de terceros para retransmitir sin permiso expreso.

Uso de recursos compartidos: En cuentas de hosting compartido, el Usuario NO puede: (a) usar 25% o más de recursos del sistema (CPU, I/O de disco, conexiones) por más de 90 segundos; (b) ejecutar crawlers, spiders o indexadores; (c) ejecutar aplicaciones de torrents, trackers o clientes (se permite enlazar externamente); (d) ejecutar procesos CRON con intervalos menores a 20 minutos; (e) ejecutar consultas SQL que tomen más de 20 segundos (las tablas deben estar indexadas correctamente).

Inodos y espacio: El uso de más de 250.000 inodos en cuentas compartidas puede ocasionar problemas. Cuentas con más de 150.000 inodos pueden ser deshabilitadas del sistema automático de backups. Cuentas que superen 30 GB pueden ser deshabilitadas del sistema automático de backups. El espacio en disco debe estar relacionado con la página web hospedada; no se ofrece almacenamiento online, sitios de descargas masivas ni backups de datos ajenos a la cuenta.

Bases de datos: Bases de datos con número excesivo de tablas (más de 500) o tamaño excesivo (más de 3 GB) pueden impactar el rendimiento. En tales casos se solicitará reducción o se evaluará suspensión según la afectación al servicio.

Seguridad: Está prohibido modificar direcciones MAC o IP, interceptar tráfico de otros clientes, ejecutar servidores proxy no autorizados, o cualquier comportamiento que afecte negativamente los servicios del Proveedor o derive en inclusión en listas negras de correo.


6. PAGOS, FACTURACIÓN Y RENOVACIÓN

Los precios de los Servicios se encuentran publicados en el Sitio web y pueden estar sujetos a impuestos aplicables. Los precios pueden ser modificados por el Proveedor en cualquier momento; dichas modificaciones no afectarán los servicios ya contratados hasta la fecha de su próxima renovación, salvo que la ley disponga lo contrario.

El pago de los Servicios se realizará por los medios y en los plazos indicados en el Sitio web al momento de la contratación. El incumplimiento del pago en los plazos establecidos puede dar lugar a la suspensión o cancelación de los Servicios, sin perjuicio de las acciones legales que el Proveedor pueda ejercer para el cobro de las cantidades adeudadas.

Muchos Servicios se contratan por períodos determinados (anuales, mensuales, etc.) y pueden renovarse automáticamente al finalizar cada período, salvo que el Usuario cancele la renovación automática con la antelación indicada en el Sitio web. El Usuario es responsable de gestionar las renovaciones y cancelaciones de sus Servicios.

Las políticas de reembolso, si las hubiere, se encuentran descritas en el Sitio web o se comunicarán al Usuario en el momento de la compra. Salvo disposición en contrario, los pagos realizados no son reembolsables.


7. PROPIEDAD INTELECTUAL

Todos los derechos de propiedad intelectual e industrial sobre el Sitio web, los Servicios, el software subyacente, el diseño, los logotipos, las marcas, los textos, las imágenes y cualquier otro elemento del Sitio web o de los Servicios son propiedad exclusiva del Proveedor o de sus licenciantes. El Usuario no adquiere ningún derecho sobre dichos elementos por el mero uso de los Servicios.

El Usuario conserva todos los derechos sobre su propio Contenido. No obstante, al cargar o publicar Contenido a través de los Servicios, el Usuario otorga al Proveedor una licencia no exclusiva, mundial, libre de regalías y transferible para usar, reproducir, modificar, adaptar y mostrar dicho Contenido en la medida necesaria para la prestación de los Servicios.


8. LIMITACIÓN DE RESPONSABILIDAD

EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE, EL PROVEEDOR Y SUS DIRECTORES, EMPLEADOS, AGENTES, LICENCIANTES Y PROVEEDORES NO SERÁN RESPONSABLES POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, INCLUYENDO PERO NO LIMITÁNDOSE A PÉRDIDA DE BENEFICIOS, PÉRDIDA DE DATOS, PÉRDIDA DE CLIENTES, INTERRUPCIÓN DEL NEGOCIO O CUALQUIER OTRO DAÑO DE SIMILAR NATURALEZA, QUE RESULTEN DEL USO O LA IMPOSIBILIDAD DE USO DE LOS SERVICIOS, INCLUSO SI EL PROVEEDOR HA SIDO ADVERTIDO DE LA POSIBILIDAD DE DICHOS DAÑOS.

LA RESPONSABILIDAD TOTAL DEL PROVEEDOR ANTE EL USUARIO POR CUALQUIER RECLAMACIÓN RELACIONADA CON LOS SERVICIOS O LOS PRESENTES TÉRMINOS NO EXCEDERÁ EN NINGÚN CASO EL MONTO TOTAL PAGADO POR EL USUARIO AL PROVEEDOR EN LOS DOCE (12) MESES INMEDIATAMENTE ANTERIORES AL HECHO QUE DIO LUGAR A LA RECLAMACIÓN, O LA CANTIDAD DE CIEN (100) UNIDADES DE LA MONEDA LOCAL, LO QUE SEA MAYOR.

Los Servicios se prestan "tal cual" y "según disponibilidad", sin garantías de ningún tipo, ya sean expresas o implícitas, incluyendo pero no limitándose a garantías de comerciabilidad, idoneidad para un propósito particular o no infracción. El Proveedor no garantiza que los Servicios serán ininterrumpidos, seguros o libres de errores.


9. EXENCIÓN DE GARANTÍAS

EL PROVEEDOR NO GARANTIZA QUE LOS SERVICIOS SATISFAGAN LOS REQUISITOS ESPECÍFICOS DEL USUARIO, QUE LOS SERVICIOS SERÁN ININTERRUMPIDOS, OPORTUNOS, SEGUROS O LIBRES DE ERRORES, QUE LOS RESULTADOS OBTENIDOS DEL USO DE LOS SERVICIOS SERÁN EXACTOS O CONFIABLES, O QUE CUALQUIER ERROR EN LOS SERVICIOS SERÁ CORREGIDO.

EL USUARIO RECONOCE Y ACEPTA QUE EL USO DE LOS SERVICIOS ES BAJO SU PROPIO RIESGO Y QUE ES RESPONSABLE DE EVALUAR LA PRECISIÓN, INTEGRIDAD Y UTILIDAD DE CUALQUIER INFORMACIÓN O CONTENIDO OBTENIDO A TRAVÉS DE LOS SERVICIOS.


10. INDEMNIZACIÓN

El Usuario se compromete a indemnizar, defender y mantener indemne al Proveedor, sus afiliados, directores, empleados, agentes y licenciantes frente a cualquier reclamación, demanda, pérdida, responsabilidad, daño, costo y gasto (incluyendo honorarios legales razonables) que surjan de o estén relacionados con: (a) el uso que el Usuario haga de los Servicios; (b) el incumplimiento por parte del Usuario de los presentes Términos; (c) el Contenido que el Usuario cargue, publique o transmita a través de los Servicios; (d) la violación por parte del Usuario de cualquier derecho de terceros; o (e) cualquier conducta u omisión del Usuario que cause daño al Proveedor o a terceros.


11. PRIVACIDAD Y PROTECCIÓN DE DATOS

El tratamiento de los datos personales del Usuario se rige por nuestra Política de Privacidad, que forma parte integrante de los presentes Términos. Al aceptar los presentes Términos, el Usuario también acepta la Política de Privacidad. El Usuario consiente el tratamiento de sus datos personales en los términos allí establecidos.

El Proveedor implementa medidas de seguridad técnicas y organizativas para proteger los datos personales de los Usuarios, si bien no puede garantizar la seguridad absoluta de las transmisiones por internet o del almacenamiento electrónico.


12. SUSPENSIÓN Y TERMINACIÓN

El Proveedor puede suspender o terminar el acceso del Usuario a los Servicios, o cancelar su Cuenta, en cualquier momento y sin previo aviso, por incumplimiento de los presentes Términos, por conducta que el Proveedor considere inapropiada, por solicitud de las autoridades competentes, o por cualquier otra razón que el Proveedor estime conveniente.

El Usuario puede terminar su relación con el Proveedor en cualquier momento dejando de utilizar los Servicios y cancelando su Cuenta y las renovaciones automáticas de los Servicios contratados, según los procedimientos indicados en el Sitio web.

Las disposiciones de los presentes Términos que por su naturaleza deban sobrevivir a la terminación, incluyendo, entre otros, las secciones de Limitación de Responsabilidad, Exención de Garantías, Indemnización y Propiedad Intelectual, permanecerán en vigor después de la terminación.


13. MODIFICACIONES

El Proveedor se reserva el derecho de modificar los presentes Términos en cualquier momento. Las modificaciones entrarán en vigor en el momento de su publicación en el Sitio web, o en la fecha que en la modificación se indique. El uso continuado de los Servicios después de la entrada en vigor de las modificaciones constituye la aceptación de los Términos modificados.

Se recomienda al Usuario revisar periódicamente los presentes Términos. Si el Usuario no acepta las modificaciones, deberá dejar de utilizar los Servicios y cancelar su Cuenta.


14. DISPOSICIONES GENERALES

Los presentes Términos constituyen el acuerdo completo entre el Usuario y el Proveedor respecto de los Servicios y sustituyen cualquier acuerdo, comunicación o entendimiento previo, ya sea escrito u oral.

La nulidad o inaplicabilidad de alguna disposición de los presentes Términos no afectará la validez o aplicabilidad de las demás disposiciones. Las disposiciones nulas o inaplicables se interpretarán o modificarán en la medida mínima necesaria para hacerlas válidas y aplicables, preservando en lo posible la intención original de las partes.

El Proveedor no incurrirá en incumplimiento por retrasos o fallos en el cumplimiento de sus obligaciones cuando dichos retrasos o fallos se deban a causas fuera de su control razonable, incluyendo, entre otros, desastres naturales, guerras, actos de gobierno, fallos de internet o de proveedores de servicios de telecomunicaciones, o cualquier otra causa de fuerza mayor.

El Usuario no podrá ceder o transferir sus derechos u obligaciones bajo los presentes Términos sin el consentimiento previo por escrito del Proveedor. El Proveedor podrá ceder o transferir sus derechos y obligaciones sin restricción.

Los encabezados de las secciones de los presentes Términos tienen carácter meramente informativo y no afectan la interpretación de las disposiciones.


15. LEY APLICABLE Y JURISDICCIÓN

Los presentes Términos se rigen por las leyes de la República de Colombia, sin tener en cuenta sus disposiciones sobre conflicto de leyes. Cualquier controversia que surja de o en relación con los presentes Términos o los Servicios será sometida a los tribunales competentes de la República de Colombia, y las partes se someten expresamente a la jurisdicción de dichos tribunales.


16. CONTACTO

Para cualquier consulta, reclamación o notificación relacionada con los presentes Términos o los Servicios, el Usuario puede contactar al Proveedor a través de los medios de contacto indicados en el Sitio web.

Al utilizar los Servicios, el Usuario reconoce haber leído, comprendido y aceptado los presentes Términos y Condiciones en su totalidad.`}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
