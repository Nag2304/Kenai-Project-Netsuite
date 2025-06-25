/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: wdym_Module_commercialInvoice.js
 * Author           Date       Version               Remarks
 * nagendrababu 06.25.2025      1.00        Initial creation of the script
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------- Load Commercial Invoice - Begin -------------------- */
  /**
   *
   * @param {Object} scriptContext
   * @returns
   */
  const loadCommercialInvoice = (scriptContext) => {
    const loggerTitle = 'Load Commercial Invoice';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
        return;
      }
      const objForm = scriptContext.form;
      objForm.clientScriptModulePath = 'SuiteScripts/callForSuitelet_CS.js';

      // Retrieve other necessary fields
      const transferOrderRecord = scriptContext.newRecord;
      const commercialInvoicePrinted = transferOrderRecord.getValue({
        fieldId: 'custbody_wdym_comm_inv_printed',
      });

      //
      if (!commercialInvoicePrinted) {
        log.debug(loggerTitle, ' Triggered Commercial Invoice Logic');
        objForm.addButton({
          id: 'custpage_commercial_invoice_btn',
          label: 'Commercial Invoice',
          functionName: 'callCommercialInvoiceSuitelet()',
        });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ---------------------- Load Commercial Invoice - End --------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeLoad = loadCommercialInvoice;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
