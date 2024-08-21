/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/**
 * Filename: ops_UE_returnAuthorizationMaster.js
 * Script: OPS | UE Return Authorization Master
 * Author           Date       Version               Remarks
 * mikewilliams  2022.12.28    1.00        Initial Creation of Script.
 * nagendrababu  2024.08.21    1.01        Add the logic related to Amazon Customer ID
 */

/*global define,log*/

define(['N/format', 'N/record'], (format, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const AMAZON_CUSTOMERS = ['1187553', '220554'];
  const INSPECTED_BY_ID = 14;
  const exports = {};

  /* ------------------------ Global Variables - End ------------------------ */

  /* --------------------------- afterSubmit - Begin -------------------------- */
  const afterSubmit = (scriptContext) => {
    const strLoggerTitle = 'After Submit';

    log.audit(strLoggerTitle, logEntryMessage('Entry'));

    try {
      const returnAuthId = scriptContext.newRecord.id;
      const returnAuthorizationRecord = loadReturnAuthorization(returnAuthId);
      const customerId = getCustomerId(returnAuthorizationRecord);

      if (isAmazonCustomer(customerId)) {
        handleAmazonCustomer(returnAuthorizationRecord);
      } else {
        handleNonAmazonCustomer(returnAuthorizationRecord);
      }
    } catch (error) {
      logError(strLoggerTitle, error);
    }

    log.audit(strLoggerTitle, logEntryMessage('Exit'));
  };
  /* ---------------------------- afterSubmit - End --------------------------- */

  /* ------------------------ Reusable Helper Functions - Begin ------------------------ */

  /**
   * Load the Return Authorization record
   * @param {string} returnAuthId
   * @returns {Record} Loaded return authorization record
   */
  const loadReturnAuthorization = (returnAuthId) => {
    return record.load({
      type: record.Type.RETURN_AUTHORIZATION,
      id: returnAuthId,
    });
  };

  /**
   * Get the customer ID from the Return Authorization record
   * @param {Record} returnAuthorizationRecord
   * @returns {string} customerId
   */
  const getCustomerId = (returnAuthorizationRecord) => {
    return returnAuthorizationRecord.getValue({ fieldId: 'entity' });
  };

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
    log.audit(
      'Amazon Customer',
      'Skipping auto receipt but processing credit memo'
    );

    const returnAuthId = returnAuthorizationRecord.id;
    const createdFromId = returnAuthorizationRecord.getValue({
      fieldId: 'createdfrom',
    });
    const returnAuthStatus = returnAuthorizationRecord.getValue({
      fieldId: 'status',
    });

    if (createdFromId && returnAuthStatus !== 'Pending Receipt') {
      createCreditMemo(returnAuthorizationRecord);
    }
  };

  /**
   * Handle the case when the customer is not Amazon
   * @param {Record} returnAuthorizationRecord
   */
  const handleNonAmazonCustomer = (returnAuthorizationRecord) => {
    const returnAuthId = returnAuthorizationRecord.id;
    const createdFromId = returnAuthorizationRecord.getValue({
      fieldId: 'createdfrom',
    });
    const returnAuthStatus = returnAuthorizationRecord.getValue({
      fieldId: 'status',
    });

    if (returnAuthStatus === 'Pending Receipt' && createdFromId) {
      createItemReceipt(returnAuthorizationRecord);
      createCreditMemo(returnAuthorizationRecord);
    }
  };

  /**
   * Create an Item Receipt from the Return Authorization
   * @param {Record} returnAuthorizationRecord
   */
  const createItemReceipt = (returnAuthorizationRecord) => {
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

    itemReceiptRecord.setValue({ fieldId: 'trandate', value: returnAuthDate });
    itemReceiptRecord.setValue({
      fieldId: 'custbody_atlas_inspectedby',
      value: INSPECTED_BY_ID,
    });

    const itemReceiptRecordInternalId = itemReceiptRecord.save();
    log.audit(
      'Item Receipt',
      `Item Receipt Record Saved Successfully ${itemReceiptRecordInternalId}`
    );
  };

  /**
   * Create a Credit Memo from the Return Authorization
   * @param {Record} returnAuthorizationRecord
   */
  const createCreditMemo = (returnAuthorizationRecord) => {
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
  };

  /**
   * Log an entry message for audit purposes
   * @param {string} action
   * @returns {string} formatted log message
   */
  const logEntryMessage = (action) => {
    return `|>----------------- After Submit : Function - ${action}-----------------<|`;
  };

  /**
   * Log an error message for audit purposes
   * @param {string} strLoggerTitle
   * @param {Error} error
   */
  const logError = (strLoggerTitle, error) => {
    log.error(`${strLoggerTitle} caught an exception`, error);
  };

  /* ------------------------ Reusable Helper Functions - End ------------------------ */

  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ----------------------------- Exports - End ---------------------------- */
});
