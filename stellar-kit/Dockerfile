# Build stage
FROM node:18 AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Listar contenido para debugging
RUN echo "Contenido del directorio src:" && ls -la src/

# Construir la aplicación
RUN npm run build

# Listar estructura de directorios para debugging
RUN echo "Estructura de directorios después de la compilación:" && \
    find dist -type f | sort

# Production stage
FROM node:18

WORKDIR /app

# Instalar las dependencias necesarias para Stellar CLI
RUN apt-get update && apt-get install -y curl jq libdbus-1-3 && \
    # Obtener la última versión de Stellar CLI
    LATEST_RELEASE_URL="https://github.com/stellar/stellar-cli/releases/latest" && \
    REDIRECT_URL=$(curl -s -I $LATEST_RELEASE_URL | grep -i "location:" | sed 's/location: //i' | tr -d '\r') && \
    RELEASE_TAG=$(basename $REDIRECT_URL) && \
    echo "Última versión: $RELEASE_TAG" && \
    # Descargar los binarios
    mkdir -p /tmp/stellar-cli && \
    cd /tmp/stellar-cli && \
    echo "Descargando Stellar CLI $RELEASE_TAG..." && \
    if [ -z "$RELEASE_TAG" ]; then \
      # Fallback a la versión 22.6.0 si no se puede obtener la última
      RELEASE_TAG="v22.6.0"; \
      DOWNLOAD_URL="https://github.com/stellar/stellar-cli/releases/download/$RELEASE_TAG/stellar-cli-${RELEASE_TAG#v}-x86_64-unknown-linux-gnu.tar.gz"; \
    else \
      DOWNLOAD_URL="https://github.com/stellar/stellar-cli/releases/download/$RELEASE_TAG/stellar-cli-${RELEASE_TAG#v}-x86_64-unknown-linux-gnu.tar.gz"; \
    fi && \
    echo "Descargando desde $DOWNLOAD_URL" && \
    curl -L -o stellar-cli.tar.gz $DOWNLOAD_URL && \
    tar -xzf stellar-cli.tar.gz && \
    # Instalar los binarios
    echo "Moviendo binarios a /usr/local/bin..." && \
    if [ -f stellar ]; then mv stellar /usr/local/bin/; chmod +x /usr/local/bin/stellar; fi && \
    if [ -f soroban ]; then mv soroban /usr/local/bin/; chmod +x /usr/local/bin/soroban; fi && \
    # Verificar instalación
    echo "Verificando instalación:" && \
    (which stellar && stellar --version) || echo "No se pudo instalar stellar" && \
    (which soroban && soroban --version) || echo "No se pudo instalar soroban" && \
    # Limpiar
    cd / && rm -rf /tmp/stellar-cli && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copiar dependencias y build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Configurar variables de entorno
ENV NODE_ENV=production
ENV PORT=8080

# Exponer puerto
EXPOSE 8080

# Comando para iniciar la aplicación
CMD echo "Verificando CLI de Stellar:" && \
    (which soroban && soroban --version) || echo "ADVERTENCIA: soroban no está instalado" && \
    (which stellar && stellar --version) || echo "ADVERTENCIA: stellar no está instalado" && \
    find /app -type f | grep server.js && \
    node dist/server/server.js