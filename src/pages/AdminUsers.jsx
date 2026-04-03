import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, Search, Pencil, Check, X, UserPlus, Trash2,
  Mail, Download, ChevronLeft, ChevronRight, Clock, DollarSign, TrendingUp
} from "lucide-react";
import EmployeeModal from "../components/admin/EmployeeModal";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

const ROLE_LABELS = {
  admin:    "Администратор",
  manager:  "Руководитель",
  employee: "Сотрудник",
};

const ROLE_COLORS = {
  admin:    "text-[#D32F2F] bg-[#D32F2F]/20 border-[#D32F2F]/30",
  manager:  "text-blue-400 bg-blue-400/20 border-blue-400/30",
  employee: "text-[#9E9E9E] bg-[#9E9E9E]/20 border-[#9E9E9E]/30",
};

const PAGE_SIZE = 8;

export default function AdminUsers() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [workRecords, setWorkRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editRate, setEditRate] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [isInviting, setIsInviting] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

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

    const [allUsers, allRecords] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.WorkRecord.list("-date", 2000),
    ]);

    setUsers(allUsers);
    setWorkRecords(allRecords);
    setIsLoading(false);
  }

  // --- Stats helpers ---

  function getTotalHoursForUser(email) {
    let total = 0;
    for (const r of workRecords) {
      if (r.employee_id === email) {
        total += r.duration_hours || 0;
      }
    }
    return Math.round(total * 10) / 10;
  }

  function getSalaryFundForUser(email) {
    let total = 0;
    for (const r of workRecords) {
      if (r.employee_id === email) {
        total += r.earnings || 0;
      }
    }
    return Math.round(total);
  }

  function isActiveThisMonth(email) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return workRecords.some(function(r) {
      return r.employee_id === email && r.date?.startsWith(yearMonth);
    });
  }

  // --- Top KPI cards ---

  const totalUsersCount = users.length;
  const activeThisMonthCount = users.filter(function(u) { return isActiveThisMonth(u.email); }).length;

  let allHours = 0;
  let salaryFund = 0;
  for (const r of workRecords) {
    allHours += r.duration_hours || 0;
    salaryFund += r.earnings || 0;
  }

  // --- Filtering ---

  function getFilteredUsers() {
    const query = searchQuery.toLowerCase().trim();
    return users.filter(function(u) {
      const matchesSearch =
        !query ||
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.position?.toLowerCase().includes(query);

      const matchesRole = filterRole === "all" || u.role === filterRole;

      return matchesSearch && matchesRole;
    });
  }

  const filteredUsers = getFilteredUsers();
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearchChange(value) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleRoleFilterChange(role) {
    setFilterRole(role);
    setCurrentPage(1);
  }

  // --- Editing ---

  function startEditing(user) {
    setEditingUserId(user.id);
    setEditRate(user.hourly_rate ? String(user.hourly_rate) : "");
    setEditRole(user.role || "employee");
    setEditPosition(user.position || "");
  }

  function cancelEditing() {
    setEditingUserId(null);
  }

  async function saveUser(userId) {
    setIsSaving(true);
    await base44.entities.User.update(userId, {
      hourly_rate: editRate ? parseFloat(editRate) : null,
      role: editRole,
      position: editPosition,
    });
    toast.success("Данные обновлены");
    setEditingUserId(null);
    await loadData();
    setIsSaving(false);
  }

  async function handleDeleteUser(userId) {
    setIsDeleting(userId);
    await base44.entities.User.delete(userId);
    toast.success("Сотрудник удалён");
    setDeleteConfirmId(null);
    await loadData();
    setIsDeleting(null);
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    toast.success(`Приглашение отправлено на ${inviteEmail}`);
    setInviteEmail("");
    setInviteRole("employee");
    setShowInviteForm(false);
    setIsInviting(false);
  }

  function exportCSV() {
    const rows = [["Имя", "Email", "Роль", "Должность", "Ставка €/ч", "Часов", "Фонд €"]];
    for (const u of users) {
      rows.push([
        u.full_name || "",
        u.email || "",
        ROLE_LABELS[u.role] || u.role || "",
        u.position || "",
        u.hourly_rate || 0,
        getTotalHoursForUser(u.email),
        getSalaryFundForUser(u.email),
      ]);
    }
    const csv = rows.map(function(row) {
      return row.map(function(cell) { return `"${String(cell).replace(/"/g, '""')}"`; }).join(";");
    }).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  if (currentUser?.role !== "admin" && currentUser?.role !== "manager") {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Users size={24} />}
          title="Нет доступа"
          description="Эта страница только для администраторов и руководителей"
        />
      </div>
    );
  }

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-6xl mx-auto">

      {/* Модальное окно сотрудника */}
      {selectedEmployee && (
        <EmployeeModal
          user={selectedEmployee}
          onClose={function() { setSelectedEmployee(null); }}
          onEdit={function(u) {
            setSelectedEmployee(null);
            startEditing(u);
          }}
        />
      )}

      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Управление сотрудниками</h1>
            <span className="text-xs font-semibold text-[#388E3C] bg-[#388E3C]/10 border border-[#388E3C]/20 px-2 py-0.5 rounded-full">
              {totalUsersCount} активных
            </span>
          </div>
          <p className="text-xs text-[#555] mt-1">Профили, роли, права доступа и статистика команды</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium hover:border-[#555] hover:text-white transition-all"
          >
            <Download size={15} />
            Экспорт
          </button>
          <button
            onClick={function() { setShowInviteForm(!showInviteForm); }}
            className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          >
            <UserPlus size={15} />
            Добавить сотрудника
          </button>
        </div>
      </div>

      {/* Форма приглашения */}
      {showInviteForm && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={15} className="text-[#D32F2F]" />
            <h2 className="text-sm font-semibold text-white">Пригласить сотрудника</h2>
          </div>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={function(e) { setInviteEmail(e.target.value); }}
              required
              placeholder="email@company.com"
              className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
            />
            <select
              value={inviteRole}
              onChange={function(e) { setInviteRole(e.target.value); }}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
            >
              <option value="employee">Сотрудник</option>
              <option value="manager">Руководитель</option>
              {isAdmin && <option value="admin">Администратор</option>}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={function() { setShowInviteForm(false); }}
                className="px-4 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium hover:border-[#555] transition-all"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isInviting}
                className="px-4 py-2.5 rounded-lg bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-50 transition-all"
              >
                {isInviting ? "Отправка..." : "Пригласить"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI карточки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#D32F2F]/10 flex items-center justify-center">
              <Users size={15} className="text-[#D32F2F]" />
            </div>
            <span className="text-xs text-[#388E3C] font-medium">+2 за месяц</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalUsersCount}</p>
          <p className="text-xs text-[#555] mt-0.5">Всего сотрудников</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#388E3C]/10 flex items-center justify-center">
              <TrendingUp size={15} className="text-[#388E3C]" />
            </div>
            <span className="text-xs text-[#388E3C] font-medium">
              {totalUsersCount > 0 ? Math.round((activeThisMonthCount / totalUsersCount) * 100) : 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{activeThisMonthCount}</p>
          <p className="text-xs text-[#555] mt-0.5">Активны сегодня</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <Clock size={15} className="text-blue-400" />
            </div>
            <span className="text-xs text-[#F57C00] font-medium">Этот месяц</span>
          </div>
          <p className="text-2xl font-bold text-white">{Math.round(allHours).toLocaleString()}</p>
          <p className="text-xs text-[#555] mt-0.5">Часов отработано</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#9E9E9E]/10 flex items-center justify-center">
              <DollarSign size={15} className="text-[#9E9E9E]" />
            </div>
            <span className="text-xs text-[#9E9E9E] font-medium">€</span>
          </div>
          <p className="text-2xl font-bold text-white">{Math.round(salaryFund).toLocaleString("cs")}</p>
          <p className="text-xs text-[#555] mt-0.5">Фонд зарплаты (Kč)</p>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={function(e) { handleSearchChange(e.target.value); }}
            placeholder="Поиск по имени, email, должности..."
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#D32F2F] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {["all", "admin", "manager", "employee"].map(function(role) {
            const isActive = filterRole === role;
            const label = role === "all" ? "Все роли" : (ROLE_LABELS[role] || role);
            return (
              <button
                key={role}
                onClick={function() { handleRoleFilterChange(role); }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#D32F2F] border-[#D32F2F] text-white"
                    : "bg-[#1A1A1A] border-[#2A2A2A] text-[#9E9E9E] hover:text-white hover:border-[#555]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Таблица — desktop */}
      <div className="hidden md:block bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden mb-4">
        {/* Заголовок таблицы */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[#2A2A2A]">
          <span className="text-xs font-semibold text-[#555] uppercase tracking-wider">Сотрудник</span>
          <span className="text-xs font-semibold text-[#555] uppercase tracking-wider">Роль</span>
          <span className="text-xs font-semibold text-[#555] uppercase tracking-wider">Статус</span>
          <span className="text-xs font-semibold text-[#555] uppercase tracking-wider">Часов/Мес</span>
          <span className="text-xs font-semibold text-[#555] uppercase tracking-wider">Действия</span>
        </div>

        {/* Строки */}
        {pagedUsers.map(function(user) {
          const isEditing = editingUserId === user.id;
          const isConfirmDelete = deleteConfirmId === user.id;
          const isSelf = user.id === currentUser?.id;
          const userHours = getTotalHoursForUser(user.email);
          const userFund = getSalaryFundForUser(user.email);
          const active = isActiveThisMonth(user.email);
          const roleColorClass = ROLE_COLORS[user.role] || ROLE_COLORS.employee;

          return (
            <div key={user.id}>
              <div
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 border-b border-[#2A2A2A] hover:bg-[#111] transition-colors items-center cursor-pointer"
                onClick={function(e) {
                  if (e.target.closest("button") || e.target.closest("select") || e.target.closest("input")) return;
                  setSelectedEmployee(user);
                }}
              >
                {/* Сотрудник */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#D32F2F]/10 border border-[#D32F2F]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#D32F2F]">
                      {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                    <p className="text-xs text-[#555] truncate">{user.email}</p>
                  </div>
                </div>

                {/* Роль */}
                <div>
                  {isEditing ? (
                    <select
                      value={editRole}
                      onChange={function(e) { setEditRole(e.target.value); }}
                      className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#D32F2F] transition-colors w-full"
                    >
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Руководитель</option>
                      <option value="admin">Администратор</option>
                    </select>
                  ) : (
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg border ${roleColorClass}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  )}
                </div>

                {/* Статус */}
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? "bg-[#388E3C]" : "bg-[#555]"}`} />
                  <span className={`text-xs ${active ? "text-[#388E3C]" : "text-[#555]"}`}>
                    {active ? "Активен" : "Неактивен"}
                  </span>
                </div>

                {/* Часов/Мес */}
                <div>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editRate}
                      onChange={function(e) { setEditRate(e.target.value); }}
                      placeholder="Ставка €/ч"
                      step="0.5"
                      min="0"
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#388E3C] transition-colors"
                    />
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-white">{userHours}</p>
                      <p className="text-xs text-[#555]">
                        {user.hourly_rate
                          ? `${Math.round(user.hourly_rate * userHours).toLocaleString("cs")} Kč`
                          : "ставка не задана"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Действия */}
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={function() { saveUser(user.id); }}
                        disabled={isSaving}
                        className="p-1.5 text-[#388E3C] hover:bg-[#388E3C]/10 rounded-lg transition-all disabled:opacity-50"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1.5 text-[#9E9E9E] hover:bg-[#2A2A2A] rounded-lg transition-all"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={function() { startEditing(user); }}
                        className="p-1.5 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all"
                        title="Редактировать"
                      >
                        <Pencil size={14} />
                      </button>
                      {isAdmin && !isSelf && (
                        <button
                          onClick={function() { setDeleteConfirmId(isConfirmDelete ? null : user.id); }}
                          className="p-1.5 text-[#9E9E9E] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-all"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Строка редактирования позиции */}
              {isEditing && (
                <div className="px-5 pb-3 bg-[#111] border-b border-[#2A2A2A]">
                  <input
                    type="text"
                    value={editPosition}
                    onChange={function(e) { setEditPosition(e.target.value); }}
                    placeholder="Должность"
                    className="w-64 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#D32F2F] transition-colors"
                  />
                </div>
              )}

              {/* Подтверждение удаления */}
              {isConfirmDelete && (
                <div className="px-5 py-3 bg-[#D32F2F]/5 border-b border-[#D32F2F]/20 flex items-center justify-between">
                  <p className="text-xs text-white">Удалить {user.full_name}?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={function() { setDeleteConfirmId(null); }}
                      className="px-3 py-1.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-xs transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={function() { handleDeleteUser(user.id); }}
                      disabled={isDeleting === user.id}
                      className="px-3 py-1.5 rounded-lg bg-[#D32F2F] text-white text-xs font-semibold disabled:opacity-50 transition-all"
                    >
                      {isDeleting === user.id ? "Удаление..." : "Удалить"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {pagedUsers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-[#555]">Сотрудников не найдено</p>
          </div>
        )}
      </div>

      {/* Карточки — mobile */}
      <div className="md:hidden space-y-3 mb-4">
        {pagedUsers.map(function(user) {
          const isEditing = editingUserId === user.id;
          const isSelf = user.id === currentUser?.id;
          const isConfirmDelete = deleteConfirmId === user.id;
          const userHours = getTotalHoursForUser(user.email);
          const active = isActiveThisMonth(user.email);
          const roleColorClass = ROLE_COLORS[user.role] || ROLE_COLORS.employee;

          return (
            <div
              key={user.id}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4"
            >
              <div
                className="flex items-start justify-between mb-3 cursor-pointer"
                onClick={function(e) {
                  if (e.target.closest("button")) return;
                  setSelectedEmployee(user);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D32F2F]/10 border border-[#D32F2F]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#D32F2F]">
                      {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user.full_name}</p>
                    <p className="text-xs text-[#555]">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${roleColorClass}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${active ? "text-[#388E3C]" : "text-[#555]"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#388E3C]" : "bg-[#555]"}`} />
                        {active ? "Активен" : "Неактивен"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={function() { startEditing(user); }}
                        className="p-2 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      {isAdmin && !isSelf && (
                        <button
                          onClick={function() { setDeleteConfirmId(isConfirmDelete ? null : user.id); }}
                          className="p-2 text-[#9E9E9E] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button onClick={function() { saveUser(user.id); }} disabled={isSaving} className="p-2 text-[#388E3C] hover:bg-[#388E3C]/10 rounded-lg disabled:opacity-50">
                        <Check size={14} />
                      </button>
                      <button onClick={cancelEditing} className="p-2 text-[#9E9E9E] hover:bg-[#2A2A2A] rounded-lg">
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isConfirmDelete && (
                <div className="mb-3 p-3 bg-[#D32F2F]/10 border border-[#D32F2F]/30 rounded-lg">
                  <p className="text-xs text-white mb-2">Удалить {user.full_name}?</p>
                  <div className="flex gap-2">
                    <button onClick={function() { setDeleteConfirmId(null); }} className="flex-1 py-1.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-xs">Отмена</button>
                    <button onClick={function() { handleDeleteUser(user.id); }} disabled={isDeleting === user.id} className="flex-1 py-1.5 rounded-lg bg-[#D32F2F] text-white text-xs font-semibold disabled:opacity-50">
                      {isDeleting === user.id ? "..." : "Удалить"}
                    </button>
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-2 pt-2 border-t border-[#2A2A2A]">
                  <input type="text" value={editPosition} onChange={function(e) { setEditPosition(e.target.value); }} placeholder="Должность" className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={editRate} onChange={function(e) { setEditRate(e.target.value); }} placeholder="Ставка €/ч" step="0.5" min="0" className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#388E3C]" />
                    <select value={editRole} onChange={function(e) { setEditRole(e.target.value); }} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]">
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Руководитель</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 pt-2 border-t border-[#2A2A2A]">
                  <div>
                    <p className="text-xs text-[#555]">Часов</p>
                    <p className="text-sm font-bold text-white">{userHours}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#555]">Ставка</p>
                    <p className={`text-sm font-bold ${user.hourly_rate ? "text-[#388E3C]" : "text-[#555]"}`}>
                      {user.hourly_rate ? `${user.hourly_rate} Kč/ч` : "Не задана"}
                    </p>
                  </div>
                  {user.position && (
                    <div>
                      <p className="text-xs text-[#555]">Должность</p>
                      <p className="text-sm text-white">{user.position}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Пагинация */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#555]">
          Показано {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredUsers.length)}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} из {filteredUsers.length} сотрудников
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={function() { setCurrentPage(Math.max(1, currentPage - 1)); }}
            disabled={currentPage === 1}
            className="p-1.5 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, function(_, i) { return i + 1; }).map(function(page) {
            return (
              <button
                key={page}
                onClick={function() { setCurrentPage(page); }}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                  currentPage === page
                    ? "bg-[#D32F2F] text-white"
                    : "text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A]"
                }`}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={function() { setCurrentPage(Math.min(totalPages, currentPage + 1)); }}
            disabled={currentPage === totalPages}
            className="p-1.5 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg disabled:opacity-30 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}