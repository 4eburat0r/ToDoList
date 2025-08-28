package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"
)

type Task struct {
	ID   int    `json:"id"`
	Text string `json:"text"`
	Done bool   `json:"done"`
}

var (
	tasks   = make([]Task, 0)
	taskMux sync.Mutex
	nextID  = 1
)

func main() {
	http.HandleFunc("/tasks", withCORS(handleTasks))
	http.HandleFunc("/tasks/", withCORS(handleTaskByID))
	println("Server started at :8080")
	http.ListenAndServe(":8080", nil)
}

// withCORS middleware adds CORS headers
func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		h(w, r)
	}
}

func handleTasks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		taskMux.Lock()
		defer taskMux.Unlock()
		json.NewEncoder(w).Encode(tasks)
	case "POST":
		var t Task
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		taskMux.Lock()
		t.ID = nextID
		nextID++
		tasks = append(tasks, t)
		taskMux.Unlock()
		json.NewEncoder(w).Encode(t)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func handleTaskByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/tasks/"):] // /tasks/{id}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	taskMux.Lock()
	defer taskMux.Unlock()
	for i, t := range tasks {
		if t.ID == id {
			switch r.Method {
			case "PUT":
				var updated Task
				if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
					w.WriteHeader(http.StatusBadRequest)
					return
				}
				tasks[i].Text = updated.Text
				tasks[i].Done = updated.Done
				json.NewEncoder(w).Encode(tasks[i])
			case "DELETE":
				tasks = append(tasks[:i], tasks[i+1:]...)
				w.WriteHeader(http.StatusNoContent)
			default:
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
			return
		}
	}
	w.WriteHeader(http.StatusNotFound)
}
