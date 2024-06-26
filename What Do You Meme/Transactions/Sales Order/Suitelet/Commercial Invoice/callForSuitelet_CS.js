/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
/*global define,log*/
define(['N/url', 'N/currentRecord'], function (url, currentRecord) {
  const exports = {};

  /* ----------------------------- Page Init Begin ---------------------------- */
  function pageInit(scriptContext) {
    console.log(scriptContext);
    return;
  }
  /* ------------------------------ Page Init End ----------------------------- */
  //
  /* ------------------------- Call for suitelet Begin ------------------------ */
  function CallforSuiteletSO() {
    /* -------------------------- Record Details Begin -------------------------- */
    var record = currentRecord.get();
    var recId = record.id;
    //var recType = record.type;
    /* --------------------------- Record Details End --------------------------- */
    var suiteletURL = url.resolveScript({
      scriptId: 'customscript_wdym_su_so_printdeposit',
      deploymentId: 'customdeploy_wdym_su_so_printdeposit',
      params: { recId: recId },
    });
    console.log(suiteletURL);
    document.location = suiteletURL;
  }
  /* -------------------------- Call for suitelet End ------------------------- */
  //
  /* ---------------- Call Commercial Invoice Suitelet - Begin ---------------- */
  function callCommercialInvoiceSuitelet() {
    var loggerTitle = ' Call Commercial Invoice Suitelet ';
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    //
    try {
      var record = currentRecord.get();
      var recId = record.id;
      //
      // Call the suitelet
      var suiteletURL = url.resolveScript({
        scriptId: 'customscript_su_commercial_invoice',
        deploymentId: 'customdeploy_su_commercial_invoice',
        params: { recId: recId },
      });
      console.log(suiteletURL);
      document.location = suiteletURL;
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
  }
  /* ---------------- Call Commercial Invoice Suitelet - End ---------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  exports.CallforSuiteletSO = CallforSuiteletSO;
  exports.callCommercialInvoiceSuitelet = callCommercialInvoiceSuitelet;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
