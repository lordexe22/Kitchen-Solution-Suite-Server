-- Script para corregir la tabla employee_invitations
-- Elimina las secuencias asociadas a columnas que ya no deberían ser serial

-- Eliminar defaults de las columnas que eran serial
ALTER TABLE employee_invitations ALTER COLUMN branch_id DROP DEFAULT;
ALTER TABLE employee_invitations ALTER COLUMN company_id DROP DEFAULT;
ALTER TABLE employee_invitations ALTER COLUMN created_by DROP DEFAULT;
ALTER TABLE employee_invitations ALTER COLUMN used_by_user_id DROP DEFAULT;

-- Eliminar las secuencias huérfanas (si existen)
DROP SEQUENCE IF EXISTS employee_invitations_branch_id_seq CASCADE;
DROP SEQUENCE IF EXISTS employee_invitations_company_id_seq CASCADE;
DROP SEQUENCE IF EXISTS employee_invitations_created_by_seq CASCADE;
DROP SEQUENCE IF EXISTS employee_invitations_used_by_user_id_seq CASCADE;
