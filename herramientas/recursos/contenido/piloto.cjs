const { B } = require("../plantilla.cjs");
const I = require("../ilustraciones.cjs");

module.exports = [
  // ────────────────────────────────────────────────────────────────────────────
  {
    archivo: "pacientes/01-autorregistro-ansiedad.pdf", codigo: "PAC-01", cat: "paciente", tema: "ansiedad",
    titulo: "Autorregistro de ansiedad",
    subtitulo: "Para descubrir cuándo aparece tu ansiedad, qué te dices en ese momento y qué haces después.",
    ilustracion: I.hero.ondas,
    bloques: t => [
      B.uso("Rellénalo cada vez que notes ansiedad, lo antes posible (o al final del día). No hace falta escribir mucho: unas palabras bastan. Tráelo a la próxima sesión."),
      B.h("La ansiedad funciona como un círculo", 1),
      B.p("Una situación dispara un pensamiento; ese pensamiento provoca una emoción y sensaciones en el cuerpo; y lo que hacemos para calmarnos (irnos, evitar, comprobar) alivia en el momento pero hace que la próxima vez el círculo se repita. Registrarlo es el primer paso para romperlo."),
      B.svg(I.circuloAnsiedad(t)),
      B.h("¿Cuánta ansiedad sientes?", 2),
      B.p("Puntúa la intensidad de 0 a 10. No hay respuestas buenas ni malas: lo importante es que uses siempre la misma escala."),
      B.escala("0 · Nada", "10 · La peor imaginable"),
      B.rejilla([
        ["Situación", "Dónde estabas, con quién y qué estaba pasando. Sé concreto/a: «en el metro, de pie, mucha gente»."],
        ["Pensamiento", "La frase que pasó por tu cabeza, con tus palabras: «me voy a marear y nadie me ayudará»."],
        ["Conducta", "Qué hiciste: salir, evitar, distraerte con el móvil, pedir ayuda, quedarte…"],
      ]),
      B.salto(),
      B.h("Mi registro de la semana", 3),
      B.tabla(["Día y hora", "Situación", "Pensamiento", "Emoción y cuerpo", "0–10", "Qué hice"], [], 9, {
        anchos: [12, 22, 22, 18, 7, 19], alto: 15,
        ejemplo: ["Martes, 8:15", "En el metro, lleno de gente", "«Me voy a marear y no podré salir»", "Miedo · corazón acelerado", "8", "Me bajé en la siguiente parada"],
      }),
      B.junto(B.h("Al final de la semana", 4), B.columnas(B.lineas(3, "¿Qué situaciones se repiten?"), B.lineas(3, "¿Qué pensamientos aparecen más?"))),
    ],
    referencias: ["Clark, D. A., y Beck, A. T. (2012). *Terapia cognitiva para trastornos de ansiedad*. Desclée de Brouwer."],
  },
  // ────────────────────────────────────────────────────────────────────────────
  {
    archivo: "pacientes/10-exposicion-gradual.pdf", codigo: "PAC-10", cat: "paciente", tema: "ansiedad",
    titulo: "Exposición gradual",
    subtitulo: "Una guía para afrontar, paso a paso, las situaciones que hoy evitas.",
    ilustracion: I.hero.escalera,
    bloques: t => [
      B.uso("Construye tu escalera con tu psicólogo/a, empieza por el escalón más asumible y repite cada práctica varias veces antes de subir al siguiente."),
      B.h("Por qué funciona", 1),
      B.p("Cada vez que evitas una situación sientes alivio, y ese alivio enseña a tu cerebro que la situación era peligrosa. Al quedarte, compruebas lo que pasa de verdad: que lo que temías no ocurre (o no es tan grave) y que puedes tolerar el malestar."),
      B.svg(I.curvaExposicion(t), "La ansiedad sube y, si te quedas, baja por sí sola. Con cada práctica el pico es menor."),
      B.h("Las reglas de una buena práctica", 2),
      B.rejilla([
        ["Planificada", "Decide antes qué harás, dónde y cuánto tiempo. Nada de improvisar en un mal día."],
        ["Sin muletas", "Deja atrás las «conductas de seguridad»: el agua, el móvil, ir acompañado/a. Impiden aprender."],
        ["Hasta comprobar", "Quédate hasta ver qué pasa realmente, no hasta que la ansiedad desaparezca del todo."],
        ["Repetida", "Varias veces por semana y en sitios distintos. La repetición es lo que consolida."],
        ["Con predicción", "Antes, escribe qué temes que ocurra. Después, compáralo con lo que pasó."],
        ["Con paciencia", "Habrá días peores. Un mal día no borra lo aprendido."],
      ]),
      B.salto(),
      B.h("Mi escalera", 3),
      B.p("Ordena las situaciones que evitas de menor a mayor ansiedad esperada (0 = nada, 100 = la máxima imaginable)."),
      B.tabla(["Escalón", "Situación", "Ansiedad esperada (0–100)", "Empiezo el…", "Superado ✓"],
        [["7 · lo más difícil", "", "", "", ""], ["6", "", "", "", ""], ["5", "", "", "", ""], ["4", "", "", "", ""], ["3", "", "", "", ""], ["2", "", "", "", ""], ["1 · lo más fácil", "", "", "", ""]],
        0, { anchos: [16, 44, 16, 14, 10], negrita0: true }),
      B.h("Registro de prácticas", 4),
      B.tabla(["Fecha", "Escalón", "Lo que temía", "Ansiedad máx. (0–100)", "¿Qué ocurrió?", "Lo que he aprendido"], [], 6, {
        anchos: [10, 9, 21, 12, 23, 25], alto: 14,
        ejemplo: ["12/11", "2", "Marearme en el súper", "65", "Estuve 20 min; no me mareé", "Puedo quedarme aunque me agobie"],
      }),
    ],
    referencias: ["Craske, M. G., Treanor, M., Conway, C. C., Zbozinek, T., y Vervliet, B. (2014). Maximizing exposure therapy: an inhibitory learning approach. *Behaviour Research and Therapy, 58*, 10-23."],
  },
  // ────────────────────────────────────────────────────────────────────────────
  {
    archivo: "profesionales/05-formulacion-de-caso.pdf", codigo: "PRO-05", cat: "profesional", tema: "profesional",
    titulo: "Formulación de caso (5 P)",
    subtitulo: "Plantilla para conceptualizar el caso, ordenar hipótesis y derivar de ellas el plan de tratamiento.",
    ilustracion: I.hero.red,
    bloques: t => [
      B.uso("Complétela tras la evaluación (2.ª–4.ª sesión) y compártala con el paciente en lenguaje sencillo: una formulación consensuada mejora la alianza y la adherencia. Revísela cuando aparezca información nueva; es una hipótesis de trabajo, no un diagnóstico.", true),
      B.h("El modelo", 1),
      B.svg(I.cincoP(t), "Los perpetuantes son el principal objetivo de la intervención: son los que se pueden modificar ahora."),
      B.datos(["Edad", "Impresión diagnóstica (CIE-11 / DSM-5-TR)", "Fecha"]),
      B.h("Las 5 P de este caso", 2),
      B.tabla(["Factor", "Qué recoger", "En este caso"], [
        ["Problema presente", "Síntomas, conductas y dificultades actuales, en palabras del paciente. Impacto en su vida.", ""],
        ["Predisponentes", "Vulnerabilidades previas: biológicas, temperamento, historia de aprendizaje, creencias nucleares, apego.", ""],
        ["Precipitantes", "Acontecimientos o cambios que desencadenaron el problema actual. ¿Por qué ahora?", ""],
        ["Perpetuantes", "Lo que lo mantiene: evitación, conductas de seguridad, rumiación, refuerzos, contexto.", ""],
        ["Protectores", "Fortalezas, apoyos, recursos y motivación que facilitan el cambio.", ""],
      ], 0, { anchos: [17, 33, 50], negrita0: true, alto: 24 }),
      B.h("Hipótesis de mantenimiento", 3),
      B.p("Describa el ciclo que mantiene el problema con un ejemplo reciente y concreto."),
      B.tabla(["Situación", "Pensamiento / creencia", "Emoción y cuerpo", "Conducta", "Consecuencia (corto / largo plazo)"], [], 2, { alto: 20 }),
      B.h("Del modelo al plan", 4),
      B.tabla(["Elemento", "Contenido"], [
        ["Objetivos terapéuticos (consensuados)", ""], ["Intervenciones previstas y para qué factor", ""], ["Posibles obstáculos", ""],
        ["Indicadores de progreso y medidas", ""], ["Duración estimada y revisión", ""],
      ], 0, { anchos: [34, 66], negrita0: true, alto: 16 }),
      B.tarjeta("Pregunta de control", "¿Cada intervención prevista actúa sobre algún factor perpetuante? Si no, revise si es necesaria."),
    ],
    referencias: [
      "Weerasekera, P. (1996). *Multiperspective case formulation: a step towards treatment integration*. Krieger.",
      "Macneil, C. A., Hasty, M. K., Conus, P., y Berk, M. (2012). Is diagnosis enough to guide interventions in mental health? Using case formulation in clinical practice. *BMC Medicine, 10*, 111.",
    ],
  },
  // ────────────────────────────────────────────────────────────────────────────
  {
    archivo: "nutricion/pacientes/02-el-plato-saludable.pdf", codigo: "NUT-PAC-02", cat: "paciente", tema: "nutricion",
    titulo: "El plato saludable",
    subtitulo: "Una forma sencilla de montar comidas equilibradas sin pesar ni contar calorías.",
    ilustracion: I.hero.plato,
    bloques: t => [
      B.uso("Úsalo como guía visual en la comida y la cena. Es flexible: sirve para platos únicos, guisos, táperes y comidas fuera de casa."),
      B.h("Tu plato, en proporciones", 1),
      B.columnas(B.svg(I.platoGrande(t)),
        B.tarjeta("La mitad · verduras y hortalizas", "De colores variados, crudas o cocinadas: ensalada, pisto, judías verdes, brócoli, calabacín.", "borde") +
        B.tarjeta("Un cuarto · proteína", "Legumbres, pescado, huevos, carne (mejor blanca), tofu, lácteos.", "borde") +
        B.tarjeta("Un cuarto · cereales o tubérculos", "Mejor integrales: arroz, pasta, pan, patata, quinoa, cuscús.", "borde")),
      B.h("Para completar", 2),
      B.rejilla([
        ["Agua", "Como bebida habitual. Refrescos, zumos y alcohol, de forma ocasional.", I.ico.vaso(t)],
        ["Aceite de oliva", "Para cocinar y aliñar, en cantidad moderada.", I.ico.gota(t)],
        ["Fruta a diario", "Entera mejor que en zumo; puede ser tu postre.", I.ico.fruta(t)],
        ["Legumbres", "Varias veces por semana. También cuentan como proteína.", I.ico.legumbre(t)],
      ], 4),
      B.salto(),
      B.h("Así queda en la práctica", 3),
      B.tabla(["Momento", "Un ejemplo de plato"], [
        ["Comida", "Ensalada de tomate y pepino + lentejas estofadas con verduras + pan integral + fruta."],
        ["Cena", "Verduras salteadas + tortilla francesa o pescado a la plancha + patata asada."],
        ["Plato único", "Arroz integral con pollo y muchas verduras: que las verduras ocupen la mitad del táper."],
        ["Comer fuera", "Primero de verdura o ensalada; segundo de pescado o carne con guarnición vegetal; agua y fruta."],
      ], 0, { anchos: [20, 80], negrita0: true }),
      B.junto(B.h("Mi plato de esta semana", 4),
        B.columnas(B.svg(I.platoGrande(t, true), "Dibuja o escribe cómo quedó una de tus comidas."), B.lineas(6, "¿Qué parte me cuesta más completar? ¿Qué puedo cambiar?"))),
      B.tarjeta("", "Proporciones orientativas para adultos sanos. Si tienes alguna enfermedad, estás embarazada o haces deporte intenso, tu dietista-nutricionista ajustará las tuyas.", "aviso"),
    ],
    referencias: [
      "Harvard T.H. Chan School of Public Health. *El plato para comer saludable*.",
      "Agencia Española de Seguridad Alimentaria y Nutrición (2022). *Recomendaciones dietéticas sostenibles y de actividad física para la población española*.",
    ],
  },
];
