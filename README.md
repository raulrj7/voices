# API de Gestión de Archivos CSV con NestJS

## Descripción

Esta API está diseñada para procesar archivos CSV y almacenarlos en una base de datos PostgreSQL. Los registros válidos son insertados en la base de datos, mientras que los inválidos se almacenan con sus respectivos mensajes de error. La API también permite la búsqueda filtrada de mensajes.

## Funcionalidades

- **Carga de archivos CSV**: Permite cargar archivos CSV para ser procesados en segundo plano.
- **Validación de registros**: Los registros se validan según criterios predefinidos (número de teléfono y mensaje).
- **Almacenamiento de registros válidos**: Los registros válidos se insertan en la base de datos PostgreSQL.
- **Manejo de errores**: Los registros inválidos se almacenan junto con los mensajes de error.
- **Búsqueda filtrada**: Se pueden buscar los registros en la base de datos usando filtros como número de teléfono, fecha, y mensaje.
- **Procesamiento en segundo plano**: El procesamiento de archivos CSV se maneja a través de colas de Bull y Redis.

## Tecnologías

- **NestJS**: Framework de backend basado en Node.js utilizado para construir la API.
- **PostgreSQL**: Base de datos relacional para almacenar los registros.
- **Redis**: Almacenamiento en memoria utilizado para manejar colas con Bull.
- **Bull**: Librería para manejo de colas, utilizada para procesar los archivos CSV en segundo plano.
- **Stream y COPY en PostgreSQL**: Utilización de flujos y comandos `COPY` para insertar grandes cantidades de datos de manera eficiente.

## Requisitos

Antes de levantar el proyecto, asegúrate de tener instalado lo siguiente:

- **Node.js** (v16 o superior)
- **Docker** y **Docker Compose** (para levantar los contenedores de la base de datos y Redis)

## Instalación

1. Clona el repositorio:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_PROYECTO>
    ```

2. Instala las dependencias:
    ```bash
    npm install
    ```

3. Levanta los contenedores con Docker Compose:
    ```bash
    docker-compose up -d
    ```

    Esto iniciará los servicios de PostgreSQL y Redis.

4. Configura las variables de entorno, generar un archivo con nombre `.env` en la raiz del proyecto:


### Configuración de la Base de Datos

1. Aplica las migraciones para crear las tablas:
    ```bash
    npx prisma migrate deploy
    ```

### Levantamiento de API    

1. Levanta la API en modo desarrollo:
    ```bash
    npm run start:dev
    ```

### Documentación de la API (Swagger)

Una vez que la API esté levantada, puedes acceder a la documentación de Swagger en la siguiente URL:

- **URL local**: [http://localhost:3000/api](http://localhost:3000/api)

Esta documentación te permite explorar y probar los endpoints de la API directamente desde tu navegador.


## Endpoints

### `/upload/csv` - Subir archivo CSV

- **Método**: `POST`
- **Descripción**: Permite cargar un archivo CSV para ser procesado.
- **Parámetros**: El archivo CSV se envía en el cuerpo de la solicitud como `multipart/form-data`.
- **Respuesta**: El archivo se coloca en una cola de procesamiento en segundo plano.

### `/upload/search-messages` - Buscar registros

- **Método**: `GET`
- **Descripción**: Permite buscar registros en la base de datos con filtros como número, fecha y mensaje.
- **Parámetros**:
  - `number`: Número de teléfono (opcional).
  - `startDate`: Fecha de inicio del rango (opcional).
  - `endDate`: Fecha de fin del rango (opcional).
  - `message`: Mensaje a buscar (opcional).
  - `page`: Página para paginación (opcional, por defecto 1).
  - `pageSize`: Número de registros por página (opcional, por defecto 10).
- **Respuesta**: Lista de registros que coinciden con los filtros y metadatos de paginación.

## Estructura de Archivos

El proyecto sigue la estructura estándar de un proyecto NestJS:

Los scripts de configuración y migración de la base de datos están en las carpetas prisma y migrations.

El archivo ERD.svg contiene el diagrama de entidad-relación para visualizar la estructura de la base de datos.



## Descripción de las Tecnologías Utilizadas

### **Bull y Redis**

- **Bull**: Bull es una librería de colas que permite gestionar trabajos en segundo plano. En este proyecto, se utiliza para procesar los archivos CSV de manera asíncrona, evitando que el proceso de carga del archivo bloquee la API.
  
- **Redis**: Redis se utiliza como almacenamiento en memoria para manejar las colas de Bull, permitiendo que los trabajos se gestionen de manera eficiente.

### **PostgreSQL y Stream/Copy**

- **PostgreSQL**: Se utiliza como base de datos relacional para almacenar los registros de los archivos CSV procesados.
  
- **COPY**: El comando `COPY` de PostgreSQL se emplea para realizar inserciones masivas de datos en la base de datos de forma eficiente. Utilizando flujos de datos, podemos insertar grandes volúmenes de registros con un rendimiento óptimo.

### **Manejo de Lotes**

El procesamiento de archivos CSV se maneja en lotes. Si el número de registros supera el límite predefinido (en este caso, 100000 registros), se utiliza el método `COPY` de PostgreSQL para insertar los registros en la base de datos de manera eficiente. Si el número de registros es menor, se inserta utilizando el método `createMany` de Prisma.

## Notificaciones y Progreso en Tiempo Real

Para mantener al usuario informado del progreso, la API puede emitir eventos en tiempo real utilizando **WebSocket**. Esto permite mostrar el estado del procesamiento de los registros a medida que avanzan en los lotes.
