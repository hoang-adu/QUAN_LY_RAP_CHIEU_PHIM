import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodOrder } from './food-order.entity';
import { CreateFoodOrderDto } from './dto/create-food-order.dto';
import { UpdateFoodOrderDto } from './dto/update-food-order.dto';

@Injectable()
export class FoodOrdersService {
  constructor(
    @InjectRepository(FoodOrder)
    private readonly foodOrderRepository: Repository<FoodOrder>,
  ) {}

  // CREATE - Tạo hóa đơn đồ ăn mới
  async create(createFoodOrderDto: CreateFoodOrderDto): Promise<FoodOrder> {
    const order = this.foodOrderRepository.create(createFoodOrderDto);
    return this.foodOrderRepository.save(order);
  }

  // READ - Lấy danh sách tất cả hóa đơn đồ ăn
  async findAll(): Promise<FoodOrder[]> {
    return this.foodOrderRepository.find();
  }

  // READ - Lấy 1 hóa đơn theo id
  async findOne(id: number): Promise<FoodOrder> {
    const order = await this.foodOrderRepository.findOne({
      where: { order_id: id },
    });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy hóa đơn có id = ${id}`);
    }
    return order;
  }

  // UPDATE - Cập nhật hóa đơn theo id
  async update(id: number, updateFoodOrderDto: UpdateFoodOrderDto): Promise<FoodOrder> {
    const order = await this.findOne(id);
    Object.assign(order, updateFoodOrderDto);
    return this.foodOrderRepository.save(order);
  }

  // DELETE - Xóa hóa đơn theo id
  async remove(id: number): Promise<{ message: string }> {
    const order = await this.findOne(id);
    await this.foodOrderRepository.remove(order);
    return { message: `Đã xóa hóa đơn có id = ${id}` };
  }
}
