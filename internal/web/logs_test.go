package web

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net/url"
	"regexp"
	"time"

	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/amir20/dozzle/internal/container"
	support_web "github.com/amir20/dozzle/internal/support/web"
	"github.com/beme/abide"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func addAllLogLevels(q url.Values) {
	q.Add("levels", "error")
	q.Add("levels", "warn")
	q.Add("levels", "info")
	q.Add("levels", "debug")
	q.Add("levels", "trace")
	q.Add("levels", "fatal")
	q.Add("levels", "unknown")
}

func Test_handler_streamLogs_happy(t *testing.T) {
	ctx, cancel := context.WithCancel(t.Context())

	id := "123456"
	req, err := http.NewRequestWithContext(ctx, "GET", "/api/hosts/localhost/containers/"+id+"/logs/stream", nil)

	q := req.URL.Query()
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	addAllLogLevels(q)

	req.URL.RawQuery = q.Encode()
	require.NoError(t, err, "NewRequest should not return an error.")

	mockedClient := new(MockedClient)

	data := makeMessage("INFO Testing logs...\n", container.STDOUT)

	now := time.Now()

	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id, Tty: false, Host: "localhost", StartedAt: now}, nil)
	mockedClient.On("ContainerLogs", mock.Anything, mock.Anything, now, container.STDALL).Return(io.NopCloser(bytes.NewReader(data)), nil).
		Run(func(args mock.Arguments) {
			go func() {
				time.Sleep(50 * time.Millisecond)
				cancel()
			}()
		})
	mockedClient.On("Host").Return(container.Host{
		ID: "localhost",
	})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil).Run(func(args mock.Arguments) {
		time.Sleep(50 * time.Millisecond)
	})

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	reader := strings.NewReader(regexp.MustCompile(`"time":"[^"]*"`).ReplaceAllString(rr.Body.String(), `"time":"<removed>"`))
	abide.AssertReader(t, t.Name(), reader)
	mockedClient.AssertExpectations(t)
}

func Test_handler_streamLogs_happy_with_id(t *testing.T) {
	id := "123456"
	ctx, cancel := context.WithCancel(context.Background())
	req, err := http.NewRequestWithContext(ctx, "GET", "/api/hosts/localhost/containers/"+id+"/logs/stream", nil)
	q := req.URL.Query()
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	addAllLogLevels(q)

	req.URL.RawQuery = q.Encode()
	require.NoError(t, err, "NewRequest should not return an error.")

	mockedClient := new(MockedClient)

	data := makeMessage("2020-05-13T18:55:37.772853839Z INFO Testing logs...\n", container.STDOUT)

	started := time.Date(2020, time.May, 13, 18, 55, 37, 772853839, time.UTC)

	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id, Host: "localhost", StartedAt: started}, nil)
	mockedClient.On("ContainerLogs", mock.Anything, mock.Anything, started, container.STDALL).Return(io.NopCloser(bytes.NewReader(data)), nil).
		Run(func(args mock.Arguments) {
			go func() {
				time.Sleep(50 * time.Millisecond)
				cancel()
			}()
		})
	mockedClient.On("Host").Return(container.Host{
		ID: "localhost",
	})

	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)

	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil).Run(func(args mock.Arguments) {
		time.Sleep(50 * time.Millisecond)
	})

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	reader := strings.NewReader(regexp.MustCompile(`"time":"[^"]*"`).ReplaceAllString(rr.Body.String(), `"time":"<removed>"`))
	abide.AssertReader(t, t.Name(), reader)
	mockedClient.AssertExpectations(t)
}

func Test_handler_streamLogs_happy_container_stopped(t *testing.T) {
	id := "123456"
	ctx, cancel := context.WithCancel(context.Background())
	req, err := http.NewRequestWithContext(ctx, "GET", "/api/hosts/localhost/containers/"+id+"/logs/stream", nil)
	q := req.URL.Query()
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	addAllLogLevels(q)

	req.URL.RawQuery = q.Encode()
	require.NoError(t, err, "NewRequest should not return an error.")

	started := time.Date(2020, time.May, 13, 18, 55, 37, 772853839, time.UTC)
	mockedClient := new(MockedClient)
	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id, Host: "localhost", StartedAt: started}, nil)
	mockedClient.On("ContainerLogs", mock.Anything, id, started, container.STDALL).Return(io.NopCloser(strings.NewReader("")), io.EOF).
		Run(func(args mock.Arguments) {
			go func() {
				time.Sleep(50 * time.Millisecond)
				cancel()
			}()
		})
	mockedClient.On("Host").Return(container.Host{
		ID: "localhost",
	})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	reader := strings.NewReader(regexp.MustCompile(`"time":"[^"]*"`).ReplaceAllString(rr.Body.String(), `"time":"<removed>"`))
	abide.AssertReader(t, t.Name(), reader)
	mockedClient.AssertExpectations(t)
}

func Test_handler_streamLogs_search_status_exhausted(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	id := "123456"
	req, err := http.NewRequestWithContext(ctx, "GET", "/api/hosts/localhost/containers/"+id+"/logs/stream", nil)
	require.NoError(t, err, "NewRequest should not return an error.")

	q := req.URL.Query()
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	q.Add("filter", "NOMATCH")
	q.Add("levels", "info")
	req.URL.RawQuery = q.Encode()

	created := time.Now().Add(-5 * time.Second)

	mockedClient := new(MockedClient)
	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id, Host: "localhost", Created: created, StartedAt: created}, nil)
	mockedClient.On("ContainerLogsBetweenDates", mock.Anything, id, mock.Anything, mock.Anything, container.STDALL).
		Return(io.NopCloser(strings.NewReader("")), nil)
	mockedClient.On("ContainerLogs", mock.Anything, id, mock.Anything, container.STDALL).Return(io.NopCloser(strings.NewReader("")), io.EOF).
		Run(func(args mock.Arguments) {
			go func() {
				time.Sleep(100 * time.Millisecond)
				cancel()
			}()
		})
	mockedClient.On("Host").Return(container.Host{ID: "localhost"})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	body := rr.Body.String()
	assert.Contains(t, body, "event: search-status", "should emit a search-status event")
	assert.Contains(t, body, `"done":true`, "should emit a terminal status")
	assert.Contains(t, body, `"reason":"exhausted"`, "ran out of logs, so reason is exhausted")
}

func Test_handler_streamLogs_search_status_on_error(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	id := "123456"
	req, err := http.NewRequestWithContext(ctx, "GET", "/api/hosts/localhost/containers/"+id+"/logs/stream", nil)
	require.NoError(t, err, "NewRequest should not return an error.")

	q := req.URL.Query()
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	q.Add("filter", "needle")
	q.Add("levels", "info")
	req.URL.RawQuery = q.Encode()

	created := time.Now().Add(-1 * time.Hour)

	mockedClient := new(MockedClient)
	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id, Host: "localhost", Created: created, StartedAt: created}, nil)
	// the backfill fetch fails partway through the walk
	mockedClient.On("ContainerLogsBetweenDates", mock.Anything, id, mock.Anything, mock.Anything, container.STDALL).
		Return(io.NopCloser(strings.NewReader("")), errors.New("boom"))
	mockedClient.On("ContainerLogs", mock.Anything, id, mock.Anything, container.STDALL).Return(io.NopCloser(strings.NewReader("")), io.EOF).
		Run(func(args mock.Arguments) {
			go func() {
				time.Sleep(100 * time.Millisecond)
				cancel()
			}()
		})
	mockedClient.On("Host").Return(container.Host{ID: "localhost"})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	body := rr.Body.String()
	// even when the walk errors out, a terminal status must be sent so the
	// frontend stops suppressing the empty state and the spinner clears
	assert.Contains(t, body, "event: search-status", "should emit a search-status event")
	assert.Contains(t, body, `"done":true`, "must emit a terminal status even on error")
}

func Test_handler_streamLogs_error_reading(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	id := "123456"
	req, err := http.NewRequestWithContext(ctx, "GET", "/api/hosts/localhost/containers/"+id+"/logs/stream", nil)
	q := req.URL.Query()
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	addAllLogLevels(q)

	req.URL.RawQuery = q.Encode()
	require.NoError(t, err, "NewRequest should not return an error.")

	started := time.Date(2020, time.May, 13, 18, 55, 37, 772853839, time.UTC)
	mockedClient := new(MockedClient)
	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id, Host: "localhost", StartedAt: started}, nil)
	mockedClient.On("ContainerLogs", mock.Anything, id, started, container.STDALL).Return(io.NopCloser(strings.NewReader("")), errors.New("test error")).
		Run(func(args mock.Arguments) {
			go func() {
				time.Sleep(50 * time.Millisecond)
				cancel()
			}()
		})
	mockedClient.On("Host").Return(container.Host{
		ID: "localhost",
	})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	reader := strings.NewReader(regexp.MustCompile(`"time":"[^"]*"`).ReplaceAllString(rr.Body.String(), `"time":"<removed>"`))
	abide.AssertReader(t, t.Name(), reader)
	mockedClient.AssertExpectations(t)
}

func Test_handler_streamLogs_error_std(t *testing.T) {
	id := "123456"
	req, err := http.NewRequest("GET", "/api/hosts/localhost/containers/"+id+"/logs/stream", nil)

	require.NoError(t, err, "NewRequest should not return an error.")

	mockedClient := new(MockedClient)
	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id, Host: "localhost"}, nil)
	mockedClient.On("Host").Return(container.Host{
		ID: "localhost",
	})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil).
		Run(func(args mock.Arguments) {
			time.Sleep(50 * time.Millisecond)
		})

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	abide.AssertHTTPResponse(t, t.Name(), rr.Result())
}

func Test_handler_between_dates(t *testing.T) {
	id := "123456"
	req, err := http.NewRequest("GET", "/api/hosts/localhost/containers/"+id+"/logs", nil)
	require.NoError(t, err, "NewRequest should not return an error.")

	from, _ := time.Parse(time.RFC3339, "2018-01-01T00:00:00Z")
	to, _ := time.Parse(time.RFC3339, "2018-01-01T10:00:00Z")

	q := req.URL.Query()
	q.Add("from", from.Format(time.RFC3339))
	q.Add("to", to.Format(time.RFC3339))
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	q.Add("levels", "info")

	req.URL.RawQuery = q.Encode()

	mockedClient := new(MockedClient)

	first := makeMessage("2020-05-13T18:55:37.772853839Z INFO Testing stdout logs...\n", container.STDOUT)
	second := makeMessage("2020-05-13T18:56:37.772853839Z INFO Testing stderr logs...\n", container.STDERR)
	data := append(first, second...)

	mockedClient.On("ContainerLogsBetweenDates", mock.Anything, id, from, to, container.STDALL).Return(io.NopCloser(bytes.NewReader(data)), nil)
	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id}, nil)
	mockedClient.On("Host").Return(container.Host{
		ID: "localhost",
	})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	reader := strings.NewReader(regexp.MustCompile(`"time":"[^"]*"`).ReplaceAllString(rr.Body.String(), `"time":"<removed>"`))
	abide.AssertReader(t, t.Name(), reader)
	mockedClient.AssertExpectations(t)
}

func Test_handler_between_dates_with_fill(t *testing.T) {
	id := "123456"
	req, err := http.NewRequest("GET", "/api/hosts/localhost/containers/"+id+"/logs", nil)
	require.NoError(t, err, "NewRequest should not return an error.")

	from, _ := time.Parse(time.RFC3339, "2018-01-01T00:00:00Z")
	to, _ := time.Parse(time.RFC3339, "2018-01-01T10:00:00Z")

	q := req.URL.Query()
	q.Add("from", from.Format(time.RFC3339))
	q.Add("to", to.Format(time.RFC3339))
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	q.Add("fill", "true")
	q.Add("levels", "info")
	q.Add("min", "10")

	req.URL.RawQuery = q.Encode()

	mockedClient := new(MockedClient)

	first := makeMessage("2020-05-13T18:55:37.772853839Z INFO Testing stdout logs...\n", container.STDOUT)
	second := makeMessage("2020-05-13T18:56:37.772853839Z INFO Testing stderr logs...\n", container.STDERR)
	data := append(first, second...)

	mockedClient.On("ContainerLogsBetweenDates", mock.Anything, id, from, to, container.STDALL).
		Return(io.NopCloser(bytes.NewReader([]byte{})), nil).
		Once()

	mockedClient.On("ContainerLogsBetweenDates", mock.Anything, id, time.Date(2017, time.December, 31, 14, 0, 0, 0, time.UTC), to, container.STDALL).
		Return(io.NopCloser(bytes.NewReader(data)), nil).
		Once()

	mockedClient.On("ContainerLogsBetweenDates", mock.Anything, id, time.Date(2017, time.December, 30, 18, 0, 0, 0, time.UTC), to, container.STDALL).
		Return(io.NopCloser(bytes.NewReader(data)), nil).
		Once()

	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id, Created: time.Date(2017, time.December, 31, 10, 0, 0, 0, time.UTC)}, nil)
	mockedClient.On("Host").Return(container.Host{ID: "localhost"})

	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)

	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	reader := strings.NewReader(regexp.MustCompile(`"time":"[^"]*"`).ReplaceAllString(rr.Body.String(), `"time":"<removed>"`))
	abide.AssertReader(t, t.Name(), reader)
	mockedClient.AssertExpectations(t)
}

func Test_handler_between_dates_with_everything_complex(t *testing.T) {
	id := "123456"
	req, err := http.NewRequest("GET", "/api/hosts/localhost/containers/"+id+"/logs", nil)
	require.NoError(t, err, "NewRequest should not return an error.")

	q := req.URL.Query()
	q.Add("jsonOnly", "true")
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	q.Add("everything", "true")

	req.URL.RawQuery = q.Encode()

	mockedClient := new(MockedClient)

	first := makeMessage("2020-05-13T18:55:37.772853839Z INFO Testing stdout logs...\n", container.STDOUT)
	second := makeMessage("2020-05-13T18:56:37.772853839Z {\"msg\":\"a complex log message\"}\n", container.STDOUT)
	data := append(first, second...)

	mockedClient.On("ContainerLogsBetweenDates", mock.Anything, id, mock.Anything, mock.Anything, container.STDALL).
		Return(io.NopCloser(bytes.NewReader(data)), nil).
		Once()
	mockedClient.On("FindContainer", mock.Anything, id).Return(container.Container{ID: id}, nil)
	mockedClient.On("Host").Return(container.Host{
		ID: "localhost",
	})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{
		{ID: id, Name: "test", Host: "localhost", State: "running"},
	}, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	reader := strings.NewReader(regexp.MustCompile(`"time":"[^"]*"`).ReplaceAllString(rr.Body.String(), `"time":"<removed>"`))
	abide.AssertReader(t, t.Name(), reader)
	mockedClient.AssertExpectations(t)
}

func Test_matchesFilter_inverse(t *testing.T) {
	levels := map[string]struct{}{"info": {}}

	regex, err := support_web.ParseRegex("INFO")
	require.NoError(t, err)

	regex2, err := support_web.ParseRegex("ERROR")
	require.NoError(t, err)

	tests := []struct {
		name    string
		event   *container.LogEvent
		regex   *regexp.Regexp
		levels  map[string]struct{}
		inverse bool
		want    bool
	}{
		{
			name:    "normal mode: matching regex and level passes",
			event:   &container.LogEvent{Message: "INFO: all good", Level: "info"},
			regex:   regex,
			levels:  levels,
			inverse: false,
			want:    true,
		},
		{
			name:    "normal mode: non-matching regex fails",
			event:   &container.LogEvent{Message: "INFO: all good", Level: "info"},
			regex:   regex2,
			levels:  levels,
			inverse: false,
			want:    false,
		},
		{
			name:    "inverse mode: matching regex fails (excluded)",
			event:   &container.LogEvent{Message: "INFO: all good", Level: "info"},
			regex:   regex,
			levels:  levels,
			inverse: true,
			want:    false,
		},
		{
			name:    "inverse mode: non-matching regex passes (not excluded)",
			event:   &container.LogEvent{Message: "INFO: all good", Level: "info"},
			regex:   regex2,
			levels:  levels,
			inverse: true,
			want:    true,
		},
		{
			name:    "no regex: inverse is a no-op, level check still applies",
			event:   &container.LogEvent{Message: "INFO: all good", Level: "info"},
			regex:   nil,
			levels:  levels,
			inverse: true,
			want:    true,
		},
		{
			name:    "inverse mode: wrong level fails regardless of regex",
			event:   &container.LogEvent{Message: "ERROR: oops", Level: "error"},
			regex:   regex2,
			levels:  levels,
			inverse: true,
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := matchesFilter(tt.event, tt.regex, tt.levels, tt.inverse)
			assert.Equal(t, tt.want, got)
		})
	}
}

func makeMessage(message string, stream container.StdType) []byte {
	data := make([]byte, 8)
	binary.BigEndian.PutUint32(data[4:], uint32(len(message)))
	data[0] = byte(stream / 2)
	data = append(data, []byte(message)...)

	return data
}

// The fleet-wide route is what makes log search work without Dozzle Cloud: it
// hands the backward scan every container, so a query finds lines from things
// that have since died — usually the whole reason someone is searching. Only the
// running ones are tailed live, because a stopped container EOFs at once and
// would post a "container-stopped" row for every corpse on the host.
func Test_handler_streamAllLogs_searches_stopped_containers_but_tails_only_running(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	req, err := http.NewRequestWithContext(ctx, "GET", "/api/logs/stream", nil)
	require.NoError(t, err, "NewRequest should not return an error.")

	q := req.URL.Query()
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	q.Add("filter", "NOMATCH")
	q.Add("levels", "info")
	req.URL.RawQuery = q.Encode()

	created := time.Now().Add(-5 * time.Second)
	running := container.Container{ID: "running-1", Name: "one", Host: "localhost", State: "running", Created: created, StartedAt: created}
	stopped := container.Container{ID: "stopped-1", Name: "two", Host: "localhost", State: "exited", Created: created, StartedAt: created}

	mockedClient := new(MockedClient)
	mockedClient.On("Host").Return(container.Host{ID: "localhost"})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{running, stopped}, nil)
	mockedClient.On("FindContainer", mock.Anything, running.ID).Return(running, nil)
	mockedClient.On("FindContainer", mock.Anything, stopped.ID).Return(stopped, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)
	mockedClient.On("ContainerLogsBetweenDates", mock.Anything, mock.Anything, mock.Anything, mock.Anything, container.STDALL).
		Return(io.NopCloser(strings.NewReader("")), nil)
	mockedClient.On("ContainerLogs", mock.Anything, running.ID, mock.Anything, container.STDALL).
		Return(io.NopCloser(strings.NewReader("")), io.EOF).
		Run(func(args mock.Arguments) {
			go func() {
				time.Sleep(100 * time.Millisecond)
				cancel()
			}()
		})

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code, "the route should exist")
	body := rr.Body.String()
	assert.Contains(t, body, "event: search-status", "the backward scan should run")

	// The point of the split: history is read for the dead container too...
	mockedClient.AssertCalled(t, "ContainerLogsBetweenDates", mock.Anything, stopped.ID, mock.Anything, mock.Anything, container.STDALL)
	// ...but nothing tries to tail it.
	mockedClient.AssertNotCalled(t, "ContainerLogs", mock.Anything, stopped.ID, mock.Anything, mock.Anything)
}

// Running-vs-all is the viewer's choice, so it belongs to the multi-container
// routes only. A single-container view names its container outright, and its
// logs are exactly what you open that view for when it has stopped — applying
// the filter there returned an empty set, and the stream then had nothing to
// end and hung until the test timed out.
func Test_handler_streamContainerLogs_ignores_the_stopped_filter(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	id := "123456"
	req, err := http.NewRequestWithContext(ctx, "GET", "/api/hosts/localhost/containers/"+id+"/logs/stream", nil)
	require.NoError(t, err, "NewRequest should not return an error.")

	q := req.URL.Query()
	q.Add("stdout", "true")
	q.Add("stderr", "true")
	addAllLogLevels(q)
	req.URL.RawQuery = q.Encode()

	now := time.Now()
	stopped := container.Container{ID: id, Tty: false, Host: "localhost", State: "exited", StartedAt: now}

	mockedClient := new(MockedClient)
	mockedClient.On("Host").Return(container.Host{ID: "localhost"})
	mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{stopped}, nil)
	mockedClient.On("FindContainer", mock.Anything, id).Return(stopped, nil)
	mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)
	mockedClient.On("ContainerLogs", mock.Anything, mock.Anything, now, container.STDALL).
		Return(io.NopCloser(bytes.NewReader(makeMessage("INFO from a stopped container\n", container.STDOUT))), nil).
		Run(func(args mock.Arguments) {
			go func() {
				time.Sleep(50 * time.Millisecond)
				cancel()
			}()
		})

	handler := createDefaultHandler(mockedClient)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "from a stopped container", "a stopped container must still stream its own logs")
}

// The multi-container routes do take it, and default to running only.
func Test_handler_streamHostLogs_stopped_filter(t *testing.T) {
	run := func(t *testing.T, query string) string {
		ctx, cancel := context.WithCancel(context.Background())
		req, err := http.NewRequestWithContext(ctx, "GET", "/api/hosts/localhost/logs/stream?stdout=true&stderr=true&"+query, nil)
		require.NoError(t, err)

		// All levels, so no filter is active and the backward scan does not run:
		// this test is about which containers get tailed, not about search.
		q := req.URL.Query()
		addAllLogLevels(q)
		req.URL.RawQuery = q.Encode()

		now := time.Now()
		running := container.Container{ID: "alive", Name: "alive", Host: "localhost", State: "running", StartedAt: now}
		stopped := container.Container{ID: "dead", Name: "dead", Host: "localhost", State: "exited", StartedAt: now}

		mockedClient := new(MockedClient)
		mockedClient.On("Host").Return(container.Host{ID: "localhost"})
		mockedClient.On("ListContainers", mock.Anything, mock.Anything).Return([]container.Container{running, stopped}, nil)
		mockedClient.On("FindContainer", mock.Anything, mock.Anything).Return(running, nil)
		mockedClient.On("ContainerEvents", mock.Anything, mock.AnythingOfType("chan<- container.ContainerEvent")).Return(nil)
		mockedClient.On("ContainerLogs", mock.Anything, mock.Anything, mock.Anything, container.STDALL).
			Return(io.NopCloser(strings.NewReader("")), io.EOF).
			Run(func(args mock.Arguments) {
				go func() {
					time.Sleep(50 * time.Millisecond)
					cancel()
				}()
			})

		handler := createDefaultHandler(mockedClient)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
		calls := 0
		for _, c := range mockedClient.Calls {
			if c.Method == "ContainerLogs" {
				calls++
			}
		}
		return fmt.Sprintf("%d", calls)
	}

	assert.Equal(t, "1", run(t, ""), "running only by default")
	assert.Equal(t, "2", run(t, "stopped=1"), "stopped=1 opens the stopped container too")
}
