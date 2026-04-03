import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * Вычисляет расстояние между двумя точками по формуле Haversine.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} расстояние в метрах
 */
function calcDistanceMeters(lat1, lon1, lat2, lon2) {
  var R = 6371000; // радиус Земли в метрах
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLon = ((lon2 - lon1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Компонент GPS-проверки нахождения сотрудника на рабочей площадке.
 * @param {function} onResult - callback(isOnSite: bool, siteName: string|null)
 * @param {boolean} autoCheck - автоматически проверить при монтировании
 */
export default function GpsCheckIn({ onResult, autoCheck }) {
  const [status, setStatus] = useState("idle"); // idle | checking | on_site | off_site | error
  const [nearestSite, setNearestSite] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [sites, setSites] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(function() {
    base44.entities.WorkSite.filter({ is_active: true }, "name", 50)
      .then(function(data) { setSites(data); })
      .catch(function() {});
  }, []);

  useEffect(function() {
    if (autoCheck && sites.length > 0) {
      checkLocation();
    }
  }, [autoCheck, sites]);

  function checkLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("GPS не поддерживается браузером");
      return;
    }

    if (sites.length === 0) {
      setStatus("error");
      setErrorMsg("Нет настроенных рабочих площадок");
      return;
    }

    setStatus("checking");

    navigator.geolocation.getCurrentPosition(
      function(position) {
        var userLat = position.coords.latitude;
        var userLon = position.coords.longitude;

        // Находим ближайшую площадку
        var closestSite = null;
        var closestDistance = Infinity;

        for (var i = 0; i < sites.length; i++) {
          var site = sites[i];
          var dist = calcDistanceMeters(userLat, userLon, site.latitude, site.longitude);
          if (dist < closestDistance) {
            closestDistance = dist;
            closestSite = site;
          }
        }

        var radius = closestSite?.radius_meters || 200;
        var isOnSite = closestDistance <= radius;

        setNearestSite(closestSite);
        setDistanceMeters(Math.round(closestDistance));
        setStatus(isOnSite ? "on_site" : "off_site");

        if (typeof onResult === "function") {
          onResult(isOnSite, isOnSite ? closestSite?.name : null);
        }
      },
      function(err) {
        setStatus("error");
        var msg = "Ошибка GPS";
        if (err.code === 1) msg = "Доступ к геолокации запрещён";
        else if (err.code === 2) msg = "Местоположение недоступно";
        else if (err.code === 3) msg = "Истекло время ожидания GPS";
        setErrorMsg(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={15} className="text-[#D32F2F]" />
        <span className="text-sm font-semibold text-white">GPS-проверка</span>
      </div>

      {status === "idle" && (
        <button
          onClick={checkLocation}
          disabled={sites.length === 0}
          className="w-full py-2.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium hover:border-[#D32F2F] hover:text-white transition-all disabled:opacity-40"
        >
          {sites.length === 0 ? "Нет площадок" : "Проверить местоположение"}
        </button>
      )}

      {status === "checking" && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={16} className="text-[#9E9E9E] animate-spin" />
          <span className="text-sm text-[#9E9E9E]">Определение местоположения...</span>
        </div>
      )}

      {status === "on_site" && (
        <div className="flex items-start gap-3">
          <CheckCircle size={20} className="text-[#388E3C] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#388E3C]">Вы на объекте</p>
            <p className="text-xs text-[#9E9E9E] mt-0.5">{nearestSite?.name}</p>
            <p className="text-xs text-[#555]">{distanceMeters} м от центра площадки</p>
          </div>
          <button onClick={checkLocation} className="ml-auto text-xs text-[#555] hover:text-white transition-colors">
            Обновить
          </button>
        </div>
      )}

      {status === "off_site" && (
        <div className="flex items-start gap-3">
          <XCircle size={20} className="text-[#D32F2F] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#D32F2F]">Вы не на объекте</p>
            <p className="text-xs text-[#9E9E9E] mt-0.5">
              Ближайший: {nearestSite?.name}
            </p>
            <p className="text-xs text-[#555]">{distanceMeters} м ({nearestSite?.radius_meters || 200} м допустимо)</p>
          </div>
          <button onClick={checkLocation} className="ml-auto text-xs text-[#555] hover:text-white transition-colors">
            Обновить
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3">
          <XCircle size={20} className="text-[#F57C00] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#F57C00]">{errorMsg}</p>
            <button onClick={checkLocation} className="text-xs text-[#D32F2F] hover:text-white mt-1 transition-colors">
              Попробовать снова
            </button>
          </div>
        </div>
      )}
    </div>
  );
}