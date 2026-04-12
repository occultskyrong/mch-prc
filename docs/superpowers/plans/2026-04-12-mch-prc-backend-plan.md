# mch-prc 后端实施计划 (Phase 1-2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建 NestJS 后端 API，支持近代史数据存储和查询

**Architecture:** 模块化设计，每个功能模块独立（event/person/group/source/location/timeline），使用 TypeORM 管理 PostgreSQL，RESTful API

**Tech Stack:** NestJS + TypeScript + TypeORM + PostgreSQL

---

## 文件结构

```
backend/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── database.config.ts
│   ├── common/
│   │   ├── base.entity.ts
│   │   └── base.dto.ts
│   ├── group/
│   │   ├── group.module.ts
│   │   ├── group.entity.ts
│   │   ├── group.dto.ts
│   │   ├── group.service.ts
│   │   └── group.controller.ts
│   ├── person/
│   │   ├── person.module.ts
│   │   ├── person.entity.ts
│   │   ├── person.dto.ts
│   │   ├── person.service.ts
│   │   ├── person.controller.ts
│   │   └── person-group-relation.entity.ts
│   ├── event/
│   │   ├── event.module.ts
│   │   ├── event.entity.ts
│   │   ├── event.dto.ts
│   │   ├── event.service.ts
│   │   ├── event.controller.ts
│   │   ├── event-summary.entity.ts
│   │   ├── event-detail.entity.ts
│   │   ├── event-relation.entity.ts
│   │   ├── person-event-relation.entity.ts
│   │   └── event-location-relation.entity.ts
│   ├── source/
│   │   ├── source.module.ts
│   │   ├── source.entity.ts
│   │   ├── source.dto.ts
│   │   ├── source.service.ts
│   │   ├── source.controller.ts
│   │   └── source-relation.entity.ts
│   ├── location/
│   │   ├── location.module.ts
│   │   ├── location.entity.ts
│   │   ├── location.dto.ts
│   │   ├── location.service.ts
│   │   └── location.controller.ts
│   └── timeline/
│   │   ├── timeline.module.ts
│   │   ├── timeline.service.ts
│   │   └── timeline.controller.ts
│   └── migrations/
└── test/
```

---

## Task 1: 项目初始化

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/nest-cli.json`
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`

- [ ] **Step 1: 创建 NestJS 项目**

```bash
cd m:/jiachen/mch-prc
nest new backend --package-manager npm --skip-git --strict
```

- [ ] **Step 2: 安装依赖**

```bash
cd backend
npm install @nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/config
npm install -D @types/pg
```

- [ ] **Step 3: 创建配置目录结构**

```bash
mkdir -p src/config src/common src/group src/person src/event src/source src/location src/timeline src/migrations
```

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "init: NestJS project scaffold"
```

---

## Task 2: 数据库配置

**Files:**
- Create: `backend/src/config/database.config.ts`
- Create: `backend/.env`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: 创建环境变量文件**

```env
# backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=mch_prc
PORT=3000
```

- [ ] **Step 2: 创建数据库配置**

```typescript
// backend/src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // 开发环境自动同步
  logging: true,
});
```

- [ ] **Step 3: 修改 app.module.ts**

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "config: database connection with PostgreSQL"
```

---

## Task 3: 公共基础类

**Files:**
- Create: `backend/src/common/base.entity.ts`
- Create: `backend/src/common/base.dto.ts`

- [ ] **Step 1: 创建基础 Entity**

```typescript
// backend/src/common/base.entity.ts
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
```

- [ ] **Step 2: 创建基础 DTO**

```typescript
// backend/src/common/base.dto.ts
import { IsInt, IsOptional } from 'class-validator';

export class BaseListDTO {
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  pageSize?: number = 20;
}

export class BaseResultDTO {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 3: 提交**

```bash
git add .
git commit -m "common: base entity and dto"
```

---

## Task 4: Group 模块

**Files:**
- Create: `backend/src/group/group.entity.ts`
- Create: `backend/src/group/group.dto.ts`
- Create: `backend/src/group/group.module.ts`
- Create: `backend/src/group/group.service.ts`
- Create: `backend/src/group/group.controller.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: 创建 Group Entity**

```typescript
// backend/src/group/group.entity.ts
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';

@Entity({ name: 'group' })
export class GroupEntity extends BaseEntity {
  @Column('varchar', { length: 100, nullable: false })
  name: string;

  @Column('int', { name: 'parent_id', nullable: true })
  parentId: number;

  @ManyToOne(() => GroupEntity, (group) => group.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: GroupEntity;

  @OneToMany(() => GroupEntity, (group) => group.parent)
  children: GroupEntity[];

  @Column('varchar', { length: 50, name: 'type', nullable: true })
  type: string; // 党派/军阀/学派/其他

  @Column('text', { nullable: true })
  description: string;
}
```

- [ ] **Step 2: 创建 Group DTO**

```typescript
// backend/src/group/group.dto.ts
import { IsString, IsOptional, IsInt } from 'class-validator';
import { BaseListDTO, BaseResultDTO } from 'src/common/base.dto';

export class GroupCreateDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class GroupUpdateDTO extends GroupCreateDTO {
  @IsInt()
  id: number;
}

export class GroupListDTO extends BaseListDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class GroupResultDTO extends BaseResultDTO {
  name: string;
  parentId: number;
  type: string;
  description: string;
}
```

- [ ] **Step 3: 创建 Group Service**

```typescript
// backend/src/group/group.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from './group.entity';
import { GroupCreateDTO, GroupUpdateDTO, GroupListDTO, GroupResultDTO } from './group.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly repo: Repository<GroupEntity>,
  ) {}

  async create(dto: GroupCreateDTO): Promise<GroupResultDTO> {
    const entity = plainToClass(GroupEntity, dto);
    await this.repo.save(entity);
    return plainToClass(GroupResultDTO, entity);
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
    return { data: data.map(d => plainToClass(GroupResultDTO, d)), count };
  }

  async findById(id: number): Promise<GroupResultDTO | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['parent', 'children'] });
    return entity ? plainToClass(GroupResultDTO, entity) : null;
  }

  async update(dto: GroupUpdateDTO): Promise<GroupResultDTO> {
    const entity = await this.repo.findOne({ where: { id: dto.id } });
    if (!entity) throw new Error('Group not found');
    Object.assign(entity, dto);
    await this.repo.save(entity);
    return plainToClass(GroupResultDTO, entity);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async tree(): Promise<GroupEntity[]> {
    const all = await this.repo.find({ relations: ['children'] });
    return all.filter(g => !g.parentId);
  }
}
```

- [ ] **Step 4: 创建 Group Controller**

```typescript
// backend/src/group/group.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupCreateDTO, GroupUpdateDTO, GroupListDTO } from './group.dto';

@Controller('api/group')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Post()
  create(@Body() dto: GroupCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: GroupListDTO) {
    return this.service.list(dto);
  }

  @Get('/tree')
  tree() {
    return this.service.tree();
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: GroupUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
```

- [ ] **Step 5: 创建 Group Module**

```typescript
// backend/src/group/group.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupEntity } from './group.entity';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GroupEntity])],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
```

- [ ] **Step 6: 注册到 AppModule**

```typescript
// backend/src/app.module.ts (追加 import)
import { GroupModule } from './group/group.module';

@Module({
  imports: [
    // ... 原有 imports
    GroupModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 7: 提交**

```bash
git add .
git commit -m "feat: group module CRUD"
```

---

## Task 5: Person 模块

**Files:**
- Create: `backend/src/person/person.entity.ts`
- Create: `backend/src/person/person.dto.ts`
- Create: `backend/src/person/person-group-relation.entity.ts`
- Create: `backend/src/person/person.module.ts`
- Create: `backend/src/person/person.service.ts`
- Create: `backend/src/person/person.controller.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: 创建 Person Entity**

```typescript
// backend/src/person/person.entity.ts
import { Entity, Column } from 'typeorm';
import BaseEntity from 'src/common/base.entity';

@Entity({ name: 'person' })
export class PersonEntity extends BaseEntity {
  @Column('varchar', { length: 100, nullable: false })
  name: string;

  @Column('int', { name: 'birth_year', nullable: true })
  birthYear: number;

  @Column('int', { name: 'death_year', nullable: true })
  deathYear: number;

  @Column('varchar', { length: 10, nullable: true })
  gender: string;

  @Column('text', { name: 'bio_summary', nullable: true })
  bioSummary: string;
}
```

- [ ] **Step 2: 创建 PersonGroupRelation Entity**

```typescript
// backend/src/person/person-group-relation.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { PersonEntity } from './person.entity';
import { GroupEntity } from 'src/group/group.entity';

@Entity({ name: 'person_group_relation' })
export class PersonGroupRelationEntity extends BaseEntity {
  @Column('int', { name: 'person_id' })
  personId: number;

  @ManyToOne(() => PersonEntity)
  @JoinColumn({ name: 'person_id' })
  person: PersonEntity;

  @Column('int', { name: 'group_id' })
  groupId: number;

  @ManyToOne(() => GroupEntity)
  @JoinColumn({ name: 'group_id' })
  group: GroupEntity;

  @Column('date', { name: 'start_date', nullable: true })
  startDate: Date;

  @Column('date', { name: 'end_date', nullable: true })
  endDate: Date;

  @Column('varchar', { length: 100, nullable: true })
  role: string;
}
```

- [ ] **Step 3: 创建 Person DTO**

```typescript
// backend/src/person/person.dto.ts
import { IsString, IsOptional, IsInt, IsDate } from 'class-validator';
import { BaseListDTO, BaseResultDTO } from 'src/common/base.dto';

export class PersonCreateDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  birthYear?: number;

  @IsOptional()
  @IsInt()
  deathYear?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bioSummary?: string;
}

export class PersonUpdateDTO extends PersonCreateDTO {
  @IsInt()
  id: number;
}

export class PersonListDTO extends BaseListDTO {
  @IsOptional()
  @IsString()
  name?: string;
}

export class PersonResultDTO extends BaseResultDTO {
  name: string;
  birthYear: number;
  deathYear: number;
  gender: string;
  bioSummary: string;
}

export class PersonGroupRelationDTO {
  @IsInt()
  personId: number;

  @IsInt()
  groupId: number;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  @IsString()
  role?: string;
}
```

- [ ] **Step 4: 创建 Person Service**

```typescript
// backend/src/person/person.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonEntity } from './person.entity';
import { PersonGroupRelationEntity } from './person-group-relation.entity';
import { PersonCreateDTO, PersonUpdateDTO, PersonListDTO, PersonResultDTO, PersonGroupRelationDTO } from './person.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly personRepo: Repository<PersonEntity>,
    @InjectRepository(PersonGroupRelationEntity)
    private readonly relationRepo: Repository<PersonGroupRelationEntity>,
  ) {}

  async create(dto: PersonCreateDTO): Promise<PersonResultDTO> {
    const entity = plainToClass(PersonEntity, dto);
    await this.personRepo.save(entity);
    return plainToClass(PersonResultDTO, entity);
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
    return { data: data.map(d => plainToClass(PersonResultDTO, d)), count };
  }

  async findById(id: number): Promise<PersonResultDTO | null> {
    const entity = await this.personRepo.findOne({ where: { id } });
    return entity ? plainToClass(PersonResultDTO, entity) : null;
  }

  async update(dto: PersonUpdateDTO): Promise<PersonResultDTO> {
    const entity = await this.personRepo.findOne({ where: { id: dto.id } });
    if (!entity) throw new Error('Person not found');
    Object.assign(entity, dto);
    await this.personRepo.save(entity);
    return plainToClass(PersonResultDTO, entity);
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

  async getEvents(personId: number) {
    // 后续在 event 模块实现后补充
    return [];
  }

  async addGroupRelation(dto: PersonGroupRelationDTO) {
    const entity = plainToClass(PersonGroupRelationEntity, dto);
    await this.relationRepo.save(entity);
    return entity;
  }

  async removeGroupRelation(id: number) {
    await this.relationRepo.delete(id);
  }
}
```

- [ ] **Step 5: 创建 Person Controller**

```typescript
// backend/src/person/person.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonCreateDTO, PersonUpdateDTO, PersonListDTO, PersonGroupRelationDTO } from './person.dto';

@Controller('api/person')
export class PersonController {
  constructor(private readonly service: PersonService) {}

  @Post()
  create(@Body() dto: PersonCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: PersonListDTO) {
    return this.service.list(dto);
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: PersonUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }

  @Get('/:id/groups')
  getGroups(@Param('id') id: number) {
    return this.service.getGroups(id);
  }

  @Get('/:id/events')
  getEvents(@Param('id') id: number) {
    return this.service.getEvents(id);
  }

  @Post('/group-relation')
  addGroupRelation(@Body() dto: PersonGroupRelationDTO) {
    return this.service.addGroupRelation(dto);
  }

  @Delete('/group-relation/:id')
  removeGroupRelation(@Param('id') id: number) {
    return this.service.removeGroupRelation(id);
  }
}
```

- [ ] **Step 6: 创建 Person Module**

```typescript
// backend/src/person/person.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonEntity } from './person.entity';
import { PersonGroupRelationEntity } from './person-group-relation.entity';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { GroupModule } from 'src/group/group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PersonEntity, PersonGroupRelationEntity]),
    GroupModule,
  ],
  controllers: [PersonController],
  providers: [PersonService],
  exports: [PersonService],
})
export class PersonModule {}
```

- [ ] **Step 7: 注册到 AppModule**

```typescript
// backend/src/app.module.ts (追加)
import { PersonModule } from './person/person.module';

@Module({
  imports: [
    // ... 原有
    PersonModule,
  ],
})
```

- [ ] **Step 8: 提交**

```bash
git add .
git commit -m "feat: person module CRUD and group relation"
```

---

## Task 6: Event 模块 (核心)

**Files:**
- Create: `backend/src/event/event.entity.ts`
- Create: `backend/src/event/event-summary.entity.ts`
- Create: `backend/src/event/event-detail.entity.ts`
- Create: `backend/src/event/event-relation.entity.ts`
- Create: `backend/src/event/person-event-relation.entity.ts`
- Create: `backend/src/event/event-location-relation.entity.ts`
- Create: `backend/src/event/event.dto.ts`
- Create: `backend/src/event/event.module.ts`
- Create: `backend/src/event/event.service.ts`
- Create: `backend/src/event/event.controller.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: 创建 Event Entity**

```typescript
// backend/src/event/event.entity.ts
import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventSummaryEntity } from './event-summary.entity';
import { EventDetailEntity } from './event-detail.entity';

@Entity({ name: 'event' })
export class EventEntity extends BaseEntity {
  @Column('varchar', { length: 200, nullable: false })
  title: string;

  @Column('date', { name: 'start_date', nullable: false })
  startDate: Date;

  @Column('date', { name: 'end_date', nullable: true })
  endDate: Date;

  @Column('boolean', { name: 'is_instant', default: false })
  isInstant: boolean;

  @Column('varchar', { length: 50, name: 'event_type', nullable: true })
  eventType: string; // 战争/条约/运动/起义/改革/其他

  @OneToOne(() => EventSummaryEntity, (summary) => summary.event)
  summary: EventSummaryEntity;

  @OneToOne(() => EventDetailEntity, (detail) => detail.event)
  detail: EventDetailEntity;
}
```

- [ ] **Step 2: 创建 EventSummary Entity**

```typescript
// backend/src/event/event-summary.entity.ts
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';

@Entity({ name: 'event_summary' })
export class EventSummaryEntity extends BaseEntity {
  @Column('int', { name: 'event_id', unique: true })
  eventId: number;

  @OneToOne(() => EventEntity, (event) => event.summary)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column('text', { nullable: true })
  content: string;
}
```

- [ ] **Step 3: 创建 EventDetail Entity**

```typescript
// backend/src/event/event-detail.entity.ts
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';

@Entity({ name: 'event_detail' })
export class EventDetailEntity extends BaseEntity {
  @Column('int', { name: 'event_id', unique: true })
  eventId: number;

  @OneToOne(() => EventEntity, (event) => event.detail)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column('text', { nullable: true })
  motive: string;

  @Column('text', { nullable: true })
  process: string;

  @Column('text', { nullable: true })
  result: string;

  @Column('text', { nullable: true })
  impact: string;
}
```

- [ ] **Step 4: 创建 EventRelation Entity**

```typescript
// backend/src/event/event-relation.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';

@Entity({ name: 'event_relation' })
export class EventRelationEntity extends BaseEntity {
  @Column('int', { name: 'event_id_a' })
  eventIdA: number;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id_a' })
  eventA: EventEntity;

  @Column('int', { name: 'event_id_b' })
  eventIdB: number;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id_b' })
  eventB: EventEntity;

  @Column('varchar', { length: 50, name: 'relation_type' })
  relationType: string; // 导致/促成/对立/延续/间接影响/其他

  @Column('text', { nullable: true })
  description: string;
}
```

- [ ] **Step 5: 创建 PersonEventRelation Entity**

```typescript
// backend/src/event/person-event-relation.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';
import { PersonEntity } from 'src/person/person.entity';

@Entity({ name: 'person_event_relation' })
export class PersonEventRelationEntity extends BaseEntity {
  @Column('int', { name: 'person_id' })
  personId: number;

  @ManyToOne(() => PersonEntity)
  @JoinColumn({ name: 'person_id' })
  person: PersonEntity;

  @Column('int', { name: 'event_id' })
  eventId: number;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column('varchar', { length: 50, name: 'role_type' })
  roleType: string; // 领导者/参与者/决策者/对立者/受害者/其他

  @Column('text', { name: 'role_description', nullable: true })
  roleDescription: string;
}
```

- [ ] **Step 6: 创建 EventLocationRelation Entity**

```typescript
// backend/src/event/event-location-relation.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';
import { LocationEntity } from 'src/location/location.entity';

@Entity({ name: 'event_location_relation' })
export class EventLocationRelationEntity extends BaseEntity {
  @Column('int', { name: 'event_id' })
  eventId: number;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column('int', { name: 'location_id' })
  locationId: number;

  @ManyToOne(() => LocationEntity)
  @JoinColumn({ name: 'location_id' })
  location: LocationEntity;

  @Column('varchar', { length: 50, name: 'relation_type' })
  relationType: string; // 发生地/主要地点/涉及地点
}
```

- [ ] **Step 7: 创建 Event DTO**

```typescript
// backend/src/event/event.dto.ts
import { IsString, IsOptional, IsInt, IsBoolean, IsDate } from 'class-validator';
import { BaseListDTO, BaseResultDTO } from 'src/common/base.dto';

export class EventCreateDTO {
  @IsString()
  title: string;

  @IsDate()
  startDate: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isInstant?: boolean;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  summaryContent?: string;

  @IsOptional()
  @IsString()
  motive?: string;

  @IsOptional()
  @IsString()
  process?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  impact?: string;
}

export class EventUpdateDTO extends EventCreateDTO {
  @IsInt()
  id: number;
}

export class EventListDTO extends BaseListDTO {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsInt()
  groupId?: number;

  @IsOptional()
  @IsInt()
  personId?: number;
}

export class EventResultDTO extends BaseResultDTO {
  title: string;
  startDate: Date;
  endDate: Date;
  isInstant: boolean;
  eventType: string;
  summary?: { content: string };
  detail?: { motive: string; process: string; result: string; impact: string };
}

export class EventRelationDTO {
  @IsInt()
  eventIdA: number;

  @IsInt()
  eventIdB: number;

  @IsString()
  relationType: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PersonEventRelationDTO {
  @IsInt()
  personId: number;

  @IsInt()
  eventId: number;

  @IsString()
  roleType: string;

  @IsOptional()
  @IsString()
  roleDescription?: string;
}
```

- [ ] **Step 8: 创建 Event Service**

```typescript
// backend/src/event/event.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { EventEntity } from './event.entity';
import { EventSummaryEntity } from './event-summary.entity';
import { EventDetailEntity } from './event-detail.entity';
import { EventRelationEntity } from './event-relation.entity';
import { PersonEventRelationEntity } from './person-event-relation.entity';
import { EventCreateDTO, EventUpdateDTO, EventListDTO, EventResultDTO, EventRelationDTO, PersonEventRelationDTO } from './event.dto';
import { plainToClass } from 'class-transformer';

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
  ) {}

  async create(dto: EventCreateDTO): Promise<EventResultDTO> {
    const event = plainToClass(EventEntity, dto);
    await this.eventRepo.save(event);

    if (dto.summaryContent) {
      const summary = this.summaryRepo.create({ eventId: event.id, content: dto.summaryContent });
      await this.summaryRepo.save(summary);
    }
    if (dto.motive || dto.process || dto.result || dto.impact) {
      const detail = this.detailRepo.create({
        eventId: event.id,
        motive: dto.motive,
        process: dto.process,
        result: dto.result,
        impact: dto.impact,
      });
      await this.detailRepo.save(detail);
    }

    return this.findById(event.id);
  }

  async list(dto: EventListDTO): Promise<{ data: EventResultDTO[]; count: number }> {
    const where: any = {};
    if (dto.title) where.title = Like(`%${dto.title}%`);
    if (dto.eventType) where.eventType = dto.eventType;

    // TODO: startDate/endDate/groupId/personId 筛选需复杂查询

    const count = await this.eventRepo.count({ where });
    const data = await this.eventRepo.find({
      where,
      relations: ['summary', 'detail'],
      order: { startDate: 'ASC' },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
    });
    return { data: data.map(d => this.toResult(d)), count };
  }

  async findById(id: number): Promise<EventResultDTO | null> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['summary', 'detail'],
    });
    return event ? this.toResult(event) : null;
  }

  private toResult(event: EventEntity): EventResultDTO {
    const result = plainToClass(EventResultDTO, event);
    if (event.summary) result.summary = { content: event.summary.content };
    if (event.detail) result.detail = {
      motive: event.detail.motive,
      process: event.detail.process,
      result: event.detail.result,
      impact: event.detail.impact,
    };
    return result;
  }

  async update(dto: EventUpdateDTO): Promise<EventResultDTO> {
    const event = await this.eventRepo.findOne({ where: { id: dto.id } });
    if (!event) throw new Error('Event not found');

    Object.assign(event, { title: dto.title, startDate: dto.startDate, endDate: dto.endDate, isInstant: dto.isInstant, eventType: dto.eventType });
    await this.eventRepo.save(event);

    if (dto.summaryContent) {
      let summary = await this.summaryRepo.findOne({ where: { eventId: dto.id } });
      if (!summary) summary = this.summaryRepo.create({ eventId: dto.id });
      summary.content = dto.summaryContent;
      await this.summaryRepo.save(summary);
    }

    if (dto.motive || dto.process || dto.result || dto.impact) {
      let detail = await this.detailRepo.findOne({ where: { eventId: dto.id } });
      if (!detail) detail = this.detailRepo.create({ eventId: dto.id });
      Object.assign(detail, { motive: dto.motive, process: dto.process, result: dto.result, impact: dto.impact });
      await this.detailRepo.save(detail);
    }

    return this.findById(dto.id);
  }

  async delete(id: number): Promise<void> {
    await this.summaryRepo.delete({ eventId: id });
    await this.detailRepo.delete({ eventId: id });
    await this.personEventRepo.delete({ eventId: id });
    await this.relationRepo.delete({ eventIdA: id });
    await this.relationRepo.delete({ eventIdB: id });
    await this.eventRepo.delete(id);
  }

  async getRelations(eventId: number) {
    return this.relationRepo.find({
      where: [{ eventIdA: eventId }, { eventIdB: eventId }],
      relations: ['eventA', 'eventB'],
    });
  }

  async addRelation(dto: EventRelationDTO) {
    const entity = plainToClass(EventRelationEntity, dto);
    await this.relationRepo.save(entity);
    return entity;
  }

  async removeRelation(id: number) {
    await this.relationRepo.delete(id);
  }

  async getPersons(eventId: number) {
    return this.personEventRepo.find({
      where: { eventId },
      relations: ['person'],
    });
  }

  async addPersonRelation(dto: PersonEventRelationDTO) {
    const entity = plainToClass(PersonEventRelationEntity, dto);
    await this.personEventRepo.save(entity);
    return entity;
  }

  async removePersonRelation(id: number) {
    await this.personEventRepo.delete(id);
  }
}
```

- [ ] **Step 9: 创建 Event Controller**

```typescript
// backend/src/event/event.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { EventCreateDTO, EventUpdateDTO, EventListDTO, EventRelationDTO, PersonEventRelationDTO } from './event.dto';

@Controller('api/event')
export class EventController {
  constructor(private readonly service: EventService) {}

  @Post()
  create(@Body() dto: EventCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: EventListDTO) {
    return this.service.list(dto);
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: EventUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }

  @Get('/:id/relations')
  getRelations(@Param('id') id: number) {
    return this.service.getRelations(id);
  }

  @Post('/relation')
  addRelation(@Body() dto: EventRelationDTO) {
    return this.service.addRelation(dto);
  }

  @Delete('/relation/:id')
  removeRelation(@Param('id') id: number) {
    return this.service.removeRelation(id);
  }

  @Get('/:id/persons')
  getPersons(@Param('id') id: number) {
    return this.service.getPersons(id);
  }

  @Post('/person-relation')
  addPersonRelation(@Body() dto: PersonEventRelationDTO) {
    return this.service.addPersonRelation(dto);
  }

  @Delete('/person-relation/:id')
  removePersonRelation(@Param('id') id: number) {
    return this.service.removePersonRelation(id);
  }
}
```

- [ ] **Step 10: 创建 Event Module**

```typescript
// backend/src/event/event.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './event.entity';
import { EventSummaryEntity } from './event-summary.entity';
import { EventDetailEntity } from './event-detail.entity';
import { EventRelationEntity } from './event-relation.entity';
import { PersonEventRelationEntity } from './person-event-relation.entity';
import { EventLocationRelationEntity } from './event-location-relation.entity';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PersonModule } from 'src/person/person.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, EventSummaryEntity, EventDetailEntity, EventRelationEntity, PersonEventRelationEntity, EventLocationRelationEntity]),
    PersonModule,
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
```

- [ ] **Step 11: 注册到 AppModule**

```typescript
// backend/src/app.module.ts (追加)
import { EventModule } from './event/event.module';

@Module({
  imports: [
    // ... 原有
    EventModule,
  ],
})
```

- [ ] **Step 12: 提交**

```bash
git add .
git commit -m "feat: event module with summary/detail/relation"
```

---

## Task 7: Source 模块

**Files:**
- Create: `backend/src/source/source.entity.ts`
- Create: `backend/src/source/source-relation.entity.ts`
- Create: `backend/src/source/source.dto.ts`
- Create: `backend/src/source/source.module.ts`
- Create: `backend/src/source/source.service.ts`
- Create: `backend/src/source/source.controller.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: 创建 Source Entity**

```typescript
// backend/src/source/source.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { SourceRelationEntity } from './source-relation.entity';

@Entity({ name: 'source' })
export class SourceEntity extends BaseEntity {
  @Column('varchar', { length: 200, nullable: false })
  title: string;

  @Column('varchar', { length: 100, nullable: true })
  author: string;

  @Column('varchar', { length: 100, nullable: true })
  publisher: string;

  @Column('int', { name: 'publish_year', nullable: true })
  publishYear: number;

  @Column('varchar', { length: 500, nullable: true })
  url: string;

  @Column('varchar', { length: 50, name: 'source_type', nullable: true })
  sourceType: string; // 书籍/档案/网站/期刊/其他

  @OneToMany(() => SourceRelationEntity, (rel) => rel.source)
  relations: SourceRelationEntity[];
}
```

- [ ] **Step 2: 创建 SourceRelation Entity**

```typescript
// backend/src/source/source-relation.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { SourceEntity } from './source.entity';

@Entity({ name: 'source_relation' })
export class SourceRelationEntity extends BaseEntity {
  @Column('int', { name: 'source_id' })
  sourceId: number;

  @ManyToOne(() => SourceEntity, (source) => source.relations)
  @JoinColumn({ name: 'source_id' })
  source: SourceEntity;

  @Column('varchar', { length: 50, name: 'target_type' })
  targetType: string; // event_summary/event_detail/person/group

  @Column('int', { name: 'target_id' })
  targetId: number;

  @Column('varchar', { length: 50, name: 'citation_type' })
  citationType: string; // 主要参考/补充参考/对比参考
}
```

- [ ] **Step 3: 创建 Source DTO**

```typescript
// backend/src/source/source.dto.ts
import { IsString, IsOptional, IsInt } from 'class-validator';
import { BaseListDTO, BaseResultDTO } from 'src/common/base.dto';

export class SourceCreateDTO {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsInt()
  publishYear?: number;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;
}

export class SourceUpdateDTO extends SourceCreateDTO {
  @IsInt()
  id: number;
}

export class SourceListDTO extends BaseListDTO {
  @IsOptional()
  @IsString()
  title?: string;
}

export class SourceResultDTO extends BaseResultDTO {
  title: string;
  author: string;
  publisher: string;
  publishYear: number;
  url: string;
  sourceType: string;
}

export class SourceRelationDTO {
  @IsInt()
  sourceId: number;

  @IsString()
  targetType: string;

  @IsInt()
  targetId: number;

  @IsString()
  citationType: string;
}
```

- [ ] **Step 4: 创建 Source Service**

```typescript
// backend/src/source/source.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SourceEntity } from './source.entity';
import { SourceRelationEntity } from './source-relation.entity';
import { SourceCreateDTO, SourceUpdateDTO, SourceListDTO, SourceResultDTO, SourceRelationDTO } from './source.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class SourceService {
  constructor(
    @InjectRepository(SourceEntity)
    private readonly sourceRepo: Repository<SourceEntity>,
    @InjectRepository(SourceRelationEntity)
    private readonly relationRepo: Repository<SourceRelationEntity>,
  ) {}

  async create(dto: SourceCreateDTO): Promise<SourceResultDTO> {
    const entity = plainToClass(SourceEntity, dto);
    await this.sourceRepo.save(entity);
    return plainToClass(SourceResultDTO, entity);
  }

  async list(dto: SourceListDTO): Promise<{ data: SourceResultDTO[]; count: number }> {
    const where: any = {};
    if (dto.title) where.title = Like(`%${dto.title}%`);

    const count = await this.sourceRepo.count({ where });
    const data = await this.sourceRepo.find({
      where,
      order: { id: 'DESC' },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
    });
    return { data: data.map(d => plainToClass(SourceResultDTO, d)), count };
  }

  async findById(id: number): Promise<SourceResultDTO | null> {
    const entity = await this.sourceRepo.findOne({ where: { id } });
    return entity ? plainToClass(SourceResultDTO, entity) : null;
  }

  async update(dto: SourceUpdateDTO): Promise<SourceResultDTO> {
    const entity = await this.sourceRepo.findOne({ where: { id: dto.id } });
    if (!entity) throw new Error('Source not found');
    Object.assign(entity, dto);
    await this.sourceRepo.save(entity);
    return plainToClass(SourceResultDTO, entity);
  }

  async delete(id: number): Promise<void> {
    await this.relationRepo.delete({ sourceId: id });
    await this.sourceRepo.delete(id);
  }

  async getCitations(sourceId: number) {
    return this.relationRepo.find({ where: { sourceId } });
  }

  async addRelation(dto: SourceRelationDTO) {
    const entity = plainToClass(SourceRelationEntity, dto);
    await this.relationRepo.save(entity);
    return entity;
  }

  async removeRelation(id: number) {
    await this.relationRepo.delete(id);
  }

  async findByTarget(targetType: string, targetId: number) {
    return this.relationRepo.find({
      where: { targetType, targetId },
      relations: ['source'],
    });
  }
}
```

- [ ] **Step 5: 创建 Source Controller**

```typescript
// backend/src/source/source.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SourceService } from './source.service';
import { SourceCreateDTO, SourceUpdateDTO, SourceListDTO, SourceRelationDTO } from './source.dto';

@Controller('api/source')
export class SourceController {
  constructor(private readonly service: SourceService) {}

  @Post()
  create(@Body() dto: SourceCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: SourceListDTO) {
    return this.service.list(dto);
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: SourceUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }

  @Get('/:id/citations')
  getCitations(@Param('id') id: number) {
    return this.service.getCitations(id);
  }

  @Post('/relation')
  addRelation(@Body() dto: SourceRelationDTO) {
    return this.service.addRelation(dto);
  }

  @Delete('/relation/:id')
  removeRelation(@Param('id') id: number) {
    return this.service.removeRelation(id);
  }
}
```

- [ ] **Step 6: 创建 Source Module**

```typescript
// backend/src/source/source.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourceEntity } from './source.entity';
import { SourceRelationEntity } from './source-relation.entity';
import { SourceService } from './source.service';
import { SourceController } from './source.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SourceEntity, SourceRelationEntity])],
  controllers: [SourceController],
  providers: [SourceService],
  exports: [SourceService],
})
export class SourceModule {}
```

- [ ] **Step 7: 注册到 AppModule**

```typescript
// backend/src/app.module.ts (追加)
import { SourceModule } from './source/source.module';
```

- [ ] **Step 8: 提交**

```bash
git add .
git commit -m "feat: source module with citation tracking"
```

---

## Task 8: Location 模块

**Files:**
- Create: `backend/src/location/location.entity.ts`
- Create: `backend/src/location/location.dto.ts`
- Create: `backend/src/location/location.module.ts`
- Create: `backend/src/location/location.service.ts`
- Create: `backend/src/location/location.controller.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: 创建 Location Entity**

```typescript
// backend/src/location/location.entity.ts
import { Entity, Column } from 'typeorm';
import BaseEntity from 'src/common/base.entity';

@Entity({ name: 'location' })
export class LocationEntity extends BaseEntity {
  @Column('varchar', { length: 100, nullable: false })
  name: string;

  @Column('varchar', { length: 50, nullable: true })
  province: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;
}
```

- [ ] **Step 2: 创建 Location DTO**

```typescript
// backend/src/location/location.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { BaseListDTO, BaseResultDTO } from 'src/common/base.dto';

export class LocationCreateDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class LocationUpdateDTO extends LocationCreateDTO {
  @IsNumber()
  id: number;
}

export class LocationListDTO extends BaseListDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  province?: string;
}

export class LocationResultDTO extends BaseResultDTO {
  name: string;
  province: string;
  latitude: number;
  longitude: number;
}
```

- [ ] **Step 3: 创建 Location Service**

```typescript
// backend/src/location/location.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { LocationEntity } from './location.entity';
import { LocationCreateDTO, LocationUpdateDTO, LocationListDTO, LocationResultDTO } from './location.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private readonly repo: Repository<LocationEntity>,
  ) {}

  async create(dto: LocationCreateDTO): Promise<LocationResultDTO> {
    const entity = plainToClass(LocationEntity, dto);
    await this.repo.save(entity);
    return plainToClass(LocationResultDTO, entity);
  }

  async list(dto: LocationListDTO): Promise<{ data: LocationResultDTO[]; count: number }> {
    const where: any = {};
    if (dto.name) where.name = Like(`%${dto.name}%`);
    if (dto.province) where.province = dto.province;

    const count = await this.repo.count({ where });
    const data = await this.repo.find({
      where,
      order: { id: 'DESC' },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
    });
    return { data: data.map(d => plainToClass(LocationResultDTO, d)), count };
  }

  async findById(id: number): Promise<LocationResultDTO | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? plainToClass(LocationResultDTO, entity) : null;
  }

  async update(dto: LocationUpdateDTO): Promise<LocationResultDTO> {
    const entity = await this.repo.findOne({ where: { id: dto.id } });
    if (!entity) throw new Error('Location not found');
    Object.assign(entity, dto);
    await this.repo.save(entity);
    return plainToClass(LocationResultDTO, entity);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
```

- [ ] **Step 4: 创建 Location Controller**

```typescript
// backend/src/location/location.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationCreateDTO, LocationUpdateDTO, LocationListDTO } from './location.dto';

@Controller('api/location')
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Post()
  create(@Body() dto: LocationCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: LocationListDTO) {
    return this.service.list(dto);
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: LocationUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
```

- [ ] **Step 5: 创建 Location Module**

```typescript
// backend/src/location/location.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationEntity } from './location.entity';
import { EventLocationRelationEntity } from 'src/event/event-location-relation.entity';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LocationEntity, EventLocationRelationEntity])],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
```

- [ ] **Step 6: 注册到 AppModule**

```typescript
// backend/src/app.module.ts (追加)
import { LocationModule } from './location/location.module';
```

- [ ] **Step 7: 提交**

```bash
git add .
git commit -m "feat: location module CRUD"
```

---

## Task 9: Timeline 模块（核心可视化）

**Files:**
- Create: `backend/src/timeline/timeline.module.ts`
- Create: `backend/src/timeline/timeline.service.ts`
- Create: `backend/src/timeline/timeline.controller.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: 创建 Timeline Service**

```typescript
// backend/src/timeline/timeline.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEntity } from 'src/event/event.entity';
import { PersonEventRelationEntity } from 'src/event/person-event-relation.entity';
import { GroupEntity } from 'src/group/group.entity';
import { PersonGroupRelationEntity } from 'src/person/person-group-relation.entity';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(PersonEventRelationEntity)
    private readonly personEventRepo: Repository<PersonEventRelationEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
    @InjectRepository(PersonGroupRelationEntity)
    private readonly groupRelationRepo: Repository<PersonGroupRelationEntity>,
  ) {}

  async getMatrix(startDate: Date, endDate: Date, groupBy: 'group' | 'person', groupId?: number, personId?: number, eventType?: string) {
    // 生成时间列
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const columns: string[] = [];
    for (let year = startYear; year <= endYear; year++) {
      columns.push(String(year));
    }

    // 获取事件
    const events = await this.eventRepo.find({
      where: {
        startDate: Between(startDate, endDate),
        ...(eventType ? { eventType } : {}),
      },
      relations: ['summary'],
      order: { startDate: 'ASC' },
    });

    // 获取事件-人物关联
    const personEventRelations = await this.personEventRepo.find({
      relations: ['person', 'event'],
    });

    // 获取人物-群体关联
    const groupRelations = await this.groupRelationRepo.find({
      relations: ['person', 'group'],
    });

    // 按群体或人物分组
    let rows: any[] = [];

    if (groupBy === 'group') {
      const groups = await this.groupRepo.find();
      rows = groups.map(group => {
        // 找到该群体下的所有人物
        const groupPersons = groupRelations.filter(r => r.groupId === group.id).map(r => r.personId);
        // 找到这些人物参与的事件
        const groupEvents = personEventRelations
          .filter(r => groupPersons.includes(r.personId))
          .map(r => r.eventId);
        // 匹配事件到年份
        const matchedEvents = events.filter(e => groupEvents.includes(e.id)).map(e => ({
          eventId: e.id,
          title: e.title,
          year: String(e.startDate.getFullYear()),
        }));

        return {
          id: group.id,
          name: group.name,
          type: 'group',
          events: matchedEvents,
        };
      });
    } else {
      // 按人物分组
      const personIds = personEventRelations.map(r => r.personId);
      const uniquePersonIds = [...new Set(personIds)];

      rows = uniquePersonIds.map(personId => {
        const relation = personEventRelations.find(r => r.personId === personId);
        const personEvents = personEventRelations
          .filter(r => r.personId === personId)
          .map(r => r.eventId);
        const matchedEvents = events.filter(e => personEvents.includes(e.id)).map(e => ({
          eventId: e.id,
          title: e.title,
          year: String(e.startDate.getFullYear()),
        }));

        return {
          id: personId,
          name: relation?.person?.name || `人物${personId}`,
          type: 'person',
          events: matchedEvents,
        };
      });
    }

    return { columns, rows };
  }
}
```

- [ ] **Step 2: 创建 Timeline Controller**

```typescript
// backend/src/timeline/timeline.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { TimelineService } from './timeline.service';

@Controller('api/timeline')
export class TimelineController {
  constructor(private readonly service: TimelineService) {}

  @Get('/matrix')
  async getMatrix(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('groupBy') groupBy: 'group' | 'person' = 'group',
    @Query('groupId') groupId?: number,
    @Query('personId') personId?: number,
    @Query('eventType') eventType?: string,
  ) {
    const startDate = new Date(startDateStr || '1840-01-01');
    const endDate = new Date(endDateStr || '1949-12-31');
    return this.service.getMatrix(startDate, endDate, groupBy, groupId, personId, eventType);
  }
}
```

- [ ] **Step 3: 创建 Timeline Module**

```typescript
// backend/src/timeline/timeline.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from 'src/event/event.entity';
import { PersonEventRelationEntity } from 'src/event/person-event-relation.entity';
import { GroupEntity } from 'src/group/group.entity';
import { PersonGroupRelationEntity } from 'src/person/person-group-relation.entity';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { EventModule } from 'src/event/event.module';
import { GroupModule } from 'src/group/group.module';
import { PersonModule } from 'src/person/person.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, PersonEventRelationEntity, GroupEntity, PersonGroupRelationEntity]),
    EventModule,
    GroupModule,
    PersonModule,
  ],
  controllers: [TimelineController],
  providers: [TimelineService],
})
export class TimelineModule {}
```

- [ ] **Step 4: 注册到 AppModule**

```typescript
// backend/src/app.module.ts (追加)
import { TimelineModule } from './timeline/timeline.module';
```

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "feat: timeline matrix query API"
```

---

## Task 10: 验证与启动

**Files:**
- Verify: `backend/src/app.module.ts`
- Test: 启动服务并测试 API

- [ ] **Step 1: 确保 PostgreSQL 运行**

```bash
# 检查 PostgreSQL 服务状态（根据实际环境调整）
# Windows: 检查服务或使用 pgAdmin
```

- [ ] **Step 2: 创建数据库**

```sql
CREATE DATABASE mch_prc;
```

- [ ] **Step 3: 启动后端服务**

```bash
cd backend
npm run start:dev
```

- [ ] **Step 4: 测试 API（使用 curl 或 Postman）**

```bash
# 测试 group API
curl -X POST http://localhost:3000/api/group -H "Content-Type: application/json" -d '{"name":"洋务派","type":"学派"}'
curl http://localhost:3000/api/group/list

# 测试 person API
curl -X POST http://localhost:3000/api/person -H "Content-Type: application/json" -d '{"name":"曾国藩","birthYear":1811,"deathYear":1872}'

# 测试 event API
curl -X POST http://localhost:3000/api/event -H "Content-Type: application/json" -d '{"title":"安庆内军械所创办","startDate":"1861-01-01","isInstant":false,"eventType":"改革","summaryContent":"曾国藩创办安庆内军械所，标志着洋务运动开始"}'

# 测试 timeline API
curl "http://localhost:3000/api/timeline/matrix?startDate=1840-01-01&endDate=1949-12-31&groupBy=group"
```

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "test: backend API verification"
```

---

*后端计划完成，待执行*