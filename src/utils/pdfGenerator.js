import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (element, filename = 'report') => {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  let imgY = 10;
  let scaledHeight = imgHeight * ratio;
  let scaledWidth = imgWidth * ratio;

  // Handle multi-page
  let heightLeft = scaledHeight;
  let position = imgY;

  pdf.addImage(imgData, 'PNG', imgX, position, scaledWidth, scaledHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - scaledHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', imgX, position, scaledWidth, scaledHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(`${filename}.pdf`);
};
