import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiController,
  GetWithCache,
  SecurePost,
  ApiPagination,
  ApiIdParam,
  CurrentUser,
  UserRole,
} from '../../common/decorators/api.decorators';
import { Roles } from '../../common/decorators/role.decorators';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/role.decorators';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { User } from './entity/user.entity';

@ApiController('users', 'Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @SecurePost('user')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiPagination()
  @GetWithCache('users')
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get('profile')
  @GetWithCache('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get(':id')
  @ApiIdParam()
  @GetWithCache('user')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiIdParam()
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    if (!currentUser.role.includes(UserRole.ADMIN) && currentUser.id !== id) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiIdParam()
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
