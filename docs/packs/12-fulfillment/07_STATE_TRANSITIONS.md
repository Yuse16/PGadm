# Transiciones válidas

## Ejemplos

`Pendiente de conseguir → Pedido a proveedor`

`Pedido a proveedor → Backorder confirmado`

`Backorder confirmado → Recibido parcialmente`

`Recibido parcialmente → Recibido completo`

`Recibido completo → Reservado`

`Reservado → Listo para recoger`

`Listo para recoger → Cliente contactado`

`Cliente contactado → Entregado`

## Restricción

No permitir saltos críticos sin motivo y permiso.

Ejemplo:

`Pendiente de conseguir → Entregado`

requiere validación especial.
