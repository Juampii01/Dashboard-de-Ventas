// Importa un CSV de GHL usando el MISMO código que el botón «Subir CSV».
// Uso: npx tsx --conditions=react-server --env-file=.env.local scripts/importar-csv.mts <archivo.csv> "<Pipeline>"
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaALead, guardarLeads } from "@/lib/leads";
import type { Proyecto } from "@/lib/tipos";

const [archivo, nombrePipeline = "Biblioteca Recursos"] = process.argv.slice(2);
if (!archivo) throw new Error("Falta la ruta del CSV.");

const db = createAdminClient();
const { data: proyecto } = await db.from("proyectos").select("*").eq("nombre", "Maestria").single<Proyecto>();
if (!proyecto) throw new Error("No existe el proyecto Maestria.");
const { data: pipeline } = await db.from("pipelines").select("id").eq("proyecto_id", proyecto.id).eq("nombre", nombrePipeline).single();
if (!pipeline) throw new Error(`No existe el pipeline ${nombrePipeline}.`);

const texto = readFileSync(archivo, "utf8").replace(/^﻿/, "");
const filas = Papa.parse<Record<string, string>>(texto, { header: true, skipEmptyLines: true }).data;
const r = await guardarLeads(proyecto, filas.map((f) => filaALead(f)), { pipelineId: pipeline.id, origen: "csv", perfilId: null, repartir: false });
console.log(`Filas: ${filas.length} · nuevos: ${r.insertados} · actualizados: ${r.actualizados} · sin datos: ${r.invalidos}`);
