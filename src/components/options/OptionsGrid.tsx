import React from "react";
import type { ProfileDto, AiPreferenceDto, CustomAuditDto, UpdateProfileCommand } from "../../types";
import { SettingsCard } from "./SettingsCard";
import { GenerationSettingsForm } from "./GenerationSettingsForm";
import { CrudList } from "../shared/CrudList";

type ItemType = AiPreferenceDto | CustomAuditDto;

interface LoadingStates {
  profileUpdate: boolean;
  itemCreate: boolean;
  itemUpdate: string | null;
  itemDelete: string | null;
}

interface OptionsGridProps {
  profile: ProfileDto | null;
  aiPreferences: AiPreferenceDto[];
  customAudits: CustomAuditDto[];
  loadingStates: LoadingStates;
  onUpdateProfile: (data: UpdateProfileCommand) => Promise<void>;
  onCreateItem: (type: "aiPreference" | "customAudit") => void;
  onEditItem: (type: "aiPreference" | "customAudit", item: ItemType) => void;
  onDeleteItem: (type: "aiPreference" | "customAudit", id: string) => Promise<void>;
}

export const OptionsGrid: React.FC<OptionsGridProps> = ({
  profile,
  aiPreferences,
  customAudits,
  loadingStates,
  onUpdateProfile,
  onCreateItem,
  onEditItem,
  onDeleteItem,
}) => {
  return (
    <div className="space-y-8">
      {/* Karta 1: Ustawienia generowania */}
      <SettingsCard
        title="Ustawienia generowania"
        description="Skonfiguruj domyślne wartości dla generowania treści AI"
      >
        {profile && (
          <GenerationSettingsForm
            initialData={profile}
            isSubmitting={loadingStates.profileUpdate}
            onSave={onUpdateProfile}
          />
        )}
      </SettingsCard>

      {/* Karta 2: Preferencje AI */}
      <SettingsCard title="Preferencje AI" description="Zarządzaj swoimi preferencjami stylu AI">
        <CrudList
          items={aiPreferences}
          isCreating={loadingStates.itemCreate}
          updatingItemId={loadingStates.itemUpdate}
          deletingItemId={loadingStates.itemDelete}
          onCreate={() => onCreateItem("aiPreference")}
          onEdit={(item) => onEditItem("aiPreference", item)}
          onDelete={(id) => onDeleteItem("aiPreference", id)}
          emptyMessage="Brak preferencji AI"
          createButtonText="Dodaj preferencję"
        />
      </SettingsCard>

      {/* Karta 3: Niestandardowe audyty */}
      <SettingsCard title="Niestandardowe audyty" description="Twórz własne audyty do analizy treści">
        <CrudList
          items={customAudits}
          isCreating={loadingStates.itemCreate}
          updatingItemId={loadingStates.itemUpdate}
          deletingItemId={loadingStates.itemDelete}
          onCreate={() => onCreateItem("customAudit")}
          onEdit={(item) => onEditItem("customAudit", item)}
          onDelete={(id) => onDeleteItem("customAudit", id)}
          emptyMessage="Brak niestandardowych audytów"
          createButtonText="Dodaj audyt"
        />
      </SettingsCard>
    </div>
  );
};
