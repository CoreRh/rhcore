"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { FormModal } from "@/components/form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { VacationForm } from "@/components/forms/vacation-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { vacationsApi } from "@/lib/api";
import {
  type Vacation,
  type CreateVacationData,
  type UpdateVacationData,
  type VacationStatus,
  VACATION_STATUS,
  VACATION_STATUS_LABELS,
} from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

type DialogState = {
  type: "delete" | "approve" | "reject";
  vacation: Vacation;
} | null;
export default function VacationsPage() {
  const { user, role, hasAppPermission } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<
    Vacation | undefined
  >();
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vacations"],
    queryFn: () => vacationsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVacationData) => vacationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacations"] });
      setIsFormOpen(false);
      toast.success("Férias registradas com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao registrar férias");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVacationData }) =>
      vacationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacations"] });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao atualizar férias");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vacationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacations"] });
      setDialog(null);
      toast.success("Férias excluídas com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao excluir férias");
    },
  });

  const handleSubmit = async (
    formData: CreateVacationData | UpdateVacationData,
  ) => {
    try {
      if (selectedVacation) {
        await updateMutation.mutateAsync(
          { id: selectedVacation.ID, data: formData as UpdateVacationData },
          {
            onSuccess: () => {
              setIsFormOpen(false);
              setSelectedVacation(undefined);
              toast.success("Férias atualizadas com sucesso!");
            },
          },
        );
      } else {
        await createMutation.mutateAsync(formData as CreateVacationData);
      }
    } catch {
      // tratado pelo onError da mutation
    }
  };

  const openCreateForm = () => {
    setSelectedVacation(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (vacation: Vacation) => {
    setSelectedVacation(vacation);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (vacation: Vacation) =>
    setDialog({ type: "delete", vacation });

  const openApproveDialog = (vacation: Vacation) =>
    setDialog({ type: "approve", vacation });

  const openRejectDialog = (vacation: Vacation) =>
    setDialog({ type: "reject", vacation });

  const columns: ColumnDef<Vacation>[] = [
    {
      accessorKey: "FUNCIONARIO",
      header: "Funcionário",
      meta: { exportValue: (row) => row.FUNCIONARIO?.NOME ?? "" },
      cell: ({ row }) => row.original.FUNCIONARIO?.NOME || "-",
    },
    {
      accessorKey: "DATA_INICIO",
      header: "Data Início",
      cell: ({ row }) =>
        new Date(row.original.DATA_INICIO + "T00:00:00").toLocaleDateString(
          "pt-BR",
        ),
    },
    {
      accessorKey: "DATA_FIM",
      header: "Data Fim",
      cell: ({ row }) =>
        new Date(row.original.DATA_FIM + "T00:00:00").toLocaleDateString(
          "pt-BR",
        ),
    },
    {
      accessorKey: "DIAS_SOLICITADOS",
      header: "Dias",
    },
    {
      accessorKey: "STATUS_FERIAS",
      header: "Status",
      filterFn: "equals",
      cell: ({ row }) => <StatusBadge status={row.original.STATUS_FERIAS} />,
    },
    {
      accessorKey: "APROVADO_POR",
      header: "Aprovado Por",
      cell: ({ row }) => row.original.APROVADO_POR?.NOME_USUARIO || "-",
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const vacation = row.original;
        const isOwnVacation = vacation.FUNCIONARIO_ID === user?.FUNCIONARIO_ID;
        const canApprove =
          hasAppPermission("APPROVE_VACATIONS") && !isOwnVacation;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                data-testid={`edit-vacation-${vacation.ID}`}
                onClick={() => openEditForm(vacation)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid={`delete-vacation-${vacation.ID}`}
                onClick={() => openDeleteDialog(vacation)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
              {canApprove && (
                <DropdownMenuItem
                  data-testid={`approve-vacation-${vacation.ID}`}
                  onClick={() => openApproveDialog(vacation)}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar
                </DropdownMenuItem>
              )}
              {canApprove && (
                <DropdownMenuItem
                  data-testid={`reject-vacation-${vacation.ID}`}
                  onClick={() => openRejectDialog(vacation)}
                  className="text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  const visibleColumns = columns;

  const vacations = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Férias"
        description="Gerencie as solicitações de férias dos funcionários"
      >
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Solicitação
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Erro ao carregar férias. Tente novamente.
        </p>
      ) : (
        <DataTable
          columns={visibleColumns}
          data={vacations}
          exportFilename="ferias"
          searchKey="FUNCIONARIO"
          searchPlaceholder="Buscar por funcionário..."
          filters={[
            {
              column: "STATUS_FERIAS",
              placeholder: "Status",
              options: VACATION_STATUS.map((s) => ({
                label: VACATION_STATUS_LABELS[s],
                value: s,
              })),
            },
          ]}
        />
      )}

      <FormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={
          selectedVacation ? "Editar Férias" : "Nova Solicitação de Férias"
        }
        description={
          selectedVacation
            ? "Atualize os dados das férias"
            : "Preencha os dados da solicitação"
        }
      >
        <VacationForm
          vacation={selectedVacation}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onCancel={() => setIsFormOpen(false)}
          role={role ?? undefined}
          employeeId={user?.FUNCIONARIO_ID}
        />
      </FormModal>

      <ConfirmDialog
        open={dialog?.type === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Excluir Férias"
        description={`Tem certeza que deseja excluir esta solicitação de férias de "${dialog?.vacation?.FUNCIONARIO?.NOME}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => dialog && deleteMutation.mutate(dialog.vacation.ID)}
        isLoading={deleteMutation.isPending}
        confirmText="Excluir"
      />

      <ConfirmDialog
        open={dialog?.type === "approve"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Aprovar Férias"
        description={`Tem certeza que deseja aprovar esta solicitação de férias de "${dialog?.vacation?.FUNCIONARIO?.NOME}"?`}
        onConfirm={() =>
          dialog &&
          updateMutation.mutate(
            {
              id: dialog.vacation.ID,
              data: {
                STATUS_FERIAS: "APROVADO",
                DATA_APROVACAO: new Date().toISOString(),
                APROVADO_POR_ID: user?.ID,
              },
            },
            {
              onSuccess: () => {
                setDialog(null);
                toast.success("Férias aprovadas com sucesso!");
              },
            },
          )
        }
        isLoading={updateMutation.isPending}
        confirmText="Aprovar"
        variant="default"
      />
      <ConfirmDialog
        open={dialog?.type === "reject"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Rejeitar Férias"
        description={`Tem certeza que deseja rejeitar esta solicitação de férias de "${dialog?.vacation?.FUNCIONARIO?.NOME}"?`}
        onConfirm={() =>
          dialog &&
          updateMutation.mutate(
            {
              id: dialog.vacation.ID,
              data: { STATUS_FERIAS: "REJEITADO", APROVADO_POR_ID: user?.ID },
            },
            {
              onSuccess: () => {
                setDialog(null);
                toast.success("Férias rejeitadas.");
              },
            },
          )
        }
        isLoading={updateMutation.isPending}
        confirmText="Rejeitar"
      />
    </div>
  );
}
