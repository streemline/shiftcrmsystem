import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Plus, Pencil, Trash2 } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Низкий" },
  { value: "normal", label: "Средний" },
  { value: "high",   label: "Высокий" },
];

const STATUS_OPTIONS = [
  { value: "todo",        label: "К выполнению" },
  { value: "in_progress", label: "В работе" },
  { value: "completed",   label: "Выполнено" },
];

const PRIORITY_COLORS = {
  low:    "text-[#9E9E9E] bg-[#9E9E9E]/10",
  normal: "text-blue-400 bg-blue-400/10",
  high:   "text-[#D32F2F] bg-[#D32F2F]/10",
};

const STATUS_COLORS = {
  todo:        "text-[#9E9E9E]",
  in_progress: "text-blue-400",
  completed:   "text-[#388E3C]",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  deadline: "",
  priority: "normal",
  status: "todo",
  progress: 0,
  assigned_to: [],
};

export default function AdminTasks() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(function() {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const me = await base44.auth.me();
    setCurrentUser(me);

    if (me.role !== "admin" && me.role !== "manager") {
      setIsLoading(false);
      return;
    }

    const [allTasks, allUsers] = await Promise.all([
      base44.entities.Task.list("-created_date", 100),
      base44.entities.User.list(),
    ]);

    setTasks(allTasks);
    setUsers(allUsers);
    setIsLoading(false);
  }

  function openCreateForm() {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(task) {
    setEditingTask(task);
    setForm({
      title:       task.title || "",
      description: task.description || "",
      deadline:    task.deadline || "",
      priority:    task.priority || "normal",
      status:      task.status || "todo",
      progress:    task.progress || 0,
      assigned_to: task.assigned_to || [],
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingTask(null);
    setForm(EMPTY_FORM);
  }

  function setFormField(field, value) {
    setForm(function(prev) { return { ...prev, [field]: value }; });
  }

  function toggleAssignedUser(email) {
    setForm(function(prev) {
      const list = prev.assigned_to || [];
      if (list.includes(email)) {
        return { ...prev, assigned_to: list.filter(function(e) { return e !== email; }) };
      }
      return { ...prev, assigned_to: [...list, email] };
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);

    const data = {
      title:       form.title,
      description: form.description,
      deadline:    form.deadline || null,
      priority:    form.priority,
      status:      form.status,
      progress:    Number(form.progress),
      assigned_to: form.assigned_to,
    };

    if (editingTask) {
      await base44.entities.Task.update(editingTask.id, data);
      toast.success("Задача обновлена");
      // Уведомление об изменении статуса назначенным сотрудникам
      if (data.status !== editingTask.status) {
        const assigned = data.assigned_to || [];
        for (const email of assigned) {
          await base44.entities.Notification.create({
            recipient_email: email,
            type: "status_change",
            title: `Статус задачи изменён`,
            message: `"${data.title}" → ${data.status === "completed" ? "Выполнено" : data.status === "in_progress" ? "В работе" : "К выполнению"}`,
            task_id: editingTask.id,
            is_read: false,
          });
        }
      }
    } else {
      const newTask = await base44.entities.Task.create(data);
      toast.success("Задача создана");
      // Уведомление о новой задаче назначенным сотрудникам
      const assigned = data.assigned_to || [];
      for (const email of assigned) {
        await base44.entities.Notification.create({
          recipient_email: email,
          type: "new_task",
          title: `Новая задача: ${data.title}`,
          message: data.description || "",
          task_id: newTask?.id || "",
          is_read: false,
        });
      }
    }

    cancelForm();
    await loadData();
    setIsSaving(false);
  }

  async function handleDelete(taskId) {
    setDeletingId(taskId);
    await base44.entities.Task.delete(taskId);
    toast.success("Задача удалена");
    await loadData();
    setDeletingId(null);
  }

  if (isLoading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  if (currentUser?.role !== "admin" && currentUser?.role !== "manager") {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Нет доступа"
          description="Эта страница только для администраторов и руководителей"
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">Управление задачами</h1>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Plus size={16} />
          Задача
        </button>
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 mb-5">
          <h2 className="text-base font-semibold text-white mb-4">
            {editingTask ? "Редактировать задачу" : "Новая задача"}
          </h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Название</label>
              <input
                type="text"
                value={form.title}
                onChange={function(e) { setFormField("title", e.target.value); }}
                required
                placeholder="Название задачи"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Описание</label>
              <textarea
                value={form.description}
                onChange={function(e) { setFormField("description", e.target.value); }}
                rows={2}
                placeholder="Описание задачи (необязательно)"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors resize-none placeholder-[#555]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Приоритет</label>
                <select
                  value={form.priority}
                  onChange={function(e) { setFormField("priority", e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                >
                  {PRIORITY_OPTIONS.map(function(p) {
                    return <option key={p.value} value={p.value}>{p.label}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Статус</label>
                <select
                  value={form.status}
                  onChange={function(e) { setFormField("status", e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                >
                  {STATUS_OPTIONS.map(function(s) {
                    return <option key={s.value} value={s.value}>{s.label}</option>;
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Срок</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={function(e) { setFormField("deadline", e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Прогресс %</label>
                <input
                  type="number"
                  value={form.progress}
                  onChange={function(e) { setFormField("progress", e.target.value); }}
                  min="0"
                  max="100"
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
            </div>

            {/* Назначение сотрудников */}
            <div>
              <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">
                Назначить сотрудников
              </label>
              <div className="space-y-1 max-h-36 overflow-y-auto bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2">
                {users.map(function(u) {
                  const isSelected = (form.assigned_to || []).includes(u.email);
                  return (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-[#1A1A1A] transition-colors">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={function() { toggleAssignedUser(u.email); }}
                        className="accent-[#D32F2F]"
                      />
                      <span className="text-sm text-white">{u.full_name}</span>
                      <span className="text-xs text-[#555] ml-auto">{u.position || u.role}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium hover:border-[#555] transition-all"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-lg bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-50 transition-all"
              >
                {isSaving ? "Сохранение..." : (editingTask ? "Сохранить" : "Создать")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список задач */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Задач нет"
          description="Создайте первую задачу для сотрудников"
        />
      ) : (
        <div className="space-y-3">
          {tasks.map(function(task) {
            const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal;
            const statusColor = STATUS_COLORS[task.status] || STATUS_COLORS.todo;

            return (
              <div key={task.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-[#9E9E9E] mt-0.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColor}`}>
                        {PRIORITY_OPTIONS.find(function(p) { return p.value === task.priority; })?.label || "Средний"}
                      </span>
                      <span className={`text-xs ${statusColor}`}>
                        {STATUS_OPTIONS.find(function(s) { return s.value === task.status; })?.label || "К выполнению"}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-[#555]">
                          До {new Date(task.deadline + "T12:00:00").toLocaleDateString("ru", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {task.assigned_to && task.assigned_to.length > 0 && (
                        <span className="text-xs text-[#555]">👥 {task.assigned_to.length}</span>
                      )}
                    </div>
                    {task.progress > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D32F2F] rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#555] mt-0.5">{task.progress}%</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={function() { openEditForm(task); }}
                      className="p-2 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={function() { handleDelete(task.id); }}
                      disabled={deletingId === task.id}
                      className="p-2 text-[#9E9E9E] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}