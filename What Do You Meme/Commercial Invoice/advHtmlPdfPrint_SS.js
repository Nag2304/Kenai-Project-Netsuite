/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

define(["N/render", "N/record", "N/file", "N/config"], function (
  render,
  record,
  file,
  config
) {
  function onRequest(context) {
    try {
      var configRecObj = config.load({
        type: config.Type.COMPANY_INFORMATION,
      });
      var salesOrderID = context.request.parameters["recId"];
      var soRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: salesOrderID,
      });
      var pdf = renderRecordToPdfWithTemplate(soRecord, configRecObj);
      context.response.writeFile(pdf, false);
    } catch (e) {
      log.debug("error", e);
    }
  }
  function renderRecordToPdfWithTemplate(cdRecord, configRecObj) {
    var htmlTemplateFile = file.load(
      "Templates/Script Templates/commercialInvoice.xml"
    );
    var renderer = render.create();
    renderer.templateContent = htmlTemplateFile.getContents();
    renderer.addRecord("record", cdRecord);
    renderer.addRecord("companyInformation", configRecObj);
    var invoicePDF = renderer.renderAsPdf();

    return invoicePDF;
  }
  return {
    onRequest: onRequest,
  };
});
