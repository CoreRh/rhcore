"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldMessage,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { employeesApi } from "@/lib/api";
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

const currentYear = new Date().getFullYear();
const ANOS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

function calcINSS(base: number): number {
  const faixas = [
    { ate: 1518.0, aliquota: 0.075 },
    { ate: 2793.88, aliquota: 0.09 },
    { ate: 4190.83, aliquota: 0.12 },
    { ate: 8157.41, aliquota: 0.14 },
  ];
  let inss = 0;
  let anterior = 0;
  for (const faixa of faixas) {
    if (base > faixa.ate) {
      inss += (faixa.ate - anterior) * faixa.aliquota;
      anterior = faixa.ate;
    } else {
      inss += (base - anterior) * faixa.aliquota;
      break;
    }
  }
  return Math.round(inss * 100) / 100;
}

function calcIRRF(base: number, inss: number, dependentes: number): number {
  const deducaoDependente = 189.59 * dependentes;
  const baseCalculo = base - inss - deducaoDependente;
  if (baseCalculo <= 2259.2) return 0;
  if (baseCalculo <= 2826.65)
    return Math.round((baseCalculo * 0.075 - 169.44) * 100) / 100;
  if (baseCalculo <= 3751.05)
    return Math.round((baseCalculo * 0.15 - 381.44) * 100) / 100;
  if (baseCalculo <= 4664.68)
    return Math.round((baseCalculo * 0.225 - 662.77) * 100) / 100;
  return Math.round((baseCalculo * 0.275 - 896.0) * 100) / 100;
}

function calcLiquido(
  base: number,
  bonus: number,
  inss: number,
  irrf: number,
  outros: number,
): number {
  return base + bonus - inss - irrf - outros;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const payrollSchema = z.object({
  FUNCIONARIO_ID: z.string().min(1, "Funcionário é obrigatório"),
  MES_REFERENCIA: z.coerce.number().min(1).max(12),
  ANO_REFERENCIA: z.coerce.number().min(2000),
  NUMERO_DEPENDENTES: z.coerce.number().min(0).default(0),
  SALARIO_BASE: z.coerce.number().positive("Salário base deve ser positivo"),
  BONUS: z.coerce.number().min(0).default(0),
  DESCONTO_INSS: z.coerce.number().min(0).default(0),
  DESCONTO_IRRF: z.coerce.number().min(0).default(0),
  OUTROS_DESCONTOS: z.coerce.number().min(0).default(0),
  VALOR_PASSAGEM: z.coerce.number().min(0).optional(),
  OBSERVACAO: z.string().max(500).optional(),
});

type PayrollFormData = z.infer<typeof payrollSchema>;

interface PayrollFormProps {
  payroll?: Payroll;
  onSubmit: (data: CreatePayrollData | UpdatePayrollData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function PayrollForm({
  payroll,
  onSubmit,
  isSubmitting,
  onCancel,
}: PayrollFormProps) {
  const [inssOverride, setInssOverride] = useState(false);
  const [irrfOverride, setIrrfOverride] = useState(false);
  const isFirstInssRender = useRef(true);
  const isFirstIrrfRender = useRef(true);

  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeesApi.getAll(),
  });

  const employees =
    employeesData?.data?.filter((e) => e.STATUS === "ATIVO") || [];

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      FUNCIONARIO_ID: payroll?.FUNCIONARIO_ID || "",
      MES_REFERENCIA: payroll?.MES_REFERENCIA || new Date().getMonth() + 1,
      ANO_REFERENCIA: payroll?.ANO_REFERENCIA || currentYear,
      NUMERO_DEPENDENTES: payroll?.NUMERO_DEPENDENTES ?? 0,
      SALARIO_BASE: payroll ? parseFloat(payroll.SALARIO_BASE) : 0,
      BONUS: payroll ? parseFloat(payroll.BONUS) : 0,
      DESCONTO_INSS: payroll ? parseFloat(payroll.DESCONTO_INSS) : 0,
      DESCONTO_IRRF: payroll ? parseFloat(payroll.DESCONTO_IRRF) : 0,
      OUTROS_DESCONTOS: payroll ? parseFloat(payroll.OUTROS_DESCONTOS) : 0,
      VALOR_PASSAGEM: 0,
      OBSERVACAO: payroll?.OBSERVACAO || "",
    },
  });

  const funcionarioId = useWatch({ control, name: "FUNCIONARIO_ID" });
  const mesReferencia = useWatch({ control, name: "MES_REFERENCIA" });
  const anoReferencia = useWatch({ control, name: "ANO_REFERENCIA" });
  const salarioBase = useWatch({ control, name: "SALARIO_BASE" });
  const numDependentes = useWatch({ control, name: "NUMERO_DEPENDENTES" });
  const bonus = useWatch({ control, name: "BONUS" });
  const descontoInss = useWatch({ control, name: "DESCONTO_INSS" });
  const descontoIrrf = useWatch({ control, name: "DESCONTO_IRRF" });
  const outrosDescontos = useWatch({ control, name: "OUTROS_DESCONTOS" });
  const valorPassagem = useWatch({ control, name: "VALOR_PASSAGEM" });

  useEffect(() => {
    if (isFirstInssRender.current) {
      isFirstInssRender.current = false;
      return;
    }
    if (inssOverride) return;

    setValue("DESCONTO_INSS", calcINSS(Number(salarioBase) || 0));
  }, [salarioBase, inssOverride, setValue]);

  useEffect(() => {
    if (isFirstIrrfRender.current) {
      isFirstIrrfRender.current = false;
      return;
    }
    if (irrfOverride) return;

    setValue(
      "DESCONTO_IRRF",
      calcIRRF(
        Number(salarioBase) || 0,
        Number(descontoInss) || 0,
        Number(numDependentes) || 0,
      ),
    );
  }, [salarioBase, descontoInss, numDependentes, irrfOverride, setValue]);

  const descontoVTPreview = Math.min(
    Number(valorPassagem) || 0,
    (Number(salarioBase) || 0) * 0.06,
  );

  const liquidoPreview =
    calcLiquido(
      Number(salarioBase) || 0,
      Number(bonus) || 0,
      Number(descontoInss) || 0,
      Number(descontoIrrf) || 0,
      Number(outrosDescontos) || 0,
    ) - descontoVTPreview;

  const handleFormSubmit = async (data: PayrollFormData) => {
    await onSubmit({
      FUNCIONARIO_ID: data.FUNCIONARIO_ID,
      MES_REFERENCIA: data.MES_REFERENCIA,
      ANO_REFERENCIA: data.ANO_REFERENCIA,
      NUMERO_DEPENDENTES: data.NUMERO_DEPENDENTES,
      SALARIO_BASE: data.SALARIO_BASE,
      BONUS: data.BONUS,
      DESCONTO_INSS: data.DESCONTO_INSS,
      DESCONTO_IRRF: data.DESCONTO_IRRF,
      OUTROS_DESCONTOS: data.OUTROS_DESCONTOS,
      VALOR_PASSAGEM: data.VALOR_PASSAGEM || undefined,
      OBSERVACAO: data.OBSERVACAO || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel>Funcionário *</FieldLabel>
          <Select
            value={funcionarioId}
            onValueChange={(value) => setValue("FUNCIONARIO_ID", value)}
            disabled={!!payroll}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um funcionário..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.ID} value={emp.ID}>
                  {emp.NOME} — {emp.MATRICULA}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.FUNCIONARIO_ID && (
            <FieldMessage variant="error">
              {errors.FUNCIONARIO_ID.message}
            </FieldMessage>
          )}
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel>Mês *</FieldLabel>
            <Select
              value={String(mesReferencia)}
              onValueChange={(v) => setValue("MES_REFERENCIA", Number(v))}
              disabled={!!payroll}
            >
              <SelectTrigger>
                <SelectValue placeholder="Mês..." />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((mes, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Ano *</FieldLabel>
            <Select
              value={String(anoReferencia)}
              onValueChange={(v) => setValue("ANO_REFERENCIA", Number(v))}
              disabled={!!payroll}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ano..." />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((ano) => (
                  <SelectItem key={ano} value={String(ano)}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="NUMERO_DEPENDENTES">Dependentes</FieldLabel>
            <Input
              id="NUMERO_DEPENDENTES"
              type="number"
              min="0"
              {...register("NUMERO_DEPENDENTES")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="SALARIO_BASE">Salário Base (R$) *</FieldLabel>
            <Input
              id="SALARIO_BASE"
              type="number"
              step="0.01"
              min="0"
              {...register("SALARIO_BASE")}
            />
            {errors.SALARIO_BASE && (
              <FieldMessage variant="error">
                {errors.SALARIO_BASE.message}
              </FieldMessage>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="BONUS">Bônus (R$)</FieldLabel>
            <Input
              id="BONUS"
              type="number"
              step="0.01"
              min="0"
              {...register("BONUS")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel htmlFor="DESCONTO_INSS">
              INSS (R$)
              {!inssOverride && (
                <span className="ml-1 text-xs text-muted-foreground">
                  (auto)
                </span>
              )}
            </FieldLabel>
            <Input
              id="DESCONTO_INSS"
              type="number"
              step="0.01"
              min="0"
              {...register("DESCONTO_INSS", {
                onChange: () => setInssOverride(true),
              })}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="DESCONTO_IRRF">
              IRRF (R$)
              {!irrfOverride && (
                <span className="ml-1 text-xs text-muted-foreground">
                  (auto)
                </span>
              )}
            </FieldLabel>
            <Input
              id="DESCONTO_IRRF"
              type="number"
              step="0.01"
              min="0"
              {...register("DESCONTO_IRRF", {
                onChange: () => setIrrfOverride(true),
              })}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="OUTROS_DESCONTOS">
              Outros Desc. (R$)
            </FieldLabel>
            <Input
              id="OUTROS_DESCONTOS"
              type="number"
              step="0.01"
              min="0"
              {...register("OUTROS_DESCONTOS")}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="VALOR_PASSAGEM">
            Valor da Passagem (R$)
          </FieldLabel>
          <Input
            id="VALOR_PASSAGEM"
            type="number"
            step="0.01"
            min="0"
            {...register("VALOR_PASSAGEM")}
          />
          <FieldMessage>
            O desconto será de no máximo 6% do salário base
          </FieldMessage>
        </Field>

        <div className="rounded-md border bg-muted/40 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Salário Líquido (preview)
          </span>
          <span
            className={`text-lg font-bold ${liquidoPreview < 0 ? "text-destructive" : "text-green-600"}`}
          >
            {formatCurrency(liquidoPreview)}
          </span>
        </div>

        <Field>
          <FieldLabel htmlFor="OBSERVACAO">Observação</FieldLabel>
          <Textarea
            id="OBSERVACAO"
            {...register("OBSERVACAO")}
            rows={3}
            maxLength={500}
            placeholder="Máximo de 500 caracteres"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            {payroll ? "Salvar" : "Criar"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
