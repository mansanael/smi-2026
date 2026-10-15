import { IsArray, IsUUID } from 'class-validator';

export class UpdateMembresDto {
  @IsArray()
  @IsUUID('all', { each: true })
  utilisateurIds: string[];
}
