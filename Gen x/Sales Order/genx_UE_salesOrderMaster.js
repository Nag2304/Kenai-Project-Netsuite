/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*global define,log*/
define(['N/search'], (search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin -------------------------- */
  const beforeLoad = (scriptContext) => {
    const loggerTitle = ' Before Load ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Entry----------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Exit----------------<|'
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (scriptContext) => {
    const loggerTitle = ' Before Submit ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Entry----------------<|'
    );
    //
    try {
      const salesOrderRecord = scriptContext.newRecord;

      // Retrieve Paired InterCompany  Transaction
      const interCompanyTransaction = salesOrderRecord.getValue({
        fieldId: 'intercotransaction',
      });
      log.debug(
        loggerTitle,
        'Paired Intercompany Transaction: ' + interCompanyTransaction
      );

      // Retrieve the tranid from the purchaseorder
      const purchaseOrderFieldSearch = search.lookupFields({
        type: search.Type.PURCHASE_ORDER,
        id: interCompanyTransaction,
        columns: ['tranid'],
      });
      const purchaseOrderTransactionId = purchaseOrderFieldSearch.tranid;
      log.debug(
        loggerTitle,
        'Purchase Order Tran ID:' + purchaseOrderTransactionId
      );

      // Set the Value
      if (purchaseOrderTransactionId) {
        salesOrderRecord.setValue({
          fieldId: 'otherrefnum',
          value: purchaseOrderTransactionId,
        });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Exit----------------<|'
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (scriptContext) => {
    const loggerTitle = ' After Submit ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Entry----------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Exit----------------<|'
    );
  };
  /* --------------------------- After Submit - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
