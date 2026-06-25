import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodOrderDetail } from './food-order-detail.entity';
import { CreateFoodOrderDetailDto } from './dto/create-food-order-detail.dto';
import { UpdateFoodOrderDetailDto } from './dto/update-food-order-detail.dto';

@Injectable()
export class FoodOrderDetailsService {
  constructor(
    @InjectRepository(FoodOrderDetail)
    private readonly detailRepository: Repository<FoodOrderDetail>,
  ) {}

  async create(dto: CreateFoodOrderDetailDto): Promise<FoodOrderDetail> {
    const detail = this.detailRepository.create(dto);
    return this.detailRepository.save(detail);
  }

  async findAll(): Promise<FoodOrderDetail[]> {
    return this.detailRepository.find({ order: { order_id: 'ASC', product_id: 'ASC' } });
  }

  async findOne(order_id: number, product_id: number): Promise<FoodOrderDetail> {
    const detail = await this.detailRepository.findOne({
      where: { order_id, product_id },
    });
    if (!detail) {
      throw new NotFoundException(
        `Không tìm thấy chi tiết hóa đơn (order_id=${order_id}, product_id=${product_id})`,
      );
    }
    return detail;
  }

  async findByOrder(order_id: number): Promise<FoodOrderDetail[]> {
    return this.detailRepository.find({
      where: { order_id },
      order: { product_id: 'ASC' },
    });
  }

  async update(
    order_id: number,
    product_id: number,
    dto: UpdateFoodOrderDetailDto,
  ): Promise<FoodOrderDetail> {
    const detail = await this.findOne(order_id, product_id);
    Object.assign(detail, dto);
    return this.detailRepository.save(detail);
  }

  async remove(order_id: number, product_id: number): Promise<{ message: string }> {
    const detail = await this.findOne(order_id, product_id);
    await this.detailRepository.remove(detail);
    return {
      message: `Đã xóa chi tiết hóa đơn (order_id=${order_id}, product_id=${product_id})`,
    };
  }
}
