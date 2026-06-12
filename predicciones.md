# Predicciones y Fundamentos - RPSoft Bootcamp Hackathon
## v1 — Dashboard Unificado de Redes Sociales (YouTube)

Este archivo contiene las decisiones metodológicas, fórmulas de negocio y justificaciones técnicas del sistema, resueltas por el equipo antes de la programación del motor de cálculo.

---

### DÍA 1: Fórmulas de Engagement y Reglas de Cuota

#### 1. ¿Qué fórmula vas a usar para la tasa de engagement de un video?
La tasa de engagement de un video individual se calcula con la siguiente fórmula oficial pública de la API:

$$\text{Tasa de Engagement (\%)} = \frac{\text{Me gusta (likes)} + \text{Comentarios (comments)}}{\text{Vistas (views)}} \times 100$$

*Nota de seguridad:* Si un video tiene $0$ vistas, la división entre cero resultará en un error crítico (NaN o Infinity). En este caso, el motor de cálculo interceptará la condición y retornará un indicador explícito `"sin datos"` en lugar de realizar la operación matemática.

#### 2. ¿Por qué se divide entre vistas y no entre suscriptores?
Dividir el engagement entre **vistas** mide la capacidad real de conexión del contenido con el público que **efectivamente consumió el video**, independientemente de si pertenecen o no a la comunidad de suscriptores habituales. 
- Si dividiéramos entre suscriptores, estaríamos castigando injustamente a los canales grandes pero de nicho con audiencias pasivas, o premiando erróneamente a canales pequeños con un solo video viral.
- La vista representa la unidad de exposición (el denominador del embudo de conversión). El engagement basado en vistas nos dice: *De cada 100 personas que le dieron click y vieron el video, cuántas sintieron la necesidad de interactuar activamente*.

#### 3. ¿Por qué NO vas a usar `search.list`?
La YouTube Data API v3 impone un presupuesto diario estricto de **10,000 unidades de cuota**.
- La llamada a `search.list` tiene un costo extremadamente caro de **100 unidades de cuota por consulta**. Realizar búsquedas repetitivas para listar videos quemaría el presupuesto en minutos (apenas 100 llamadas de búsqueda agotan el día por completo).
- En su lugar, utilizamos el **uploads playlist** (`playlistItems.list` sobre el ID de carga del canal), que cuesta solo **1 unidad de cuota** por página de hasta 50 videos.
- Posteriormente, obtenemos los detalles de estadísticas con `videos.list`, que cuesta **1 unidad de cuota** por cada batch de hasta 50 IDs de videos.
- Este enfoque estructurado reduce el costo total de actualizar un canal a tan solo **3 unidades de cuota** por día, permitiendo monitorear decenas de canales bajo el límite gratuito sin riesgo de cortes de servicio.

---

### DÍA 2: Crecimiento de Canales de Redes Sociales

#### 1. Para "Canal que crece más rápido", ¿usarás crecimiento absoluto o tasa de crecimiento (%)?
Utilizaremos de manera obligatoria la **Tasa de Crecimiento (\%)** calculada a partir de los snapshots del periodo:

$$\text{Crecimiento Neto} = \text{Suscriptores}_{\text{final}} - \text{Suscriptores}_{\text{inicio}}$$
$$\text{Tasa de Crecimiento (\%)} = \left(\frac{\text{Crecimiento Neto}}{\text{Suscriptores}_{\text{inicio}}}\right) \times 100$$

*Justificación de Negocio:*
El crecimiento absoluto favorece injustamente a los canales grandes establecidos, ocultando el verdadero desempeño de marcas emergentes o campañas de contenido altamente eficientes. La tasa porcentual permite una comparación equitativa y justa:

**Ejemplo comparativo:**
- **Canal Grande (Marca A):** Empieza con $1,000,000$ suscriptores, termina con $1,005,000$ suscriptores.
  - Crecimiento absoluto (Neto) = $+5,000$ suscriptores.
  - Tasa de crecimiento = $\frac{5,000}{1,000,000} \times 100 = 0.5\%$.
- **Canal Chico (Marca B):** Empieza con $1,000$ suscriptores, termina con $1,500$ suscriptores.
  - Crecimiento absoluto (Neto) = $+500$ suscriptores.
  - Tasa de crecimiento = $\frac{500}{1,000} \times 100 = 50\%$.

Si evaluamos por crecimiento absoluto, decidiríamos erróneamente que la **Marca A** es el canal que "crece más rápido", cuando en realidad está estancado emocionalmente, mientras que la **Marca B** está multiplicando su audiencia con un crecimiento explosivo del $50\%$. Para tomar decisiones estratégicas de negocio fiables, la **Tasa de Crecimiento (\%)** es la única métrica justa.
Uso de Crecimiento Neto negativo: El motor soporta decrementos de audiencia arrojando tasas negativas correspondientes, lo cual activa alertas inmediatas de pérdida de engagement.
