/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_setExpectedShipDate.js
 * Author           Date       Version               Remarks
 * nagendrababu  01.16.2025     1.00      Set Expected Ship Date on Line Level
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------- Set Expected Ship Date - Begin --------------------- */
  const setExpectedShipDate = (scriptContext) => {
    const loggerTitle = 'Set Expected Ship Date';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const salesOrderRecord = scriptContext.newRecord;
      //
      const expectedShipDate = salesOrderRecord.getValue({
        fieldId: 'shipdate',
      });
      const lineItemCount = salesOrderRecord.getLineCount({
        sublistId: 'item',
      });
      log.debug(loggerTitle, { expectedShipDate, lineItemCount });
      //
      for (let index = 0; index < lineItemCount; index++) {
        const lineExpectedShipDate = salesOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'expectedshipdate',
          line: index,
        });
        log.debug(loggerTitle, { lineExpectedShipDate });
        if (lineExpectedShipDate !== expectedShipDate) {
          salesOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'expectedshipdate',
            line: index,
            value: expectedShipDate,
          });
          log.debug(
            loggerTitle,
            `Line Expected Date set on the Index: ${index}`
          );
        }
      }
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* --------------------- Set Expected Ship Date - End--------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setExpectedShipDate;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
