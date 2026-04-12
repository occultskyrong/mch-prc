import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from './group.entity';
import { GroupCreateDTO, GroupUpdateDTO, GroupListDTO, GroupResultDTO } from './group.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly repo: Repository<GroupEntity>,
  ) {}

  async create(dto: GroupCreateDTO): Promise<GroupResultDTO> {
    const entity = plainToInstance(GroupEntity, dto);
    await this.repo.save(entity);
    return plainToInstance(GroupResultDTO, entity);
  }

  async list(dto: GroupListDTO): Promise<{ data: GroupResultDTO[]; count: number }> {
    const where: any = {};
    if (dto.name) where.name = dto.name;
    if (dto.type) where.type = dto.type;

    const count = await this.repo.count({ where });
    const data = await this.repo.find({
      where,
      order: { id: 'DESC' },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
    });
    return { data: data.map(d => plainToInstance(GroupResultDTO, d)), count };
  }

  async findById(id: number): Promise<GroupResultDTO | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['parent', 'children'] });
    return entity ? plainToInstance(GroupResultDTO, entity) : null;
  }

  async update(dto: GroupUpdateDTO): Promise<GroupResultDTO> {
    const entity = await this.repo.findOne({ where: { id: dto.id } });
    if (!entity) throw new Error('Group not found');
    Object.assign(entity, dto);
    await this.repo.save(entity);
    return plainToInstance(GroupResultDTO, entity);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async tree(): Promise<GroupEntity[]> {
    const all = await this.repo.find({ relations: ['children'] });
    return all.filter(g => !g.parentId);
  }
}