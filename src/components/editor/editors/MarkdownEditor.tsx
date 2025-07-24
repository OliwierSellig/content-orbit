import React from "react";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-white mb-4">Treść artykułu</h3>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Napisz treść artykułu w formacie Markdown..."
        disabled={disabled || isLoading}
        className="w-full h-[1400px] px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm disabled:opacity-50"
      />
    </>
  );
};
