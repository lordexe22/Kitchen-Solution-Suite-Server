/**
 * Servicios de Gestión de Compañías
 * 
 * Todos los servicios para operaciones CRUD de compañías y validaciones.
 * Los tipos y constantes están centralizados en types.ts y constants.ts
 */

// Tipos e interfaces
export type {
  Company,
  CompanyState,
  CreateCompanyInput,
  UpdateCompanyInput,
} from './types';

// Constantes
export { COMPANY_STATES, COMPANY_STATE_VALUES, isValidCompanyState } from './constants';

// Servicios
export { checkNameAvailability } from './checkNameAvailability/checkNameAvailability.service';
export { createCompanyService } from './createCompany/createCompany.service';
export { getAllCompaniesService } from './getAllCompanies/getAllCompanies.service';
export { getCompanyService } from './getCompany/getCompany.service';
export { updateCompanyService } from './updateCompany/updateCompany.service';
export { archiveCompanyService } from './archiveCompany/archiveCompany.service';
export { reactivateCompanyService } from './reactivateCompany/reactivateCompany.service';
export { deleteCompanyService } from './deleteCompany/deleteCompany.service';
export { checkCompanyPermissionService } from './checkCompanyPermission/checkCompanyPermission.service';

// Tipos adicionales de servicios específicos
export type { GetAllCompaniesOptions, PaginatedCompaniesResult } from './getAllCompanies/getAllCompanies.service';
export type { PermissionCheckResult } from './checkCompanyPermission/checkCompanyPermission.service';
