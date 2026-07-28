import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class ReportsPdfService {

    async generate(data: any): Promise<{
    buffer: Buffer;
    filePath: string;
    fileName: string;
    }> {
        const doc = new PDFDocument();
        const chunks: Uint8Array[] = [];
        doc.on('data', chunk => {
            chunks.push(chunk);
        });

        const pdfFinished = new Promise<Buffer>((resolve) => {
            doc.on('end', () => {
        resolve(Buffer.from(Buffer.concat(chunks)));
            });
        });

        doc
        .fontSize(22)
        .text('Infinity EventOS', {
            align:'center'
        });

        doc.moveDown();

        doc
        .fontSize(18)
        .text('Report Settimanale');
        doc.moveDown();
        for(const report of data){

            doc
            .fontSize(14)
            .text(`Festival: ${report.festival}`);

            doc.moveDown();

            doc
            .fontSize(12)
            .text(
`Biglietti venduti: ${report.ticketsSold}

Braccialetti attivati: ${report.activatedWristbands}

Braccialetti non attivati: ${report.inactiveWristbands}

Incasso totale: € ${report.revenue}
`
            );
            doc.moveDown();
            doc.moveDown();
        }

        doc.end();
        const buffer = await pdfFinished;


const fileName =
    `report-${Date.now()}.pdf`;


const folder =
    path.join(process.cwd(), 'reports');


if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
}


const filePath =
    path.join(folder, fileName);


fs.writeFileSync(
    filePath,
    buffer
);


return {
    buffer,
    filePath,
    fileName
};

    }

}