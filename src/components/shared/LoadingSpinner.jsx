import React from "react";

export default function LoadingSpinner({ text = "Загрузка..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#D32F2F] rounded-full animate-spin" />
      <p className="text-sm text-[#9E9E9E]">{text}</p>
    </div>
  );
}