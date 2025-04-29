/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_setQuoteStatus.js
 * Author           Date       Version               Remarks
 * nagendrababu 04.19.2025       1.00         #365 - Approval for Quotes
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------ Set Quote Status - Begin ------------------------ */
  const setQuoteStatus = (context) => {
    const loggerTitle = ' Set Quote Status ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const record = context.newRecord;

      const quoteApprovalStatus = record.getValue({
        fieldId: 'custbody_nsis_sc_quote_approval_status',
      });

      if (quoteApprovalStatus == '1') {
        let approvalStatus = true;
        //
        const sweeperSalesOrder = record.getValue({
          fieldId: 'custbody_scm_sweeper_order',
        });
        if (!sweeperSalesOrder) {
          const quoteLineCount = record.getLineCount({
            sublistId: 'item',
          });
          log.debug(loggerTitle, `Line Count: ${quoteLineCount}`);
          // Loop Through the Quote Lines
          for (let index = 0; index < quoteLineCount; index++) {
            const rate = record.getSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              line: index,
            });
            log.debug(loggerTitle, `Rate:${rate} Line:${index + 1}`);
            //
            if (rate < 0 || rate == 0.0 || rate == 0 || rate == null) {
              approvalStatus = false;
              break;
            }
          }
          //
          if (approvalStatus) {
            record.setValue({
              fieldId: 'custbody_nsis_sc_quote_approval_status',
              value: '2',
            });
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
  /* ------------------------- Set Quote Status - End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setQuoteStatus;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
