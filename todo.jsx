var { useState, useCallback } = React;

function TodoWidget() {
  const { t } = window.useI18n();
  const [todos, setTodos] = window.useStorage(STORAGE_KEYS.todos, [], false);
  const [input, setInput] = useState('');

  const addTodo = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (todos.length >= 25) {
      alert(t('todo.cap_reached'));
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
      <div className="crt-panel-label">P3 · {t('todo.title')}</div>
      
      <form className="todo-input-wrap" onSubmit={addTodo}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder={t('todo.placeholder')}
          maxLength={100}
        />
        <button type="submit" className="todo-add-btn" aria-label="Add task">+</button>
      </form>

      <div className="todo-list custom-scrollbar">
        {todos.length === 0 ? (
          <div className="todo-empty">{t('todo.empty')}</div>
        ) : (
          todos.map(task => (
            <div key={task.id} className={"todo-item" + (task.done ? " done" : "")}>
              <button 
                className="todo-check" 
                onClick={() => toggleTodo(task.id)}
                aria-label={task.done ? "Mark incomplete" : "Mark complete"}
              >
                {task.done ? '▣' : '▢'}
              </button>
              <span className="todo-text" onClick={() => toggleTodo(task.id)}>{task.text}</span>
              <button 
                className="todo-del" 
                onClick={() => deleteTodo(task.id)}
                aria-label="Delete"
              >×</button>
            </div>
          ))
        )}
      </div>

      {todos.length > 0 && (
        <div className="todo-footer">
          <span>{t('todo.done_count', { done: completedCount, total: todos.length })}</span>
          {completedCount > 0 && (
            <button className="todo-clear-btn" onClick={clearCompleted}>{t('todo.clear_done')}</button>
          )}
        </div>
      )}
    </div>
  );
}

window.TodoWidget = TodoWidget;
