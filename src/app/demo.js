import { DEFAULT_CONSENT, INITIAL_PROFESIONALES } from "./constantes.js";
import { addDays, diasEntre, fechaDe, toYMD, today } from "./utilidades.js";

// ── SAMPLE DATA ────────────────────────────────────────────────────────────────
export const mkPatient=()=>({id:Date.now(),nombre:"",apellidos:"",telefono:"",email:"",fechaNacimiento:"",estado:"activo",
  motivoConsulta:"",
  historiaClinica:{antecedentesFamiliares:"",antecedentesPersonales:"",tratamientosPrevios:"",medicacionActual:"",enfermedadesMedicas:"",consumoSustancias:"",desarrolloEvolutivo:""},
  formulacionCaso:{habitosDiarios:"",sueno:"",alimentacion:"",deporte:"",familia:"",relaciones:"",trabajo:"",factoresEstresantes:"",factoresProtectores:"",otrosFactores:""},
  informesMedicos:[],pruebasRealizadas:[],sesiones:[],objetivos:[],consentimiento:false,consentimientoTexto:DEFAULT_CONSENT,informeAlta:"",documentos:[]});

export const mk=(id,n,ap,tel,email,fnac,estado,motivo,consent,sesArr,objArr,prArr,infArr)=>({
  id,nombre:n,apellidos:ap,telefono:tel,email,fechaNacimiento:fnac,estado,motivoConsulta:motivo,
  consentimiento:consent,consentimientoTexto:DEFAULT_CONSENT,informeAlta:"",documentos:[],
  informesMedicos:infArr||[],pruebasRealizadas:prArr||[],sesiones:sesArr||[],objetivos:objArr||[],
  dni:"",sexo:"",nacionalidad:"",direccion:"",codigoPostal:"",ciudad:"",mutua:"",numPoliza:"",
  numFacturacion:"",situacionLaboral:"",trabajoActual:"",referencia:"",observacionesAdmin:""
});
export const ses=(id,num,fecha,pago,pagado,fac,trab)=>({id,numero:num,fecha,pago,pagado,factura:fac,trabajado:trab,observaciones:""});
export const ob=(id,objetivo,logrado)=>({id,objetivo,logrado});
export const pr=(id,fecha,prueba,resultado,observaciones="")=>({id,fecha,prueba,resultado,observaciones});
export const mf=(id,fecha,titulo,descripcion,medico)=>({id,fecha,titulo,descripcion,medico});

export const SAMPLE_PATIENTS=[
  mk(1,"María","González López","612 345 678","maria@email.com","1990-03-15","activo","Ansiedad generalizada con preocupación excesiva, insomnio y tensión muscular.",true,
    [ses(1,1,"2026-01-15",80,true,"FAC-101","Evaluación inicial. Historia clínica."),ses(2,2,"2026-02-01",80,true,"FAC-102","Psicoeducación ansiedad."),ses(3,3,"2026-02-15",80,true,"FAC-103","Respiración diafragmática."),ses(4,4,"2026-03-01",80,false,"FAC-104","Reestructuración cognitiva.")],
    [ob(1,"Reducir episodios de ansiedad semanales",false),ob(2,"Aplicar respiración de forma autónoma",true)],
    [pr(1,"2026-01-15","BAI","Puntuación 28 — Ansiedad moderada"),pr(2,"2026-03-15","BAI","Puntuación 14 — Ansiedad leve","Mejora significativa")],
    [mf(1,"2026-01-10","Informe psiquiátrico","Diagnóstico TAG. Se recomienda TCC.","Dr. Pérez")]),

  mk(2,"Carlos","Ruiz Martínez","634 567 890","carlos@email.com","1998-07-22","activo","Episodio depresivo mayor. Anhedonia, fatiga crónica y dificultad de concentración.",false,
    [ses(5,1,"2026-02-10",80,true,"FAC-201","Evaluación estado depresivo."),ses(6,2,"2026-02-24",80,true,"FAC-202","Activación conductual."),ses(7,3,"2026-03-10",80,false,"FAC-203","Pensamientos automáticos negativos.")],
    [ob(3,"Recuperar rutina de actividad física",false),ob(4,"Mejorar calidad del sueño",false)],
    [pr(3,"2026-02-10","PHQ-9","Puntuación 17 — Depresión moderada-grave")]),

  mk(3,"Ana","Martínez Vega","611 223 344","ana@email.com","1985-11-30","activo","Fobia social y evitación de situaciones interpersonales.",true,
    [ses(8,1,"2026-01-20",80,true,"FAC-301","Evaluación. Jerarquía de situaciones."),ses(9,2,"2026-02-03",80,true,"FAC-302","Exposición gradual en imaginación."),ses(10,3,"2026-03-05",80,true,"FAC-303","Exposición real: cafetería.")],
    [ob(5,"Mantener conversación 10 min con desconocido",false)],
    [pr(4,"2026-01-20","SPIN","Puntuación 42 — Fobia social severa")]),

  mk(4,"Javier","Fernández Mora","655 667 788","javier@email.com","1978-05-14","activo","Trastorno adaptativo tras divorcio. Dificultad para gestionar cambios vitales.",true,
    [ses(11,1,"2026-02-18",90,true,"FAC-401","Acogida. Contexto del divorcio."),ses(12,2,"2026-03-04",90,true,"FAC-402","Identidad personal post-ruptura."),ses(13,3,"2026-03-18",90,false,"FAC-403","Nuevas rutinas. Plan semanal.")],
    [ob(6,"Establecer rutina estable con los hijos",false)],[]),

  mk(5,"Laura","Sánchez Díaz","677 889 900","laura@email.com","2001-02-28","activo","TCA (restricción). Distorsión de imagen corporal y rituales alimentarios.",true,
    [ses(14,1,"2026-01-08",90,true,"FAC-501","Evaluación TCA. Psicoeducación."),ses(15,2,"2026-01-22",90,true,"FAC-502","Registro alimentario."),ses(16,3,"2026-02-05",90,true,"FAC-503","Exposición espejo."),ses(17,4,"2026-02-19",90,true,"FAC-504","Mindful eating."),ses(18,5,"2026-03-05",90,false,"FAC-505","Prevención recaídas.")],
    [ob(7,"Alcanzar IMC saludable",false),ob(8,"Reducir pensamientos sobre el peso",false)],
    [pr(5,"2026-01-08","EDE-Q","Puntuación 4.2 — TCA significativo"),pr(6,"2026-03-05","EDE-Q","Puntuación 2.8 — Mejora moderada")],
    [mf(2,"2026-01-05","Informe nutricionista","Pauta alimentaria. Seguimiento conjunto.","Dra. Gómez")]),

  mk(6,"Pedro","López Castillo","699 001 122","pedro@email.com","1972-08-19","activo","TOC con rituales de comprobación. Interfiere gravemente en vida laboral.",true,
    [ses(19,1,"2026-02-12",80,true,"FAC-601","Evaluación Y-BOCS. Modelo ERP."),ses(20,2,"2026-02-26",80,true,"FAC-602","Jerarquía obsesiones. Primer ERP."),ses(21,3,"2026-03-12",80,true,"FAC-603","ERP: comprobar puerta 1 vez.")],
    [ob(9,"Reducir rituales a menos de 5 min/día",false)],
    [pr(7,"2026-02-12","Y-BOCS","Puntuación 28 — TOC grave")]),

  mk(7,"Sofía","Ramírez Torres","633 445 566","sofia@email.com","1995-04-03","activo","Duelo complicado por fallecimiento materno. Bloqueo emocional.",true,
    [ses(22,1,"2026-03-01",80,true,"FAC-701","Acogida. Valoración del duelo."),ses(23,2,"2026-03-15",80,false,"FAC-702","Trabajo emocional. Carta despedida.")],
    [ob(10,"Retomar actividad laboral",false)],[]),

  mk(8,"Miguel","García Blanco","622 334 455","miguel@email.com","1988-12-07","activo","Burnout y estrés crónico. Desmotivación e irritabilidad.",true,
    [ses(24,1,"2026-01-25",80,true,"FAC-801","Evaluación burnout MBI."),ses(25,2,"2026-02-08",80,true,"FAC-802","Gestión del tiempo. Límites."),ses(26,3,"2026-02-22",80,true,"FAC-803","Mindfulness. Autocuidado."),ses(27,4,"2026-03-08",80,false,"FAC-804","Plan desconexión digital.")],
    [ob(11,"Salir del trabajo antes de las 19h",false),ob(12,"Mindfulness 10 min diarios",true)],
    [pr(8,"2026-01-25","MBI","Burnout clínico en todas las subescalas")]),

  mk(9,"Elena","Vidal Moreno","644 556 677","elena@email.com","1992-09-21","activo","TDAH adulto. Procrastinación severa, desorganización e impulsividad.",true,
    [ses(28,1,"2026-02-14",80,true,"FAC-901","Evaluación TDAH. Conners."),ses(29,2,"2026-02-28",80,true,"FAC-902","Organización. GTD adaptado."),ses(30,3,"2026-03-14",80,false,"FAC-903","Pomodoro. Reducción distractores.")],
    [ob(13,"Usar agenda de forma consistente 21 días",false)],
    [pr(9,"2026-02-14","CAARS","T>65 en Inatención y Hiperactividad"),pr(10,"2026-03-14","CAARS","T=60 — Leve mejoría")]),

  mk(10,"Roberto","Jiménez Fuentes","655 667 778","roberto@email.com","1965-03-12","activo","Trastorno de pánico con agorafobia. Evitación de transportes.",true,
    [ses(31,1,"2026-01-18",80,true,"FAC-1001","Psicoeducación pánico."),ses(32,2,"2026-02-01",80,true,"FAC-1002","Respiración controlada."),ses(33,3,"2026-02-15",80,true,"FAC-1003","Exposición: autobús."),ses(34,4,"2026-03-01",80,false,"FAC-1004","Exposición: metro.")],
    [ob(14,"Usar metro sin acompañante",false)],
    [pr(11,"2026-01-18","PDSS","Puntuación 14 — Pánico grave")]),

  mk(11,"Isabel","Morales Ruiz","666 778 889","isabel@email.com","2003-07-15","activo","Autolesiones en contexto de desregulación emocional. Posible TLP.",true,
    [ses(35,1,"2026-02-20",90,true,"FAC-1101","Evaluación seguridad. Plan de crisis."),ses(36,2,"2026-03-06",90,true,"FAC-1102","DBT: mindfulness.")],
    [ob(15,"Identificar emociones antes de actuar",false)],[],
    [mf(3,"2026-02-18","Informe psiquiátrico","Descartar TLP. Seguimiento intensivo.","Dra. Martín")]),

  mk(12,"Antonio","Pérez Gallego","677 889 990","antonio@email.com","1958-01-24","activo","Depresión en la tercera edad. Soledad y pérdida de rol tras jubilación.",true,
    [ses(37,1,"2026-03-03",80,true,"FAC-1201","Evaluación GDS. Historia vital."),ses(38,2,"2026-03-17",80,false,"FAC-1202","Revisión de vida. Significado.")],
    [ob(16,"Apuntarse a actividad grupal semanal",false)],
    [pr(12,"2026-03-03","GDS-15","Puntuación 10 — Depresión moderada")]),

  mk(13,"Carmen","Herrera Blanco","688 990 001","carmen@email.com","1980-06-30","alta","Fobia específica a agujas. Interferencia en seguimiento oncológico.",true,
    [ses(39,1,"2025-09-10",80,true,"FAC-1301","Evaluación. Jerarquía estímulos."),ses(40,2,"2025-09-24",80,true,"FAC-1302","Exposición gradual imágenes."),ses(41,3,"2025-10-08",80,true,"FAC-1303","Exposición jeringa real."),ses(42,4,"2025-10-22",80,true,"FAC-1304","Alta. Objetivo cumplido.")],
    [ob(17,"Tolerar extracción de sangre",true),ob(18,"Acudir a revisiones sin evitación",true)],[],
    [mf(4,"2025-09-08","Informe oncología","Fobia agujas. Solicitan intervención urgente.","Dr. Navarro")]),

  mk(14,"David","Castillo Romero","699 001 112","david@email.com","2000-10-05","activo","Ansiedad ante exámenes. Perfeccionismo y miedo al fracaso.",false,
    [ses(43,1,"2026-03-12",70,true,"FAC-1401","Evaluación. Creencias sobre rendimiento.")],
    [ob(19,"Estudiar sin revisar apuntes más de 2 veces",false)],[]),

  mk(15,"Lucía","Navarro Soto","611 223 335","lucia@email.com","1987-04-18","activo","Trauma complejo por abuso infantil. Pesadillas e hipervigilancia.",true,
    [ses(44,1,"2026-01-30",90,true,"FAC-1501","Evaluación PCL-5. Estabilización."),ses(45,2,"2026-02-13",90,true,"FAC-1502","Lugar seguro. Regulación SNA."),ses(46,3,"2026-02-27",90,true,"FAC-1503","EMDR fase 2. Preparación."),ses(47,4,"2026-03-13",90,false,"FAC-1504","EMDR fase 3-4.")],
    [ob(20,"Dormir sin pesadillas 5 de 7 noches",false),ob(21,"Tolerar recuerdos sin disociarse",false)],
    [pr(13,"2026-01-30","PCL-5","Puntuación 52 — TEPT probable"),pr(14,"2026-03-13","PCL-5","Puntuación 38 — Reducción significativa")]),
];

export const SAMPLE_CITAS=[
  {id:1,pacienteId:1,fecha:toYMD(today()),hora:"09:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:2,pacienteId:2,fecha:toYMD(today()),hora:"11:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:3,pacienteId:null,fecha:toYMD(today()),hora:"10:00",duracion:30,tipoId:"t1",tipo:"Primera llamada",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"calendly",nombreExterno:"Ana Martín",telefonoExterno:"666 111 222",emailExterno:"ana@email.com",precio:0},
  {id:4,pacienteId:5,fecha:toYMD(today()),hora:"12:00",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:90},
  {id:5,pacienteId:8,fecha:toYMD(today()),hora:"16:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:6,pacienteId:3,fecha:toYMD(addDays(today(),1)),hora:"09:30",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:7,pacienteId:6,fecha:toYMD(addDays(today(),1)),hora:"11:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:8,pacienteId:9,fecha:toYMD(addDays(today(),2)),hora:"10:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:9,pacienteId:4,fecha:toYMD(addDays(today(),2)),hora:"12:00",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:90},
  {id:10,pacienteId:10,fecha:toYMD(addDays(today(),3)),hora:"09:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:11,pacienteId:11,fecha:toYMD(addDays(today(),3)),hora:"11:30",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:90},
  {id:12,pacienteId:7,fecha:toYMD(addDays(today(),4)),hora:"10:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:13,pacienteId:12,fecha:toYMD(addDays(today(),4)),hora:"12:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:14,pacienteId:14,fecha:toYMD(addDays(today(),5)),hora:"09:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:70},
  {id:15,pacienteId:15,fecha:toYMD(addDays(today(),5)),hora:"11:00",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:90},
  {id:16,pacienteId:null,fecha:toYMD(addDays(today(),6)),hora:"09:30",duracion:30,tipoId:"t1",tipo:"Primera llamada",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"calendly",nombreExterno:"Pablo Suárez",telefonoExterno:"688 001 234",emailExterno:"pablo@email.com",precio:0},
];
// En la demo, las fechas de ejemplo se desplazan para que la última sesión sea reciente
export function demoPacientes(){
  const desf=diasEntre(fechaDe("2026-03-18"),addDays(today(),-6));
  const mover=f=>f?toYMD(addDays(fechaDe(f),desf)):f;
  return SAMPLE_PATIENTS.map((p,i)=>({...p,profesionalId:i%3===2?"u2":"demo",
    sesiones:p.sesiones.map(s=>({...s,fecha:mover(s.fecha)})),
    pruebasRealizadas:p.pruebasRealizadas.map(x=>({...x,fecha:mover(x.fecha)})),
    informesMedicos:p.informesMedicos.map(x=>({...x,fecha:mover(x.fecha)}))}));
}

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════
export const DEMO_USER={...INITIAL_PROFESIONALES[0],id:"demo",nombre:"Profesional demo",especialidad:"Psicología clínica",rol:"admin"};
export const DEMO_MIEMBROS=INITIAL_PROFESIONALES.map(p=>({...p,id:p.id==="u1"?"demo":p.id}));
