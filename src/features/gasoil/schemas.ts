import { z } from 'zod'

export const Surtidor = z.object({
  ID_SURTIDOR: z.number(),
  NOMBRE: z.string(),
})

export type Surtidor = z.infer<typeof Surtidor>

export const Deposito = z.object({
  ID_DEPOSITO: z.number(),
  NOMBRE: z.string(),
})

export type Deposito = z.infer<typeof Deposito>

export const Combustible = z.object({
  ID_COMBUSTIBLE: z.number(),
  NOMBRE: z.string(),
})

export type Combustible = z.infer<typeof Combustible>

export const Suministro = z.object({
  ID_USUARIO: z.number(),
  ID_VEHICULO: z.number(),
  KM: z.number(),
  LITROS_SUMINISTRADOS: z.number(),
  PRECIO: z.number(),
  "FECHA Y HORA": z.string(),
  NUMERO_DE_SERIE_SURTIDOR: z.number()
})

export type Suministro = z.infer<typeof Suministro>

export const EstadoDeposito = z.object({
  ID_DEPOSITO: z.number(),
  NOMBRE: z.string(),
  CAPACIDAD: z.number(),
  LITROS_ACTUALES: z.number(),
  PORCENTAJE: z.number(),
  ULTIMO_SUMINISTRO: z.string().optional(),
})

export type EstadoDeposito = z.infer<typeof EstadoDeposito>