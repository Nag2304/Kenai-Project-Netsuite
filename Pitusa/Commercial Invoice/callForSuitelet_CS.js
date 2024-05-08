/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(["N/url", "N/currentRecord"], function (url, currentRecord) {
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
    /* --------------------------- Record Details End --------------------------- */
    var suiteletURL = url.resolveScript({
      scriptId: "customscript_pitusa_su_printcomminv",
      deploymentId: "customdeploy_pitusa_su_printcomminv",
      params: { recId: recId },
    });
    //console.log(suiteletURL);
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
