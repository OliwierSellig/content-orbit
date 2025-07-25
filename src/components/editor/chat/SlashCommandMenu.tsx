import React, { useState, useEffect, useRef } from "react";
import { Search, FileText } from "lucide-react";
import type { CustomAuditDto } from "../../../types";

interface SlashCommandMenuProps {
  customAudits: CustomAuditDto[];
  isVisible: boolean;
  onSelectCommand: (prompt: string) => void;
  position: { top: number; left: number };
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  customAudits,
  isVisible,
  onSelectCommand,
  position,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter audits based on search term
  const filteredAudits = customAudits.filter(
    (audit) =>
      audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Focus search input when menu opens and reset state
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setSelectedIndex(0); // Reset selection
    }
    if (!isVisible) {
      setSearchTerm(""); // Reset search when menu closes
      setSelectedIndex(0);
    }
  }, [isVisible]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredAudits.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredAudits.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredAudits.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredAudits[selectedIndex]) {
          onSelectCommand(filteredAudits[selectedIndex].prompt);
          setSearchTerm("");
        }
        break;
    }
  };

  if (!isVisible) {
    return null;
  }

  // Calculate position higher above input
  const menuHeight = 320;
  const adjustedPosition = {
    top: position.top - menuHeight - 20, // Added extra 20px spacing
    left: position.left,
  };

  return (
    <div
      className="absolute z-50 bg-neutral-800/95 backdrop-blur-sm border border-neutral-600/40 rounded-lg shadow-2xl shadow-black/20 w-80 animate-in fade-in-0 slide-in-from-bottom-4 duration-200"
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left,
      }}
    >
      {/* Header with Search */}
      <div className="p-3 border-b border-neutral-700/40">
        <div className="text-sm font-medium text-white mb-3">Niestandardowe Audyty</div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Wyszukaj audyty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-8 pr-3 py-2 bg-neutral-700/60 border border-neutral-600/40 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 text-xs"
          />
        </div>
      </div>

      {/* Commands List */}
      <div className="p-2">
        {filteredAudits.length > 0 ? (
          <>
            <div className="text-xs text-neutral-500 mb-2 px-2">
              {filteredAudits.length} {filteredAudits.length === 1 ? "audyt" : "audytów"}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
              {filteredAudits.map((audit, index) => (
                <button
                  key={audit.id}
                  onClick={() => {
                    onSelectCommand(audit.prompt);
                    setSearchTerm("");
                  }}
                  className={`w-full text-left p-3 rounded-md transition-all duration-150 cursor-pointer ${
                    index === selectedIndex
                      ? "bg-violet-500/15 border border-violet-500/30"
                      : "hover:bg-neutral-700/40 border border-transparent"
                  } focus:outline-none`}
                >
                  <div className="flex items-start gap-3">
                    {/* Simple Icon */}
                    <div className="w-5 h-5 bg-neutral-700/60 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-3 h-3 text-neutral-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-xs truncate mb-1">{audit.title}</div>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {audit.prompt.length > 70 ? `${audit.prompt.substring(0, 70)}...` : audit.prompt}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : customAudits.length === 0 ? (
          <div className="text-center text-neutral-500 text-sm py-6">
            <FileText className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
            <p>Brak niestandardowych audytów</p>
          </div>
        ) : (
          <div className="text-center text-neutral-500 text-sm py-4">
            <Search className="w-5 h-5 text-neutral-600 mx-auto mb-2" />
            <p>Brak wyników dla "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
