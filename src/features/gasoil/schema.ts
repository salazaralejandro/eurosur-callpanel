// src/features/gasoil/schema.ts
import { z } from 'zod'

// --- Surtidor ---
export const SurtidorFromApi = z.tuple([z.string(), z.string()])
export type SurtidorApiTuple = z.infer<typeof SurtidorFromApi>
export const Surtidor = z.object({
  ID_SURTIDOR: z.string(),
  NOMBRE: z.string(),
})
export type Surtidor = z.infer<typeof Surtidor>

// --- Deposito ---
export const DepositoFromApi = z.tuple([z.number(), z.string()])
export type DepositoApiTuple = z.infer<typeof DepositoFromApi>
export const Deposito = z.object({
  ID_DEPOSITO: z.number(),
  NOMBRE: z.string(),
})
export type Deposito = z.infer<typeof Deposito>

// --- Combustible ---
export const CombustibleFromApi = z.tuple([z.number(), z.string()])
export type CombustibleApiTuple = z.infer<typeof CombustibleFromApi>
export const Combustible = z.object({
  ID_COMBUSTIBLE: z.number(),
  NOMBRE: z.string(),
})
export type Combustible = z.infer<typeof Combustible>

// --- Suministro ---
export const SuministroFromApi = z.tuple([
  z.number().nullable(), // ID_USUARIO
  z.number().nullable(), // ID_VEHICULO
  z.number().nullable(), // KM
  z.number(), // LITROS
  z.number().nullable(), // PRECIO
  z.string(), // "FECHA Y HORA"
  z.union([z.string(), z.number()]).nullable(), // NUMERO_SERIE_SURTIDOR
  z.number().nullable(), // ID_DEPOSITO
  z.number().nullable(), // ID_COMBUSTIBLE
]).rest(z.unknown())
export type SuministroApiTuple = z.infer<typeof SuministroFromApi>

export const Suministro = z.object({
  ID_USUARIO: z.number().nullable(),
  ID_VEHICULO: z.number().nullable(),
  KM: z.number().nullable(),
  LITROS_SUMINISTRADOS: z.number(),
  PRECIO: z.number().nullable(),
  "FECHA Y HORA": z.string(),
  NUMERO_DE_SERIE_SURTIDOR: z.union([z.string(), z.number()]).nullable(),
  ID_DEPOSITO: z.number().nullable(),
  ID_COMBUSTIBLE: z.number().nullable(),
})
export type Suministro = z.infer<typeof Suministro>

// --- EstadoDeposito ---
export const EstadoDeposito = z.object({
  ID_DEPOSITO: z.number(),
  NOMBRE: z.string(),
  CAPACIDAD: z.number().nullable(),
  LITROS_ACTUALES: z.number().nullable(),
  PORCENTAJE: z.number().nullable(),
  ULTIMO_SUMINISTRO: z.string().nullable().optional(),
})
export type EstadoDeposito = z.infer<typeof EstadoDeposito>

// --- Sondas y Nivel ---
export const SondaFromApi = z.tuple([z.string(), z.number(), z.string()])

// --- ¡CAMBIO AQUÍ PARA ARREGLAR ZODERROR! ---
// 1. Define el array interno: Ej: [970] o ["970"] o [null]
const InnerNivelArray = z.array(
  z.union([z.number(), z.string()]).nullable()
).optional() // Hacemos que el array interno sea opcional

// 2. Define la respuesta externa: Ej: [[970]] o [] (array vacío)
export const DepositoNivelFromApi = z.array(InnerNivelArray)
// --- FIN DEL CAMBIO ---


// --- Usuario ---
export const UsuarioFromApi = z.tuple([
  z.number(), // ID_USUARIO
  z.string(), // NOMBRE
  z.string().nullable(), // PIN
  z.string().nullable(), // LLAVE
]).rest(z.unknown())
export type UsuarioApiTuple = z.infer<typeof UsuarioFromApi>

export const Usuario = z.object({
  ID_USUARIO: z.number(),
  NOMBRE: z.string(),
})
export type Usuario = z.infer<typeof Usuario>

// --- Vehiculo ---
export const VehiculoFromApi = z.tuple([
  z.number(), // ID_VEHICULO
  z.string(), // MATRICULA
  z.string(), // NOMBRE
  z.string().nullable(), // PIN
  z.string().nullable(), // LLAVE
  z.string().nullable(), // GASOLEO PROFESIONAL
  z.string().nullable(), // EMPLAZAMIENTO/EMPRESA
  z.string().nullable(), // GRUPO
  z.number().nullable(), // ULTIMOS_KM
  z.number().nullable(), // CALCULO_MEDIAS
]).rest(z.unknown())
export type VehiculoApiTuple = z.infer<typeof VehiculoFromApi>

export const Vehiculo = z.object({
  ID_VEHICULO: z.number(),
  MATRICULA: z.string(),
  NOMBRE: z.string(),
  GRUPO: z.string().nullable(),
})
export type Vehiculo = z.infer<typeof Vehiculo>