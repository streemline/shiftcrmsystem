import React from "react";

/**
 * Заглушка когда данных нет.
 * @param {React.ReactNode} icon
 * @param {string} title
 * @param {string} description
 * @param {React.ReactNode} action
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
      {icon && (
        <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#9E9E9E] mb-2">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-white">{title}</p>
      {description && (
        <p className="text-sm text-[#9E9E9E] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}