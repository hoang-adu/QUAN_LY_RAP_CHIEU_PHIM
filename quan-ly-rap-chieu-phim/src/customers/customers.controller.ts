import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
  ParseIntPipe,
  HttpCode,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthedRequest {
  user: { role?: string; customer_id?: number; employee_id?: number };
}

// Nhân viên/admin: toàn quyền thêm/sửa/xóa khách hàng (đúng yêu cầu nghiệp vụ).
// Khách hàng: chỉ được xem/sửa đúng hồ sơ của chính mình (không xem được người khác).
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: AuthedRequest) {
    this.assertSelfOrStaff(req, id);
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req: AuthedRequest,
  ) {
    this.assertSelfOrStaff(req, id);
    return this.customersService.update(id, updateCustomerDto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }

  private assertSelfOrStaff(req: AuthedRequest, id: number) {
    const user = req.user;
    const isStaff = user?.role === 'admin' || user?.role === 'employee';
    const isSelf = user?.role === 'customer' && user.customer_id === id;
    if (!isStaff && !isSelf) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập hồ sơ khách hàng này',
      );
    }
  }
}