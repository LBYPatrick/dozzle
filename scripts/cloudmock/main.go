// Mock Dozzle Cloud proxy — lets you play-test the cloud UIs without a real
// cloud account. It fakes the /api/cloud/* endpoints (config/status/search) and
// transparently reverse-proxies everything else (HTML, logs, SSE) to the real
// dev backend on :3100.
//
// Usage:  go run .   (listens on :3200)   then open http://localhost:3200
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	listenAddr = ":3200"
	backend    = "http://localhost:3100"
)

// In-memory cloud config so the stream-logs toggle and unlink actually do
// something during play-testing.
var (
	mu         sync.Mutex
	linked     = true
	streamLogs = true
)

// Mock container fleet (matches the demo containers you're running) so the
// search results look real.
var fleet = []struct{ id, name string }{
	{"c0ffee0000000000000000000000000000000000000000000000000000000001", "auth-service"},
	{"c0ffee0000000000000000000000000000000000000000000000000000000002", "api-gateway"},
	{"c0ffee0000000000000000000000000000000000000000000000000000000003", "payments-worker"},
	{"c0ffee0000000000000000000000000000000000000000000000000000000004", "web-storefront"},
	{"c0ffee0000000000000000000000000000000000000000000000000000000005", "postgres"},
	{"c0ffee0000000000000000000000000000000000000000000000000000000006", "nightly-report"},
}

var levels = []string{"info", "info", "info", "warn", "error", "debug"}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func cloudConfig() map[string]any {
	mu.Lock()
	defer mu.Unlock()
	return map[string]any{
		"prefix":     "mock_1234",
		"expiresAt":  time.Now().Add(365 * 24 * time.Hour).Format(time.RFC3339),
		"linked":     linked,
		"streamLogs": streamLogs,
	}
}

func handleConfig(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, cloudConfig())
	case http.MethodPatch:
		var body struct {
			StreamLogs *bool `json:"streamLogs"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		mu.Lock()
		if body.StreamLogs != nil {
			streamLogs = *body.StreamLogs
		}
		mu.Unlock()
		writeJSON(w, http.StatusOK, cloudConfig())
	case http.MethodDelete:
		mu.Lock()
		linked = false
		mu.Unlock()
		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	isLinked := linked
	mu.Unlock()
	if !isLinked {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"user": map[string]any{"email": "you@example.com", "name": "Mock User"},
		"plan": map[string]any{"name": "pro", "events_per_month": 5_000_000, "retention_days": 30},
		"usage": map[string]any{
			"events_used":  1_284_530,
			"events_limit": 5_000_000,
			"period":       "resets in 12 days",
		},
	})
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	isLinked, streaming := linked, streamLogs
	mu.Unlock()
	if !isLinked {
		w.WriteHeader(http.StatusServiceUnavailable) // 503: not configured
		return
	}
	if !streaming {
		w.WriteHeader(http.StatusNoContent) // 204: streaming disabled
		return
	}

	q := strings.TrimSpace(r.URL.Query().Get("q"))
	limit := 20
	if n, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && n > 0 {
		limit = n
	}
	before, _ := strconv.ParseInt(r.URL.Query().Get("before"), 10, 64)

	nowNs := time.Now().UnixNano()
	startNs := nowNs
	if before > 0 {
		startNs = before - 1
	}

	hits := make([]map[string]any, 0, limit)
	var lastTs int64
	for i := 0; i < limit; i++ {
		ts := startNs - int64(i)*int64(time.Second)
		c := fleet[(int(startNs/int64(time.Second))+i)%len(fleet)]
		lvl := levels[(i+int(startNs/1e9))%len(levels)]
		stream := "stdout"
		if lvl == "error" || lvl == "warn" {
			stream = "stderr"
		}
		hits = append(hits, map[string]any{
			// Nanoseconds — the real backend returns TimestampNs and the UI
			// divides by 1e6 to get millis. Emitting millis here rendered every
			// row as Jan 1 1970.
			"ts":            ts,
			"hostId":        "localhost",
			"containerId":   c.id,
			"containerName": c.name,
			"stream":        stream,
			"level":         lvl,
			"message": fmt.Sprintf(
				`time=%q level=%q msg=%q request_id=%q q=%q`,
				time.Unix(0, ts).UTC().Format(time.RFC3339), lvl,
				fmt.Sprintf("handled request matching %q", q), fmt.Sprintf("req_%06d", i), q),
			"logId": (startNs/1e6 + int64(i)) & 0xffffffff,
		})
		lastTs = ts
	}

	// About 6 pages of results, then stop.
	hasMore := (nowNs - lastTs) < 120*int64(time.Second)
	resp := map[string]any{"hits": hits, "hasMore": hasMore}
	if hasMore {
		resp["nextBefore"] = lastTs
	}
	writeJSON(w, http.StatusOK, resp)
}

func main() {
	target, _ := url.Parse(backend)
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.FlushInterval = -1 // stream SSE immediately

	mux := http.NewServeMux()
	mux.HandleFunc("/api/cloud/config", handleConfig)
	mux.HandleFunc("/api/cloud/status", handleStatus)
	mux.HandleFunc("/api/cloud/search/logs", handleSearch)
	mux.HandleFunc("/api/cloud/feedback", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) })
	mux.Handle("/", proxy)

	log.Printf("Mock Dozzle Cloud proxy on http://localhost%s  ->  %s", listenAddr, backend)
	log.Printf("Open http://localhost%s (cloud shows as linked + pro + streaming)", listenAddr)
	if err := http.ListenAndServe(listenAddr, mux); err != nil {
		log.Fatal(err)
	}
}
