/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_setRateforRFQ.js
 * Author           Date       Version               Remarks
 * nagendrababu  01.26.2025     1.00        Initial creation of the script
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- Set Rate - Begin ---------------------------- */
  /**
   *
   * @param {Object} context
   */
  const setRate = (context) => {
    const loggerTitle = 'Set Rate';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const purchaseOrderRecord = context.newRecord;

      const rfq = purchaseOrderRecord.getValue({
        fieldId: 'custbody_scm_rfq',
      });
      //
      log.debug(loggerTitle, `RFQ: ${rfq}`);
      if (rfq) {
        const purchaseOrderLineCount = purchaseOrderRecord.getLineCount({
          sublistId: 'item',
        });
        log.debug(loggerTitle, ' Sublist Count: ' + purchaseOrderLineCount);
        for (let index = 0; index < purchaseOrderLineCount; index++) {
          purchaseOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: index,
            value: 0,
          });
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
  /* ----------------------------- Set Rate - End ----------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setRate;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
