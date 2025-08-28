
import React, { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [confirmingTask, setConfirmingTask] = useState(null);


  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then(setTasks)
      .catch(() => setTasks([]));
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
  console.log('addTask called, text=', text);
  if (!text.trim()) { console.log('addTask aborted: empty text'); return; }
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, done: false }),
      });
      const newTask = await res.json();
      setTasks([...tasks, newTask]);
      setText("");
    } catch (err) {
      console.error(err);
      alert("Не удалось добавить задачу. Проверьте, запущен ли backend.");
    }
  };

  const updateTask = async (id, updated) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("update failed");
      setTasks(tasks.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("delete failed");
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="container">
      <div className="card">
        <div className="header">
          <div className="logo">TD</div>
          <div>
            <div className="title">ToDo — список твоих дел</div>
            <div className="subtitle small">Добавляйте, отмечайте и удаляйте задачи</div>
          </div>
        </div>

        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <input className="input" value={text} onChange={(e) => { console.log('input change', e.target.value); setText(e.target.value); }} placeholder="Что нужно сделать?" />
          <button className="btn" type="button" onClick={() => { console.log('add button clicked'); addTask({ preventDefault: () => {} }); }}>Добавить</button>
        </form>

        <div className="list">
          {tasks.length === 0 && <div className="small">Задач нет — добавьте первую</div>}
          {tasks.map((task) => (
            <div className="item" key={task.id}>
              <input type="checkbox" checked={task.done} onChange={() => updateTask(task.id, { ...task, done: !task.done })} />
              <div className={"text" + (task.done ? " done" : "")}>{task.text}</div>
              <div className="actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="Редактировать"
                  onClick={() => {
                    setEditingTask(task);
                    setEditingText(task.text);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
                    <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="icon-btn"
                  title="Удалить"
                  onClick={() => {
                    setConfirmingTask(task);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z" fill="currentColor" />
                    <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
  </div>
  </div>
      <EditModal
        task={editingTask}
        value={editingText}
        onChange={setEditingText}
        onClose={() => setEditingTask(null)}
        onSave={async () => {
          if (!editingTask) return;
          await updateTask(editingTask.id, { ...editingTask, text: editingText });
          setEditingTask(null);
        }}
      />

      <ConfirmModal
        task={confirmingTask}
        onCancel={() => setConfirmingTask(null)}
        onConfirm={async () => {
          if (!confirmingTask) return;
          await deleteTask(confirmingTask.id);
          setConfirmingTask(null);
        }}
      />
  </>
  );
}

// --- Modals inserted at bottom so they appear above everything ---
function EditModal({ task, value, onChange, onClose, onSave }) {
  if (!task) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">Редактировать задачу</div>
        <div className="modal-body">
          <textarea className="input-edit" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>Отмена</button>
          <button className="btn" onClick={onSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ task, onCancel, onConfirm }) {
  if (!task) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">Удалить задачу?</div>
        <div className="modal-body">
          <div style={{ marginTop: 8, fontWeight: 600 }}>{task.text}</div>
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onCancel}>Нет</button>
          <button className="btn" onClick={onConfirm}>Да, удалить</button>
        </div>
      </div>
    </div>
  );
}


export default App;
