
/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: ops_Module_createCMforAmazonCustomers.js
 * Author           Date       Version               Remarks
 * nagendrababu 11thSep 2024    1.00     Initial creation of the script
 *
 */

/* global define,log */

define(['N/record'], (record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const AMAZON_CUSTOMERS = ['1187553', '220554'];
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ----------------------- Create Credit Memo - Begin ----------------------- */
  const createCreditMemo = (context) => {
    const loggerTitle = ' Create Credit Memo ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const irRecord = context.newRecord;
      //
      const customerId = irRecord.getValue({ fieldId: 'entity' });
      const createdFromText = irRecord.getText({ fieldId: 'createdfrom' });

      log.debug(
        loggerTitle,
        `Customer ID: ${customerId} Created From Text: ${createdFromText}`
      );
      //
      if (isAmazonCustomer(customerId) && isCreatedFromRA(createdFromText)) {
        createCreditMemoForAmazonCustomers(irRecord);
      } else {
        log.debug(loggerTitle, ' Customer is not Amazon Customer.');
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
  /* ------------------------ Create Credit Memo - End ------------------------ */
  //
  /* ------------------------- Helper Functions - Begin ------------------------ */
  /**
   * Check if the customer is Amazon based on their ID
   * @param {string} customerId
   * @returns {boolean} isAmazon
   */
  const isAmazonCustomer = (customerId) => {
    return AMAZON_CUSTOMERS.includes(customerId);
  };

  const isCreatedFromRA = (createdFrom) => {
    return createdFrom.includes('Return');
  };

  /**
   * Create a Credit Memo from the Return Authorization
   * @param {Record} itemReceiptRecord
   */
  const createCreditMemoForAmazonCustomers = (itemReceiptRecord) => {
    const loggerTitle = 'Create Credit Memo for Amazon Customers ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const returnAuthId = itemReceiptRecord.getValue({
        fieldId: 'createdfrom',
      });

      const returnAuthDate = itemReceiptRecord.getValue({
        fieldId: 'trandate',
      });

      const creditMemoRecord = record.transform({
        fromType: 'returnauthorization',
        fromId: returnAuthId,
        toType: 'creditmemo',
        isDynamic: true,
      });

      creditMemoRecord.setValue({ fieldId: 'trandate', value: returnAuthDate });

      const creditMemoRecordInternalId = creditMemoRecord.save();
      log.audit(
        loggerTitle,
        `Credit Memo Record Saved Successfully ${creditMemoRecordInternalId}`
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ------------------------- Helper Functions - End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = createCreditMemo;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
