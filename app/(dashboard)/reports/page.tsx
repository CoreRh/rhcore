"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useReportData } from "@/hooks/use-report-data";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportsPage() {
  const { hasAppPermission, isLoading: authLoading } = useAuth();
  const canView = !authLoading && hasAppPermission("VIEW_REPORTS");
  const router = useRouter();
  const {
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
  } = useReportData({ enabled: canView });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !hasAppPermission("VIEW_REPORTS")) router.push("/");
  }, [authLoading, hasAppPermission, router]);

  if (authLoading) {
    return (
      <div>
        <PageHeader
          title="Relatórios"
          description="Visão analítica dos dados do Sistema"
        />
        <div className="grid gap-4 mt-4">
          {["kpi", "chart-1", "chart-2"].map((id) => (
            <Skeleton key={id} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!canView) return null;

  if (hasError) {
    return (
      <div>
        <PageHeader
          title="Relatórios"
          description="Visão analítica dos dados do Sistema"
        />
        <p className="text-sm text-destructive mt-4">
          Erro ao carregar os dados. Tente novamente mais tarde.
        </p>
        <button
          onClick={() => queryClient.invalidateQueries()}
          className="mt-2 text-sm underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Visão analítica dos dados do sistema"
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24 mt-1" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Funcionários Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeEmployees}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {inactiveEmployees} inativos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Férias no período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vacations.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingVacations} pendentes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Solicitações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingRequests} pendentes
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Férias por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : vacationsByStatus.every((s) => s.total === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Sem dados no período
              </p>
            ) : (
              <div
                role="img"
                aria-label={`Gráfico de férias por status: ${vacationsByStatus.map((s) => `${s.name} ${s.total}`).join(", ")}`}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={vacationsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {vacationsByStatus.map((entry, i) => (
                        <Cell
                          key={`vac-${entry.name}`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitações por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : requestsByType.every((r) => r.total === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Sem dados no período
              </p>
            ) : (
              <div
                role="img"
                aria-label={`Gráfico de solicitações por tipo: ${requestsByType.map((s) => `${s.name} ${s.total}`).join(", ")}`}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={requestsByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {requestsByType.map((entry, i) => (
                        <Cell
                          key={`req-${entry.name}`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionários por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : employeesByDept.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Sem dados no período
            </p>
          ) : (
            <div
              role="img"
              aria-label={`Gráfico de funcionários por departamento: ${employeesByDept.map((d) => `${d.fullName} ${d.total}`).join(", ")}`}
            >
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, employeesByDept.length * 40)}
              >
                <BarChart data={employeesByDept} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Funcionários"]}
                    labelFormatter={(label) =>
                      employeesByDept.find((d) => d.name === label)?.fullName ??
                      label
                    }
                  />
                  <Bar dataKey="total" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
