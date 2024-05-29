import { Body, Controller, Post } from '@nestjs/common';
import { ConverterService } from './converter.service';
import { ConvertJsxDto } from './dto';

@Controller('converter')
export class ConverterController {
  constructor(private converterService: ConverterService) {}

  @Post('url')
  convertUrl(@Body() dto: ConvertJsxDto) {
    return this.converterService.convertUrl(dto);
  }
}
