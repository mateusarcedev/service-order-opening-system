// src/users/users.service.ts
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dtos/create-user.dto';

import { PublicUser, UserEntity } from './entitites/users.entity';
import { UsersFactory } from './users.factory';
import type { UsersRepository } from './users.repository';
import { USERS_REPOSITORY } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly repo: UsersRepository,
    private readonly factory: UsersFactory,
  ) { }

  async findByEmail(email: string): Promise<PublicUser | null> {
    const user = await this.repo.findByEmail(email);
    return user ? this.factory.toPublic(user) : null;
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.factory.toPublic(user);
  }

  async findByEmailWithSecret(email: string): Promise<UserEntity | null> {
    return this.repo.findByEmail(email);
  }

  async findByIdWithSecret(id: string): Promise<UserEntity | null> {
    return this.repo.findById(id);
  }

  async create(input: CreateUserDto): Promise<PublicUser> {
    const exists = await this.repo.findByEmail(input.email);
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(input.password, 10);
    const entity = this.factory.create({
      name: input.name,
      email: input.email,
      passwordHash: hashed,
      role: input.role ?? 'USER',
    });
    const created = await this.repo.create(entity);
    return this.factory.toPublic(created);
  }
}
