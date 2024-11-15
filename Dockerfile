# Etapa 1: Construcción de la imagen con Node.js
FROM node:18 AS build
WORKDIR /usr/src/app

# Copiar el package.json y package-lock.json al contenedor
COPY package*.json ./

# Instalar las dependencias de la aplicación
RUN npm install

# Copiar todo el código de la aplicación al contenedor
COPY . .

# Construir la aplicación (si es necesario, por ejemplo, para NestJS)
RUN npm run build

# Etapa 2: Ejecutar la aplicación
FROM node:18 AS runtime

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar las dependencias ya instaladas y el código compilado
COPY --from=build /usr/src/app /usr/src/app

# Exponer el puerto que utilizará la aplicación (3000 por defecto en NestJS)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start:prod"]
