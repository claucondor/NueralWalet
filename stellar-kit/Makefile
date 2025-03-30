# Variables
GIT_SHA := $(shell git rev-parse --short=7 HEAD)
PROJECT_ID := spanish-catalyst
REGION := us-central1
SERVICE_NAME := stellar-kit-server

# Colores
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
YELLOW := \033[1;33m
RESET := \033[0m

# Comandos básicos
setup:
	@echo "$(BLUE)🔧 Installing dependencies...$(RESET)"
	@npm install

clean:
	@echo "$(BLUE)🧹 Cleaning build files...$(RESET)"
	@rm -rf dist
	@rm -rf build

build: clean
	@echo "$(BLUE)🏗️  Building project...$(RESET)"
	@npm run build

dev: build
	@echo "$(BLUE)🚀 Running in development mode...$(RESET)"
	@npm run dev

# Verificar configuración de gcloud
check-gcloud:
	@echo "$(BLUE)🔍 Verificando configuración de gcloud...$(RESET)"
	@echo "Proyecto activo: $$(gcloud config get-value project)"
	@echo "Región por defecto: $$(gcloud config get-value compute/region)"
	@echo "Zona por defecto: $$(gcloud config get-value compute/zone)"
	@echo "Cuenta activa: $$(gcloud config get-value account)"
	@echo "$(BLUE)Servicios requeridos:$(RESET)"
	@gcloud services list --enabled --filter="name:run.googleapis.com OR name:secretmanager.googleapis.com OR name:artifactregistry.googleapis.com"

# Comandos de Docker
docker-build:
	@echo "$(BLUE)🐳 Building Docker image...$(RESET)"
	@docker build -t $(SERVICE_NAME):$(GIT_SHA) .

docker-run: docker-build
	@echo "$(BLUE)🐳 Running Docker container locally...$(RESET)"
	@docker run --env-file .env -p 8080:8080 $(SERVICE_NAME):$(GIT_SHA)

# Listar contenido del proyecto
list-files:
	@echo "$(BLUE)📁 Listando archivos en src/server...$(RESET)"
	@find src/server -type f | sort
	@echo "$(BLUE)📁 Listando archivos en dist después de la compilación...$(RESET)"
	@find dist -type f | sort || echo "Directorio dist no encontrado"

# Comandos de Cloud Run
deploy: build check-env list-files
	@echo "$(BLUE)🚀 Deploying to Cloud Run...$(RESET)"
	@echo "$(YELLOW)⚠️ Compilando imagen de Docker con modo depuración...$(RESET)"
	@docker buildx build --platform linux/amd64 \
		-t gcr.io/$(PROJECT_ID)/$(SERVICE_NAME):$(GIT_SHA) . --push

	@echo "$(BLUE)📦 Updating secrets...$(RESET)"
	@gcloud secrets versions add $(SERVICE_NAME)-env \
		--data-file .env \
		|| gcloud secrets create $(SERVICE_NAME)-env \
		--data-file .env

	@echo "$(BLUE)🚀 Deploying service...$(RESET)"
	@gcloud run deploy $(SERVICE_NAME) \
		--image gcr.io/$(PROJECT_ID)/$(SERVICE_NAME):$(GIT_SHA) \
		--region $(REGION) \
		--update-env-vars "$$(gcloud secrets versions access latest --secret $(SERVICE_NAME)-env | tr '\n' ',')" \
		--allow-unauthenticated \
		--memory 1Gi \
		--cpu 1 \
		--min-instances 0 \
		--max-instances 5 \
		--platform managed

	@echo "$(GREEN)✅ Deployment successful$(RESET)"

# Verificar entorno
check-env:
	@echo "$(BLUE)🔍 Checking environment variables...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(RED)❌ Error: .env file not found$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Environment variables OK$(RESET)"

get-url:
	@echo "$(BLUE)🔍 Getting Cloud Run URL...$(RESET)"
	@url=$$(gcloud run services describe $(SERVICE_NAME) --region $(REGION) --format 'value(status.url)'); \
	echo "$$url" > .url; \
	echo "$(GREEN)✅ Service URL: $$url$(RESET)"

destroy:
	@echo "$(BLUE)🗑️  Destroying Cloud Run service...$(RESET)"
	@gcloud run services delete $(SERVICE_NAME) --region $(REGION) --quiet || true
	@gcloud secrets delete $(SERVICE_NAME)-env --quiet || true
	@echo "$(GREEN)✅ Service destroyed$(RESET)"

# Comandos principales
init: setup deploy

.PHONY: setup clean build dev docker-build docker-run deploy check-env get-url destroy init check-gcloud list-files