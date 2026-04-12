import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { EventEntity } from './event.entity';
import { EventSummaryEntity } from './event-summary.entity';
import { EventDetailEntity } from './event-detail.entity';
import { EventRelationEntity } from './event-relation.entity';
import { PersonEventRelationEntity } from './person-event-relation.entity';
import { EventLocationRelationEntity } from './event-location-relation.entity';
import {
  EventCreateDTO,
  EventUpdateDTO,
  EventListDTO,
  EventResultDTO,
  EventRelationCreateDTO,
  EventRelationResultDTO,
  PersonEventRelationCreateDTO,
  PersonEventRelationResultDTO,
  EventLocationRelationCreateDTO,
  EventLocationRelationResultDTO,
} from './event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(EventSummaryEntity)
    private readonly summaryRepo: Repository<EventSummaryEntity>,
    @InjectRepository(EventDetailEntity)
    private readonly detailRepo: Repository<EventDetailEntity>,
    @InjectRepository(EventRelationEntity)
    private readonly relationRepo: Repository<EventRelationEntity>,
    @InjectRepository(PersonEventRelationEntity)
    private readonly personEventRepo: Repository<PersonEventRelationEntity>,
    @InjectRepository(EventLocationRelationEntity)
    private readonly locationRepo: Repository<EventLocationRelationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ========== Event CRUD ==========

  async create(dto: EventCreateDTO): Promise<EventResultDTO> {
    return await this.dataSource.transaction(async (manager) => {
      // Create event
      const event = manager.create(EventEntity, {
        title: dto.title,
        startDate: dto.startDate,
        endDate: dto.endDate,
        isInstant: dto.isInstant ?? false,
        eventType: dto.eventType,
      });
      await manager.save(event);

      // Create summary
      if (dto.summaryContent) {
        const summary = manager.create(EventSummaryEntity, {
          eventId: event.id,
          content: dto.summaryContent,
        });
        await manager.save(summary);
      }

      // Create detail
      if (dto.motive || dto.process || dto.result || dto.impact) {
        const detail = manager.create(EventDetailEntity, {
          eventId: event.id,
          motive: dto.motive,
          process: dto.process,
          result: dto.result,
          impact: dto.impact,
        });
        await manager.save(detail);
      }

      return await this.findById(event.id);
    });
  }

  async list(dto: EventListDTO): Promise<{ data: EventResultDTO[]; count: number }> {
    const where: any = {};
    if (dto.title) {
      where.title = dto.title;
    }
    if (dto.eventType) {
      where.eventType = dto.eventType;
    }

    const count = await this.eventRepo.count({ where });
    const data = await this.eventRepo.find({
      where,
      order: { id: 'DESC' },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
      relations: ['summary', 'detail'],
    });

    return { data: data.map((d) => this.toResultDTO(d)), count };
  }

  async findById(id: number): Promise<EventResultDTO | null> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['summary', 'detail'],
    });
    return event ? this.toResultDTO(event) : null;
  }

  async update(dto: EventUpdateDTO): Promise<EventResultDTO> {
    return await this.dataSource.transaction(async (manager) => {
      const event = await manager.findOne(EventEntity, {
        where: { id: dto.id },
        relations: ['summary', 'detail'],
      });
      if (!event) throw new Error('Event not found');

      // Update event
      Object.assign(event, {
        title: dto.title ?? event.title,
        startDate: dto.startDate ?? event.startDate,
        endDate: dto.endDate ?? event.endDate,
        isInstant: dto.isInstant ?? event.isInstant,
        eventType: dto.eventType ?? event.eventType,
      });
      await manager.save(event);

      // Update or create summary
      if (dto.summaryContent !== undefined) {
        if (event.summary) {
          event.summary.content = dto.summaryContent;
          await manager.save(event.summary);
        } else {
          const summary = manager.create(EventSummaryEntity, {
            eventId: event.id,
            content: dto.summaryContent,
          });
          await manager.save(summary);
        }
      }

      // Update or create detail
      const hasDetailUpdate = dto.motive || dto.process || dto.result || dto.impact;
      if (hasDetailUpdate) {
        if (event.detail) {
          event.detail.motive = dto.motive ?? event.detail.motive;
          event.detail.process = dto.process ?? event.detail.process;
          event.detail.result = dto.result ?? event.detail.result;
          event.detail.impact = dto.impact ?? event.detail.impact;
          await manager.save(event.detail);
        } else {
          const detail = manager.create(EventDetailEntity, {
            eventId: event.id,
            motive: dto.motive,
            process: dto.process,
            result: dto.result,
            impact: dto.impact,
          });
          await manager.save(detail);
        }
      }

      return await this.findById(dto.id);
    });
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(EventSummaryEntity, { eventId: id });
      await manager.delete(EventDetailEntity, { eventId: id });
      await manager.delete(EventRelationEntity, { sourceEventId: id });
      await manager.delete(EventRelationEntity, { targetEventId: id });
      await manager.delete(PersonEventRelationEntity, { eventId: id });
      await manager.delete(EventLocationRelationEntity, { eventId: id });
      await manager.delete(EventEntity, { id });
    });
  }

  private toResultDTO(event: EventEntity): EventResultDTO {
    return plainToInstance(EventResultDTO, {
      id: event.id,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      isInstant: event.isInstant,
      eventType: event.eventType,
      summary: event.summary
        ? {
            id: event.summary.id,
            eventId: event.summary.eventId,
            content: event.summary.content,
            createdAt: event.summary.createdAt,
            updatedAt: event.summary.updatedAt,
          }
        : null,
      detail: event.detail
        ? {
            id: event.detail.id,
            eventId: event.detail.eventId,
            motive: event.detail.motive,
            process: event.detail.process,
            result: event.detail.result,
            impact: event.detail.impact,
            createdAt: event.detail.createdAt,
            updatedAt: event.detail.updatedAt,
          }
        : null,
    });
  }

  // ========== Event Relations ==========

  async getRelations(eventId: number): Promise<EventRelationResultDTO[]> {
    const relations = await this.relationRepo.find({
      where: [{ sourceEventId: eventId }, { targetEventId: eventId }],
    });
    return relations.map((r) => plainToInstance(EventRelationResultDTO, r));
  }

  async addRelation(dto: EventRelationCreateDTO): Promise<EventRelationResultDTO> {
    const relation = this.relationRepo.create(dto);
    await this.relationRepo.save(relation);
    return plainToInstance(EventRelationResultDTO, relation);
  }

  async removeRelation(id: number): Promise<void> {
    await this.relationRepo.delete(id);
  }

  // ========== Person Event Relations ==========

  async getPersons(eventId: number): Promise<PersonEventRelationResultDTO[]> {
    const relations = await this.personEventRepo.find({
      where: { eventId },
      relations: ['person'],
    });
    return relations.map((r) => plainToInstance(PersonEventRelationResultDTO, r));
  }

  async addPersonRelation(dto: PersonEventRelationCreateDTO): Promise<PersonEventRelationResultDTO> {
    const relation = this.personEventRepo.create(dto);
    await this.personEventRepo.save(relation);
    return plainToInstance(PersonEventRelationResultDTO, relation);
  }

  async removePersonRelation(id: number): Promise<void> {
    await this.personEventRepo.delete(id);
  }

  // ========== Event Location Relations ==========

  async getLocations(eventId: number): Promise<EventLocationRelationResultDTO[]> {
    const relations = await this.locationRepo.find({
      where: { eventId },
      relations: ['location'],
    });
    return relations.map((r) => plainToInstance(EventLocationRelationResultDTO, r));
  }

  async addLocationRelation(dto: EventLocationRelationCreateDTO): Promise<EventLocationRelationResultDTO> {
    const relation = this.locationRepo.create(dto);
    await this.locationRepo.save(relation);
    return plainToInstance(EventLocationRelationResultDTO, relation);
  }

  async removeLocationRelation(id: number): Promise<void> {
    await this.locationRepo.delete(id);
  }
}