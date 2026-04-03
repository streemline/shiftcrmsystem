import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Settings as SettingsIcon } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";

const PRESET_COLORS = ["#D32F2F", "#1976D2", "#388E3C", "#F57C00", "#7B1FA2", "#9E9E9E"];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [objectTypes, setObjectTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#D32F2F");
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(function() { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    const types = await base44.entities.ObjectType.list("sort_order", 100);
    setObjectTypes(types);
    setIsLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSaving(true);
    await base44.entities.ObjectType.create({
      name: newName.trim(),
      color: newColor,
      is_active: true,
      sort_order: objectTypes.length,
    });
    setNewName("");
    setNewColor("#D32F2F");
    setIsAdding(false);
    await loadData();
    setIsSaving(false);
  }

  async function handleToggle(obj) {
    await base44.entities.ObjectType.update(obj.id, { is_active: !obj.is_active });
    await loadData();
  }

  async function handleDelete(obj) {
    const ok = window.confirm(`Удалить "${obj.name}"?`);
    if (!ok) return;
    await base44.entities.ObjectType.delete(obj.id);
    await loadData();
  }

  const isAdmin = user?.role === "admin" || user?.role === "manager";

  if (isLoading) return <div className="p-6"><LoadingSpinner /></div>;

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Настройки</h1>

      {/* Типы объектов */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Типы объектов</h2>
            <p className="text-xs text-[#9E9E9E] mt-0.5">Виды работ при добавлении записи</p>
          </div>
          {isAdmin && (
            <button
              onClick={function() { setIsAdding(!isAdding); }}
              className="flex items-center gap-1.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              <Plus size={13} />
              Добавить
            </button>
          )}
        </div>

        {/* Форма добавления */}
        {isAdding && (
          <form onSubmit={handleAdd} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Название</label>
              <input
                type="text"
                value={newName}
                onChange={function(e) { setNewName(e.target.value); }}
                placeholder="Например: Монтаж"
                required
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-2 block">Цвет</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map(function(color) {
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={function() { setNewColor(color); }}
                      className={`w-7 h-7 rounded-full transition-all ${newColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A]" : ""}`}
                      style={{ background: color }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={function() { setIsAdding(false); }}
                className="flex-1 py-2 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm hover:border-[#555] transition-all"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2 rounded-lg bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-50 transition-all"
              >
                {isSaving ? "Сохранение..." : "Добавить"}
              </button>
            </div>
          </form>
        )}

        {/* Список объектов */}
        {objectTypes.length === 0 ? (
          <EmptyState
            icon={<SettingsIcon size={20} />}
            title="Нет типов объектов"
            description='Добавьте типы работ нажав "Добавить"'
          />
        ) : (
          <div className="space-y-2">
            {objectTypes.map(function(obj) {
              return (
                <div
                  key={obj.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    obj.is_active ? "bg-[#0A0A0A] border-[#2A2A2A]" : "bg-[#0A0A0A] border-[#1A1A1A] opacity-50"
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: obj.color || "#9E9E9E" }}
                  />
                  <span className="flex-1 text-sm text-white">{obj.name}</span>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={function() { handleToggle(obj); }}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all ${
                          obj.is_active
                            ? "text-[#388E3C] bg-[#388E3C]/10"
                            : "text-[#9E9E9E] bg-[#9E9E9E]/10"
                        }`}
                      >
                        {obj.is_active ? "Активен" : "Скрыт"}
                      </button>
                      <button
                        onClick={function() { handleDelete(obj); }}
                        className="p-1.5 text-[#9E9E9E] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Подсказка */}
      {!isAdmin && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
          <p className="text-xs text-[#9E9E9E]">Управление настройками доступно только руководителям</p>
        </div>
      )}
    </div>
  );
}