import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CheckSquare, MessageSquare, ChevronDown, ChevronUp, Send, Camera, X, Image } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

const FILTERS = [
  { value: "all",         label: "Все" },
  { value: "todo",        label: "К выполнению" },
  { value: "in_progress", label: "В работе" },
  { value: "completed",   label: "Выполнено" },
  { value: "high",        label: "Приоритет" },
];

const PRIORITY_LABELS = {
  low:    { label: "Низкий",   color: "text-[#9E9E9E] bg-[#9E9E9E]/10" },
  normal: { label: "Средний",  color: "text-blue-400 bg-blue-400/10" },
  high:   { label: "Высокий",  color: "text-[#D32F2F] bg-[#D32F2F]/10" },
};

const STATUS_LABELS = {
  todo:        "К выполнению",
  in_progress: "В работе",
  completed:   "Выполнено",
};

export default function Tasks() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [uploadingPhotoTaskId, setUploadingPhotoTaskId] = useState(null);
  const fileInputRef = useRef(null);
  const [photoTaskTarget, setPhotoTaskTarget] = useState(null);

  useEffect(function() {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const allTasks = await base44.entities.Task.list("-created_date", 100);
    setTasks(allTasks);
    setIsLoading(false);
  }

  async function loadCommentsForTask(taskId) {
    const taskComments = await base44.entities.TaskComment.filter(
      { task_id: taskId },
      "created_date",
      50
    );
    setComments(function(prev) {
      return { ...prev, [taskId]: taskComments };
    });
  }

  function handleToggleExpand(taskId) {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      loadCommentsForTask(taskId);
    }
  }

  async function handleMarkComplete(task) {
    const newStatus = task.status === "completed" ? "in_progress" : "completed";
    const newProgress = newStatus === "completed" ? 100 : task.progress;
    await base44.entities.Task.update(task.id, { status: newStatus, progress: newProgress });

    if (newStatus === "completed") {
      toast.success(`Задача выполнена: ${task.title}`);
    } else {
      toast.info(`Задача возобновлена: ${task.title}`);
    }
    await loadData();
  }

  async function handleSendComment(taskId) {
    const content = (commentInputs[taskId] || "").trim();
    if (!content) return;

    setIsSendingComment(true);
    await base44.entities.TaskComment.create({
      task_id: taskId,
      author_email: user.email,
      author_name: user.full_name,
      content,
    });

    // Уведомление другим участникам задачи
    const task = tasks.find(function(t) { return t.id === taskId; });
    if (task) {
      const assigned = task.assigned_to || [];
      for (const email of assigned) {
        if (email !== user.email) {
          await base44.entities.Notification.create({
            recipient_email: email,
            type: "new_comment",
            title: `Новый комментарий в задаче`,
            message: `${user.full_name}: ${content.substring(0, 80)}`,
            task_id: taskId,
            is_read: false,
          });
        }
      }
    }

    setCommentInputs(function(prev) { return { ...prev, [taskId]: "" }; });
    await loadCommentsForTask(taskId);
    setIsSendingComment(false);
  }

  function handlePhotoButtonClick(taskId) {
    setPhotoTaskTarget(taskId);
    fileInputRef.current?.click();
  }

  async function handlePhotoFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !photoTaskTarget) return;

    setUploadingPhotoTaskId(photoTaskTarget);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const task = tasks.find(function(t) { return t.id === photoTaskTarget; });
    const existingPhotos = task?.photo_urls || [];
    await base44.entities.Task.update(photoTaskTarget, {
      photo_urls: [...existingPhotos, file_url],
    });

    toast.success("Фото добавлено");
    await loadData();
    setUploadingPhotoTaskId(null);
    setPhotoTaskTarget(null);
    e.target.value = "";
  }

  async function handleRemovePhoto(task, photoUrl) {
    const updatedPhotos = (task.photo_urls || []).filter(function(u) { return u !== photoUrl; });
    await base44.entities.Task.update(task.id, { photo_urls: updatedPhotos });
    await loadData();
  }

  function getFilteredTasks() {
    if (activeFilter === "all") return tasks;
    if (activeFilter === "high") return tasks.filter(function(t) { return t.priority === "high"; });
    return tasks.filter(function(t) { return t.status === activeFilter; });
  }

  const filteredTasks = getFilteredTasks();

  if (isLoading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-5">Задачи</h1>

      {/* Скрытый input для загрузки файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileChange}
      />

      {/* Фильтры — flex-wrap чтобы не было горизонтальной прокрутки */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(function(f) {
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={function() { setActiveFilter(f.value); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#D32F2F] text-white"
                  : "bg-[#1A1A1A] border border-[#2A2A2A] text-[#9E9E9E] hover:text-white"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Список задач */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={24} />}
          title="Задач нет"
          description="Задачи назначает руководитель"
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(function(task) {
            const isExpanded = expandedTaskId === task.id;
            const isCompleted = task.status === "completed";
            const priorityInfo = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.normal;
            const taskComments = comments[task.id] || [];
            const photoUrls = task.photo_urls || [];

            return (
              <div
                key={task.id}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden"
              >
                {/* Заголовок задачи */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={function() { handleMarkComplete(task); }}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-all ${
                        isCompleted
                          ? "bg-[#388E3C] border-[#388E3C]"
                          : "border-[#2A2A2A] hover:border-[#388E3C]"
                      }`}
                    >
                      {isCompleted && (
                        <svg viewBox="0 0 10 10" className="w-full h-full p-0.5">
                          <polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug ${isCompleted ? "line-through text-[#555]" : "text-white"}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-[#9E9E9E] mt-1 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                        <span className="text-xs text-[#555]">
                          {STATUS_LABELS[task.status]}
                        </span>
                        {task.deadline && (
                          <span className="text-xs text-[#9E9E9E]">
                            До {new Date(task.deadline + "T12:00:00").toLocaleDateString("ru", { day: "numeric", month: "short" })}
                          </span>
                        )}
                        {photoUrls.length > 0 && (
                          <span className="text-xs text-blue-400 flex items-center gap-1">
                            <Image size={11} />
                            {photoUrls.length}
                          </span>
                        )}
                      </div>

                      {task.progress > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-[#9E9E9E]">Прогресс</span>
                            <span className="text-xs text-white">{task.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#D32F2F] rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={function() { handleToggleExpand(task.id); }}
                      className="flex-shrink-0 p-1 text-[#9E9E9E] hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Расширенная секция */}
                {isExpanded && (
                  <div className="border-t border-[#2A2A2A] bg-[#0F0F0F]">
                    {/* Фотоотчёты */}
                    <div className="p-3 border-b border-[#2A2A2A]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Camera size={13} className="text-[#9E9E9E]" />
                          <span className="text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
                            Фотоотчёт ({photoUrls.length})
                          </span>
                        </div>
                        <button
                          onClick={function() { handlePhotoButtonClick(task.id); }}
                          disabled={uploadingPhotoTaskId === task.id}
                          className="text-xs text-[#D32F2F] hover:text-[#B71C1C] disabled:opacity-50 transition-colors font-medium"
                        >
                          {uploadingPhotoTaskId === task.id ? "Загрузка..." : "+ Фото"}
                        </button>
                      </div>

                      {photoUrls.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {photoUrls.map(function(url, idx) {
                            return (
                              <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-[#2A2A2A] group">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                  onClick={function() { handleRemovePhoto(task, url); }}
                                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={10} className="text-white" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {photoUrls.length === 0 && (
                        <p className="text-xs text-[#555] text-center py-1">Нет фотографий</p>
                      )}
                    </div>

                    {/* Комментарии */}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={13} className="text-[#9E9E9E]" />
                        <span className="text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
                          Комментарии ({taskComments.length})
                        </span>
                      </div>

                      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                        {taskComments.length === 0 && (
                          <p className="text-xs text-[#555] text-center py-2">Нет комментариев</p>
                        )}
                        {taskComments.map(function(comment) {
                          const isOwn = comment.author_email === user?.email;
                          return (
                            <div key={comment.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                              <p className="text-xs text-[#555] mb-0.5">{comment.author_name}</p>
                              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs text-white ${
                                isOwn ? "bg-[#D32F2F]/20 border border-[#D32F2F]/20" : "bg-[#1A1A1A] border border-[#2A2A2A]"
                              }`}>
                                {comment.content}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInputs[task.id] || ""}
                          onChange={function(e) {
                            setCommentInputs(function(prev) {
                              return { ...prev, [task.id]: e.target.value };
                            });
                          }}
                          onKeyDown={function(e) {
                            if (e.key === "Enter") handleSendComment(task.id);
                          }}
                          placeholder="Написать комментарий..."
                          className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#D32F2F] transition-colors"
                        />
                        <button
                          onClick={function() { handleSendComment(task.id); }}
                          disabled={isSendingComment || !(commentInputs[task.id] || "").trim()}
                          className="p-2 bg-[#D32F2F] rounded-lg text-white hover:bg-[#B71C1C] disabled:opacity-50 transition-all"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}