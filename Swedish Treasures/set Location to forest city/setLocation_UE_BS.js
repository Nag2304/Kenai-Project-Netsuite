/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define([], () => {
  const exports = {};
  /* --------------------------- Before Submit Begin -------------------------- */
  const beforeSubmit = (scriptContext) => {
    try {
      if (scriptContext.type === scriptContext.UserEventType.CREATE) {
        const rec = scriptContext.newRecord;

        const customerId = rec.getValue({ fieldId: "entity" });

        // If the customer ID is target.com set the location to Forest City "1"
        if (customerId == "952464") {
          const lineItemCount = rec.getLineCount({ sublistId: "item" });
          //
          for (let i = 0; i < lineItemCount; i++) {
            rec.setSublistValue({
              sublistId: "item",
              fieldId: "location",
              value: "1",
              line: i,
            });
          }
          //
        }
        //
      }
    } catch (err) {
      log.debug("Script Failed To Execute", err);
    }
  };
  /* ---------------------------- Before Submit End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
