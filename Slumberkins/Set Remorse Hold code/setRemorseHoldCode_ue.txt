/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(["N/record", "N/log"], function (record, log) {
  const exports = {};
  /* ------------------------ Before Load Script Begin ------------------------ */
  function beforeLoad(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.CREATE) {
      const rec = scriptContext.newRecord;
      rec.setValue({ fieldId: "custbody_sl_remorse_hold", value: true });
    }
  }
  /* ------------------------ Before Load Script End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeLoad = beforeLoad;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
