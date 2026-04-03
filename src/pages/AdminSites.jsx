import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  radius_meters: 200,
  is_active: true,
  color: "#D32F2F",
};

export default function AdminSites() {
  const [currentUser, setCurrentUser] = useState(null);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);

  useEffect(function() { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    const me = await base44.auth.me();
    setCurrentUser(me);
    if (me.role === "admin" || me.role === "manager") {
      const data = await base44.entities.WorkSite.list("name", 100);
      setSites(data);
    }
    setIsLoading(false);
  }

  function openCreate() {
    setEditingSite(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(site) {
    setEditingSite(site);
    setForm({
      name: site.name || "",
      address: site.address || "",
      latitude: site.latitude || "",
      longitude: site.longitude || "",
      radius_meters: site.radius_meters || 200,
      is_active: site.is_active !== false,
      color: site.color || "#D32F2F",
    });
    setShowForm(true);
  }

  function setField(key, value) {
    setForm(function(prev) { return { ...prev, [key]: value }; });
  }

  function getCurrentGps() {
    if (!navigator.geolocation) {
      toast.error("GPS не поддерживается");
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        setForm(function(prev) {
          return {
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          };
        });
        setGettingGps(false);
        toast.success("Координаты получены");
      },
      function() {
        toast.error("Не удалось получить GPS");
        setGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    const data = {
      name: form.name,
      address: form.address,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      radius_meters: Number(form.radius_meters),
      is_active: form.is_active,
      color: form.color,
    };
    if (editingSite) {
      await base44.entities.WorkSite.update(editingSite.id, data);
      toast.success("Площадка обновлена");
    } else {
      await base44.entities.WorkSite.create(data);
      toast.success("Площадка создана");
    }
    setShowForm(false);
    await loadData();
    setIsSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Удалить площадку?")) return;
    await base44.entities.WorkSite.delete(id);
    toast.success("Площадка удалена");
    await loadData();
  }

  async function toggleActive(site) {
    await base44.entities.WorkSite.update(site.id, { is_active: !site.is_active });
    await loadData();
  }

  if (isLoading) return <div className="p-6"><LoadingSpinner /></div>;

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "manager";
  if (!isAdmin) {
    return (
      <div className="p-6">
        <EmptyState icon={<MapPin size={24} />} title="Нет доступа" description="Только для администраторов" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Рабочие площадки</h1>
          <p className="text-xs text-[#555] mt-1">GPS-зоны для контроля присутствия</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Plus size={15} />
          Добавить
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 mb-5">
          <h2 className="text-base font-semibold text-white mb-4">
            {editingSite ? "Редактировать площадку" : "Новая площадка"}
          </h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Название</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={function(e) { setField("name", e.target.value); }}
                placeholder="Tursko, O2 Arena..."
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
              />
            </div>

            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Адрес</label>
              <input
                type="text"
                value={form.address}
                onChange={function(e) { setField("address", e.target.value); }}
                placeholder="Улица, город"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Широта</label>
                <input
                  required
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={function(e) { setField("latitude", e.target.value); }}
                  placeholder="50.075538"
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                />
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Долгота</label>
                <input
                  required
                  type="number"
                  step="0.000001"
                  value={form.longitude}
                  onChange={function(e) { setField("longitude", e.target.value); }}
                  placeholder="14.437800"
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={getCurrentGps}
              disabled={gettingGps}
              className="text-xs text-[#D32F2F] hover:text-white flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              <MapPin size={12} />
              {gettingGps ? "Получаю координаты..." : "Использовать моё текущее местоположение"}
            </button>

            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">
                Радиус (метры)
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                value={form.radius_meters}
                onChange={function(e) { setField("radius_meters", e.target.value); }}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={function() { setShowForm(false); }}
                className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium transition-all"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-lg bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-50 transition-all"
              >
                {isSaving ? "Сохранение..." : (editingSite ? "Обновить" : "Создать")}
              </button>
            </div>
          </form>
        </div>
      )}

      {sites.length === 0 ? (
        <EmptyState icon={<MapPin size={24} />} title="Площадок нет" description="Добавьте первую рабочую площадку" />
      ) : (
        <div className="space-y-3">
          {sites.map(function(site) {
            return (
              <div key={site.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: site.color || "#D32F2F" }}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-white">{site.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          site.is_active
                            ? "text-[#388E3C] bg-[#388E3C]/10"
                            : "text-[#555] bg-[#2A2A2A]"
                        }`}>
                          {site.is_active ? "Активна" : "Отключена"}
                        </span>
                      </div>
                      {site.address && (
                        <p className="text-xs text-[#9E9E9E]">{site.address}</p>
                      )}
                      <p className="text-xs text-[#555] mt-0.5">
                        {site.latitude}, {site.longitude} · радиус {site.radius_meters || 200} м
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={function() { toggleActive(site); }}
                      className="p-1.5 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all"
                      title={site.is_active ? "Отключить" : "Включить"}
                    >
                      {site.is_active ? <ToggleRight size={16} className="text-[#388E3C]" /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={function() { openEdit(site); }}
                      className="p-1.5 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={function() { handleDelete(site.id); }}
                      className="p-1.5 text-[#9E9E9E] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-all"
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