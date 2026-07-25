import { SetMetadata } from '@nestjs/common';

// Sử dụng: @Roles('admin') hoặc @Roles('admin', 'employee')
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
