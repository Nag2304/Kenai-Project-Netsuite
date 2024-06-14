/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

/*global define,log*/

/**
 * Script Record: WDYM | SU Commercial Invoice
 * Fileanme: wdym_SU_commericalInvoice.js
 * Author           Date       Version               Remarks
 * nagendrababu  06.14.2024    1.00       Initial creation of the script.
 *
 */

define(['N/render', 'N/record', 'N/file', 'N/config'], (
  render,
  record,
  file,
  config
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- onRequest - Begin --------------------------- */
  /**
   *
   * @param {object} scriptContext
   * @returns {boolean}
   */
  const onRequest = (scriptContext) => {
    const loggerTitle = ' On Request ';
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Entry-----------------<|'
    );
    //
    try {
      const configRecObj = config.load({
        type: config.Type.COMPANY_INFORMATION,
      });
      const invoiceInternalId = scriptContext.request.parameters['recId'];
      //
      // Load the Invoice Record
      const invoiceRecord = record.load({
        type: 'invoice',
        id: invoiceInternalId,
      });
      log.debug(loggerTitle, ' Invoice Record Loaded Successfully ');
      //
      const commericalInvoicePdf = renderRecordToPdfWithTemplate(
        invoiceRecord,
        configRecObj
      );
      scriptContext.response.writeFile(commericalInvoicePdf, false);
      //
      invoiceRecord.setValue({
        fieldId: 'custbody_wdym_comm_inv_printed',
        value: true,
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Exit-----------------<|'
    );
    return true;
  };
  /* ----------------------------- onRequest - End ---------------------------- */
  //
  /* ----------------------- Helper Functions - Begin ----------------------- */
  //
  /* *********************** Render Record To Pdf With Template - Begin *********************** */
  /**
   *
   * @param {object} invRecord
   * @param {object} configRecObj
   * @returns {object} invoiceRecordPDF
   */
  const renderRecordToPdfWithTemplate = (invRecord, configRecObj) => {
    const loggerTitle = 'Render Record To Pdf With Template';
    log.debug(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Entry-----------------<|'
    );
    //
    let invoiceRecordPDF;
    try {
      // Load the XML Template
      const htmlTemplateFile = file.load(
        'Templates/Script Templates/commericalInvoicePDF.xml'
      );
      log.debug(loggerTitle + ' Template File Loaded ', htmlTemplateFile);
      //
      // Render the PDF Template
      const renderer = render.create();
      renderer.templateContent = htmlTemplateFile.getContents();
      renderer.addRecord('record', invRecord);
      renderer.addRecord('companyInformation', configRecObj);
      invoiceRecordPDF = renderer.renderAsPdf();
      log.debug(loggerTitle, ' Template Renderer Successfully ');
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Exit-----------------<|'
    );
    return invoiceRecordPDF;
  };
  /* *********************** Render Record To Pdf With Template - End *********************** */
  //
  /* ----------------------- Helper Functions - End ----------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
