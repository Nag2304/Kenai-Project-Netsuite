/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_setExpectedPODate.js
 * Author           Date       Version               Remarks
 * nagendrababu  10.17.2024      1.00       Initial creation of the script
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------- Set Expected PO Date - Begin ---------------------- */
  /**
   *
   * @param {Object} scriptContext
   * @param {Object} purchaseOrderRecord
   */
  const setExpectedPODate = (scriptContext, purchaseOrderRecord) => {
    const loggerTitle = 'Set Expected PO Date';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let saveFlag = false;
    try {
      if (
        scriptContext.type === scriptContext.UserEventType.CREATE ||
        scriptContext.type === scriptContext.UserEventType.EDIT ||
        scriptContext.type === scriptContext.UserEventType.XEDIT
      ) {
        log.debug(
          loggerTitle,
          scriptContext.type + '  event type executed successfully'
        );
        const expectedReceiveDate = purchaseOrderRecord.getValue({
          fieldId: 'custbody_sc_exp_rec_date',
        });
        //
        log.debug(
          loggerTitle,
          ' Expected Receive Date: ' + expectedReceiveDate
        );

        const purchaseOrderLineCount = purchaseOrderRecord.getLineCount({
          sublistId: 'item',
        });
        //
        log.debug(loggerTitle, ' Sublist Count: ' + purchaseOrderLineCount);
        for (let index = 0; index < purchaseOrderLineCount; index++) {
          const lineExpectedReceiveDate = purchaseOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'expectedreceiptdate',
            line: index,
          });
          //
          if (expectedReceiveDate !== lineExpectedReceiveDate) {
            purchaseOrderRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'expectedreceiptdate',
              line: index,
              value: expectedReceiveDate,
            });
            saveFlag = true;
            log.debug(loggerTitle, ' Line Level Expected Date Successfully');
          }
          //
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
    return saveFlag;
  };
  /* ---------------------- Set Expected PO Date - End ---------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = setExpectedPODate;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
