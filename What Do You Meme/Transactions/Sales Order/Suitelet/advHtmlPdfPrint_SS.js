/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

define(['N/render', 'N/record', 'N/file', 'N/log', 'N/config'], function (
  render,
  record,
  file,
  log,
  config
) {
  function onRequest(context) {
    try {
      var configRecObj = config.load({
        type: config.Type.COMPANY_INFORMATION,
      });
      var customerDepositID = context.request.parameters['recId'];
      var cdRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: customerDepositID,
      });
      var pdf = renderRecordToPdfWithTemplate(cdRecord, configRecObj);
      context.response.writeFile(pdf, false);
    } catch (e) {
      log.debug('error', e);
    }
  }
  function renderRecordToPdfWithTemplate(cdRecord, configRecObj) {
    var htmlTemplateFile = file.load(
      'Templates/Script Templates/printDeposit.xml'
    );
    var renderer = render.create();
    renderer.templateContent = htmlTemplateFile.getContents();
    renderer.addRecord('record', cdRecord);
    renderer.addRecord('companyInformation', configRecObj);
    var creditMemoPDF = renderer.renderAsPdf();

    return creditMemoPDF;
  }
  return {
    onRequest: onRequest,
  };
});
