import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  employeesApi,
  vacationsApi,
  requestsApi,
  departmentsApi,
} from "@/lib/api";

const VACATION_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  CANCELADO: "Cancelado",
};

const REQUEST_LABELS: Record<string, string> = {
  DOCUMENTO: "Documento",
  EQUIPAMENTO: "Equipamento",
  BENEFICIO: "Benefício",
  TREINAMENTO: "Treinamento",
  OUTROS: "Outros",
};

export function useReportData({ enabled = true }: { enabled?: boolean } = {}) {
  const {
    data: empData,
    isLoading: empLoading,
    isError: empError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeesApi.getAll(),
    staleTime: 60_000,
    enabled,
  });

  const {
    data: vacData,
    isLoading: vacLoading,
    isError: vacError,
  } = useQuery({
    queryKey: ["vacations"],
    queryFn: () => vacationsApi.getAll(),
    staleTime: 60_000,
    enabled,
  });

  const {
    data: reqData,
    isLoading: reqLoading,
    isError: reqError,
  } = useQuery({
    queryKey: ["requests"],
    queryFn: () => requestsApi.getAll(),
    staleTime: 60_000,
    enabled,
  });

  const {
    data: deptData,
    isLoading: deptLoading,
    isError: deptError,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentsApi.getAll(),
    staleTime: 60_000,
    enabled,
  });

  const isLoading = empLoading || vacLoading || reqLoading || deptLoading;
  const hasError = empError || vacError || reqError || deptError;

  const employees = empData?.data ?? [];
  const vacations = vacData?.data ?? [];
  const requests = reqData?.data ?? [];
  const departments = deptData?.data ?? [];

  const { activeEmployees, inactiveEmployees } = useMemo(
    () =>
      employees.reduce(
        (acc, e) => {
          if (e.STATUS === "ATIVO") acc.activeEmployees++;
          else if (e.STATUS === "INATIVO") acc.inactiveEmployees++;
          return acc;
        },
        { activeEmployees: 0, inactiveEmployees: 0 },
      ),
    [employees],
  );

  const vacationsByStatus = useMemo(
    () =>
      ["PENDENTE", "APROVADO", "REJEITADO", "CANCELADO"].map((s) => ({
        name: VACATION_LABELS[s],
        total: vacations.filter((v) => v.STATUS_FERIAS === s).length,
      })),
    [vacations],
  );

  const requestsByType = useMemo(
    () =>
      ["DOCUMENTO", "EQUIPAMENTO", "BENEFICIO", "TREINAMENTO", "OUTROS"].map(
        (t) => ({
          name: REQUEST_LABELS[t],
          total: requests.filter((r) => r.TIPO === t).length,
        }),
      ),
    [requests],
  );

  const employeesByDept = useMemo(
    () =>
      departments
        .filter((d) => d.STATUS === "ATIVO")
        .map((dept) => ({
          name: dept.SIGLA,
          fullName: dept.NOME,
          total: employees.filter(
            (e) => e.DEPARTAMENTO?.ID === dept.ID && e.STATUS === "ATIVO",
          ).length,
        }))
        .filter((d) => d.total > 0)
        .sort((a, b) => b.total - a.total),
    [departments, employees],
  );

  const pendingVacations = useMemo(
    () => vacations.filter((v) => v.STATUS_FERIAS === "PENDENTE").length,
    [vacations],
  );

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.STATUS === "PENDENTE").length,
    [requests],
  );

  return {
    isLoading,
    hasError,
    vacations,
    requests,
    activeEmployees,
    inactiveEmployees,
    vacationsByStatus,
    requestsByType,
    employeesByDept,
    pendingVacations,
    pendingRequests,
  };
}
