/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: ins_Module_setClassLineLevel.js
 * Author           Date       Version               Remarks
 * nagendrababu 02.07.2025      1.00       Intial Creation Of the Script
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------- Set Class Line Level - Begin ---------------------- */
  const setClassLineLevel = (context) => {
    const loggerTitle = 'Set Class Line Level';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const salesOrderRecord = context.newRecord;
      //
      const headerClass = salesOrderRecord.getValue({ fieldId: 'class' });
      log.debug(loggerTitle, { headerClass });

      const salesOrderLineCount = salesOrderRecord.getLineCount({
        sublistId: 'item',
      });
      //
      for (let index = 0; index < salesOrderLineCount; index++) {
        if (headerClass) {
          const lineClass = salesOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'class',
            line: index,
          });
          log.debug(loggerTitle, { lineClass });
          //
          salesOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'class',
            value: headerClass,
            line: index,
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
  /* ---------------------- Set Class Line Level - End ---------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setClassLineLevel;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
