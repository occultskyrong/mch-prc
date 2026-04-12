import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { LocationEntity } from './location.entity';
import {
  LocationCreateDTO,
  LocationUpdateDTO,
  LocationListDTO,
  LocationResultDTO,
} from './location.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private readonly locationRepo: Repository<LocationEntity>,
  ) {}

  async create(dto: LocationCreateDTO): Promise<LocationResultDTO> {
    const location = this.locationRepo.create(dto);
    await this.locationRepo.save(location);
    return plainToInstance(LocationResultDTO, location);
  }

  async list(dto: LocationListDTO): Promise<{ data: LocationResultDTO[]; count: number }> {
    const where: any = {};
    if (dto.name) {
      where.name = dto.name;
    }
    if (dto.province) {
      where.province = dto.province;
    }

    const count = await this.locationRepo.count({ where });
    const data = await this.locationRepo.find({
      where,
      order: { id: 'DESC' },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
    });

    return { data: data.map((d) => plainToInstance(LocationResultDTO, d)), count };
  }

  async findById(id: number): Promise<LocationResultDTO | null> {
    const location = await this.locationRepo.findOne({ where: { id } });
    return location ? plainToInstance(LocationResultDTO, location) : null;
  }

  async update(dto: LocationUpdateDTO): Promise<LocationResultDTO> {
    const location = await this.locationRepo.findOne({ where: { id: dto.id } });
    if (!location) throw new Error('Location not found');

    Object.assign(location, {
      name: dto.name ?? location.name,
      province: dto.province ?? location.province,
      city: dto.city ?? location.city,
      address: dto.address ?? location.address,
      latitude: dto.latitude ?? location.latitude,
      longitude: dto.longitude ?? location.longitude,
      description: dto.description ?? location.description,
    });
    await this.locationRepo.save(location);
    return plainToInstance(LocationResultDTO, location);
  }

  async delete(id: number): Promise<void> {
    await this.locationRepo.delete(id);
  }
}