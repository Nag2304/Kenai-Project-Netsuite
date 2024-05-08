/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(["N/log"], function (log) {
  const exports = {};
  /* ------------------------ Page Init Begin ------------------------ */
  function pageInit(scriptContext) {
    var rec = scriptContext.currentRecord;
    if (scriptContext.mode === "create") {
      rec.setValue({ fieldId: "custbody_sl_remorse_hold", value: true });
    }
  }
  /* ------------------------ Page Init End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
