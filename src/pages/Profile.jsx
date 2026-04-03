import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, Phone, MapPin, Mail, Briefcase, LogOut, Globe } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { LANGUAGES, getCurrentLanguage, setLanguage, useTranslation } from "../lib/i18n";

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  useEffect(function() {
    loadUser();
  }, []);

  async function loadUser() {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    setPhone(currentUser.phone || "");
    setAddress(currentUser.address || "");
    setBirthYear(currentUser.birth_year ? String(currentUser.birth_year) : "");
    setFirstName(currentUser.first_name || "");
    setLastName(currentUser.last_name || "");
    setIsLoading(false);
  }

  async function handleSave() {
    setIsSaving(true);
    await base44.auth.updateMe({
      phone,
      address,
      birth_year: birthYear ? parseInt(birthYear, 10) : null,
      first_name: firstName,
      last_name: lastName,
    });
    await loadUser();
    setIsEditing(false);
    setIsSaving(false);
  }

  function handleLogout() {
    base44.auth.logout();
  }

  function handleLangChange(code) {
    setLanguage(code);
    setCurrentLang(code);
  }

  const ROLE_LABELS = {
    admin:    "Администратор",
    manager:  "Руководитель",
    employee: "Сотрудник",
  };

  if (isLoading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">{t("profile")}</h1>

      {/* Аватар и имя */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 mb-4 flex flex-col items-center text-center">
        <div className="relative mb-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#2A2A2A]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#D32F2F]/20 border-2 border-[#D32F2F]/30 flex items-center justify-center">
              <User size={32} className="text-[#D32F2F]" />
            </div>
          )}
        </div>
        <h2 className="text-lg font-bold text-white">{user?.full_name}</h2>
        <p className="text-sm text-[#9E9E9E]">{user?.email}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/20">
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
          {user?.position && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#2A2A2A] text-[#9E9E9E]">
              {user.position}
            </span>
          )}
        </div>
      </div>

      {/* Почасовая ставка — только для чтения */}
      {user?.hourly_rate && (
        <div className="bg-[#1A1A1A] border border-[#388E3C]/30 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#9E9E9E] uppercase tracking-wider">{t("rate")}</p>
            <p className="text-xl font-bold text-[#388E3C] mt-0.5">{user.hourly_rate} €/ч</p>
          </div>
          <p className="text-xs text-[#555]">Устанавливается руководством</p>
        </div>
      )}

      {/* Контактные данные */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">{t("management") /* not exact match, let's use profile keys if available or generic */}</h3>
          {!isEditing && (
            <button
              onClick={function() { setIsEditing(true); }}
              className="text-xs text-[#D32F2F] hover:text-[#B71C1C] font-medium"
            >
              {t("edit")}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Имя</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={function(e) { setFirstName(e.target.value); }}
                  placeholder="Иван"
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Фамилия</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={function(e) { setLastName(e.target.value); }}
                  placeholder="Новак"
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Телефон</label>
              <input
                type="tel"
                value={phone}
                onChange={function(e) { setPhone(e.target.value); }}
                placeholder="+420 000 000 000"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Адрес</label>
              <input
                type="text"
                value={address}
                onChange={function(e) { setAddress(e.target.value); }}
                placeholder="Улица, город"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1.5 block">Год рождения</label>
              <input
                type="number"
                value={birthYear}
                onChange={function(e) { setBirthYear(e.target.value); }}
                placeholder="1990"
                min="1950"
                max="2005"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={function() { setIsEditing(false); }}
                className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium hover:border-[#555] transition-all"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-lg bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-50 transition-all"
              >
                {isSaving ? t("loading") : t("save")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <InfoRow icon={<Mail size={14} />} label="Email" value={user?.email} />
            <InfoRow icon={<Phone size={14} />} label="Телефон" value={user?.phone || "—"} />
            <InfoRow icon={<MapPin size={14} />} label="Адрес" value={user?.address || "—"} />
            <InfoRow icon={<Briefcase size={14} />} label="Год рождения" value={user?.birth_year ? String(user.birth_year) : "—"} />
          </div>
        )}
      </div>

      {/* Язык интерфейса */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={14} className="text-[#9E9E9E]" />
          <h3 className="text-sm font-semibold text-white">{t("language")}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(function(lang) {
            var isActive = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={function() { handleLangChange(lang.code); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#D32F2F] border-[#D32F2F] text-white"
                    : "bg-[#0A0A0A] border-[#2A2A2A] text-[#9E9E9E] hover:border-[#555] hover:text-white"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Выход */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl border border-[#D32F2F]/30 text-[#D32F2F] text-sm font-semibold hover:bg-[#D32F2F]/10 transition-all flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        {t("logout")}
      </button>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#9E9E9E] flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#555]">{label}</p>
        <p className="text-sm text-white truncate">{value}</p>
      </div>
    </div>
  );
}