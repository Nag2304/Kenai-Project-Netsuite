/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define(['N/file', 'N/render', 'N/record', 'N/email'], (
  file,
  render,
  record,
  email
) => {
  const exports = {};
  const execute = (context) => {
    //
    const xmlTmplFile = file.load(
      'Templates/Invoice Templates/InvoiceUSDTemplate.xml'
    );
    log.debug('Test Scheduled Script File', xmlTmplFile);
    //
    const myFile = render.create();
    myFile.templateContent = xmlTmplFile.getContents();
    const invoiceRecord = record.load({
      type: record.Type.INVOICE,
      id: 1532004,
    });
    const docNumber = invoiceRecord.getValue({ fieldId: 'tranid' });
    myFile.addRecord('record', invoiceRecord);
    const attachment = myFile.renderAsPdf();
    log.debug('test scheduled script file', attachment);
    attachment.name = 'Invoice ' + docNumber + '.pdf';
    log.debug('File Name', attachment);
    //

    email.send({
      author: 3052,
      recipients: 'mike@msuiteinc.com',
      subject: 'Test Sample Email Module',
      body: 'email body',
      attachments: [attachment],
    });
  };
  exports.execute = execute;
  return exports;
});
