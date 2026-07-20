"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFestivalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_festival_dto_1 = require("./create-festival.dto");
class UpdateFestivalDto extends (0, swagger_1.PartialType)(create_festival_dto_1.CreateFestivalDto) {
}
exports.UpdateFestivalDto = UpdateFestivalDto;
//# sourceMappingURL=update-festival.dto.js.map