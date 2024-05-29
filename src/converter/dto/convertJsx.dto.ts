import { IsUrl } from 'class-validator';

export class ConvertJsxDto {
  @IsUrl()
  url: string;
}
