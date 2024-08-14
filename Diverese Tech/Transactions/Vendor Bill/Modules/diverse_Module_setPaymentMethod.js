/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: diverse_Module_setPaymentMethod.js
 * Author           Date       Version               Remarks
 * nagendrababu  14th Aug 2024  1.00           Initial creation of the script.
 *
 */

/* global define,log */

define(['N/search'], (search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ----------------------- Set Payment Method - Begin ----------------------- */
  const setPaymentMethod = (scriptContext) => {
    const loggerTitle = ' Set Payment Method ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    try {
      if (
        scriptContext.type === scriptContext.UserEventType.CREATE ||
        scriptContext.type === scriptContext.UserEventType.EDIT
      ) {
        const vbRecord = scriptContext.newRecord;
        //
        const payWhenPaid = vbRecord.getValue({
          fieldId: 'custbody_dct_pay_when_paid',
        });
        const arInvoicePayWhenPaid = vbRecord.getValue({
          fieldId: 'custbody_dct_ar_invoice_pay_when_paid',
        });
        log.debug(
          loggerTitle,
          `Pay When Paid: ${payWhenPaid} AR Invoice Pay When Paid: ${arInvoicePayWhenPaid}`
        );

        const invoiceFields = search.lookupFields({
          type: 'invoice',
          id: arInvoicePayWhenPaid,
          columns: ['status'],
        });
        log.debug(loggerTitle + ' Invoice Fields', invoiceFields);

        const status = invoiceFields.status[0].value;

        // Set Payment Method
        if (payWhenPaid && status === 'open') {
          vbRecord.setValue({ fieldId: 'paymenthold', value: true });
          log.debug(loggerTitle, ' Payment Method to True ');
        }
        //
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
    return true;
  };
  /* ----------------------- Set Payment Method - End ----------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setPaymentMethod;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
