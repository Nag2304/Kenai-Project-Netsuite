/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(["N/record", "N/log", "N/currentRecord"], function (
  record,
  log,
  currentRecord
) {
  const exports = {};
  /* ------------------------ Page Init Begin ------------------------ */
  function pageInit(scriptContext) {
    //! alert("script executed");
    //! console.log(scriptContext.mode);
    if (scriptContext.mode === "create") {
      try {
        // New Record
        const rec = currentRecord.get();
        /* -------------------------- Prepayment Begin -------------------------- */
        //Get Purchase Order Internal ID
        var purchaseOrder = rec.getValue({
          fieldId: "purchaseorder",
        });
        /* -------------------------- Purchase Order Begin -------------------------- */
        if (purchaseOrder) {
          var poLoad = record.load({
            type: "purchaseorder",
            id: purchaseOrder,
            isDynamic: true,
          });
          var poPrepaymentAmount = poLoad.getValue({
            fieldId: "custbody_bbb_prepayment_amount",
          });
        }
        /* --------------------------- Purchase Order End --------------------------- */
        //
        if (poPrepaymentAmount > 0) {
          rec.setValue({
            fieldId: "custbody_bbb_prepayment_amount",
            value: poPrepaymentAmount,
          });
        }
        /* -------------------------- Prepayment End -------------------------- */
      } catch (err) {
        log.debug({ title: "Error Occured", details: err });
      }
    }
  }
  /* ------------------------ Page Init End ------------------------ */
  //
  //!alert("script executed");
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
