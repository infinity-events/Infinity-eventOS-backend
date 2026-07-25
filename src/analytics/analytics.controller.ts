import { Controller,Get,Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';


@Controller('analytics')
export class AnalyticsController{


constructor(
private analyticsService:AnalyticsService
){}



@Get(':festivalId')
getAnalytics(
@Param('festivalId') festivalId:string
){

return this.analyticsService.getAnalytics(festivalId);

}


}