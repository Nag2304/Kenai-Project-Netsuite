/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name:ops_Module_createIRorCM.js
 * Author           Date       Version               Remarks
 * nagendrababu 10th Sep 2024   1.00          Initial creation of the script
 *
 */

/* global define,log */

define(['N/record'], (record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const AMAZON_CUSTOMERS = ['1187553', '220554'];
  const INSPECTED_BY_ID = 14;
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Create IR or CM - Begin ------------------------ */
  const createIRorCM = (context) => {
    const loggerTitle = 'Create IR or CM';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const returnAuthorizationRecord = context.newRecord;

      const customerId = returnAuthorizationRecord.getValue({
        fieldId: 'entity',
      });

      if (isAmazonCustomer(customerId)) {
        handleAmazonCustomer(returnAuthorizationRecord);
      } else {
        handleNonAmazonCustomer(returnAuthorizationRecord);
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
  /* ------------------------- Create IR or CM - End ------------------------ */
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

  /**
   * Handle the case when the customer is Amazon
   * @param {Record} returnAuthorizationRecord
   */
  const handleAmazonCustomer = (returnAuthorizationRecord) => {
    const loggerTitle = 'Handle Amazon Customers';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const createdFromId = returnAuthorizationRecord.getValue({
        fieldId: 'createdfrom',
      });
      const returnAuthStatus = returnAuthorizationRecord.getValue({
        fieldId: 'status',
      });

      log.debug(
        loggerTitle,
        `Created From ID: ${createdFromId} Return Auth Status: ${returnAuthStatus}`
      );
      //
      if (createdFromId && returnAuthStatus !== 'Pending Receipt') {
        createCreditMemo(returnAuthorizationRecord);
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

  /**
   * Handle the case when the customer is not Amazon
   * @param {Record} returnAuthorizationRecord
   */
  const handleNonAmazonCustomer = (returnAuthorizationRecord) => {
    const loggerTitle = 'Handle Non Amazon Customers';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const createdFromId = returnAuthorizationRecord.getValue({
        fieldId: 'createdfrom',
      });
      const returnAuthStatus = returnAuthorizationRecord.getValue({
        fieldId: 'status',
      });
      log.debug(
        loggerTitle,
        `Created From ID: ${createdFromId} Return Auth Status: ${returnAuthStatus}`
      );
      //
      if (returnAuthStatus === 'Pending Receipt' && createdFromId) {
        createItemReceipt(returnAuthorizationRecord);
        createCreditMemo(returnAuthorizationRecord);
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

  /**
   * Create an Item Receipt from the Return Authorization
   * @param {Record} returnAuthorizationRecord
   */
  const createItemReceipt = (returnAuthorizationRecord) => {
    const loggerTitle = 'Create Item Receipt';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const returnAuthId = returnAuthorizationRecord.id;
      const returnAuthDate = returnAuthorizationRecord.getValue({
        fieldId: 'trandate',
      });

      const itemReceiptRecord = record.transform({
        fromType: 'returnauthorization',
        fromId: returnAuthId,
        toType: 'itemreceipt',
        isDynamic: true,
      });

      itemReceiptRecord.setValue({
        fieldId: 'trandate',
        value: returnAuthDate,
      });
      itemReceiptRecord.setValue({
        fieldId: 'custbody_atlas_inspectedby',
        value: INSPECTED_BY_ID,
      });

      const itemReceiptRecordInternalId = itemReceiptRecord.save();
      log.audit(
        'Item Receipt',
        `Item Receipt Record Saved Successfully ${itemReceiptRecordInternalId}`
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

  /**
   * Create a Credit Memo from the Return Authorization
   * @param {Record} returnAuthorizationRecord
   */
  const createCreditMemo = (returnAuthorizationRecord) => {
    const loggerTitle = 'Create Credit Memo';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const returnAuthId = returnAuthorizationRecord.id;
      const returnAuthDate = returnAuthorizationRecord.getValue({
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
        'Credit Memo',
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
  exports.afterSubmit = createIRorCM;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
