import { useMemo, useState } from 'react';
import { Plus, Star } from 'lucide-react';
import type { Todo, TodoFilter } from '../types';
import { Bear } from '../components/Bear';
import { TodoForm } from '../components/TodoForm';
import { CheckButton, Modal, Segmented } from '../components/ui';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/Auth';
import { categoryLabel, categoryTone } from '../lib/constants';
import { cx } from '../lib/cx';
import { wornAllowed } from '../lib/outfits';
import { toDateKey } from '../lib/time';

export function TodoPage() {
  const { data, addTodo, updateTodo, toggleTodo, deleteTodo } = useAppState();
  const { session } = useAuth();
  const developer = session?.role === 'developer';
  const clothIds = wornAllowed(data.settings.clothIds, data.settings.ownedOutfitIds, developer);
  const itemIds = wornAllowed(data.settings.itemIds, data.settings.ownedOutfitIds, developer);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [editing, setEditing] = useState<Todo | null>(null);
  const [creating, setCreating] = useState(false);
  const todayKey = toDateKey(new Date());

  const todos = useMemo(() => {
    return data.todos
      .filter((todo) => todo.date === todayKey)
      .filter((todo) => (filter === 'open' ? !todo.done : filter === 'done' ? todo.done : true))
      .sort((a, b) => Number(a.done) - Number(b.done) || b.importance - a.importance || b.createdAt - a.createdAt);
  }, [data.todos, filter, todayKey]);

  const empty =
    filter === 'done' ? '아직 완료한 일이 없어요.' : filter === 'open' ? '진행 중인 일이 없어요.' : '오늘의 할 일을 적어보세요.';

  return (
    <div className="page todo-page">
      <header className="row-between">
        <h1 className="page-title">오늘의 할 일</h1>
        <button type="button" className="icon-btn" onClick={() => setCreating(true)} aria-label="할 일 추가">
          <Plus size={18} />
        </button>
      </header>
      <Segmented
        label="할 일 필터"
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'all', label: '전체' },
          { id: 'open', label: '진행중' },
          { id: 'done', label: '완료' },
        ]}
      />
      {todos.length === 0 ? (
        <div className="empty">
          <Bear character={data.settings.character} crop="face" size={72} />
          <p>{empty}</p>
          {filter === 'all' && (
            <button type="button" className="btn-primary slim" onClick={() => setCreating(true)}>
              할 일 추가
            </button>
          )}
        </div>
      ) : (
        <ul className="card todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className="todo-item">
              <CheckButton on={todo.done} label={todo.done ? '완료 취소' : '완료'} onClick={() => toggleTodo(todo.id)} />
              <button type="button" className="todo-main" onClick={() => setEditing(todo)}>
                <span className={cx('todo-line', todo.done && 'is-done')}>{todo.title}</span>
                <StarReadout score={todo.importance} />
              </button>
              <span className="tag" style={{ background: categoryTone(todo.subject, data.categories).bg, color: categoryTone(todo.subject, data.categories).fg }}>
                {categoryLabel(todo.subject, data.categories)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="bear-peek">
        <Bear character={data.settings.character} size={92} wear={{ clothIds, itemIds }} />
      </div>
      <Modal open={creating} title="할 일 추가" onClose={() => setCreating(false)}>
        <TodoForm
          date={todayKey}
          onSave={(value) => {
            addTodo({ ...value, date: todayKey });
            setCreating(false);
          }}
        />
      </Modal>
      <Modal open={Boolean(editing)} title="할 일 수정" onClose={() => setEditing(null)}>
        {editing && (
          <TodoForm
            date={editing.date}
            initial={editing}
            onSave={(value) => {
              updateTodo(editing.id, value);
              setEditing(null);
            }}
            onDelete={() => {
              deleteTodo(editing.id);
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function StarReadout({ score }: { score: number }) {
  return (
    <span className="star-readout" aria-label={`중요도 ${score}/5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star key={value} size={12} className={value <= score ? 'is-on' : undefined} fill={value <= score ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}
