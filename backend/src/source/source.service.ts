import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { SourceEntity } from './source.entity';
import { SourceRelationEntity } from './source-relation.entity';
import {
  SourceCreateDTO,
  SourceUpdateDTO,
  SourceListDTO,
  SourceResultDTO,
  SourceRelationCreateDTO,
  SourceRelationResultDTO,
  SourceCitationResultDTO,
} from './source.dto';

@Injectable()
export class SourceService {
  constructor(
    @InjectRepository(SourceEntity)
    private readonly sourceRepo: Repository<SourceEntity>,
    @InjectRepository(SourceRelationEntity)
    private readonly relationRepo: Repository<SourceRelationEntity>,
  ) {}

  // ========== Source CRUD ==========

  async create(dto: SourceCreateDTO): Promise<SourceResultDTO> {
    const source = this.sourceRepo.create(dto);
    await this.sourceRepo.save(source);
    return plainToInstance(SourceResultDTO, source);
  }

  async list(dto: SourceListDTO): Promise<{ data: SourceResultDTO[]; count: number }> {
    const where: any = {};
    if (dto.title) {
      where.title = dto.title;
    }
    if (dto.sourceType) {
      where.sourceType = dto.sourceType;
    }

    const count = await this.sourceRepo.count({ where });
    const data = await this.sourceRepo.find({
      where,
      order: { id: 'DESC' },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
    });

    return { data: data.map((d) => plainToInstance(SourceResultDTO, d)), count };
  }

  async findById(id: number): Promise<SourceResultDTO | null> {
    const source = await this.sourceRepo.findOne({ where: { id } });
    return source ? plainToInstance(SourceResultDTO, source) : null;
  }

  async update(dto: SourceUpdateDTO): Promise<SourceResultDTO> {
    const source = await this.sourceRepo.findOne({ where: { id: dto.id } });
    if (!source) throw new Error('Source not found');

    Object.assign(source, {
      title: dto.title ?? source.title,
      author: dto.author ?? source.author,
      publisher: dto.publisher ?? source.publisher,
      publishYear: dto.publishYear ?? source.publishYear,
      url: dto.url ?? source.url,
      sourceType: dto.sourceType ?? source.sourceType,
      description: dto.description ?? source.description,
    });
    await this.sourceRepo.save(source);
    return plainToInstance(SourceResultDTO, source);
  }

  async delete(id: number): Promise<void> {
    await this.relationRepo.delete({ sourceId: id });
    await this.sourceRepo.delete(id);
  }

  // ========== Source Citations ==========

  async getCitations(sourceId: number): Promise<SourceCitationResultDTO[]> {
    const relations = await this.relationRepo.find({
      where: { sourceId },
    });
    return relations.map((r) => plainToInstance(SourceCitationResultDTO, r));
  }

  // ========== Source Relations ==========

  async addRelation(dto: SourceRelationCreateDTO): Promise<SourceRelationResultDTO> {
    const relation = this.relationRepo.create(dto);
    await this.relationRepo.save(relation);
    return plainToInstance(SourceRelationResultDTO, relation);
  }

  async removeRelation(id: number): Promise<void> {
    await this.relationRepo.delete(id);
  }

  // ========== Get sources by target ==========

  async getSourcesByTarget(
    targetType: string,
    targetId: number,
  ): Promise<SourceCitationResultDTO[]> {
    const relations = await this.relationRepo.find({
      where: { targetType: targetType as any, targetId },
      relations: ['source'],
    });

    return relations.map((r) =>
      plainToInstance(SourceCitationResultDTO, {
        id: r.id,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        sourceId: r.sourceId,
        sourceTitle: r.source?.title,
        sourceAuthor: r.source?.author,
        targetType: r.targetType,
        targetId: r.targetId,
        citation: r.citation,
        note: r.note,
      }),
    );
  }
}