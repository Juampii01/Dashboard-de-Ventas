// Tipos de las tablas (a mano; reflejan supabase/migrations).

export type Rol = "ceo" | "director" | "closer" | "caller";

export type Perfil = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
  whatsapp: string | null;
  admin_activo: boolean;
  onboarding_completo: boolean;
  es_prueba?: boolean; // 1.0: perfil de prueba (no cuenta en cifras, reparto, rotación ni liquidaciones)
  activo: boolean;
};

export type Proyecto = {
  id: string;
  nombre: string;
  moneda: "USD" | "EUR";
  zona_horaria: "America/New_York" | "Europe/Madrid";
  modo_reparto: "manual" | "rotativo" | "horarios";
  webhook_secreto: string;
  aviso_webhook_url: string | null;
  color: string;
};

// Paso 0: «Callers» y «Closers» son pipelines del equipo (uno de cada por proyecto)
export type TipoPipeline = "normal" | "callers" | "closers";
export type Pipeline = { id: string; proyecto_id: string; nombre: string; orden: number; tipo: TipoPipeline };
// estado_caller: columna de «Callers» unida a un estado del lead · columna_cita: de «Closers», unida a Pre-call o Post-call
export type Etapa = { id: string; pipeline_id: string; nombre: string; orden: number; color: string; estado_caller?: EstadoCaller | null; columna_cita?: string | null };

export type Respuesta = { pregunta: string; respuesta: string };

export type EstadoCaller = "nuevo" | "no_contesta" | "llamar_luego" | "agendado" | "no_interesa" | "vendido";

export type Lead = {
  id: string;
  proyecto_id: string;
  ghl_contact_id: string | null;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  etiquetas: string[];
  respuestas: Respuesta[];
  origen: "csv" | "ghl" | "manual";
  pipeline_id: string | null;
  etapa_id: string | null;
  caller_id: string | null;
  closer_id: string | null;
  estado_caller: EstadoCaller;
  llamar_en: string | null;
  creado_en: string;
  ultima_actividad: string | null;
  // v2: de dónde viene y todo lo que mandó
  fuente: string | null;
  evento: string | null;
  seguimiento: Record<string, string>;
  quiz_score: number | null;
  datos: Record<string, unknown>;
  estrellas_caller: number | null;
  oferta?: "vip_empresas" | "vip" | "empresas" | "grupal" | "membresia" | null; // bloque A: según el formulario de la Biblioteca
};

export type EstadoCita =
  | "pendiente"
  | "confirmacion_pendiente"
  | "confirmada"
  | "no_califica"
  | "cerrada"
  | "seguimiento"
  | "no_show"
  | "reagendada"
  | "cancelada"
  | "perdida";

export type Cita = {
  id: string;
  proyecto_id: string;
  lead_id: string;
  closer_id: string | null;
  agendada_por: string | null;
  fecha: string;
  estado: EstadoCita;
  origen: "manual" | "ghl";
  nota: string | null;
  creado_en: string;
  estrellas_caller: number | null;
  estrellas_closer: number | null;
};

export type Producto = {
  id: string;
  proyecto_id: string;
  nombre: string;
  precio: number | null;
  link_pago: string | null;
  vende_caller: boolean;
  activo: boolean;
  orden: number;
  // v2 (Programas)
  descripcion?: string | null;
  categoria?: string | null;
  color?: string;
  backend_offer?: boolean;
  modo_pago?: "unico" | "cuotas" | "mensual"; // bloque A: «mensual» = membresía sin fin
  num_cuotas?: number | null;
  precios_divisa?: Record<string, number> | null;
  comisiones?: Partial<Record<"ceo" | "director" | "closer" | "caller" | "caller_agenda", number>> | null;
};

export type Venta = {
  id: string;
  proyecto_id: string;
  lead_id: string;
  producto_id: string | null;
  vendedor_id: string | null;
  facturacion: number;
  cash_collected: number;
  tipo_pago: "completo" | "reserva" | "cuotas";
  num_cuotas: number | null;
  metodo: "stripe" | "transferencia" | "otro";
  nota: string | null;
  fecha: string;
  devuelto: number | null;
  devuelto_en: string | null;
  devolucion_nota: string | null;
};

export type Actividad = {
  id: string;
  lead_id: string;
  perfil_id: string | null;
  tipo: string;
  resultado: string | null;
  nota: string | null;
  creado_en: string;
};

export type Recurso = {
  id: string;
  proyecto_id: string;
  titulo: string;
  tipo: "pdf" | "enlace" | "guion" | "video";
  url: string | null;
  contenido: string | null;
  archivo_path: string | null;
  para_rol: "todos" | "caller" | "closer";
  creado_en: string;
};

export type Reporte = {
  id: string;
  proyecto_id: string;
  perfil_id: string;
  rol: string;
  fecha: string;
  respuestas: Record<string, string | number>;
  creado_en: string;
};
