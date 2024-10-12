/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: wdym_Module_setDefaultApprovalStatus.js
 * Author           Date       Version               Remarks
 * nagendrababu 09.26.2024       1.00    Ttkt 284# - Auto Release for Walgreens
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const customers = ['10389816', 'Shopify Website', 'Amazon US FBM'];
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------- Set Default Approval Status - Begin ------------------ */
  const setDefaultApprovalStatus = (tranRecord) => {
    const loggerTitle = 'Set Default Approval Status';
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    //
    try {
      const customerId = tranRecord.getValue({ fieldId: 'entityname' });
      const currentStatus = tranRecord.getValue({ fieldId: 'orderstatus' }); // Get current status of the order
      log.debug(loggerTitle, ' Customer ID: ' + customerId);
      //

      if (customers.includes(customerId)) {
        // If status is already "Approved" (A)
        if (currentStatus === 'A') {
          tranRecord.setValue({ fieldId: 'orderstatus', value: 'B' });
          log.debug(loggerTitle, ' Set Status to pending fulfillment');
        }
        //
      } else if (customerId === 'Walgreens Co.') {
        // Call the validation function
        const validationResult = validateOrderForWalgreens(tranRecord);

        if (validationResult) {
          // If validation fails, set the Ops Hold field with the appropriate value and log the issue
          tranRecord.setValue({
            fieldId: validationResult.fieldId,
            value: validationResult.value,
          });
          log.debug(loggerTitle, validationResult.message + ' - Ops Hold set.');
        } else {
          // If all validations pass, set the order status to Approved
          tranRecord.setValue({ fieldId: 'orderstatus', value: 'A' }); // Approved
          log.debug(loggerTitle, ' Order status set to Approved.');
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
    return true;
  };
  /* ------------------- Set Default Approval Status - End------------------ */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /* *********************** Validate Order for Walgreens - Begin *********************** */
  /**
   * Perform all validations for Walgreens orders
   * @param {Object} tranRecord - The current transaction record
   * @returns {Object|null} - Returns an error object { fieldId, value, message } if validation fails, else null
   */
  const validateOrderForWalgreens = (tranRecord) => {
    const loggerTitle = 'Validate Order for Walgreens';
    log.debug(loggerTitle, '|> Starting Validation <|');

    const lineCount = tranRecord.getLineCount({ sublistId: 'item' });

    for (let i = 0; i < lineCount; i++) {
      // 1. Case Pack Validation
      const casePack = tranRecord.getSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_case_pack',
        line: i,
      });
      const customerCasePack = tranRecord.getSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_wdym_cust_casepk',
        line: i,
      });

      if (casePack !== customerCasePack) {
        return {
          fieldId: 'custbody_ops_hold',
          value: 4,
          message: 'Case Pack mismatch',
        }; // Ops Hold: Case
      }

      // 2. Unit Price Validation
      const unitPrice = tranRecord.getSublistValue({
        sublistId: 'item',
        fieldId: 'rate',
        line: i,
      });
      const customerPrice = tranRecord.getSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_wdym_customer_price',
        line: i,
      });

      if (unitPrice !== customerPrice) {
        return {
          fieldId: 'custbody_ops_hold',
          value: 20,
          message: 'Unit Price mismatch',
        }; // Ops Hold: Price
      }
    }

    // 3. Delivery Date Validation
    const deliveryDate = tranRecord.getValue({
      fieldId: 'custbody_delivery_date',
    });
    const currentDate = new Date();

    if (!deliveryDate || new Date(deliveryDate) <= currentDate) {
      return {
        fieldId: 'custbody_ops_hold',
        value: 10,
        message: 'Invalid Delivery Date',
      }; // Ops Hold: SAL
    }

    // 4. Credit Hold Validation
    const creditHold = tranRecord.getValue({
      fieldId: 'custbody_wdym_credit_hold',
    });
    if (creditHold) {
      return {
        fieldId: 'custbody_ops_hold',
        value: 9,
        message: 'Customer on credit hold',
      }; // Ops Hold: Pay
    }

    // If all validations pass, return null
    log.debug(loggerTitle, 'All validations passed.');
    return null;
  };
  /* *********************** Validate Order for Walgreens - End *********************** */
  //
  /* ------------------------ Helper Functions - End------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = setDefaultApprovalStatus;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
