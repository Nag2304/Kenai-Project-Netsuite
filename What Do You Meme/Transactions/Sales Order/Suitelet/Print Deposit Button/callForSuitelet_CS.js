/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/log', 'N/url', 'N/currentRecord'], function (
  log,
  url,
  currentRecord
) {
  const exports = {};

  /* ----------------------------- Page Init Begin ---------------------------- */
  function pageInit(scriptContext) {
    return;
  }
  /* ------------------------------ Page Init End ----------------------------- */
  //
  /* ------------------------- Call for suitelet Begin ------------------------ */
  function CallforSuiteletSO() {
    /* -------------------------- Record Details Begin -------------------------- */
    var record = currentRecord.get();
    var recId = record.id;
    var recType = record.type;
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
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  exports.CallforSuiteletSO = CallforSuiteletSO;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
