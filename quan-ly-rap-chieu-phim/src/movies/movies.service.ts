import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  // CREATE - Thêm phim mới
  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const movie = this.movieRepository.create(createMovieDto);
    return this.movieRepository.save(movie);
  }

  // READ - Lấy danh sách tất cả phim
  async findAll(): Promise<Movie[]> {
    return this.movieRepository.find();
  }

  // READ - Lấy 1 phim theo id
  async findOne(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { movie_id: id },
    });
    if (!movie) {
      throw new NotFoundException(`Không tìm thấy phim có id = ${id}`);
    }
    return movie;
  }

  // UPDATE - Cập nhật phim theo id
  async update(id: number, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findOne(id);
    Object.assign(movie, updateMovieDto);
    return this.movieRepository.save(movie);
  }

  // DELETE - Xóa phim theo id
  async remove(id: number): Promise<{ message: string }> {
    const movie = await this.findOne(id);
    await this.movieRepository.remove(movie);
    return { message: `Đã xóa phim có id = ${id}` };
  }
}
