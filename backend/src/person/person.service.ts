import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PersonEntity } from './person.entity';
import { PersonGroupRelationEntity } from './person-group-relation.entity';
import { PersonCreateDTO, PersonUpdateDTO, PersonListDTO, PersonResultDTO, PersonGroupRelationDTO } from './person.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly personRepo: Repository<PersonEntity>,
    @InjectRepository(PersonGroupRelationEntity)
    private readonly relationRepo: Repository<PersonGroupRelationEntity>,
  ) {}

  async create(dto: PersonCreateDTO): Promise<PersonResultDTO> {
    const entity = plainToInstance(PersonEntity, dto);
    await this.personRepo.save(entity);
    return plainToInstance(PersonResultDTO, entity);
  }

  async list(dto: PersonListDTO): Promise<{ data: PersonResultDTO[]; count: number }> {
    const where: any = {};
    if (dto.name) where.name = Like(`%${dto.name}%`);

    const count = await this.personRepo.count({ where });
    const data = await this.personRepo.find({
      where,
      order: { id: 'DESC' },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
    });
    return { data: data.map(d => plainToInstance(PersonResultDTO, d)), count };
  }

  async findById(id: number): Promise<PersonResultDTO | null> {
    const entity = await this.personRepo.findOne({ where: { id } });
    return entity ? plainToInstance(PersonResultDTO, entity) : null;
  }

  async update(dto: PersonUpdateDTO): Promise<PersonResultDTO> {
    const entity = await this.personRepo.findOne({ where: { id: dto.id } });
    if (!entity) throw new Error('Person not found');
    Object.assign(entity, dto);
    await this.personRepo.save(entity);
    return plainToInstance(PersonResultDTO, entity);
  }

  async delete(id: number): Promise<void> {
    await this.personRepo.delete(id);
  }

  async getGroups(personId: number) {
    return this.relationRepo.find({
      where: { personId },
      relations: ['group'],
      order: { startDate: 'ASC' },
    });
  }

  async addGroupRelation(dto: PersonGroupRelationDTO) {
    const entity = plainToInstance(PersonGroupRelationEntity, dto);
    await this.relationRepo.save(entity);
    return entity;
  }

  async removeGroupRelation(id: number) {
    await this.relationRepo.delete(id);
  }
}