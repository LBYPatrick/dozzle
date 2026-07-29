GEN_DIR := internal/agent/pb

.DEFAULT_GOAL := help

define HELP_TEXT
Dozzle — make targets  (run `make <target>`)

Setup
  generate        Generate TLS certs (shared_cert/key) + protobuf code. Run once after clone.

Development
  dev             Backend (air, :3100) + frontend (vite, :5173) with hot reload. Open http://localhost:3100
  cloud-mock      Mock Dozzle Cloud proxy on :3200: fakes the cloud UIs (linked + pro + streaming +
                  canned log search) and proxies everything else to :3100. Needs `make dev` running.
                  Then open http://localhost:3200 instead of :3100.
  storybook       Component workshop (Storybook) on :6006. Open http://localhost:6006
  storybook-build Build the static Storybook bundle into storybook-static/.
  preview         Build, then serve the production bundle locally.

Build
  dist            Build the frontend bundle (pnpm build) into dist/.
  build           Build the Go binary (embeds dist/) -> ./dozzle
  docker          Build image amir20/dozzle:local.
                    arg CLOUD_URL  frontend cloud link URL (default https://cloud.dozzle.dev)
                    e.g. make docker CLOUD_URL=https://cloud.example.com

Test
  test            Go tests: race detector + coverage.
  test-update     Same, updating golden fixtures.
  int             Playwright integration tests via docker compose.

Run / deploy
  run             Build image and run it (:8080, mounts docker.sock).
  agent-reload    Rebuild image and redeploy the agent into an OrbStack VM.
                    arg VM_NAME  target VM (default dozzle-agent)
                    e.g. make agent-reload VM_NAME=my-vm
  dockerhub-overview
                  Publish the Docker Hub listing (.github/dockerhub-overview.md + EXP_FEATURES.md).
                  Needs a Docker Desktop web login; access tokens are refused by that API.
                    arg REPO  target repo (default lbypatrick/dozzle)
                    e.g. make dockerhub-overview REPO=me/dozzle

Housekeeping
  clean           Remove dist/, generated protobuf, and certs.
  help            Show this help (default).

Runtime env (for the binary itself, not make): DOZZLE_ADDR, DOZZLE_LEVEL=debug,
  DOZZLE_REMOTE_AGENT=host:7007, DOZZLE_REMOTE_HOST=tcp://..., DOZZLE_ENABLE_ACTIONS.
Cloud endpoint overrides: CLOUD_URL (UI link), AGENT_URL (gRPC), DOLIGENCE_URL (HTTP).
endef
export HELP_TEXT

.PHONY: help
help:
	@echo "$$HELP_TEXT"

.PHONY: cloud-mock
cloud-mock:
	@echo "Mock Dozzle Cloud on http://localhost:3200 (proxying http://localhost:3100)."
	@echo "Make sure 'make dev' is running, then open http://localhost:3200"
	go run ./scripts/cloudmock

.PHONY: storybook
storybook:
	pnpm storybook

.PHONY: storybook-build
storybook-build:
	pnpm build-storybook

.PHONY: clean
clean:
	@rm -rf dist
	@go clean -i
	@rm -f shared_key.pem shared_cert.pem
	@rm -f $(GEN_DIR)/*.pb.go

.PHONY: dist
dist:
	@pnpm build

.PHONY: fake_assets
fake_assets:
	@echo 'Skipping asset build'
	@mkdir -p dist
	@echo "assets build was skipped" > dist/index.html

.PHONY: test
test: fake_assets generate
	go test -cover -race -count 1 -timeout 40s ./...

.PHONY: test-update
test-update: fake_assets generate
	go test -cover -race -count 1 -timeout 5s ./... -- -- -u

.PHONY: build
build: dist generate
	CGO_ENABLED=0 go build -ldflags "-s -w -X github.com/amir20/dozzle/internal/support/cli.Version=local"

.PHONY: docker
docker: generate
	@docker build --build-arg TAG=local --build-arg CLOUD_URL=$(CLOUD_URL) -t amir20/dozzle:local .

.PHONY: generate
generate: shared_key.pem shared_cert.pem
	@go generate ./...

.PHONY: dev
dev: generate fake_assets
	pnpm dev

.PHONY: int
int:
	docker compose up --build --force-recreate --exit-code-from playwright

shared_key.pem:
	@openssl genpkey -algorithm Ed25519 -out shared_key.pem

shared_cert.pem: shared_key.pem
	@openssl req -new -key shared_key.pem -out shared_request.csr -subj "/C=US/ST=California/L=San Francisco/O=Dozzle"
	@openssl x509 -req -in shared_request.csr -signkey shared_key.pem -out shared_cert.pem -days 1825
	@rm shared_request.csr

.PHONY: run
run: docker
	docker run -it --rm -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock amir20/dozzle:local

.PHONY: preview
preview: build
	pnpm preview

.PHONY: agent-reload
agent-reload: docker
	@VM_NAME=$${VM_NAME:-dozzle-agent}; \
	echo "📦 Loading image into VM $$VM_NAME..."; \
	docker save amir20/dozzle:local | orb exec -m $$VM_NAME docker load; \
	echo "🔄 Recreating agent..."; \
	orb exec -m $$VM_NAME docker stop dozzle-agent || true; \
	orb exec -m $$VM_NAME docker rm dozzle-agent || true; \
	orb exec -m $$VM_NAME docker run -d --name dozzle-agent -p 7007:7007 -v /var/run/docker.sock:/var/run/docker.sock -v ~/dozzle-certs:/certs -v ~/dozzle-data:/data -e DOZZLE_LEVEL=debug amir20/dozzle:local agent --cert /certs/shared_cert.pem --key /certs/shared_key.pem; \
	echo "✅ Agent reloaded"

.PHONY: dockerhub-overview
dockerhub-overview:
	@python3 scripts/dockerhub_overview.py $(if $(REPO),--repo $(REPO),)
