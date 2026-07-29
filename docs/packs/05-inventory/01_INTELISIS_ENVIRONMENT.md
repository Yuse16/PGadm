# Entorno Intelisis

## Versión confirmada

- Producto: Intelisis 17.
- ProductVersion: 3.0.0.0.
- FileVersion: 7000.4.6.3.

## Infraestructura observada

- Ejecutable en carpeta de red.
- Conexión directa a SQL Server por puerto 1433.
- No existe acceso autorizado para consulta directa desde la PWA.

## Regla de seguridad

La aplicación no debe:

- Extraer credenciales.
- Leer memoria del proceso.
- Alterar archivos internos.
- Escribir directamente en SQL.
- Suplantar permisos de TI.

## Ruta inicial

`Intelisis → Cubo → Excel actualizado → Importador PWA`

## Ruta futura

`Intelisis → Vista SQL/API autorizada → Sincronizador → PWA`
