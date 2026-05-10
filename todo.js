var { useState, useCallback } = React;
function TodoWidget() {
  const { t } = window.useI18n();
  const [todos, setTodos] = window.useStorage(STORAGE_KEYS.todos, [], false);
  const [input, setInput] = useState("");
  const addTodo = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (todos.length >= 25) {
      alert(t("todo.cap_reached"));
      return;
    }
    setTodos([...todos, { id: Date.now(), text, done: false }]);
    setInput("");
  };
  const toggleTodo = (id) => {
    setTodos(todos.map((t2) => t2.id === id ? { ...t2, done: !t2.done } : t2));
  };
  const deleteTodo = (id) => {
    setTodos(todos.filter((t2) => t2.id !== id));
  };
  const clearCompleted = () => {
    setTodos(todos.filter((t2) => !t2.done));
  };
  const completedCount = todos.filter((t2) => t2.done).length;
  return /* @__PURE__ */ React.createElement("div", { className: "crt-panel todo-panel" }, /* @__PURE__ */ React.createElement("div", { className: "crt-panel-label" }, "P3 \xB7 ", t("todo.title")), /* @__PURE__ */ React.createElement("form", { className: "todo-input-wrap", onSubmit: addTodo }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: input,
      onChange: (e) => setInput(e.target.value),
      placeholder: t("todo.placeholder"),
      maxLength: 100
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "todo-add-btn", "aria-label": "Add task" }, "+")), /* @__PURE__ */ React.createElement("div", { className: "todo-list custom-scrollbar" }, todos.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "todo-empty" }, t("todo.empty")) : todos.map((task) => /* @__PURE__ */ React.createElement("div", { key: task.id, className: "todo-item" + (task.done ? " done" : "") }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "todo-check",
      onClick: () => toggleTodo(task.id),
      "aria-label": task.done ? "Mark incomplete" : "Mark complete"
    },
    task.done ? "\u25A3" : "\u25A2"
  ), /* @__PURE__ */ React.createElement("span", { className: "todo-text", onClick: () => toggleTodo(task.id) }, task.text), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "todo-del",
      onClick: () => deleteTodo(task.id),
      "aria-label": "Delete"
    },
    "\xD7"
  )))), todos.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "todo-footer" }, /* @__PURE__ */ React.createElement("span", null, t("todo.done_count", { done: completedCount, total: todos.length })), completedCount > 0 && /* @__PURE__ */ React.createElement("button", { className: "todo-clear-btn", onClick: clearCompleted }, t("todo.clear_done"))));
}
window.TodoWidget = TodoWidget;
