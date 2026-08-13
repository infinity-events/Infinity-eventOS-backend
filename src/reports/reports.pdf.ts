import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

type Report = {
  festival: string;
  festivalLocation?: string | null;
  period?: string;
  generatedAt?: string;
  ticketsSold: number;
  activatedWristbands: number;
  inactiveWristbands: number;
  revenue: number;
  entrances?: number;
  ticketBreakdown?: { name: string; type: string; quantity: number; revenue: number }[];
};

@Injectable()
export class ReportsPdfService {
  async generate(data: Report[]): Promise<{ buffer: Buffer; fileName: string }> {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: 'Infinity EventOS - Report Analytics' } });
    const chunks: Uint8Array[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    const pdfFinished = new Promise<Buffer>(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));

    data.forEach((report, index) => {
      if (index > 0) doc.addPage({ size: 'A4', margin: 0 });
      this.renderReport(doc, report);
    });

    doc.end();
    return { buffer: await pdfFinished, fileName: 'report-' + Date.now() + '.pdf' };
  }

  private renderReport(doc: PDFKit.PDFDocument, report: Report) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 42;
    const contentWidth = pageWidth - margin * 2;
    const navy = '#111827';
    const purple = '#8B5CF6';
    const purpleDark = '#6D28D9';
    const muted = '#64748B';
    const green = '#10B981';
    const amber = '#F59E0B';

    doc.rect(0, 0, pageWidth, pageHeight).fill('#FFFFFF');
    doc.rect(0, 0, pageWidth, 148).fill(navy);
    doc.rect(0, 144, pageWidth, 4).fill(purple);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(23).text('Infinity EventOS', margin, 35);
    doc.fillColor('#C4B5FD').font('Helvetica-Bold').fontSize(9).text('WEEKLY EVENT REPORT', margin, 70, { characterSpacing: 1.4 });
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(18).text(report.festival, margin, 94, { width: contentWidth * 0.62 });
    doc.fillColor('#CBD5E1').font('Helvetica').fontSize(9).text(report.festivalLocation || 'Festival location not set', margin, 121);
    doc.text('Generated ' + formatDate(report.generatedAt), pageWidth - margin - 170, 121, { width: 170, align: 'right' });

    const cardY = 175;
    const cardGap = 10;
    const cardWidth = (contentWidth - cardGap * 3) / 4;
    const cards = [
      { label: 'TICKETS', value: String(report.ticketsSold), color: purple },
      { label: 'REVENUE', value: formatCurrency(report.revenue), color: green },
      { label: 'WRISTBANDS', value: String(report.activatedWristbands), color: '#38BDF8' },
      { label: 'ENTRIES', value: String(report.entrances || 0), color: amber },
    ];

    cards.forEach((card, index) => {
      const x = margin + (cardWidth + cardGap) * index;
      doc.roundedRect(x, cardY, cardWidth, 82, 10).fill('#FFFFFF').stroke('#E2E8F0');
      doc.roundedRect(x, cardY, 5, 82, 3).fill(card.color);
      doc.fillColor(muted).font('Helvetica-Bold').fontSize(7).text(card.label, x + 15, cardY + 16);
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(index === 1 ? 11 : 22).text(card.value, x + 15, cardY + 39, { width: cardWidth - 22 });
    });

    let y = 288;
    this.sectionTitle(doc, 'Ticket performance', 'Sales mix and revenue by category', margin, y, purpleDark);
    y += 34;
    const breakdown = report.ticketBreakdown && report.ticketBreakdown.length
      ? report.ticketBreakdown
      : [{ name: 'All tickets', type: 'TOTAL', quantity: report.ticketsSold, revenue: report.revenue }];
    const tableWidth = contentWidth * 0.58;
    doc.roundedRect(margin, y, tableWidth, 190, 10).fill('#FFFFFF').stroke('#E2E8F0');
    doc.fillColor(muted).font('Helvetica-Bold').fontSize(8);
    doc.text('CATEGORY', margin + 16, y + 16);
    doc.text('QTY', margin + tableWidth - 130, y + 16, { width: 35, align: 'right' });
    doc.text('REVENUE', margin + tableWidth - 76, y + 16, { width: 60, align: 'right' });
    doc.moveTo(margin + 16, y + 35).lineTo(margin + tableWidth - 16, y + 35).stroke('#E2E8F0');
    breakdown.slice(0, 6).forEach((item, index) => {
      const rowY = y + 50 + index * 22;
      if (index % 2 === 0) doc.rect(margin + 8, rowY - 5, tableWidth - 16, 22).fill('#F8FAFC');
      doc.fillColor(navy).font('Helvetica').fontSize(9).text(item.name || item.type, margin + 16, rowY);
      doc.text(String(item.quantity), margin + tableWidth - 130, rowY, { width: 35, align: 'right' });
      doc.fillColor(navy).font('Helvetica').fontSize(7).text(formatCompactCurrency(item.revenue), margin + tableWidth - 76, rowY + 1, { width: 60, align: 'right' });
    });
    doc.fillColor(muted).font('Helvetica').fontSize(8).text(report.period || 'Current reporting period', margin + 16, y + 168);

    const sideX = margin + tableWidth + 14;
    const sideWidth = contentWidth - tableWidth - 14;
    doc.roundedRect(sideX, y, sideWidth, 190, 10).fill('#F8FAFC');
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text('Wristband status', sideX + 16, y + 17);
    const wristbandTotal = report.activatedWristbands + report.inactiveWristbands;
    const activation = wristbandTotal ? Math.round((report.activatedWristbands / wristbandTotal) * 100) : 0;
    doc.fillColor(muted).font('Helvetica').fontSize(9).text(String(activation) + '% activated', sideX + 16, y + 45);
    doc.roundedRect(sideX + 16, y + 69, sideWidth - 32, 12, 6).fill('#E2E8F0');
    if (activation > 0) doc.roundedRect(sideX + 16, y + 69, (sideWidth - 32) * activation / 100, 12, 6).fill(green);
    this.metricLine(doc, 'Activated', String(report.activatedWristbands), sideX + 16, y + 105, green, sideWidth - 32);
    this.metricLine(doc, 'Available', String(report.inactiveWristbands), sideX + 16, y + 134, amber, sideWidth - 32);

    y += 225;
    this.sectionTitle(doc, 'Event snapshot', 'A quick operational readout for your team', margin, y, purpleDark);
    y += 34;
    doc.roundedRect(margin, y, contentWidth, 92, 10).fill(navy);
    const snapshot = [
      ['Ticket revenue', formatCurrency(report.revenue)],
      ['Average ticket', report.ticketsSold ? formatCurrency(report.revenue / report.ticketsSold) : 'EUR 0.00'],
      ['Entry rate', report.ticketsSold ? Math.round(((report.entrances || 0) / report.ticketsSold) * 100) + '%' : '0%'],
    ];
    snapshot.forEach((item, index) => {
      const x = margin + 18 + index * (contentWidth / 3);
      doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(8).text(item[0].toUpperCase(), x, y + 20);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(17).text(item[1], x, y + 43);
    });

    doc.fillColor('#94A3B8').font('Helvetica').fontSize(8).text('Infinity EventOS  |  Confidential analytics report', margin, pageHeight - 35);
    doc.text('Page 1', pageWidth - margin - 50, pageHeight - 35, { width: 50, align: 'right' });
  }

  private sectionTitle(doc: PDFKit.PDFDocument, title: string, subtitle: string, x: number, y: number, color: string) {
    doc.fillColor(color).font('Helvetica-Bold').fontSize(15).text(title, x, y);
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(8).text(subtitle, x, y + 20);
  }

  private metricLine(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, color: string, width: number) {
    doc.circle(x + 4, y + 5, 4).fill(color);
    doc.fillColor('#334155').font('Helvetica').fontSize(9).text(label, x + 14, y);
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9).text(value, x + width - 45, y, { width: 45, align: 'right' });
  }
}

function formatCurrency(value: number) {
  return 'EUR ' + Number(value || 0).toFixed(2);
}

function formatCompactCurrency(value: number) {
  return 'EUR ' + Number(value || 0).toFixed(0);
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT');
}
