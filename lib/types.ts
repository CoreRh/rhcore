export interface ApiResponse<T> {
  succeeded: boolean;
  data: T;
  message: string;
  error?: ApiError | null;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  role?: UserRole;
}

export interface User {
  ID: string;
  NOME_USUARIO: string;
  EMAIL: string;
  STATUS: "ATIVO" | "INATIVO";
  ROLE: UserRole;
  PERMISSIONS: AppPermission[];
  CRIADO_EM: string;
  FUNCIONARIO_ID?: string;
  ATUALIZADO_POR?: string | null;
}

export type AppPermission =
  | "APPROVE_VACATIONS"
  | "APPROVE_REQUESTS"
  | "VIEW_ALL_EMPLOYEES"
  | "MANAGE_PAYROLL"
  | "VIEW_REPORTS";

export interface Employee {
  ID: string;
  MATRICULA: string;
  NOME: string;
  CPF: string;
  RG?: string;
  DATA_NASCIMENTO: string;
  EMAIL: string;
  TELEFONE?: string;
  DATA_ADMISSAO: string;
  DEPARTAMENTO_ID?: string;
  CARGO_ID?: string;
  GESTOR_ID?: string;
  STATUS: "ATIVO" | "INATIVO";
  CRIADO_EM: string;
  ATUALIZADO_POR?: string | null;
  DEPARTAMENTO?: Department;
  CARGO?: Position;
  GESTOR?: Employee;
}

export interface CreateEmployeeData {
  MATRICULA: string;
  NOME: string;
  CPF: string;
  RG?: string;
  DATA_NASCIMENTO: string;
  EMAIL: string;
  TELEFONE?: string;
  DATA_ADMISSAO: string;
  DEPARTAMENTO_ID?: string;
  CARGO_ID?: string;
  GESTOR_ID?: string;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  STATUS?: "ATIVO" | "INATIVO";
}

export interface Department {
  ID: string;
  NOME: string;
  SIGLA: string;
  DESCRICAO?: string | null;
  DEPARTAMENTO_PAI?: Department;
  STATUS: "ATIVO" | "INATIVO";
  CRIADO_POR: string;
  CRIADO_EM: string;
  ATUALIZADO_POR?: string | null;
  EXCLUIDO_POR?: string | null;
}

export interface CreateDepartmentData {
  NOME: string;
  SIGLA: string;
  DESCRICAO?: string;
  DEPARTAMENTO_PAI_ID?: string;
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {
  STATUS?: "ATIVO" | "INATIVO";
}

export interface Position {
  ID: string;
  NOME: string;
  DESCRICAO?: string;
  NIVEL?: string;
  SALARIO_BASE?: number;
  DEPARTAMENTO_ID?: string;
  DEPARTAMENTO?: Department;
  STATUS: "ATIVO" | "INATIVO";
  CRIADO_EM: string;
  ATUALIZADO_POR?: string | null;
}

export interface CreatePositionData {
  NOME: string;
  DESCRICAO?: string;
  NIVEL?: string;
  SALARIO_BASE?: number;
  DEPARTAMENTO_ID?: string;
}

export interface UpdatePositionData extends Partial<CreatePositionData> {
  STATUS?: "ATIVO" | "INATIVO";
}

export const VACATION_STATUS = [
  "PENDENTE",
  "APROVADO",
  "REJEITADO",
  "CANCELADO",
] as const;

export type VacationStatus = (typeof VACATION_STATUS)[number];

export const VACATION_STATUS_LABELS: Record<VacationStatus, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  CANCELADO: "Cancelado",
};

export interface Vacation {
  ID: string;
  FUNCIONARIO_ID: string;
  DATA_INICIO: string;
  DATA_FIM: string;
  DIAS_SOLICITADOS: number;
  STATUS_FERIAS: VacationStatus;
  APROVADO_POR_ID?: string;
  DATA_APROVACAO?: string;
  OBSERVACAO?: string;
  CRIADO_EM: string;
  ATUALIZADO_POR?: string | null;
  FUNCIONARIO?: Employee;
  APROVADO_POR?: VacationApprover;
}

export interface CreateVacationData {
  FUNCIONARIO_ID: string;
  DATA_INICIO: string;
  DATA_FIM: string;
  OBSERVACAO?: string;
}

export interface UpdateVacationData extends Partial<CreateVacationData> {
  STATUS_FERIAS?: VacationStatus;
  APROVADO_POR_ID?: string;
  DATA_APROVACAO?: string;
}

export interface VacationApprover {
  ID: string;
  NOME_USUARIO: string;
  EMAIL: string;
}

export type RequestType =
  | "DOCUMENTO"
  | "EQUIPAMENTO"
  | "BENEFICIO"
  | "TREINAMENTO"
  | "OUTROS";

export interface HRRequest {
  ID: string;
  FUNCIONARIO_ID: string;
  TIPO: RequestType;
  DESCRICAO: string;
  DATA_SOLICITACAO: string;
  DATA_RESPOSTA?: string;
  APROVADO_POR_ID?: string;
  OBSERVACAO?: string;
  CRIADO_EM: string;
  ATUALIZADO_POR?: string | null;
  FUNCIONARIO?: Employee;
  APROVADO_POR?: SystemUser;
  STATUS: "ATIVO" | "INATIVO" | "EXCLUIDO" | "PENDENTE" | "REJEITADO";
}

export interface CreateRequestData {
  FUNCIONARIO_ID: string;
  TIPO: RequestType;
  DESCRICAO: string;
  DATA_SOLICITACAO: string;
  OBSERVACAO?: string;
}

export interface UpdateRequestData extends Partial<CreateRequestData> {
  DATA_RESPOSTA?: string;
  APROVADO_POR_ID?: string;
  STATUS?: "ATIVO" | "INATIVO" | "EXCLUIDO" | "PENDENTE" | "REJEITADO";
}

export interface SystemUser {
  ID: string;
  NOME_USUARIO: string;
  EMAIL: string;
  STATUS: "ATIVO" | "INATIVO";
  ROLE: UserRole;
  PERMISSIONS: AppPermission[];
  CRIADO_EM: string;
  ATUALIZADO_POR?: string | null;
  FUNCIONARIO_ID?: string;
}

export interface CreateUserData {
  NOME_USUARIO: string;
  EMAIL: string;
  SENHA: string;
  ROLE: UserRole;
  PERMISSIONS: AppPermission[];
  FUNCIONARIO_ID?: string;
}

export interface UpdateUserData {
  NOME_USUARIO?: string;
  EMAIL?: string;
  SENHA?: string;
  STATUS?: "ATIVO" | "INATIVO";
  ROLE?: UserRole;
  PERMISSIONS?: AppPermission[];
  SENHA_ATUAL?: string;
  NOVA_SENHA?: string;
  FUNCIONARIO_ID?: string;
}

export interface DashboardSummary {
  totalEmployees: number;
  totalDepartments: number;
  totalPositions: number;
  pendingVacations: number;
  openRequests: number;
}

export interface RecentActivity {
  ID: string;
  TIPO: "FUNCIONARIO" | "FERIAS" | "SOLICITACAO";
  TITULO: string;
  DESCRICAO: string;
  STATUS:
    | "ATIVO"
    | "INATIVO"
    | "EXCLUIDO"
    | "PENDENTE"
    | "APROVADO"
    | "REJEITADO"
    | "CANCELADO";
  CRIADO_EM: string;
}

export type PayrollStatus = "PENDENTE" | "PROCESSADO" | "PAGO";

export interface Payroll {
  ID: string;
  FUNCIONARIO_ID: string;
  FUNCIONARIO: {
    ID: string;
    NOME: string;
    MATRICULA: string;
  };
  MES_REFERENCIA: number;
  ANO_REFERENCIA: number;
  NUMERO_DEPENDENTES: number;
  SALARIO_BASE: string;
  BONUS: string;
  DESCONTO_INSS: string;
  DESCONTO_IRRF: string;
  OUTROS_DESCONTOS: string;
  DESCONTO_VT: string;
  SALARIO_LIQUIDO: string;
  STATUS_FOLHA: PayrollStatus;
  OBSERVACAO: string | null;
  CRIADO_POR: string;
  CRIADO_EM: string;
}

export interface CreatePayrollData {
  FUNCIONARIO_ID: string;
  MES_REFERENCIA: number;
  ANO_REFERENCIA: number;
  NUMERO_DEPENDENTES?: number;
  SALARIO_BASE: number;
  BONUS?: number;
  DESCONTO_INSS?: number;
  DESCONTO_IRRF?: number;
  OUTROS_DESCONTOS?: number;
  VALOR_PASSAGEM?: number;
  OBSERVACAO?: string;
}

export interface UpdatePayrollData extends Partial<CreatePayrollData> {
  STATUS_FOLHA?: PayrollStatus;
}

export type BenefitsType =
  | "VALE_TRANSPORTE"
  | "VALE_REFEICAO"
  | "PLANO_SAUDE"
  | "OUTROS";

export type BenefitsStatus = "ATIVO" | "INATIVO";

export interface ValeTransporteMetadata {
  VALOR_PASSAGEM: number;
  QUANTIDADE_DIARIA: number;
  DIAS_UTEIS: number;
}

export interface ValeRefeicaoMetadata {
  VALOR_DIARIO: number;
  DIAS_UTEIS: number;
}

export interface PlanoSaudeMetadata {
  OPERADORA: string;
  TIPO_PLANO: "INDIVIDUAL" | "FAMILIAR" | "EMPRESARIAL";
  COBERTURA: "BASICO" | "INTERMEDIARIO" | "PREMIUM";
  PERCENTUAL_FUNCIONARIO: number;
}

export type BenefitMetadata =
  | ValeTransporteMetadata
  | ValeRefeicaoMetadata
  | PlanoSaudeMetadata
  | null;

export interface Benefit {
  ID: string;
  FUNCIONARIO: {
    ID: string;
    NOME: string;
    MATRICULA: string;
  };
  TIPO: BenefitsType;
  DESCRICAO?: string | null;
  VALOR: number;
  METADADOS: BenefitMetadata;
  DATA_INICIO: string;
  DATA_FIM?: string | null;
  STATUS_BENEFICIO: BenefitsStatus;
  OBSERVACAO: string | null;
  CRIADO_POR: string;
  CRIADO_EM: string;
}

interface BaseBenefitData {
  FUNCIONARIO_ID: string;
  DATA_INICIO: string;
  DATA_FIM?: string;
  DESCRICAO?: string;
  OBSERVACAO?: string;
}

export type CreateBenefitData =
  | (BaseBenefitData & {
      TIPO: "VALE_TRANSPORTE";
      METADADOS: ValeTransporteMetadata;
    })
  | (BaseBenefitData & {
      TIPO: "VALE_REFEICAO";
      METADADOS: ValeRefeicaoMetadata;
    })
  | (BaseBenefitData & {
      TIPO: "PLANO_SAUDE";
      VALOR: number;
      METADADOS: PlanoSaudeMetadata;
    })
  | (BaseBenefitData & { TIPO: "OUTROS"; VALOR: number });

export interface UpdateBenefitData {
  FUNCIONARIO_ID?: string;
  TIPO?: BenefitsType;
  VALOR?: number;
  DATA_INICIO?: string;
  DATA_FIM?: string;
  DESCRICAO?: string;
  OBSERVACAO?: string;
  STATUS_BENEFICIO?: BenefitsStatus;
  METADADOS?: BenefitMetadata;
}
