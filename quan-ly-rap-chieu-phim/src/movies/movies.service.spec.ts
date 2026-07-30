import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MoviesService } from './movies.service';
import { Movie } from './movie.entity';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = (): MockRepo<Movie> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('MoviesService', () => {
  let service: MoviesService;
  let repo: MockRepo<Movie>;

  const sampleMovie: Movie = {
    movie_id: 1,
    title: 'Avatar 3',
    genre: 'Hành động',
    duration: 150,
    director: 'James Cameron',
    actors: 'Sam Worthington',
    release_date: '2026-12-01',
    description: 'Phim khoa học viễn tưởng',
    poster: 'avatar3.jpg',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: getRepositoryToken(Movie), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repo = module.get(getRepositoryToken(Movie));
  });

  afterEach(() => jest.clearAllMocks());

  it('nên được khởi tạo (defined)', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('tạo phim mới và trả về phim đã lưu', async () => {
      (repo.create as jest.Mock).mockReturnValue(sampleMovie);
      (repo.save as jest.Mock).mockResolvedValue(sampleMovie);

      const dto = { title: 'Avatar 3', genre: 'Hành động', duration: 150 } as any;
      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(sampleMovie);
      expect(result).toEqual(sampleMovie);
    });
  });

  describe('findAll()', () => {
    it('trả về danh sách toàn bộ phim', async () => {
      (repo.find as jest.Mock).mockResolvedValue([sampleMovie]);
      const result = await service.findAll();
      expect(result).toEqual([sampleMovie]);
      expect(repo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne()', () => {
    it('trả về phim khi tồn tại', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(sampleMovie);
      const result = await service.findOne(1);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { movie_id: 1 } });
      expect(result).toEqual(sampleMovie);
    });

    it('ném NotFoundException khi không tìm thấy phim', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('cập nhật phim đã tồn tại', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ ...sampleMovie });
      (repo.save as jest.Mock).mockImplementation((m) => Promise.resolve(m));

      const result = await service.update(1, { title: 'Avatar 3 (Bản mới)' } as any);

      expect(result.title).toBe('Avatar 3 (Bản mới)');
      expect(repo.save).toHaveBeenCalled();
    });

    it('ném NotFoundException khi cập nhật phim không tồn tại', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.update(999, { title: 'X' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove()', () => {
    it('xóa phim đã tồn tại và trả về message', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(sampleMovie);
      (repo.remove as jest.Mock).mockResolvedValue(sampleMovie);

      const result = await service.remove(1);

      expect(repo.remove).toHaveBeenCalledWith(sampleMovie);
      expect(result).toEqual({ message: 'Đã xóa phim có id = 1' });
    });

    it('ném NotFoundException khi xóa phim không tồn tại', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
