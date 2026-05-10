var { useState, useCallback } = React;

function TodoWidget() {
  const [todos, setTodos] = window.useStorage(STORAGE_KEYS.todos, [], false);
  const [input, setInput] = useState('');

  const addTodo = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (todos.length >= 25) {
      alert("To-do list is capped at 25 items for the free tier.");
      return;
    }
    setTodos([...todos, { id: Date.now(), text, done: false }]);
    setInput('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(t => !t.done));
  };

  const completedCount = todos.filter(t => t.done).length;

  return (
    <div className="crt-panel todo-panel">
      <div className="crt-panel-label">P3 · TASKS</div>
      
      <form className="todo-input-wrap" onSubmit={addTodo}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="New task..."
          maxLength={100}
        />
        <button type="submit" className="todo-add-btn" aria-label="Add task">+</button>
      </form>

      <div className="todo-list custom-scrollbar">
        {todos.length === 0 ? (
          <div className="todo-empty">No pending tasks</div>
        ) : (
          todos.map(t => (
            <div key={t.id} className={"todo-item" + (t.done ? " done" : "")}>
              <button 
                className="todo-check" 
                onClick={() => toggleTodo(t.id)}
                aria-label={t.done ? "Mark incomplete" : "Mark complete"}
              >
                {t.done ? '▣' : '▢'}
              </button>
              <span className="todo-text" onClick={() => toggleTodo(t.id)}>{t.text}</span>
              <button 
                className="todo-del" 
                onClick={() => deleteTodo(t.id)}
                aria-label="Delete"
              >×</button>
            </div>
          ))
        )}
      </div>

      {todos.length > 0 && (
        <div className="todo-footer">
          <span>{completedCount}/{todos.length} done</span>
          {completedCount > 0 && (
            <button className="todo-clear-btn" onClick={clearCompleted}>Clear done</button>
          )}
        </div>
      )}
    </div>
  );
}

window.TodoWidget = TodoWidget;
