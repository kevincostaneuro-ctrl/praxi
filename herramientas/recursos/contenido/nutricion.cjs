// Nutrición · recursos para el paciente (NUT-PAC-02 está en piloto.cjs) y para el profesional
const { B } = require("../plantilla.cjs");
const I = require("../iconos.cjs");
const IL = require("../ilustraciones.cjs");
const F = require("../figuras.cjs");
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const pac = (archivo, codigo, titulo, subtitulo, ilustracion, bloques, referencias) =>
  ({ archivo: `nutricion/pacientes/${archivo}.pdf`, codigo, cat: "paciente", tema: "nutricion", titulo, subtitulo, ilustracion, bloques, referencias });
const pro = (archivo, codigo, titulo, subtitulo, ilustracion, bloques, referencias) =>
  ({ archivo: `nutricion/profesionales/${archivo}.pdf`, codigo, cat: "profesional", tema: "nutricion", titulo, subtitulo, ilustracion, bloques, referencias });
const campos = (filas, alto = 10, etq = 34) => B.tabla(["Campo", "Contenido"], filas.map(f => [f, ""]), 0, { anchos: [etq, 100 - etq], negrita0: true, altoFilas: alto });

module.exports = [
  // ── NUT-PAC-01 · Diario de alimentación ────────────────────────────────────
  pac("01-diario-de-alimentacion", "NUT-PAC-01", "Diario de alimentación",
    "Registro de lo que comes, cuándo y cómo te sientes, para conocer tus hábitos.", I.libreta,
    t => [
      B.uso("Rellénalo durante 3–7 días, incluido algún día de fin de semana. Apunta justo después de comer: si lo dejas para la noche, se olvidan cosas."),
      B.h("¿Para qué sirve?", 1),
      B.p("No se trata de contar calorías ni de juzgar lo que comes. Anotar tus comidas unos días ayuda a ver patrones: horarios, picoteos, comidas que te saltas o momentos en los que comes sin hambre. Con esa información, tu dietista-nutricionista podrá ajustar las recomendaciones a tu día a día."),
      B.h("Cómo rellenarlo", 2),
      B.rejilla([
        ["Todo cuenta", "Cada vez que comas o bebas algo distinto del agua, también los picoteos.", IL.ico.fruta(t)],
        ["Sin pesar", "Cantidades aproximadas: un plato, un puñado, dos rebanadas…", IL.ico.legumbre(t)],
        ["Hambre y saciedad", "Del 0 al 10, antes y después de comer (escala de abajo).", IL.ico.vaso(t)],
        ["Con sinceridad", "Es una herramienta de trabajo, no un examen.", IL.ico.gota(t)],
      ], 4),
      B.h("Escala de hambre y saciedad", 3),
      B.svg(F.hambre(t)),
      B.salto(),
      B.h("Mi registro", 4),
      B.tabla(["Día / hora", "Qué y cuánto", "Dónde y con quién", "Hambre antes (0–10)", "Saciedad después (0–10)", "Emoción / notas"], [], 12, {
        anchos: [11, 30, 15, 10, 11, 23], alto: 13.5,
        ejemplo: ["Mar 10:30", "Café con leche y 2 galletas", "Trabajo, sola", "4", "5", "Con prisa; a las 12 tenía hambre otra vez"],
      }),
    ]),

  // ── NUT-PAC-03 · Hambre física y emocional ─────────────────────────────────
  pac("03-hambre-fisica-y-emocional", "NUT-PAC-03", "Hambre física y hambre emocional",
    "Aprende a distinguir cuándo comes por necesidad y cuándo por otra cosa.", I.corazon,
    t => [
      B.uso("Lee la comparación y practica la pausa antes de comer durante una semana. Registra los episodios en los que dudes: no hace falta apuntarlos todos."),
      B.h("Dos tipos de hambre", 1),
      B.p("Comer también cumple funciones emocionales, y eso es normal. El problema aparece cuando la comida se convierte en la forma principal de gestionar el aburrimiento, el estrés, la tristeza o el cansancio."),
      B.tabla(["Hambre física", "Hambre emocional"], [
        ["Aparece **poco a poco**.", "Aparece **de repente** y con urgencia."],
        ["Se calma con casi cualquier alimento.", "Pide alimentos concretos (dulce, salado, «algo rico»)."],
        ["Se nota en el cuerpo: estómago vacío, falta de energía.", "Se nota más en la cabeza: ganas de comer, pensamientos insistentes."],
        ["Para cuando estás satisfecho/a.", "Cuesta parar aunque ya estés lleno/a."],
        ["Después no suele haber culpa.", "Después puede aparecer culpa o malestar."],
      ], 0, { anchos: [50, 50] }),
      B.h("Antes de comer, haz una pausa", 2),
      B.svg(F.flujo([["Para", "unos segundos"], ["¿Cuánta hambre?", "del 0 al 10"], ["¿Qué siento?", "cansancio, estrés…"], ["Elige", "qué necesito"]], t, { fuerte: 3, ancho: "160mm" })),
      B.columnas(B.tarjeta("Si es hambre", "Come con calma, sentado/a y sin pantallas. Disfrútalo.", "borde"),
        B.tarjeta("Si es otra cosa", "Prueba primero algo que atienda esa necesidad: descansar, caminar, llamar a alguien, respirar. Si después decides comer, hazlo con atención y sin culpa: una vez no es un fracaso.", "borde")),
      B.tarjeta("Coméntalo con tu profesional si…", "Sientes a menudo que pierdes el control al comer, comes a escondidas, compensas lo que comes (vómitos, ayunos, ejercicio excesivo) o la comida y el peso ocupan gran parte de tus pensamientos. Puede ayudarte a buscar el apoyo adecuado.", "aviso"),
      B.salto(),
      B.h("Registro de episodios", 3),
      B.tabla(["Fecha / hora", "Situación", "Hambre real (0–10)", "Qué sentía", "Qué hice", "Cómo me sentí después"], [], 7, {
        anchos: [11, 21, 11, 18, 19, 20], alto: 17,
        ejemplo: ["Jue 22:00", "Sofá, tras discutir por teléfono", "2", "Enfado, nervios", "Salí 10 min a la terraza; luego una infusión", "Más tranquila, sin ganas de picar"],
      }),
    ]),

  // ── NUT-PAC-04 · Planificador de menús ─────────────────────────────────────
  pac("04-planificador-de-menus", "NUT-PAC-04", "Planificador semanal de menús",
    "Organiza las comidas de la semana y la lista de la compra en 15 minutos.", I.calendario,
    t => [
      B.uso("Elige un día fijo (por ejemplo, el domingo por la tarde). Rellena primero las cenas y los días con menos tiempo, y haz la lista de la compra a partir del menú."),
      B.h("Cómo repartir la semana", 1),
      B.rejilla([
        ["Legumbres", "**2–4** veces por semana", IL.ico.legumbre(t)],
        ["Pescado", "**3–4** veces por semana", IL.ico.gota(t)],
        ["Verdura", "En la **comida y la cena**", IL.ico.fruta(t)],
        ["Huevos y carne", "El resto de días; mejor carne blanca", IL.ico.vaso(t)],
      ], 4),
      B.h("Mi semana", 2),
      B.tabla(["Día", "Desayuno", "Comida", "Merienda", "Cena"], DIAS.map(d => [d, "", "", "", ""]), 0, { anchos: [12, 18, 26, 18, 26], negrita0: true, altoFilas: 12.5 }),
      B.salto(),
      B.h("Lista de la compra", 3),
      B.columnas(B.lineas(10, "Frutas y verduras"), B.lineas(10, "Proteínas (legumbre, pescado, huevo, carne)")),
      B.columnas(B.lineas(8, "Cereales y despensa"), B.lineas(8, "Lácteos y otros")),
      B.rejilla([
        ["Cocina de más", "Lo que sobra un día puede ser la comida del siguiente."],
        ["Deja un hueco libre", "Para imprevistos o una comida fuera."],
        ["Compra por secciones", "Ordena la lista como el súper: tardarás menos y comprarás menos cosas que no necesitas."],
      ]),
    ],
    ["Agencia Española de Seguridad Alimentaria y Nutrición (2022). *Recomendaciones dietéticas sostenibles y de actividad física para la población española*."]),

  // ── NUT-PAC-05 · Cómo leer las etiquetas ───────────────────────────────────
  pac("05-como-leer-las-etiquetas", "NUT-PAC-05", "Cómo leer las etiquetas de los alimentos",
    "Claves para entender lo que compras y comparar productos.", I.etiqueta,
    t => [
      B.uso("Llévala al súper las primeras veces o haz una foto. Practica con dos productos que compres a menudo (última sección)."),
      B.h("La lista de ingredientes", 1),
      B.lista([
        "Aparecen **de mayor a menor cantidad**. Si el azúcar o un aceite están entre los primeros, el producto contiene mucho.",
        "El azúcar puede aparecer con otros nombres: jarabe de glucosa, dextrosa, sacarosa, fructosa, miel, concentrado de zumo…",
        "Cuantos menos ingredientes y más reconocibles, normalmente mejor.",
        "Los alérgenos aparecen destacados (en negrita o subrayados).",
      ]),
      B.h("La tabla nutricional", 2),
      B.svg(F.etiquetaNutricional(t), "Etiqueta de ejemplo. Si indica sodio en lugar de sal: sal = sodio × 2,5."),
      B.h("¿Es mucho o poco? (por 100 g)", 3),
      B.svg(F.umbrales([["Azúcares", 5, 22.5, 30], ["Grasas", 3, 17.5, 25], ["Saturadas", 1.5, 5, 8], ["Sal", 0.3, 1.5, 2.2]], t)),
      B.pequeno("Valores orientativos para alimentos sólidos. «Bajo» corresponde a las declaraciones nutricionales del Reglamento (CE) 1924/2006; «alto», a los criterios del semáforo nutricional de la Food Standards Agency (Reino Unido). En bebidas los umbrales son más bajos."),
      B.h("Otras pistas", 4),
      B.rejilla([
        ["Nutri-Score (A–E)", "Sirve para comparar productos **de la misma categoría**, no un aceite con un refresco."],
        ["«Sin azúcares añadidos»", "No significa sin azúcar: puede llevar el propio de la fruta o la leche."],
        ["«Light»", "Solo indica al menos un 30 % menos de algo que el producto de referencia, no que sea saludable."],
      ]),
      B.h("Practica", 5),
      B.p("Compara dos productos que sueles comprar (por ejemplo, dos cereales de desayuno o dos panes de molde)."),
      B.tabla(["Producto", "Primer ingrediente", "Azúcares /100 g", "Saturadas /100 g", "Sal /100 g", "¿Cuál elijo?"], [], 4, { anchos: [22, 22, 13, 13, 12, 18], alto: 12 }),
    ],
    ["Reglamento (UE) n.º 1169/2011 sobre la información alimentaria facilitada al consumidor.", "Reglamento (CE) n.º 1924/2006 relativo a las declaraciones nutricionales y de propiedades saludables."]),

  // ── NUT-PRO-01 · Historia dietética ────────────────────────────────────────
  pro("01-historia-dietetica", "NUT-PRO-01", "Historia dietética inicial",
    "Plantilla de anamnesis para la primera consulta de nutrición.", I.portapapeles,
    t => [
      B.uso("Recoja primero el motivo de consulta en palabras del paciente. Si aparecen señales de un posible trastorno de la conducta alimentaria, consulte NUT-PRO-03 antes de pautar restricciones o centrar la intervención en el peso.", true),
      B.h("Motivo de consulta y objetivos", 1),
      campos(["Motivo de consulta (en sus palabras)", "Objetivos del paciente", "Expectativas y plazos"], 12),
      B.h("Datos clínicos", 2),
      campos(["Diagnósticos y antecedentes médicos", "Medicación y suplementos", "Alergias e intolerancias diagnosticadas", "Síntomas digestivos (ritmo intestinal, distensión, reflujo…)", "Antecedentes familiares relevantes", "Analítica reciente"], 11),
      B.h("Historia de peso y alimentación", 3),
      campos(["Evolución del peso (máximo, mínimo, cambios recientes)", "Dietas previas y resultado", "Relación con la comida (atracones, restricción, culpa, compensaciones)"], 13),
      B.h("Hábitos", 4),
      campos(["Horarios y número de comidas", "Quién compra y cocina", "Comidas fuera de casa", "Picoteo y bebidas (incluido alcohol)", "Actividad física (tipo, frecuencia, duración)", "Sueño y nivel de estrés", "Preferencias, aversiones y alimentación por motivos culturales o éticos"], 10),
      B.h("Antropometría", 5),
      B.tabla(["Medida", "Valor", "Medida", "Valor"], [["Peso (kg)", "", "Perímetro de cintura (cm)", ""], ["Talla (cm)", "", "Perímetro de cadera (cm)", ""], ["IMC (kg/m²)", "", "Otras (pliegues, bioimpedancia…)", ""]],
        0, { anchos: [24, 20, 36, 20], altoFilas: 9 }),
      B.saltoFijo(),
      B.h("Valoración y plan inicial", 6),
      campos(["Valoración nutricional", "Objetivos acordados (concretos y medibles)", "Primeras pautas", "Derivaciones o coordinación (medicina, psicología…)", "Próxima cita"], 16),
      B.h("Notas de la consulta", 7),
      B.lineas(9),
    ]),

  // ── NUT-PRO-02 · Recordatorio de 24 horas ──────────────────────────────────
  pro("02-recordatorio-24-horas", "NUT-PRO-02", "Recordatorio de 24 horas",
    "Protocolo de pasos múltiples y hoja de registro para la entrevista dietética.", I.reloj,
    t => [
      B.uso("Pregunte por el día de ayer completo, de la mañana a la noche. Para estimar la ingesta habitual se necesitan varios recordatorios, incluido algún día de fin de semana.", true),
      B.h("Pasos de la entrevista", 1),
      B.svg(F.flujo([["1. Lista rápida", "sin interrumpir"], ["2. Olvidos", "lo que se escapa"], ["3. Hora y ocasión", "cuándo y dónde"], ["4. Detalle", "cantidad y cocinado"], ["5. Revisión", "¿falta algo?"]], t)),
      B.tabla(["Paso", "Qué hacer"], [
        ["1. Lista rápida", "El paciente enumera todo lo que comió y bebió ayer, desde que se levantó hasta que se acostó, sin interrumpirle."],
        ["2. Olvidos frecuentes", "Pregunte por lo que suele olvidarse: bebidas (incluido alcohol), picoteos, dulces, pan, aliños, salsas, suplementos."],
        ["3. Hora y ocasión", "Sitúe cada toma: hora, lugar y con quién."],
        ["4. Detalle", "Para cada alimento: forma de preparación, cantidad (medidas caseras o fotografías), marca si es relevante, aceite añadido."],
        ["5. Revisión", "Repase el día completo con el paciente y pregunte si falta algo."],
      ], 0, { anchos: [22, 78], negrita0: true }),
      B.h("Frecuencia de consumo orientativa", 2),
      B.tabla(["Grupo", "Veces / semana", "Grupo", "Veces / semana"], [
        ["Verduras y hortalizas", "", "Legumbres", ""], ["Fruta", "", "Pescado", ""], ["Cereales integrales", "", "Carne roja y procesada", ""],
        ["Lácteos", "", "Ultraprocesados y bollería", ""], ["Frutos secos", "", "Bebidas azucaradas / alcohol", ""],
      ], 0, { anchos: [30, 20, 30, 20], altoFilas: 9 }),
      B.saltoFijo(),
      B.columnas(B.tarjeta("¿Fue un día habitual?", "Si no lo fue (fiesta, enfermedad, viaje), anote por qué: un único recordatorio describe un día, no la dieta habitual.", "borde"),
        B.tarjeta("Tono neutro", "Evite expresiones que transmitan juicio («¿solo eso?», «¿tanto?»): reducen la sinceridad del registro.", "borde")),
      B.h("Registro", 3),
      B.p("Fecha del día recordado: ______________   ¿Día habitual?  Sí / No   Motivo: ______________________________"),
      B.tabla(["Hora", "Lugar", "Alimento o bebida", "Cantidad (medida casera)", "Preparación"], [], 14, { anchos: [9, 15, 34, 20, 22], alto: 12,
        ejemplo: ["08:00", "Casa", "Café con leche semidesnatada", "1 taza (200 ml)", "Con 1 sobre de azúcar"] }),
    ],
    ["Moshfegh, A. J., et al. (2008). The US Department of Agriculture Automated Multiple-Pass Method reduces bias in the collection of energy intakes. *American Journal of Clinical Nutrition, 88*(2), 324-332."]),

  // ── NUT-PRO-03 · Señales de alerta de TCA ──────────────────────────────────
  pro("03-senales-de-alerta-tca", "NUT-PRO-03", "Señales de alerta de TCA y derivación",
    "Qué observar en consulta de nutrición y cómo actuar ante un posible trastorno de la conducta alimentaria.", I.escudo,
    t => [
      B.tarjeta("Para detectar y derivar", "No es un instrumento de diagnóstico ni sustituye a los cuestionarios de cribado validados (por ejemplo, la versión española del SCOFF) ni a la valoración por un equipo especializado.", "aviso"),
      B.h("Señales de alerta", 1),
      B.tabla(["Ámbito", "Qué observar"], [
        ["Conducta alimentaria", "Restricción intensa o reglas rígidas sobre la comida, saltarse comidas, atracones, comer a escondidas, rituales al comer."],
        ["Conductas compensatorias", "Vómitos autoinducidos, uso de laxantes o diuréticos, ejercicio excesivo o compulsivo, ayunos tras comer."],
        ["Peso y cuerpo", "Pérdida de peso rápida o importante, oscilaciones marcadas, preocupación intensa por el peso o la figura, comprobaciones frecuentes."],
        ["Físicas", "Amenorrea o irregularidad menstrual, mareos, intolerancia al frío, erosión dental, callosidades en los nudillos, alteraciones analíticas."],
        ["Emocionales y sociales", "Culpa intensa tras comer, evitar comer con otras personas, aislamiento, ánimo bajo, irritabilidad."],
      ], 0, { anchos: [24, 76], negrita0: true }),
      B.h("Preguntas para explorar", 2),
      B.p("Formúlelas con naturalidad y sin juicio, dentro de la historia dietética:"),
      B.rejilla([
        ["Después de comer", "¿Cómo te sientes después de comer?"], ["Alimentos prohibidos", "¿Hay alimentos que te prohíbes o que te dan miedo?"],
        ["Pérdida de control", "¿Alguna vez sientes que no puedes parar de comer?"], ["Compensación", "¿Has hecho algo para compensar lo que has comido (vomitar, ayunar, más ejercicio, laxantes)?"],
        ["Espacio mental", "¿Cuánto espacio ocupan en tu día los pensamientos sobre la comida, el peso o tu cuerpo?"],
      ], 5),
      B.h("Cómo actuar", 3),
      B.rejilla([
        ["Señales aisladas", "Sin compensaciones ni riesgo físico.\n**Actuación:** evite pautas restrictivas y el foco en el peso. Trabaje regularidad y alimentación flexible. Reevalúe en cada visita."],
        ["Sospecha de TCA", "**Actuación:** explique su preocupación al paciente con calma. Coordine con su médico de familia y con psicología o psiquiatría: el abordaje debe ser multidisciplinar."],
        ["Riesgo físico o psicológico", "Desmayos, dolor torácico, palpitaciones, vómitos frecuentes, pérdida de peso muy rápida, rechazo a comer o beber, ideas de hacerse daño.\n**Actuación:** derivación urgente (urgencias o médico el mismo día)."],
      ]),
      B.h("Registro", 4),
      B.tabla(["Fecha", "Señales observadas", "Actuación", "Derivado a / fecha"], [], 4, { anchos: [12, 38, 30, 20], alto: 14 }),
      B.pequeno("Si el paciente expresa ideas de suicidio o de hacerse daño: en España, línea **024** (24 h) y emergencias **112**."),
    ],
    ["Morgan, J. F., Reid, F., y Lacey, J. H. (1999). The SCOFF questionnaire: assessment of a new screening tool for eating disorders. *BMJ, 319*(7223), 1467-1468.",
      "National Institute for Health and Care Excellence (2017). *Eating disorders: recognition and treatment* (NG69)."]),

  // ── NUT-PRO-04 · Plan de alimentación ──────────────────────────────────────
  pro("04-plan-de-alimentacion", "NUT-PRO-04", "Plan de alimentación",
    "Plantilla para entregar al paciente una pauta clara y personalizada.", I.cubiertos,
    t => [
      B.uso("Rellénela con el paciente al final de la consulta y entréguesela. Pocas pautas y concretas funcionan mejor que un menú cerrado: deje opciones en cada toma.", true),
      B.h("Objetivos", 1),
      campos(["Objetivo principal", "Objetivos de hábitos (2–3, concretos)", "Fecha de revisión"], 12),
      B.h("El plato de referencia", 2),
      B.columnas(B.svg(IL.platoGrande(t)),
        B.tarjeta("½ verduras y hortalizas", "En la comida y la cena, de colores variados.", "borde") +
        B.tarjeta("¼ proteína", "Legumbres, pescado, huevos, carne, lácteos o tofu.", "borde") +
        B.tarjeta("¼ cereales o tubérculos", "Mejor integrales. Agua para beber y aceite de oliva para cocinar y aliñar.", "borde")),
      B.h("Estructura del día", 3),
      B.tabla(["Toma", "Hora orientativa", "Qué incluir", "Opciones"], ["Desayuno", "Media mañana", "Comida", "Merienda", "Cena"].map(x => [x, "", "", ""]),
        0, { anchos: [16, 14, 32, 38], negrita0: true, altoFilas: 14 }),
      B.salto(),
      B.h("Raciones orientativas por grupo", 4),
      B.tabla(["Grupo de alimentos", "Raciones", "Frecuencia", "Equivalencia de una ración"], ["Verduras y hortalizas", "Fruta", "Cereales y tubérculos", "Legumbres", "Pescado, huevos, carne", "Lácteos", "Grasas (aceite, frutos secos)"].map(x => [x, "", "", ""]),
        0, { anchos: [28, 12, 18, 42], negrita0: true, altoFilas: 9 }),
      B.h("Recomendaciones", 5),
      campos(["Bebida", "Técnicas de cocinado", "Comidas fuera de casa", "Situaciones difíciles y cómo afrontarlas", "Otras indicaciones"], 10),
      B.pequeno("Pauta individual: no la comparta con otras personas. Ante cualquier cambio de salud o de medicación, informe a su profesional."),
    ]),

  // ── NUT-PRO-05 · Entrevista motivacional ───────────────────────────────────
  pro("05-entrevista-motivacional-nutricion", "NUT-PRO-05", "Entrevista motivacional en consulta de nutrición",
    "Herramientas para favorecer el cambio de hábitos sin confrontar.", I.dialogo,
    t => [
      B.uso("Identifique en qué etapa está el paciente para cada cambio y adapte la intervención. Use las reglas de importancia y confianza al principio y al final de la sesión.", true),
      B.h("Principios", 1),
      B.rejilla([
        ["Colaborar", "No imponer: el paciente es el experto en su vida."], ["Evocar", "Sus propias razones para cambiar, no las nuestras."],
        ["Respetar la autonomía", "La decisión de cambiar es suya."], ["Frenar el reflejo de corregir", "Dar consejos sin permiso suele aumentar la resistencia."],
      ], 4),
      B.h("Habilidades básicas (OARS)", 2),
      B.tabla(["Habilidad", "Para qué", "Ejemplo"], [
        ["**O** · Preguntas abiertas", "Explorar sin dirigir.", "«¿Qué te gustaría que fuera diferente en tu alimentación?»"],
        ["**A** · Afirmaciones", "Reconocer esfuerzos y fortalezas.", "«Has conseguido desayunar cinco días esta semana; eso tiene mérito.»"],
        ["**R** · Reflejos", "Mostrar que se ha entendido y devolver lo dicho.", "«Te cuesta cenar bien cuando llegas tan cansado/a.»"],
        ["**S** · Resúmenes", "Ordenar lo hablado y reforzar el discurso de cambio.", "«Por un lado…, por otro… ¿Qué te parece si…?»"],
      ], 0, { anchos: [22, 30, 48] }),
      B.h("Reglas de importancia y confianza", 3),
      B.columnas(B.pequeno("**«Del 0 al 10, ¿qué importancia tiene para ti este cambio?»**") + B.escala("0 · Ninguna", "10 · Máxima", 10, true),
        B.pequeno("**«¿Qué confianza tienes en poder hacerlo?»**") + B.escala("0 · Ninguna", "10 · Total", 10, true)),
      B.p("Después: «¿Por qué un 6 y no un 3?» (evoca motivos) y «¿Qué haría falta para pasar a un 7?» (identifica apoyos y barreras)."),
      B.salto(),
      B.h("Etapas del cambio", 4),
      B.svg(F.ciclo([["Precontemplación", "no ve un problema"], ["Contemplación", "«debería, pero…»"], ["Preparación", "quiere cambiar pronto"], ["Acción", "está cambiando"], ["Mantenimiento", "cambios estables"]], t, { bw: 140, centro: ["etapas", "del cambio"] })),
      B.tabla(["Etapa", "Qué se observa", "Qué hacer"], [
        ["Precontemplación", "No ve un problema o no se plantea cambiar.", "Informar si lo permite, explorar sin presionar."],
        ["Contemplación", "Ambivalencia: «debería, pero…».", "Explorar pros y contras, reforzar sus motivos."],
        ["Preparación", "Quiere cambiar pronto.", "Plan concreto con pasos pequeños."],
        ["Acción", "Está haciendo cambios.", "Reforzar logros, resolver dificultades."],
        ["Mantenimiento", "Cambios estables.", "Prevenir recaídas: una recaída es información, no un fracaso."],
      ], 0, { anchos: [20, 36, 44], negrita0: true }),
      B.h("Registro de sesión", 5),
      B.tabla(["Fecha", "Cambio trabajado", "Etapa", "Importancia (0–10)", "Confianza (0–10)", "Plan acordado"], [], 5, { anchos: [10, 24, 14, 11, 11, 30], alto: 13 }),
    ],
    ["Miller, W. R., y Rollnick, S. (2015). *La entrevista motivacional* (3.ª ed.). Paidós.",
      "Prochaska, J. O., y DiClemente, C. C. (1983). Stages and processes of self-change of smoking. *Journal of Consulting and Clinical Psychology, 51*(3), 390-395."]),
];
