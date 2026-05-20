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
import { BenefitForm } from "@/components/forms/benefit-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { benefitsApi } from "@/lib/api";
import type {
  Benefit,
  CreateBenefitData,
  UpdateBenefitData,
} from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

export default function BenefitsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const isEmployee = role === "EMPLOYEE";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | undefined>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState<Benefit | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["benefits", isEmployee ? user?.FUNCIONARIO_ID : "all"],
    queryFn: () =>
      isEmployee && user?.FUNCIONARIO_ID
        ? benefitsApi.getEmployee(user.FUNCIONARIO_ID)
        : benefitsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBenefitData) => benefitsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      setIsFormOpen(false);
      toast.success("Benefício criado com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao criar benefício");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBenefitData }) =>
      benefitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      setIsFormOpen(false);
      setSelectedBenefit(undefined);
      toast.success("Benefício atualizado com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao atualizar benefício");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => benefitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      setIsDeleteOpen(false);
      setBenefitToDelete(null);
      toast.success("Benefício removido com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao remover benefício");
    },
  });

  const handleSubmit = async (
    formData: CreateBenefitData | UpdateBenefitData,
  ) => {
    try {
      if (selectedBenefit) {
        await updateMutation.mutateAsync({
          id: selectedBenefit.ID,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData as CreateBenefitData);
      }
    } catch {
      // tratado pelo onError da mutation
    }
  };

  const openCreateForm = () => {
    setSelectedBenefit(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (benefit: Benefit) => {
    setBenefitToDelete(benefit);
    setIsDeleteOpen(true);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
  };

  const columns: ColumnDef<Benefit>[] = [
    {
      accessorKey: "FUNCIONARIO",
      header: "Funcionário",
      meta: { exportValue: (row) => row.FUNCIONARIO?.NOME ?? "" },
      cell: ({ row }) => row.original.FUNCIONARIO?.NOME || "—",
    },
    {
      accessorKey: "TIPO",
      header: "Tipo",
      filterFn: "equals",
      cell: ({ row }) => <StatusBadge status={row.original.TIPO} />,
    },
    {
      accessorKey: "VALOR",
      header: "Valor",
      cell: ({ row }) => formatCurrency(row.original.VALOR),
    },
    {
      accessorKey: "DATA_INICIO",
      header: "Início",
      cell: ({ row }) => formatDate(row.original.DATA_INICIO),
    },
    {
      accessorKey: "DATA_FIM",
      header: "Fim",
      cell: ({ row }) => formatDate(row.original.DATA_FIM),
    },
    {
      accessorKey: "STATUS_BENEFICIO",
      header: "Status",
      filterFn: "equals",
      cell: ({ row }) => <StatusBadge status={row.original.STATUS_BENEFICIO} />,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const benefit = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditForm(benefit)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(benefit)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const visibleColumns = isEmployee
    ? columns.filter((col) => col.id !== "actions")
    : columns;

  const benefits = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Benefícios"
        description="Gerencie os benefícios dos funcionários"
      >
        {!isEmployee && (
          <Button onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Benefício
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <DataTable
          columns={visibleColumns}
          data={benefits}
          searchKey="FUNCIONARIO"
          searchPlaceholder="Buscar por funcionário..."
          filters={[
            {
              column: "TIPO",
              placeholder: "Tipo",
              options: [
                { label: "Vale Transporte", value: "VALE_TRANSPORTE" },
                { label: "Vale Refeição", value: "VALE_REFEICAO" },
                { label: "Plano de Saúde", value: "PLANO_SAUDE" },
                { label: "Outros", value: "OUTROS" },
              ],
            },
            {
              column: "STATUS_BENEFICIO",
              placeholder: "Status",
              options: [
                { label: "Ativo", value: "ATIVO" },
                { label: "Inativo", value: "INATIVO" },
              ],
            },
          ]}
        />
      )}

      <FormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={selectedBenefit ? "Editar Benefício" : "Novo Benefício"}
        description={
          selectedBenefit
            ? "Atualize os dados do benefício"
            : "Preencha os dados do novo benefício"
        }
      >
        <BenefitForm
          benefit={selectedBenefit}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onCancel={() => setIsFormOpen(false)}
          role={role ?? undefined}
          employeeId={user?.FUNCIONARIO_ID}
        />
      </FormModal>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Remover Benefício"
        description={`Tem certeza que deseja remover o benefício de "${benefitToDelete?.FUNCIONARIO?.NOME}"? Esta ação não pode ser desfeita.`}
        onConfirm={() =>
          benefitToDelete && deleteMutation.mutate(benefitToDelete.ID)
        }
        isLoading={deleteMutation.isPending}
        confirmText="Remover"
      />
    </div>
  );
}
