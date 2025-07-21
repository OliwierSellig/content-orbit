import React from "react";

interface SettingsCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, children }) => {
  return (
    <div className="relative overflow-hidden bg-neutral-800/30 backdrop-blur-sm border border-neutral-700/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-neutral-600/50">
      {/* Subtle accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-50 hover:opacity-75 transition-opacity"></div>

      <div className="space-y-3 mb-8">
        <h2 className="text-xl font-semibold leading-tight text-neutral-100">{title}</h2>
        <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};
