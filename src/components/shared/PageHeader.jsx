import React from "react";

/**
 * Стандартный заголовок страницы.
 * @param {string} title
 * @param {string} subtitle
 * @param {React.ReactNode} action - кнопка или другой элемент справа
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[#9E9E9E] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}