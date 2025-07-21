import React from "react";
import { useOptionsData } from "../hooks/useOptionsData";
import { OptionsGrid } from "../options/OptionsGrid";
import { CrudFormModal } from "../shared/CrudFormModal";
import type {
  CreateAiPreferenceCommand,
  UpdateAiPreferenceCommand,
  CreateCustomAuditCommand,
  UpdateCustomAuditCommand,
} from "../../types";

export const OptionsView: React.FC = () => {
  const {
    profile,
    aiPreferences,
    customAudits,
    isLoading,
    error,
    modalState,
    loadingStates,
    updateProfile,
    createItem,
    updateItem,
    deleteItem,
    openCreateModal,
    openEditModal,
    closeModal,
  } = useOptionsData();

  // Wyświetl wskaźnik ładowania
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie ustawień...</p>
        </div>
      </div>
    );
  }

  // Wyświetl błąd
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-destructive mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none transition-all duration-200"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-900">
      <div className="container mx-auto py-12 px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-white bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
            Opcje
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Zarządzaj globalnymi ustawieniami aplikacji, preferencjami AI i niestandardowymi audytami.
          </p>
        </div>

        <OptionsGrid
          profile={profile}
          aiPreferences={aiPreferences}
          customAudits={customAudits}
          loadingStates={loadingStates}
          onUpdateProfile={updateProfile}
          onCreateItem={openCreateModal}
          onEditItem={openEditModal}
          onDeleteItem={deleteItem}
        />

        <CrudFormModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          type={modalState.type}
          item={modalState.data}
          isSubmitting={loadingStates.itemCreate || loadingStates.itemUpdate !== null}
          onClose={closeModal}
          onSave={async (data) => {
            if (modalState.mode === "create" && modalState.type) {
              await createItem(modalState.type, data as CreateAiPreferenceCommand | CreateCustomAuditCommand);
            } else if (modalState.mode === "edit" && modalState.type && modalState.data) {
              await updateItem(
                modalState.type,
                modalState.data.id,
                data as UpdateAiPreferenceCommand | UpdateCustomAuditCommand
              );
            }
            closeModal();
          }}
        />
      </div>
    </div>
  );
};
