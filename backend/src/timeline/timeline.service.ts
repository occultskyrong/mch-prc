import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEntity } from 'src/event/event.entity';
import { PersonEventRelationEntity } from 'src/event/person-event-relation.entity';
import { PersonGroupRelationEntity } from 'src/person/person-group-relation.entity';
import { PersonEntity } from 'src/person/person.entity';
import { GroupEntity } from 'src/group/group.entity';

export interface TimelineMatrixDTO {
  startDate?: string;
  endDate?: string;
  groupBy: 'group' | 'person';
}

export interface TimelineEvent {
  eventId: number;
  title: string;
  year: number;
  startDate: Date;
  endDate: Date;
}

export interface TimelineRow {
  id: number;
  name: string;
  type: 'group' | 'person';
  events: TimelineEvent[];
}

export interface TimelineMatrixResult {
  columns: number[];
  rows: TimelineRow[];
}

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(PersonEventRelationEntity)
    private readonly personEventRepo: Repository<PersonEventRelationEntity>,
    @InjectRepository(PersonGroupRelationEntity)
    private readonly personGroupRepo: Repository<PersonGroupRelationEntity>,
    @InjectRepository(PersonEntity)
    private readonly personRepo: Repository<PersonEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
  ) {}

  async getMatrix(dto: TimelineMatrixDTO): Promise<TimelineMatrixResult> {
    const { startDate, endDate, groupBy } = dto;

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date('1800-01-01');
    const end = endDate ? new Date(endDate) : new Date('2000-12-31');

    // Get start and end years
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    // Generate columns (years)
    const columns: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      columns.push(year);
    }

    let rows: TimelineRow[] = [];

    if (groupBy === 'person') {
      rows = await this.getMatrixByPerson(start, end);
    } else {
      rows = await this.getMatrixByGroup(start, end);
    }

    return { columns, rows };
  }

  private async getMatrixByPerson(start: Date, end: Date): Promise<TimelineRow[]> {
    // Get all person-event relations with events in the date range
    const relations = await this.personEventRepo
      .createQueryBuilder('per')
      .leftJoinAndSelect('per.event', 'event')
      .leftJoinAndSelect('per.person', 'person')
      .where('event.startDate >= :start', { start })
      .andWhere('event.startDate <= :end', { end })
      .orderBy('person.id', 'ASC')
      .addOrderBy('event.startDate', 'ASC')
      .getMany();

    // Group by person
    const personMap = new Map<number, TimelineRow>();

    for (const relation of relations) {
      if (!relation.person || !relation.event) continue;

      const personId = relation.personId;
      if (!personMap.has(personId)) {
        personMap.set(personId, {
          id: personId,
          name: relation.person.name,
          type: 'person',
          events: [],
        });
      }

      const row = personMap.get(personId)!;
      row.events.push({
        eventId: relation.event.id,
        title: relation.event.title,
        year: relation.event.startDate?.getFullYear() || 0,
        startDate: relation.event.startDate,
        endDate: relation.event.endDate,
      });
    }

    return Array.from(personMap.values());
  }

  private async getMatrixByGroup(start: Date, end: Date): Promise<TimelineRow[]> {
    // Get all person-event relations with events in the date range
    const personEventRelations = await this.personEventRepo
      .createQueryBuilder('per')
      .leftJoinAndSelect('per.event', 'event')
      .where('event.startDate >= :start', { start })
      .andWhere('event.startDate <= :end', { end })
      .getMany();

    // Get all person-group relations
    const personGroupRelations = await this.personGroupRepo.find({
      relations: ['group'],
    });

    // Create person to groups mapping
    const personToGroups = new Map<number, number[]>();
    for (const pgr of personGroupRelations) {
      if (!personToGroups.has(pgr.personId)) {
        personToGroups.set(pgr.personId, []);
      }
      personToGroups.get(pgr.personId)!.push(pgr.groupId);
    }

    // Group events by group
    const groupMap = new Map<number, TimelineRow>();
    const groupEventSet = new Map<number, Set<number>>(); // To avoid duplicate events per group

    for (const relation of personEventRelations) {
      if (!relation.event) continue;

      const groupIds = personToGroups.get(relation.personId) || [];

      for (const groupId of groupIds) {
        if (!groupMap.has(groupId)) {
          // Get group info
          const group = await this.groupRepo.findOne({ where: { id: groupId } });
          if (group) {
            groupMap.set(groupId, {
              id: groupId,
              name: group.name,
              type: 'group',
              events: [],
            });
            groupEventSet.set(groupId, new Set());
          }
        }

        const row = groupMap.get(groupId);
        const eventSet = groupEventSet.get(groupId);

        if (row && eventSet && !eventSet.has(relation.eventId)) {
          eventSet.add(relation.eventId);
          row.events.push({
            eventId: relation.event.id,
            title: relation.event.title,
            year: relation.event.startDate?.getFullYear() || 0,
            startDate: relation.event.startDate,
            endDate: relation.event.endDate,
          });
        }
      }
    }

    // Sort events by year in each row
    for (const row of groupMap.values()) {
      row.events.sort((a, b) => a.year - b.year);
    }

    return Array.from(groupMap.values());
  }
}