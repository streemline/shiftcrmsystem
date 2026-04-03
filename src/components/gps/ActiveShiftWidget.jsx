import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Play, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import GpsCheckIn from "./GpsCheckIn";
import { calculateDurationHours, calculateEarnings } from "../utils/timeUtils";

export default function ActiveShiftWidget({ user, onRecordChange }) {
  const [activeRecord, setActiveRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Состояние GPS
  const [gpsValid, setGpsValid] = useState(false);
  const [currentSiteName, setCurrentSiteName] = useState(null);

  // Текущее время (для таймера)
  const [nowStr, setNowStr] = useState(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));

  useEffect(function() {
    loadActiveShift();
    const interval = setInterval(function() {
      setNowStr(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    }, 10000);
    return function() { clearInterval(interval); };
  }, [user]);

  async function loadActiveShift() {
    if (!user) return;
    setIsLoading(true);
    const today = new Date().toISOString().split("T")[0];
    
    try {
      const records = await base44.entities.WorkRecord.filter({ employee_id: user.email }, "-date", 10);
      const todayRecords = records.filter(function(r) { return r.date === today && r.day_type === "Working"; });
      
      // Ищем запись, где есть начало, но нет конца
      const active = todayRecords.find(function(r) { return r.start_time && !r.end_time; });
      setActiveRecord(active || null);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  }

  function handleGpsResult(isOnSite, siteName) {
    setGpsValid(isOnSite);
    setCurrentSiteName(siteName);
  }

  async function handleStartShift() {
    if (!gpsValid) {
      toast.error("Нельзя начать смену: вы не на объекте");
      return;
    }

    setIsProcessing(true);
    const today = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
    
    const recordData = {
      employee_id: user.email,
      employee_name: user.full_name,
      date: today,
      day_type: "Working",
      object_type: currentSiteName || "Производство",
      start_time: currentTime,
      end_time: null, // null означает, что смена активна
      duration_hours: 0,
      earnings: 0,
      hourly_rate_snapshot: user.hourly_rate || 0,
      notes: "Запущено по GPS",
    };

    try {
      const newRec = await base44.entities.WorkRecord.create(recordData);
      setActiveRecord(newRec);
      toast.success("Смена начата!");
      if (onRecordChange) onRecordChange();
    } catch (e) {
      toast.error("Ошибка при старте смены");
    }
    setIsProcessing(false);
  }

  async function handleEndShift() {
    if (!activeRecord) return;
    
    setIsProcessing(true);
    const currentTime = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
    
    const duration = calculateDurationHours(activeRecord.start_time, currentTime);
    const earnings = calculateEarnings(duration, activeRecord.hourly_rate_snapshot || 0);

    const updateData = {
      end_time: currentTime,
      duration_hours: duration,
      earnings: earnings,
    };

    try {
      await base44.entities.WorkRecord.update(activeRecord.id, updateData);
      setActiveRecord(null);
      toast.success("Смена завершена");
      if (onRecordChange) onRecordChange();
    } catch (e) {
      toast.error("Ошибка при завершении смены");
    }
    setIsProcessing(false);
  }

  if (isLoading) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-6 flex justify-center items-center h-[120px]">
        <Loader2 size={24} className="text-[#D32F2F] animate-spin" />
      </div>
    );
  }

  // Если смена уже активна (начата, но не завершена)
  if (activeRecord) {
    const elapsed = calculateDurationHours(activeRecord.start_time, nowStr);
    
    return (
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#111] border border-[#388E3C]/30 rounded-xl p-5 mb-6 relative overflow-hidden shadow-[0_0_15px_rgba(56,142,60,0.1)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#388E3C]"></div>
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#388E3C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#388E3C]"></span>
              </span>
              <h2 className="text-sm font-semibold text-white">Смена активна</h2>
            </div>
            <p className="text-xs text-[#9E9E9E]">Объект: {activeRecord.object_type}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#9E9E9E] mb-0.5">Начало</p>
            <p className="text-lg font-bold text-white leading-none">{activeRecord.start_time}</p>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-[#9E9E9E] uppercase tracking-wider mb-1">Текущее время работы</p>
            <p className="text-2xl font-bold text-[#388E3C] leading-none">{elapsed} <span className="text-sm font-normal text-[#9E9E9E]">ч</span></p>
          </div>
          
          <button
            onClick={handleEndShift}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-[#1A1A1A] border border-[#388E3C] hover:bg-[#388E3C]/10 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} className="text-[#388E3C] fill-[#388E3C]" />}
            Завершить смену
          </button>
        </div>
      </div>
    );
  }

  // Если смены нет - требуем GPS check-in
  return (
    <div className="mb-6 space-y-3">
      <GpsCheckIn onResult={handleGpsResult} autoCheck={true} />
      
      <button
        onClick={handleStartShift}
        disabled={!gpsValid || isProcessing}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
          gpsValid 
            ? "bg-[#D32F2F] text-white hover:bg-[#B71C1C] shadow-[0_4px_15px_rgba(211,47,47,0.3)]" 
            : "bg-[#1A1A1A] border border-[#2A2A2A] text-[#555] cursor-not-allowed"
        }`}
      >
        {isProcessing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Play size={18} className={gpsValid ? "fill-white" : ""} />
        )}
        {gpsValid ? "Начать смену" : "Ожидание GPS..."}
      </button>
    </div>
  );
}
