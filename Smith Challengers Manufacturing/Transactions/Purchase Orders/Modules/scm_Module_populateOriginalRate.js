/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_populateOriginalRate.js
 * Author           Date       Version               Remarks
 * nagendrababu  02.13.2025     1.00            Initial creation of the script
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------- populateOriginalRate - Begin ---------------------- */
  const populateOriginalRate = (scriptContext) => {
    const loggerTitle = 'Populate Original Rate';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      if (scriptContext.type === scriptContext.UserEventType.CREATE) {
        const purchaseOrderRecord = scriptContext.newRecord;
        //
        const purchaseOrderLineCount = purchaseOrderRecord.getLineCount({
          sublistId: 'item',
        });
        //
        log.debug(loggerTitle, ' Sublist Count: ' + purchaseOrderLineCount);

        for (let index = 0; index < purchaseOrderLineCount; index++) {
          const rate = purchaseOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: index,
          });

          if (rate > 0) {
            purchaseOrderRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_scm_original_rate',
              line: index,
              value: rate,
            });
            log.debug(
              loggerTitle,
              ' Rate Column successfully Populated at Index: ' + index
            );
          }
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ----------------------- populateOriginalRate - End ----------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = populateOriginalRate;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
