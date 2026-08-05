package web

import (
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"io"
	"net/http"
	"net/url"
	"runtime"

	"time"

	"github.com/amir20/dozzle/internal/auth"
	"github.com/amir20/dozzle/internal/container"
	container_support "github.com/amir20/dozzle/internal/support/container"
	support_web "github.com/amir20/dozzle/internal/support/web"
	"github.com/amir20/dozzle/internal/utils"
	"github.com/dustin/go-humanize"
	"github.com/go-chi/chi/v5"

	"github.com/rs/zerolog/log"
)

func parseStdTypes(r *http.Request) container.StdType {
	var stdTypes container.StdType
	if r.URL.Query().Has("stdout") {
		stdTypes |= container.STDOUT
	}
	if r.URL.Query().Has("stderr") {
		stdTypes |= container.STDERR
	}
	return stdTypes
}

func matchesFilter(event *container.LogEvent, regex *regexp.Regexp, levels map[string]struct{}, inverse bool) bool {
	if regex != nil && inverse == support_web.Search(regex, event) {
		return false
	}
	_, ok := levels[event.Level]
	return ok
}

// searchStatus reports progress of the filtered backfill walk to the frontend.
// scannedTo is the oldest boundary scanned so far; reason is only set when done.
type searchStatus struct {
	ScannedTo time.Time `json:"scannedTo"`
	Matches   int       `json:"matches"`
	Done      bool      `json:"done"`
	Reason    string    `json:"reason,omitempty"`
}

func (h *handler) resolveLabels(r *http.Request) container.ContainerLabels {
	labels := h.config.Labels
	if h.config.Authorization.Provider != NONE {
		user := auth.UserFromContext(r.Context())
		if user.ContainerLabels.Exists() {
			labels = user.ContainerLabels
		}
	}
	return labels
}

func (h *handler) fetchLogsBetweenDates(w http.ResponseWriter, r *http.Request) {
	plainText := strings.Contains(r.Header.Get("Accept"), "text/plain")
	if plainText {
		w.Header().Set("Content-Type", "text/plain; charset=UTF-8")
	} else {
		w.Header().Set("Content-Type", "application/x-jsonl; charset=UTF-8")
	}

	from, _ := time.Parse(time.RFC3339Nano, r.URL.Query().Get("from"))
	to, _ := time.Parse(time.RFC3339Nano, r.URL.Query().Get("to"))
	id := chi.URLParam(r, "id")

	stdTypes := parseStdTypes(r)
	if stdTypes == 0 {
		http.Error(w, "stdout or stderr is required", http.StatusBadRequest)
		return
	}

	containerService, err := h.hostService.FindContainer(hostKey(r), id, h.resolveLabels(r))
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	delta := max(to.Sub(from), time.Second*3)

	var regex *regexp.Regexp
	if r.URL.Query().Has("filter") {
		regex, err = support_web.ParseRegex(r.URL.Query().Get("filter"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	inverse := r.URL.Query().Get("inverse") == "true"

	onlyComplex := r.URL.Query().Has("jsonOnly")
	everything := r.URL.Query().Has("everything")
	if everything {
		from = time.Time{}
		to = time.Now()
	}

	minimum := 0
	buffer := utils.NewRingBuffer[*container.LogEvent](500)
	if r.URL.Query().Has("min") {
		minimum, err = strconv.Atoi(r.URL.Query().Get("min"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if minimum < 0 || minimum > buffer.Size {
			http.Error(w, "minimum must be between 0 and buffer size", http.StatusBadRequest)
			return
		}
		buffer = utils.NewRingBuffer[*container.LogEvent](minimum)
	}

	maxStart := math.MaxInt
	if r.URL.Query().Has("maxStart") {
		maxStart, err = strconv.Atoi(r.URL.Query().Get("maxStart"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if maxStart < 1 || maxStart > buffer.Size {
			http.Error(w, "invalid maxStart", http.StatusBadRequest)
			return
		}
	}

	levels := make(map[string]struct{})
	for _, level := range r.URL.Query()["levels"] {
		levels[level] = struct{}{}
	}

	lastSeenId := uint32(0)
	if r.URL.Query().Has("lastSeenId") {
		to = to.Add(50 * time.Millisecond)
		num, err := strconv.ParseUint(r.URL.Query().Get("lastSeenId"), 10, 32)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		lastSeenId = uint32(num)
	}

	startId := uint32(0)
	if r.URL.Query().Has("startId") {
		from = from.Add(-50 * time.Millisecond)
		num, err := strconv.ParseUint(r.URL.Query().Get("startId"), 10, 32)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		startId = uint32(num)
	}

	var writer io.Writer = w
	if strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
		w.Header().Set("Content-Encoding", "gzip")
		gzWriter := gzip.NewWriter(w)
		defer gzWriter.Close()
		writer = gzWriter
	}
	encoder := json.NewEncoder(writer)

	startIdFound := startId == 0
	for {
		if minimum > 0 && buffer.Len() >= minimum {
			break
		}

		buffer.Clear()

		events, err := containerService.LogsBetweenDates(r.Context(), from, to, stdTypes)
		if err != nil {
			log.Error().Err(err).Msg("error fetching logs")
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for event := range events {
			if everything {
				if _, ok := event.Message.(string); onlyComplex && ok {
					continue
				}
				if regex != nil && inverse == support_web.Search(regex, event) {
					continue
				}
				if len(levels) > 0 {
					if _, ok := levels[event.Level]; !ok {
						continue
					}
				}
				if plainText {
					// Expand grouped events into their fragment lines; grouped
					// events store their lines in Message and have an empty
					// RawMessage, so writing RawMessage alone drops every group.
					fmt.Fprintf(writer, "%s\n", event.PlainText())
				} else if err := encoder.Encode(event); err != nil {
					log.Error().Err(err).Msg("error encoding log event")
				}
				continue
			}

			if !matchesFilter(event, regex, levels, inverse) {
				continue
			}

			if !startIdFound {
				if event.Id == startId {
					log.Debug().Uint32("startId", startId).Msg("found start id, will include subsequent events")
					startIdFound = true
				}
				continue
			}

			if lastSeenId != 0 && event.Id == lastSeenId {
				log.Debug().Uint32("lastSeenId", lastSeenId).Msg("found last seen id")
				break
			}

			if buffer.Len() >= maxStart {
				break
			}

			support_web.EscapeHTMLValues(event)
			buffer.Push(event)
		}

		if everything || from.Before(containerService.Container.Created) || minimum == 0 {
			break
		}

		from = from.Add(-delta)
		delta = delta * 2
	}

	log.Debug().Int("buffer_size", buffer.Len()).Msg("sending logs to client")

	for _, event := range buffer.Data() {
		if err := encoder.Encode(event); err != nil {
			log.Error().Err(err).Msg("error encoding log event")
			return
		}
	}
}

func (h *handler) streamContainerLogs(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	h.streamLogsForContainers(w, r, func(container *container.Container) bool {
		return container.ID == id && container.Host == hostKey(r)
	})
}

func (h *handler) streamLogsMerged(w http.ResponseWriter, r *http.Request) {
	ids := make(map[string]bool)
	for id := range strings.SplitSeq(chi.URLParam(r, "ids"), ",") {
		ids[id] = true
	}

	h.streamLogsForContainers(w, r, func(container *container.Container) bool {
		return ids[container.ID] && container.Host == hostKey(r)
	})
}

func (h *handler) streamLogsWithLabels(w http.ResponseWriter, r *http.Request) {
	// Parse label filters from URL path
	// Expected format: /labels/key1:value1,key2:value2/logs/stream
	labelsParam := chi.URLParam(r, "labels")
	labelFilters := make(map[string]string)

	if labelsParam != "" {
		for pair := range strings.SplitSeq(labelsParam, ",") {
			parts := strings.SplitN(pair, ":", 2)
			if len(parts) == 2 {
				labelFilters[parts[0]] = parts[1]
			}
		}
	}

	h.streamLogsForContainers(w, r, func(container *container.Container) bool {
		if container.State != "running" {
			return false
		}

		// Check if all label filters match
		for key, value := range labelFilters {
			if container.Labels[key] != value {
				return false
			}
		}

		return len(labelFilters) > 0
	})
}

// streamAllLogs backs fleet-wide log search without Dozzle Cloud: the backward
// scan already runs across whatever set it is handed, so handing it everything
// gives search over all locally retained logs, with no index and nothing leaving
// the host.
//
// Tails the running containers, searches all of them. A crashed container is
// usually the whole reason someone is searching, so excluding the dead from the
// scan would answer a narrower question than the one asked — while tailing them
// would only add an EOF and a "container-stopped" row each.
func (h *handler) streamAllLogs(w http.ResponseWriter, r *http.Request) {
	// Optional narrowing to particular machines. Absent or empty means every
	// host, which is the reset state the UI's filter returns to.
	hosts := map[string]struct{}{}
	if raw := r.URL.Query().Get("hosts"); raw != "" {
		for id := range strings.SplitSeq(raw, ",") {
			if id = strings.TrimSpace(id); id != "" {
				hosts[id] = struct{}{}
			}
		}
	}
	onSelectedHost := func(c *container.Container) bool {
		if len(hosts) == 0 {
			return true
		}
		_, ok := hosts[c.Host]
		return ok
	}

	// Tail what the viewer asked to see; search all of it either way. A crashed
	// container is usually the whole reason someone is searching, and tailing a
	// stopped one only produces an EOF and a "container-stopped" row.
	runningOnly := wantsRunning(r)
	h.streamLogsForContainersWithSearch(w, r,
		func(c *container.Container) bool { return (!runningOnly || c.State == "running") && onSelectedHost(c) },
		onSelectedHost,
	)
}

// wantsRunning reports whether a multi-container view should be limited to
// running containers. Default yes — that is what these views have always shown,
// and on a host with a pile of exited containers it is also the cheap answer.
//
// Deliberately per-route rather than inside streamLogsForContainers: the
// single-container and merged routes name their containers outright, and a
// stopped container's logs are exactly what you open those views for. Applied
// there it returned an empty set for a stopped container, so the stream had
// nothing to end and hung.
func wantsRunning(r *http.Request) bool {
	return r.URL.Query().Get("stopped") != "1"
}

func (h *handler) streamGroupedLogs(w http.ResponseWriter, r *http.Request) {
	group := chi.URLParam(r, "group")
	runningOnly := wantsRunning(r)

	h.streamLogsForContainers(w, r, func(container *container.Container) bool {
		return (!runningOnly || container.State == "running") && container.Group == group
	})
}

func (h *handler) streamHostGroupLogs(w http.ResponseWriter, r *http.Request) {
	group, err := url.PathUnescape(chi.URLParam(r, "group"))
	if err != nil || group == "" {
		http.Error(w, "invalid group", http.StatusBadRequest)
		return
	}

	hostIDs := make(map[string]struct{})
	for _, host := range h.hostService.Hosts() {
		if host.Group == group {
			hostIDs[host.ID] = struct{}{}
		}
	}

	runningOnly := wantsRunning(r)
	h.streamLogsForContainers(w, r, func(c *container.Container) bool {
		_, ok := hostIDs[c.Host]
		return (!runningOnly || c.State == "running") && ok
	})
}

func (h *handler) streamHostLogs(w http.ResponseWriter, r *http.Request) {
	host := hostKey(r)
	runningOnly := wantsRunning(r)
	h.streamLogsForContainers(w, r, func(container *container.Container) bool {
		return (!runningOnly || container.State == "running") && container.Host == host
	})
}

func (h *handler) streamLogsForContainers(w http.ResponseWriter, r *http.Request, containerFilter container_support.ContainerFilter) {
	h.streamLogsForContainersWithSearch(w, r, containerFilter, nil)
}

// streamLogsForContainersWithSearch splits the set that is tailed live from the
// set that history is searched over.
//
// They are not the same question. Tailing a stopped container is pointless — its
// stream EOFs at once, and the EOF path emits a "container-stopped" event, so
// including dead containers in the live fan-out would fill the view with one
// event row per corpse. Searching one is the opposite: a container that exited
// is very often the exact thing you are looking for, and scoping a search to
// what is currently running quietly answers a different question than the one
// asked.
//
// searchFilter may be nil, meaning "search whatever is being tailed" — which is
// what every per-view route does, since there the visible set is the subject.
func (h *handler) streamLogsForContainersWithSearch(
	w http.ResponseWriter,
	r *http.Request,
	containerFilter container_support.ContainerFilter,
	searchFilter container_support.ContainerFilter,
) {
	stdTypes := parseStdTypes(r)
	if stdTypes == 0 {
		http.Error(w, "stdout or stderr is required", http.StatusBadRequest)
		return
	}

	sseWriter, err := support_web.NewSSEWriter(r.Context(), w, r)
	if err != nil {
		log.Error().Err(err).Msg("error creating sse writer")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer sseWriter.Close()

	userLabels := h.resolveLabels(r)

	existingContainers, errs := h.hostService.ListAllContainersFiltered(userLabels, containerFilter)
	if len(errs) > 0 {
		log.Warn().Err(errs[0]).Msg("error while listing containers")
	}

	// Widened only when a route asks for it; otherwise history is searched over
	// exactly what is on screen.
	searchContainers := existingContainers
	if searchFilter != nil {
		if wider, errs := h.hostService.ListAllContainersFiltered(userLabels, searchFilter); len(errs) == 0 {
			searchContainers = wider
		} else {
			log.Warn().Err(errs[0]).Msg("error while listing containers to search")
		}
	}

	absoluteTime := time.Time{}
	liveLogs := make(chan *container.LogEvent)
	events := make(chan *container.ContainerEvent, 1)
	backfill := make(chan []*container.LogEvent)
	searchStatusCh := make(chan searchStatus)

	levels := make(map[string]struct{})
	for _, level := range r.URL.Query()["levels"] {
		levels[level] = struct{}{}
	}

	allLogs := true
	for level := range container.SupportedLogLevels {
		if _, ok := levels[level]; !ok {
			allLogs = false
		}
	}

	var regex *regexp.Regexp
	if r.URL.Query().Has("filter") {
		var err error
		regex, err = support_web.ParseRegex(r.URL.Query().Get("filter"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	inverse := r.URL.Query().Get("inverse") == "true"

	if !allLogs || regex != nil || inverse {
		absoluteTime = time.Now()

		go func() {
			minimum := 50
			found := 0
			delta := -10 * time.Second
			to := absoluteTime
			// ctx-guarded send so the goroutine never blocks after the client disconnects
			send := func(s searchStatus) {
				select {
				case searchStatusCh <- s:
				case <-r.Context().Done():
				}
			}
			// Always emit exactly one terminal status, whatever exit fires (ran out
			// of logs, hit the cap, or errored). Without this the frontend would keep
			// suppressing the empty state and spin forever. "exhausted" is the default
			// for running out of logs and for error/early returns; "capped" is set only
			// when the loop completes by reaching the match cap.
			reason := "exhausted"
			defer func() {
				send(searchStatus{ScannedTo: to, Matches: found, Done: true, Reason: reason})
			}()
			for minimum > 0 {
				events := make([]*container.LogEvent, 0)
				stillRunning := false
				for _, container := range searchContainers {
					containerService, err := h.hostService.FindContainer(container.Host, container.ID, userLabels)

					if err != nil {
						log.Error().Err(err).Msg("error while finding container")
						return
					}

					if to.Before(containerService.Container.Created) {
						continue
					}

					logs, err := containerService.LogsBetweenDates(r.Context(), to.Add(delta), to, stdTypes)
					if err != nil {
						log.Error().Err(err).Msg("error while fetching logs")
						return
					}

					for log := range logs {
						if !matchesFilter(log, regex, levels, inverse) {
							continue
						}
						events = append(events, log)
					}

					stillRunning = true
				}

				if !stillRunning {
					// scanned past the oldest container's birth: nothing older exists
					return
				}

				to = to.Add(delta)
				delta *= 2
				minimum -= len(events)
				found += len(events)
				sort.Slice(events, func(i, j int) bool {
					return events[i].Timestamp < events[j].Timestamp
				})
				if len(events) > 0 {
					select {
					case backfill <- events:
					case <-r.Context().Done():
						return
					}
				}
				send(searchStatus{ScannedTo: to, Matches: found, Done: false})
			}
			// accumulated enough matches; more may exist further back
			reason = "capped"
		}()
	}

	streamLogs := func(c container.Container) {
		containerService, err := h.hostService.FindContainer(c.Host, c.ID, userLabels)
		if err != nil {
			log.Error().Err(err).Msg("error while finding container")
			return
		}
		c = containerService.Container
		start := utils.Max(absoluteTime, c.StartedAt)
		err = containerService.StreamLogs(r.Context(), start, stdTypes, liveLogs)
		if err != nil {
			if errors.Is(err, io.EOF) {
				log.Debug().Str("container", c.ID).Msg("streaming ended")
				finishedAt := c.FinishedAt
				if c.FinishedAt.IsZero() {
					finishedAt = time.Now()
				}
				events <- &container.ContainerEvent{
					ActorID: c.ID,
					Name:    "container-stopped",
					Host:    c.Host,
					Time:    finishedAt,
				}
			} else if !errors.Is(err, context.Canceled) {
				log.Error().Err(err).Str("container", c.ID).Msg("unknown error while streaming logs")
			}
		}
	}

	for _, container := range existingContainers {
		go streamLogs(container)
	}

	newContainers := make(chan container.Container)
	h.hostService.SubscribeContainersStarted(r.Context(), newContainers, containerFilter)

	ticker := time.NewTicker(5 * time.Second)
	sseWriter.Ping()
loop:
	for {
		select {
		case logEvent := <-liveLogs:
			if !matchesFilter(logEvent, regex, levels, inverse) {
				continue
			}

			support_web.EscapeHTMLValues(logEvent)
			sseWriter.Message(logEvent)
		case c := <-newContainers:
			if _, err := h.hostService.FindContainer(c.Host, c.ID, userLabels); err == nil {
				events <- &container.ContainerEvent{ActorID: c.ID, Name: "container-started", Host: c.Host, Time: time.Now()}
				go streamLogs(c)
			}

		case event := <-events:
			log.Debug().Str("event", event.Name).Str("container", event.ActorID).Msg("received event")
			if err := sseWriter.Event("container-event", event); err != nil {
				log.Error().Err(err).Msg("error encoding container event")
			}

		case backfillEvents := <-backfill:
			for _, event := range backfillEvents {
				support_web.EscapeHTMLValues(event)
			}
			if err := sseWriter.Event("logs-backfill", backfillEvents); err != nil {
				log.Error().Err(err).Msg("error encoding container event")
			}

		case s := <-searchStatusCh:
			if err := sseWriter.Event("search-status", s); err != nil {
				log.Error().Err(err).Msg("error encoding search status")
			}

		case <-ticker.C:
			sseWriter.Ping()

		case <-r.Context().Done():
			break loop
		}
	}

	if e := log.Debug(); e.Enabled() {
		var m runtime.MemStats
		runtime.ReadMemStats(&m)
		e.Str("allocated", humanize.Bytes(m.Alloc)).
			Str("totalAllocated", humanize.Bytes(m.TotalAlloc)).
			Str("system", humanize.Bytes(m.Sys)).
			Int("routines", runtime.NumGoroutine()).
			Msg("runtime mem stats")
	}
}
