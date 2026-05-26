var { useState, useCallback } = React;
const TODO_FREE_LIMIT = 25;
function TodoWidget() {
  const { t: i18n_t } = window.useI18n();
  const [todos, setTodos] = window.useStorage(window.STORAGE_KEYS.todos, [], true);
  const [plus] = window.useStorage(window.STORAGE_KEYS.plus, { active: false }, false);
  const [input, setInput] = useState("");
  const [limitHit, setLimitHit] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const isPlus = !!plus?.active;
  const overLimit = !isPlus && todos.length >= TODO_FREE_LIMIT;
  const addTodo = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (overLimit) {
      setLimitHit(true);
      setTimeout(() => setLimitHit(false), 2200);
      return;
    }
    setTodos([{ id: Date.now(), text, done: false, createdAt: Date.now() }, ...todos]);
    setInput("");
    setShowInput(false);
  };
  const toggleTodo = (id) => {
    setTodos(todos.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };
  const deleteTodo = (e, id) => {
    e.stopPropagation();
    setTodos(todos.filter((t) => t.id !== id));
  };
  const clearCompleted = () => {
    setTodos(todos.filter((t) => !t.done));
  };
  const doneCount = todos.filter((t) => t.done).length;
  return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", { className: "drag-handle" }, /* @__PURE__ */ React.createElement(Icon.drag, null)), i18n_t("todo.title") || "Today"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "card-action", onClick: clearCompleted }, doneCount, " ", i18n_t("todo.done") || "done"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowInput(!showInput),
      style: {
        background: "none",
        border: "none",
        color: "var(--text-mute)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px",
        borderRadius: "6px",
        transition: "background .15s, color .15s",
        outline: "none"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "var(--surface-hover)";
        e.currentTarget.style.color = "var(--text)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = "var(--text-mute)";
      },
      title: "Toggle input"
    },
    /* @__PURE__ */ React.createElement(Icon.plus, { size: 15, strokeWidth: 2.6 })
  ))), showInput && /* @__PURE__ */ React.createElement("form", { className: "todo-input-row", onSubmit: addTodo, style: { display: "flex", gap: 8, marginBottom: 12 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "todo-input",
      autoFocus: true,
      value: input,
      onChange: (e) => setInput(e.target.value),
      placeholder: i18n_t("todo.placeholder") || "What needs doing?",
      style: { flex: 1, height: 36, padding: "0 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)" }
    }
  )), limitHit && /* @__PURE__ */ React.createElement("div", { className: "plus-hint" }, "Free tier limit (", TODO_FREE_LIMIT, " tasks) reached \u2014 Plus removes it"), /* @__PURE__ */ React.createElement("div", { className: "todo-list" }, todos.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "todo-empty", style: { textAlign: "center", padding: "20px 0", fontSize: 12.5, color: "var(--text-faint)" } }, i18n_t("todo.empty") || "No tasks yet") : todos.map((task) => /* @__PURE__ */ React.createElement("div", { key: task.id, className: "todo-item" + (task.done ? " done" : ""), style: { display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8, cursor: "pointer" }, onClick: () => toggleTodo(task.id) }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "todo-check" + (task.done ? " checked" : ""),
      style: { width: 18, height: 18, border: "1.5px solid var(--border-strong)", borderRadius: 6, background: task.done ? "var(--accent)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }
    },
    task.done && /* @__PURE__ */ React.createElement(Icon.close, { size: 12, strokeWidth: 3, style: { color: "white" } })
  ), /* @__PURE__ */ React.createElement("span", { className: "todo-text", style: { flex: 1, fontSize: 13.5, textDecoration: task.done ? "line-through" : "none", color: task.done ? "var(--text-mute)" : "inherit" } }, task.text), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "todo-del",
      onClick: (e) => deleteTodo(e, task.id),
      style: { opacity: 0, transition: "opacity .2s" }
    },
    /* @__PURE__ */ React.createElement(Icon.trash, { size: 14 })
  )))));
}
window.TodoWidget = TodoWidget;
