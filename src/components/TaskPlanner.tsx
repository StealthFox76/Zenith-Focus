import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, Play, CheckCircle2, Tag } from 'lucide-react';
import { TaskItem } from '../types';

interface TaskPlannerProps {
  tasks: TaskItem[];
  activeTask: TaskItem | null;
  onSelectActiveTask: (task: TaskItem | null) => void;
  onAddTask: (title: string, category: string, estimated: number) => void;
  onToggleTaskComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const CATEGORIES = ['Deep Work', 'Coding', 'Reading', 'Writing', 'Study', 'Design'];

export const TaskPlanner: React.FC<TaskPlannerProps> = ({
  tasks,
  activeTask,
  onSelectActiveTask,
  onAddTask,
  onToggleTaskComplete,
  onDeleteTask,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Deep Work');
  const [newEstimated, setNewEstimated] = useState(2);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), newCategory, Number(newEstimated) || 1);
    setNewTitle('');
  };

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-amber-500" />
          <span>Focus Tasks & Milestones</span>
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Break your goals into focused intervals. Select any task to anchor your timer sessions.
        </p>
      </div>

      {/* Quick Add Task Form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs">
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder="What are you working on next?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 shrink-0">
              <span className="text-xs text-neutral-500">Est:</span>
              <input
                type="number"
                min="1"
                max="12"
                value={newEstimated}
                onChange={(e) => setNewEstimated(Number(e.target.value))}
                className="w-10 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-transparent text-center focus:outline-none"
              />
              <span className="text-xs text-neutral-400">🍅</span>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      </div>

      {/* Pending Tasks List */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Active Tasks ({pendingTasks.length})
          </h3>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Click 'Focus' to connect to timer
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {pendingTasks.length === 0 ? (
            <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center text-xs text-neutral-400">
              No tasks currently planned. Add one above to structure your focus flow!
            </div>
          ) : (
            pendingTasks.map((task) => {
              const isActive = activeTask?.id === task.id;
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    <button
                      onClick={() => onToggleTaskComplete(task.id)}
                      className="text-neutral-400 hover:text-emerald-500 transition-colors shrink-0"
                      title="Mark as completed"
                    >
                      <Square className="w-4 h-4" />
                    </button>

                    <div className="truncate">
                      <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 block truncate">
                        {task.title}
                      </span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                        {task.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
                    </span>

                    <button
                      onClick={() => onSelectActiveTask(isActive ? null : task)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-amber-600 dark:bg-amber-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {isActive ? 'Active Goal' : 'Focus'}
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Completed Tasks List */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
            Completed ({completedTasks.length})
          </h3>

          <div className="flex flex-col gap-2 opacity-60">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <button
                    onClick={() => onToggleTaskComplete(task.id)}
                    className="text-emerald-500 shrink-0"
                    title="Mark uncompleted"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <span className="line-through text-neutral-500 dark:text-neutral-400 truncate">
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-neutral-400">
                    {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
                  </span>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
