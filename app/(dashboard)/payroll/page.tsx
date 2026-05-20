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
import { PayrollForm } from "@/components/forms/payroll-form";
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
  DollarSign,
  FileDown,
} from "lucide-react";
import { payrollApi } from "@/lib/api";
import type {
  Payroll,
  CreatePayrollData,
  UpdatePayrollData,
} from "@/lib/types";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const formatCurrency = (value: string) =>
  parseFloat(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | undefined>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<Payroll | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payrollToPay, setPayrollToPay] = useState<Payroll | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["payroll"],
    queryFn: () => payrollApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePayrollData) => payrollApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      setIsFormOpen(false);
      toast.success("Folha de pagamento criada com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao criar folha de pagamento");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePayrollData }) =>
      payrollApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      setIsFormOpen(false);
      setSelectedPayroll(undefined);
      toast.success("Folha de pagamento atualizada com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao atualizar folha de pagamento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => payrollApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      setIsDeleteOpen(false);
      setPayrollToDelete(null);
      toast.success("Folha de pagamento excluída com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao excluir folha de pagamento");
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => payrollApi.pay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      setIsPayOpen(false);
      setPayrollToPay(null);
      toast.success("Folha marcada como paga com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Erro ao marcar folha como paga");
    },
  });

  const handleSubmit = async (
    formData: CreatePayrollData | UpdatePayrollData,
  ) => {
    try {
      if (selectedPayroll) {
        await updateMutation.mutateAsync({
          id: selectedPayroll.ID,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData as CreatePayrollData);
      }
    } catch {
      // tratado pelo onError da mutation
    }
  };

  const openCreateForm = () => {
    setSelectedPayroll(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (payroll: Payroll) => {
    setPayrollToDelete(payroll);
    setIsDeleteOpen(true);
  };

  const openPayDialog = (payroll: Payroll) => {
    setPayrollToPay(payroll);
    setIsPayOpen(true);
  };

  const handleSlip = async (id: string) => {
    try {
      await payrollApi.slip(id);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message ?? "Erro ao gerar holerite");
    }
  };

  const columns: ColumnDef<Payroll>[] = [
    {
      accessorKey: "FUNCIONARIO",
      header: "Funcionário",
      meta: {
        exportValue: (row) =>
          `${row.FUNCIONARIO.NOME} (${row.FUNCIONARIO.MATRICULA})`,
      },
      cell: ({ row }) =>
        `${row.original.FUNCIONARIO.NOME} (${row.original.FUNCIONARIO.MATRICULA})`,
    },
    {
      accessorKey: "MES_REFERENCIA",
      header: "Período",
      meta: {
        exportValue: (row) =>
          `${MESES[row.MES_REFERENCIA - 1]}/${row.ANO_REFERENCIA}`,
      },
      cell: ({ row }) =>
        `${MESES[row.original.MES_REFERENCIA - 1]}/${row.original.ANO_REFERENCIA}`,
    },
    {
      accessorKey: "SALARIO_BASE",
      header: "Salário Base",
      meta: { exportValue: (row) => formatCurrency(row.SALARIO_BASE) },
      cell: ({ row }) => formatCurrency(row.original.SALARIO_BASE),
    },
    {
      accessorKey: "SALARIO_LIQUIDO",
      header: "Salário Líquido",
      meta: { exportValue: (row) => formatCurrency(row.SALARIO_LIQUIDO) },
      cell: ({ row }) => formatCurrency(row.original.SALARIO_LIQUIDO),
    },
    {
      accessorKey: "STATUS_FOLHA",
      header: "Status",
      filterFn: "equals",
      cell: ({ row }) => <StatusBadge status={row.original.STATUS_FOLHA} />,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const payroll = row.original;
        const isPago = payroll.STATUS_FOLHA === "PAGO";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isPago && (
                <DropdownMenuItem onClick={() => openEditForm(payroll)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {!isPago && (
                <DropdownMenuItem
                  onClick={() => openPayDialog(payroll)}
                  className="text-green-600"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Marcar como Paga
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleSlip(payroll.ID)}>
                <FileDown className="mr-2 h-4 w-4" />
                Holerite
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(payroll)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const payrolls = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Folha de Pagamento"
        description="Gerencie a folha de pagamento dos funcionários"
      >
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Folha
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={payrolls}
          exportFilename="folha-de-pagamento"
          searchKey="FUNCIONARIO"
          searchPlaceholder="Buscar por funcionário..."
          filters={[
            {
              column: "STATUS_FOLHA",
              placeholder: "Status",
              options: [
                { label: "Pendente", value: "PENDENTE" },
                { label: "Processado", value: "PROCESSADO" },
                { label: "Pago", value: "PAGO" },
              ],
            },
          ]}
        />
      )}

      <FormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={selectedPayroll ? "Editar Folha" : "Nova Folha de Pagamento"}
        description={
          selectedPayroll
            ? "Atualize os dados da folha de pagamento"
            : "Preencha os dados da nova folha de pagamento"
        }
      >
        <PayrollForm
          payroll={selectedPayroll}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onCancel={() => setIsFormOpen(false)}
        />
      </FormModal>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Excluir Folha de Pagamento"
        description={`Tem certeza que deseja excluir a folha de "${payrollToDelete?.FUNCIONARIO.NOME}"? Esta ação não pode ser desfeita.`}
        onConfirm={() =>
          payrollToDelete && deleteMutation.mutate(payrollToDelete.ID)
        }
        isLoading={deleteMutation.isPending}
        confirmText="Excluir"
      />

      <ConfirmDialog
        open={isPayOpen}
        onOpenChange={setIsPayOpen}
        title="Marcar como Paga"
        description={`Tem certeza que deseja marcar a folha de "${payrollToPay?.FUNCIONARIO.NOME}" como paga? Esta ação é irreversível.`}
        onConfirm={() => payrollToPay && payMutation.mutate(payrollToPay.ID)}
        isLoading={payMutation.isPending}
        confirmText="Confirmar Pagamento"
        variant="default"
      />
    </div>
  );
}
