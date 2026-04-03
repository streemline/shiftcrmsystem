import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Plus, Trash2 } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

const UNITS = ["шт", "кг", "м", "л", "упак", "рулон", "м²", "м³"];
const CATEGORIES = ["Инструменты", "Крепёж", "Кабель/Провод", "Трубы", "Изоляция", "Расходники", "Другое"];

const MATERIAL_NAMES = [
  "Deska Lameno Bila",
  "Deska Lameno Cerna",
  "Deska Lameno Grafit",
  "DTD (Drevotriska)",
  "MDF 10",
  "MDF 12",
  "MDF 14",
  "MDF 16",
  "MDF 20",
  "MDF 25",
  "MDF 30",
  "KVH",
  "Prkno",
  "Grana papier bila",
  "Grana papier czerna",
  "Grana plast bila 20 mm",
  "Grana plast bila 40 mm",
  "Grana plast czerna 20 mm",
  "Grana plast czerna 40 mm",
  "Barva PrimaLex bila",
  "Barva PrimaLex Slonova kosc",
  "Barva Dulux Slonova kosc",
];

const EMPTY_FORM = {
  name: MATERIAL_NAMES[0],
  category: "Расходники",
  quantity: "",
  unit: "шт",
  unit_price: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function Materials() {
  const [user, setUser] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(function() {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    const list = await base44.entities.Material.list("-date", 200);
    setMaterials(list);
    setIsLoading(false);
  }

  function setFormField(field, value) {
    setForm(function(prev) { return { ...prev, [field]: value }; });
  }

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);

    const qty = parseFloat(form.quantity) || 0;
    const price = parseFloat(form.unit_price) || 0;

    await base44.entities.Material.create({
      name:          form.name,
      category:      form.category,
      quantity:      qty,
      unit:          form.unit,
      unit_price:    price,
      total_cost:    Math.round(qty * price * 100) / 100,
      date:          form.date,
      employee_id:   user.email,
      employee_name: user.full_name,
      notes:         form.notes,
    });

    toast.success("Материал добавлен");
    setForm(EMPTY_FORM);
    setShowForm(false);
    await loadData();
    setIsSaving(false);
  }

  async function handleDelete(id) {
    setDeletingId(id);
    await base44.entities.Material.delete(id);
    toast.success("Удалено");
    await loadData();
    setDeletingId(null);
  }

  const totalCost = materials.reduce(function(sum, m) { return sum + (m.total_cost || 0); }, 0);

  if (isLoading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">Материалы</h1>
        <button
          onClick={function() { setShowForm(!showForm); }}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Plus size={16} />
          Добавить
        </button>
      </div>

      {/* Итого */}
      <div className="bg-[#1A1A1A] border border-[#388E3C]/30 rounded-xl p-4 mb-5">
        <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1">Итого расходов</p>
        <p className="text-2xl font-bold text-[#388E3C]">{Math.round(totalCost).toLocaleString("cs")} Kč</p>
        <p className="text-xs text-[#555]">{materials.length} записей</p>
      </div>

      {/* Форма добавления */}
      {showForm && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 mb-5">
          <h2 className="text-base font-semibold text-white mb-4">Новый материал</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Название</label>
              <select
                value={form.name}
                onChange={function(e) { setFormField("name", e.target.value); }}
                required
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
              >
                {MATERIAL_NAMES.map(function(n) {
                  return <option key={n} value={n}>{n}</option>;
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Категория</label>
                <select
                  value={form.category}
                  onChange={function(e) { setFormField("category", e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                >
                  {CATEGORIES.map(function(c) {
                    return <option key={c} value={c}>{c}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Дата</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={function(e) { setFormField("date", e.target.value); }}
                  required
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Кол-во</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={function(e) { setFormField("quantity", e.target.value); }}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Ед.</label>
                <select
                  value={form.unit}
                  onChange={function(e) { setFormField("unit", e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                >
                  {UNITS.map(function(u) {
                    return <option key={u} value={u}>{u}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Цена Kč</label>
                <input
                  type="number"
                  value={form.unit_price}
                  onChange={function(e) { setFormField("unit_price", e.target.value); }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#388E3C] transition-colors"
                />
              </div>
            </div>

            {form.quantity && form.unit_price && (
              <div className="bg-[#0A0A0A] border border-[#388E3C]/30 rounded-lg px-3 py-2">
                <p className="text-xs text-[#9E9E9E]">Итого</p>
                <p className="text-base font-bold text-[#388E3C]">
                  {Math.round(parseFloat(form.quantity || 0) * parseFloat(form.unit_price || 0)).toLocaleString("cs")} Kč
                </p>
              </div>
            )}

            <div>
              <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Заметки</label>
              <textarea
                value={form.notes}
                onChange={function(e) { setFormField("notes", e.target.value); }}
                rows={2}
                placeholder="Необязательно"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors resize-none placeholder-[#555]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={function() { setShowForm(false); }}
                className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium hover:border-[#555] transition-all"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-lg bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-50 transition-all"
              >
                {isSaving ? "Сохранение..." : "Добавить"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список материалов */}
      {materials.length === 0 ? (
        <EmptyState
          icon={<Package size={24} />}
          title="Материалов нет"
          description="Добавьте первую запись о расходных материалах"
        />
      ) : (
        <div className="space-y-2">
          {materials.map(function(m) {
            return (
              <div key={m.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white">{m.name}</p>
                    {m.category && (
                      <span className="text-xs text-[#555] bg-[#2A2A2A] px-1.5 py-0.5 rounded">{m.category}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#9E9E9E]">
                    {m.quantity} {m.unit}
                    {m.unit_price ? ` × ${m.unit_price} Kč` : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {m.total_cost > 0 && (
                      <span className="text-sm font-bold text-[#388E3C]">{Math.round(m.total_cost).toLocaleString("cs")} Kč</span>
                    )}
                    <span className="text-xs text-[#555]">{m.date}</span>
                    {m.employee_name && (
                      <span className="text-xs text-[#555]">{m.employee_name}</span>
                    )}
                  </div>
                  {m.notes && (
                    <p className="text-xs text-[#555] mt-1 break-words whitespace-normal">{m.notes}</p>
                  )}
                </div>
                <button
                  onClick={function() { handleDelete(m.id); }}
                  disabled={deletingId === m.id}
                  className="p-2 text-[#9E9E9E] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}