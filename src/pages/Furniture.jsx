import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sofa, Plus, Pencil, Trash2, ArrowRightLeft, MessageSquare, Check, QrCode, X
} from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import QrScannerModal from "../components/shared/QrScannerModal";

const QUALITY_LABELS = {
  excellent: { label: "Отлично", color: "text-[#388E3C] bg-[#388E3C]/10", stars: 4 },
  good:      { label: "Хорошо",  color: "text-blue-400 bg-blue-400/10",   stars: 3 },
  fair:      { label: "Средне",  color: "text-[#F57C00] bg-[#F57C00]/10", stars: 2 },
  poor:      { label: "Плохо",   color: "text-[#D32F2F] bg-[#D32F2F]/10", stars: 1 },
};

const EMPTY_FORM = { name: "", description: "", total_quantity: "", category: "", image_url: "" };

export default function Furniture() {
  const [user, setUser] = useState(null);
  const [furniture, setFurniture] = useState([]);
  const [usageRecords, setUsageRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [qualityInputs, setQualityInputs] = useState({});
  const [exhibitionInputs, setExhibitionInputs] = useState({});
  const [savingComment, setSavingComment] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showQrModal, setShowQrModal] = useState(null);

  useEffect(function() { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    const [items, usages] = await Promise.all([
      base44.entities.Furniture.list("name", 200),
      base44.entities.FurnitureUsage.list("-created_date", 500),
    ]);
    setFurniture(items);
    setUsageRecords(usages);
    setIsLoading(false);
  }

  const isManager = user?.role === "admin" || user?.role === "manager";
  const isMebelist = user?.role === "Мебелщик" || isManager;

  function setField(k, v) { setForm(function(p) { return { ...p, [k]: v }; }); }

  function openCreate() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      total_quantity: String(item.total_quantity || ""),
      category: item.category || "",
      image_url: item.image_url || "",
    });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    const data = {
      name: form.name,
      description: form.description,
      total_quantity: Number(form.total_quantity),
      category: form.category,
      image_url: form.image_url,
      in_exhibition: editingItem?.in_exhibition || 0,
    };
    if (editingItem) {
      await base44.entities.Furniture.update(editingItem.id, data);
      toast.success("Мебель обновлена");
    } else {
      await base44.entities.Furniture.create(data);
      toast.success("Мебель добавлена");
    }
    setShowForm(false);
    await loadData();
    setIsSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Удалить позицию?")) return;
    await base44.entities.Furniture.delete(id);
    toast.success("Удалено");
    await loadData();
  }

  async function handleExhibitionChange(item) {
    var qty = parseInt(exhibitionInputs[item.id] || 0, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Введите количество");
      return;
    }

    // Проверяем лимит редактирований у пользователя
    var userUsages = usageRecords.filter(function(u) {
      return u.furniture_id === item.id && u.user_email === user?.email;
    });
    var editCount = 0;
    for (var i = 0; i < userUsages.length; i++) {
      editCount += userUsages[i].edit_count || 0;
    }
    if (editCount >= 2) {
      toast.error("Превышен лимит изменений (максимум 2 раза)");
      return;
    }

    var inStock = (item.total_quantity || 0) - (item.in_exhibition || 0);
    if (qty > inStock) {
      toast.error(`На складе только ${inStock} шт.`);
      return;
    }

    // Создаём запись использования
    var usage = await base44.entities.FurnitureUsage.create({
      furniture_id: item.id,
      furniture_name: item.name,
      task_id: "",
      user_email: user?.email || "",
      user_name: user?.full_name || "",
      quantity_taken: qty,
      action: "take",
      edit_count: 1,
      status: "pending",
    });

    // Обновляем количество на выставке
    await base44.entities.Furniture.update(item.id, {
      in_exhibition: (item.in_exhibition || 0) + qty,
    });

    // Уведомляем менеджеров и мебелщиков
    var allUsers = await base44.entities.User.list();
    for (var j = 0; j < allUsers.length; j++) {
      var u = allUsers[j];
      if (u.role === "manager" || u.role === "admin" || u.role === "Мебелщик") {
        if (u.email !== user?.email) {
          await base44.entities.Notification.create({
            recipient_email: u.email,
            type: "status_change",
            title: `Мебель взята на выставку`,
            message: `${user?.full_name} взял(а) ${qty} шт. «${item.name}»`,
            is_read: false,
          });
        }
      }
    }

    toast.success(`Отправлено на выставку: ${qty} шт.`);
    setExhibitionInputs(function(p) { return { ...p, [item.id]: "" }; });
    await loadData();
  }

  async function handleReturn(item) {
    var qty = parseInt(exhibitionInputs[item.id] || 0, 10);
    if (isNaN(qty) || qty <= 0 || qty > (item.in_exhibition || 0)) {
      toast.error("Некорректное количество для возврата");
      return;
    }

    await base44.entities.FurnitureUsage.create({
      furniture_id: item.id,
      furniture_name: item.name,
      user_email: user?.email || "",
      user_name: user?.full_name || "",
      quantity_taken: qty,
      action: "return",
      edit_count: 1,
      status: "pending",
    });

    await base44.entities.Furniture.update(item.id, {
      in_exhibition: Math.max(0, (item.in_exhibition || 0) - qty),
    });

    // Уведомляем мебелщиков
    var allUsers = await base44.entities.User.list();
    for (var j = 0; j < allUsers.length; j++) {
      var u = allUsers[j];
      if (u.role === "Мебелщик" || u.role === "manager" || u.role === "admin") {
        if (u.email !== user?.email) {
          await base44.entities.Notification.create({
            recipient_email: u.email,
            type: "status_change",
            title: `Мебель возвращена с выставки`,
            message: `${user?.full_name} вернул(а) ${qty} шт. «${item.name}»`,
            is_read: false,
          });
        }
      }
    }

    toast.success(`Возвращено: ${qty} шт.`);
    setExhibitionInputs(function(p) { return { ...p, [item.id]: "" }; });
    await loadData();
  }

  async function handleSaveComment(item) {
    var comment = (commentInputs[item.id] || "").trim();
    var quality = qualityInputs[item.id] || item.quality;
    if (!comment && !quality) return;

    setSavingComment(item.id);
    await base44.entities.Furniture.update(item.id, {
      quality_comment: comment || item.quality_comment,
      quality: quality || item.quality,
    });
    toast.success("Сохранено");
    setCommentInputs(function(p) { return { ...p, [item.id]: "" }; });
    setSavingComment(null);
    await loadData();
  }

  function handleScan(id) {
    setShowScanner(false);
    const item = furniture.find(f => f.id === id);
    if (item) {
      setExpandedId(item.id);
      toast.success("Мебель найдена!");
      // Scroll into view gently
      setTimeout(() => {
        const el = document.getElementById(`furniture-item-${item.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      toast.error("QR-код не распознан или мебель удалена");
    }
  }

  if (isLoading) return <div className="p-6"><LoadingSpinner /></div>;

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Мебель</h1>
          <p className="text-xs text-[#555] mt-1">Склад и управление выставочной мебелью</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-[#333] text-white text-sm font-semibold px-3 py-2 rounded-lg transition-all"
          >
            <QrCode size={15} />
            <span className="hidden sm:inline">Сканировать</span>
          </button>
          {isManager && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            >
              <Plus size={15} />
              Добавить
            </button>
          )}
        </div>
      </div>

      <QrScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      {/* Форма */}
      {showForm && isManager && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 mb-5">
          <h2 className="text-base font-semibold text-white mb-4">
            {editingItem ? "Редактировать" : "Новая позиция"}
          </h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Название</label>
                <input required type="text" value={form.name}
                  onChange={function(e) { setField("name", e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]" />
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Категория</label>
                <input type="text" value={form.category}
                  onChange={function(e) { setField("category", e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Количество</label>
              <input required type="number" min="0" value={form.total_quantity}
                onChange={function(e) { setField("total_quantity", e.target.value); }}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]" />
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">URL картинки</label>
              <input type="url" value={form.image_url}
                onChange={function(e) { setField("image_url", e.target.value); }}
                placeholder="https://..."
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]" />
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Описание</label>
              <textarea rows={2} value={form.description}
                onChange={function(e) { setField("description", e.target.value); }}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] resize-none" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={function() { setShowForm(false); }}
                className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium">Отмена</button>
              <button type="submit" disabled={isSaving}
                className="flex-1 py-2.5 rounded-lg bg-[#D32F2F] text-white text-sm font-semibold disabled:opacity-50">
                {isSaving ? "Сохранение..." : (editingItem ? "Обновить" : "Создать")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Сводка */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-white">{furniture.length}</p>
          <p className="text-xs text-[#555]">Позиций</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#388E3C]/20 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-[#388E3C]">
            {furniture.reduce(function(s, f) { return s + (f.total_quantity || 0) - (f.in_exhibition || 0); }, 0)}
          </p>
          <p className="text-xs text-[#555]">На складе</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#F57C00]/20 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-[#F57C00]">
            {furniture.reduce(function(s, f) { return s + (f.in_exhibition || 0); }, 0)}
          </p>
          <p className="text-xs text-[#555]">На выставке</p>
        </div>
      </div>

      {/* Список */}
      {furniture.length === 0 ? (
        <EmptyState icon={<Sofa size={24} />} title="Мебели нет" description="Добавьте первую позицию" />
      ) : (
        <div className="space-y-3">
          {furniture.map(function(item) {
            var inStock = (item.total_quantity || 0) - (item.in_exhibition || 0);
            var isExpanded = expandedId === item.id;
            var qualityInfo = QUALITY_LABELS[item.quality] || null;

            return (
              <div key={item.id} id={`furniture-item-${item.id}`} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
                {/* Заголовок */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={function() { setExpandedId(isExpanded ? null : item.id); }}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-[#2A2A2A] flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
                      <Sofa size={24} className="text-[#555]" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      {item.category && (
                        <span className="text-xs text-[#555] bg-[#2A2A2A] px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-[#9E9E9E] line-clamp-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-[#388E3C] font-semibold">На складе: {inStock}</span>
                      {item.in_exhibition > 0 && (
                        <span className="text-xs text-[#F57C00] font-semibold">Выставка: {item.in_exhibition}</span>
                      )}
                      {qualityInfo && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${qualityInfo.color}`}>
                          {qualityInfo.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {isManager && (
                    <div className="flex gap-1 flex-shrink-0" onClick={function(e) { e.stopPropagation(); }}>
                      <button onClick={function() { openEdit(item); }}
                        className="p-1.5 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all">
                        <Pencil size={13} />
                      </button>
                      <button onClick={function() { handleDelete(item.id); }}
                        className="p-1.5 text-[#9E9E9E] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Расширенная панель */}
                {isExpanded && (
                  <div className="border-t border-[#2A2A2A] bg-[#0F0F0F] p-4 space-y-4">
                    {/* Взять / вернуть */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[#9E9E9E] uppercase tracking-wider flex items-center gap-1">
                          <ArrowRightLeft size={11} /> Выставка
                        </p>
                        <button
                          onClick={() => setShowQrModal(item)}
                          className="text-xs text-[#555] hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <QrCode size={12} />
                          Показать QR-код
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          value={exhibitionInputs[item.id] || ""}
                          onChange={function(e) {
                            setExhibitionInputs(function(p) { return { ...p, [item.id]: e.target.value }; });
                          }}
                          placeholder="Кол-во"
                          className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                        />
                        <button
                          onClick={function() { handleExhibitionChange(item); }}
                          className="px-3 py-2 bg-[#D32F2F] text-white text-xs font-semibold rounded-lg hover:bg-[#B71C1C]"
                        >
                          Взять
                        </button>
                        {item.in_exhibition > 0 && (
                          <button
                            onClick={function() { handleReturn(item); }}
                            className="px-3 py-2 border border-[#388E3C] text-[#388E3C] text-xs font-semibold rounded-lg hover:bg-[#388E3C]/10"
                          >
                            Вернуть
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Комментарий и качество (мебелщик) */}
                    {isMebelist && (
                      <div>
                        <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-2 flex items-center gap-1">
                          <MessageSquare size={11} /> Качество и комментарий
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {Object.entries(QUALITY_LABELS).map(function(entry) {
                            var qKey = entry[0];
                            var qVal = entry[1];
                            var isSelected = (qualityInputs[item.id] || item.quality) === qKey;
                            return (
                              <button
                                key={qKey}
                                onClick={function() {
                                  setQualityInputs(function(p) { return { ...p, [item.id]: qKey }; });
                                }}
                                className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  isSelected
                                    ? "border-[#D32F2F] bg-[#D32F2F]/20 text-white"
                                    : "border-[#2A2A2A] text-[#9E9E9E] hover:border-[#555]"
                                }`}
                              >
                                {qVal.label}
                              </button>
                            );
                          })}
                        </div>
                        {item.quality_comment && (
                          <p className="text-xs text-[#9E9E9E] italic mb-2">«{item.quality_comment}»</p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[item.id] || ""}
                            onChange={function(e) {
                              setCommentInputs(function(p) { return { ...p, [item.id]: e.target.value }; });
                            }}
                            placeholder="Добавить комментарий..."
                            className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D32F2F]"
                          />
                          <button
                            onClick={function() { handleSaveComment(item); }}
                            disabled={savingComment === item.id}
                            className="p-2 bg-[#388E3C] text-white rounded-lg hover:bg-[#2E7D32] disabled:opacity-50"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно с QR-кодом */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#111] border border-[#2A2A2A] rounded-xl max-w-sm w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
              <h2 className="text-sm font-bold text-white truncate pr-4">{showQrModal.name}</h2>
              <button onClick={() => setShowQrModal(null)} className="p-1.5 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
                <X size={18} />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center bg-white">
              <QRCode value={showQrModal.id} size={200} />
              <p className="text-xs text-black/50 mt-4 font-mono">{showQrModal.id}</p>
            </div>
            <div className="p-4 text-center border-t border-[#2A2A2A]">
              <p className="text-xs text-[#9E9E9E]">Распечатайте этот код и наклейте на мебель</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}