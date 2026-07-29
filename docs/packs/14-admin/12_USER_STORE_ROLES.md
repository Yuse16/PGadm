# Roles por sucursal

## Caso

Un usuario puede tener diferentes responsabilidades en cada sucursal.

## Entidad

`UserStoreRole`

## Campos

- Usuario.
- Sucursal.
- Rol.
- Fecha de inicio.
- Fecha final.
- Estado.
- Asignado por.

## Regla

Los permisos deben resolverse usando la sucursal activa.
