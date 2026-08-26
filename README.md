# Caducados PROVESA v3.11

App estática tipo **Other** para Vercel/GitHub.

## Cambios v3.6

Se añade el bloque **Exportaciones de gestión** con cuatro exportaciones específicas:

1. **Caducados fuera política**
   - Columnas: Nº artículo, Descripción, Cantidad, Lote.
   - Agrupa por Nº artículo + Descripción + Lote.

2. **Caducados en política por proveedor**
   - Crea un Excel con una hoja por proveedor.
   - Columnas: Nº artículo, Descripción, Cantidad, Lote, Albarán de compra, Fecha de compra.
   - Agrupa por proveedor + Nº artículo + lote + albarán/entrada + fecha de compra.

3. **Ofertas compañía fuera política**
   - Para artículos no caducados, fuera de política y de animales de compañía.
   - Columnas: Nº artículo, Descripción, Cantidad, Lote, Fecha de caducidad, Descuento.
   - La columna Descuento queda vacía para rellenarla manualmente.

4. **Producción fuera política**
   - Para artículos no caducados, fuera de política y de animales de producción.
   - Columnas: Descripción, Lote, Cantidad, Fecha de caducidad, Última entrada del lote, Última venta artículo, Cliente, Acción/respuesta.
   - La columna Acción/respuesta queda vacía para rellenarla manualmente.

## Lógica de exportación

- Antes de exportar se debe seleccionar un almacén concreto: **01** o **02**.
- Las exportaciones respetan el almacén seleccionado.
- También respetan filtros compatibles como proveedor, búsqueda, gestión y frío.
- Las exportaciones de caducados fuerzan la condición de caducado, aunque el filtro de caducidad esté en otro valor.
- Las exportaciones de compañía/producción fuera de política respetan el filtro de caducidad activo para poder trabajar, por ejemplo, próximos 6 meses.

## Gestión local

La app guarda la gestión en el navegador mediante almacenamiento local.

Esto significa:

- No hay base de datos.
- No se guarda en GitHub.
- No se comparte entre ordenadores ni entre navegadores.
- Apagar el PC o cerrar el navegador no borra los datos.
- Si se borran los datos del sitio/caché del navegador, se pueden perder.
- Para conservar copia de seguridad, usar periódicamente **Exportar reclamaciones**.

## Estados de gestión

- **Pendiente**: estado normal. La línea aparece en la vista pendiente.
- **En trámite**: la línea queda marcada como gestionada.
- **En oferta**: la línea queda marcada como gestionada para salida/oferta.

Si seleccionas una línea y la pones en **Pendiente**, se elimina su gestión local y vuelve a la vista pendiente.

## Columnas principales en Lotes

- Sel.
- Gestión
- Nota recl.
- Nº artículo
- Descripción
- Proveedor entrada
- Lote
- Almacén
- Stock
- Caducidad
- Estado
- Política

Al hacer clic en una línea de **Lotes**, se despliega el detalle con el resto de información útil.

## Lógica de identificación

Cada línea se identifica internamente por:

- Nº artículo
- Lote
- Almacén
- Fecha caducidad
- Nº entrada mercancía
- Proveedor entrada

Así, al cargar un nuevo Excel de SAP, si la misma línea sigue existiendo, la app la reconoce como ya gestionada.

## Lógica de política

La app cruza por la columna **Proveedor entrada**.

Interpretación del Excel de políticas:

- `365` = se considera en política si entró con menos de 365 días de vida útil.
- `270` = se considera en política si entró con menos de 270 días.
- `181` = se considera en política si entró con menos de 181 días.
- `0` en la columna **Política** = proveedor no acepta devolución.
- `0` en la columna **Política frio** = sin política especial de frío; se usa la política general.

Si un proveedor no aparece en el Excel, se aplica la norma general de 365 días.

## Uso básico

1. Ejecutar la query en SAP.
2. Exportar el resultado a Excel.
3. Abrir la app.
4. Cargar el Excel de SAP.
5. Seleccionar almacén 01 o 02.
6. Filtrar los productos.
7. Exportar la gestión correspondiente o marcar líneas como En trámite / En oferta.

## Actualizar políticas

Para cambiar las políticas, sustituir en GitHub el archivo:

`assets/politicas-caducidad-proveedores.xlsx`

Después hacer redeploy en Vercel o esperar a que Vercel despliegue automáticamente el cambio.

## Despliegue en Vercel

Framework Preset: **Other**

Sin build command, sin `package.json` y sin `vercel.json`.


## v3.7
- La exportación de ofertas de compañía fuera de política se ordena por fecha de caducidad ascendente, dejando arriba los productos que caducan antes.


## v3.8
- Se intercambia la posición de los bloques: **Exportaciones de gestión** queda antes de **Gestión de reclamaciones**.
- Se añade el botón **Gestionar** dentro de **Exportaciones de gestión** como primer paso para el futuro flujo guiado.
- El botón queda preparado visualmente; la lógica completa del recorrido guiado se definirá en la siguiente fase.

## v3.9
- Se activa el botón **Gestionar** con recorrido guiado.
- El primer clic inicia el flujo en **Almacén 01**.
- Cada clic en **Siguiente** marca las líneas pendientes visibles con el estado del paso antes de avanzar.
- Recorrido por cada almacén:
  1. Caducados actuales fuera de política → estado **En trámite**, nota de destrucción.
  2. Caducados actuales en política → por proveedor, estado **En trámite**, nota de devolución proveedor.
  3. Próximos 6 meses completos, fuera de política, compañía → estado **En oferta**.
  4. Próximos 6 meses completos, fuera de política, producción → estado **En trámite**.
- Al terminar el almacén 01, el botón cambia a **Pasar a almacén 2** y repite el mismo recorrido.
- Al terminar el almacén 02, el botón cambia a **Finalizar gestión**.
- En cada paso se muestra el bloque activo, el almacén, proveedor si aplica, número de líneas pendientes y exportación recomendada.

## v3.10
- La exportación **Ofertas compañía fuera política** inserta una fila en blanco entre meses de caducidad, manteniendo arriba lo que caduca antes.
- Política actualizada para **MERCK SHARP & DOHME ANIMAL HEALTH, S.L.**: 272 días para artículos no fríos y 181 días para artículos de frío.



## v3.11
- La exportación **Producción fuera política** se ordena por fecha de caducidad ascendente, dejando arriba lo que caduca antes.
- La exportación **Producción fuera política** inserta una fila en blanco entre meses de caducidad, igual que la exportación de ofertas de compañía.
