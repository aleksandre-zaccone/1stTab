var { useState, useCallback } = React;
function TodoWidget() {
  const [todos, setTodos] = window.useStorage(STORAGE_KEYS.todos, [], false);
  const [input, setInput] = useState("");
  const addTodo = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (todos.length >= 25) {
      alert("To-do list is capped at 25 items for the free tier.");
      return;
    }
    setTodos([...todos, { id: Date.now(), text, done: false }]);
    setInput("");
  };
  const toggleTodo = (id) => {
    setTodos(todos.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };
  const deleteTodo = (id) => {
    setTodos(todos.filter((t) => t.id !== id));
  };
  const clearCompleted = () => {
    setTodos(todos.filter((t) => !t.done));
  };
  const completedCount = todos.filter((t) => t.done).length;
  return /* @__PURE__ */ React.createElement("div", { className: "crt-panel todo-panel" }, /* @__PURE__ */ React.createElement("div", { className: "crt-panel-label" }, "P3 \xB7 TASKS"), /* @__PURE__ */ React.createElement("form", { className: "todo-input-wrap", onSubmit: addTodo }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: input,
      onChange: (e) => setInput(e.target.value),
      placeholder: "New task...",
      maxLength: 100
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "todo-add-btn", "aria-label": "Add task" }, "+")), /* @__PURE__ */ React.createElement("div", { className: "todo-list custom-scrollbar" }, todos.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "todo-empty" }, "No pending tasks") : todos.map((t) => /* @__PURE__ */ React.createElement("div", { key: t.id, className: "todo-item" + (t.done ? " done" : "") }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "todo-check",
      onClick: () => toggleTodo(t.id),
      "aria-label": t.done ? "Mark incomplete" : "Mark complete"
    },
    t.done ? "\u25A3" : "\u25A2"
  ), /* @__PURE__ */ React.createElement("span", { className: "todo-text", onClick: () => toggleTodo(t.id) }, t.text), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "todo-del",
      onClick: () => deleteTodo(t.id),
      "aria-label": "Delete"
    },
    "\xD7"
  )))), todos.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "todo-footer" }, /* @__PURE__ */ React.createElement("span", null, completedCount, "/", todos.length, " done"), completedCount > 0 && /* @__PURE__ */ React.createElement("button", { className: "todo-clear-btn", onClick: clearCompleted }, "Clear done")));
}
window.TodoWidget = TodoWidget;
