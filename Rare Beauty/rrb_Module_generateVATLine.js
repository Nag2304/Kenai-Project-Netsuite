/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: rrb_Module_generateVATLine.js
 * Author           Date       Version               Remarks
 * nagendrababu  11 Dec 2025      1.0            Initial version
 *
 */

/* global define,log */

define(['N/record'], (record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const CUSTOMER_ID = '86490'; // Shopify UK DTC - Kate Somerville
  const VAT_ITEM_ID = 1620;
  const VAT_PERCENT = 20;

  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------ Generate VAT Line - Begin ----------------------- */
  /**
   *
   * @param {Object} scriptContext
   */
  const generateVATLine = (scriptContext) => {
    const loggerTitle = 'Generate VAT Line';
    log.debug(loggerTitle, `|>-----------${loggerTitle} Start -----------<|`);
    //
    try {
      if (scriptContext.type === scriptContext.UserEventType.DELETE) {
        log.debug(logTitle, 'Delete event - skipping.');
        return;
      }

      const csId = scriptContext.newRecord.id;

      // Load Cash Sale
      const csRecord = record.load({
        type: 'cashsale',
        id: csId,
      });

      const customerId = csRecord.getValue('entity');
      const location = csRecord.getValue('location');
      const shipAddress = csRecord.getValue('shipaddress');
      const total = csRecord.getValue('total');

      log.debug(logTitle, { customerId, location, shipAddress, total });

      // ONLY run for customer 86490
      if (String(customerId) !== CUSTOMER_ID) {
        log.debug(logTitle, 'Customer not UK DTC – skipping.');
        return;
      }

      // Must be Location 6 and Ship to UK
      if (
        !(
          location === '6' &&
          shipAddress &&
          shipAddress.includes('United Kingdom')
        )
      ) {
        log.debug(logTitle, 'Not a UK Cash Sale – skipping VAT insert.');
        return;
      }

      const lineCount = csRecord.getLineCount({ sublistId: 'item' });
      const vatLineExists = csRecord.findSublistLineWithValue({
        sublistId: 'item',
        fieldId: 'item',
        value: VAT_ITEM_ID,
      });

      log.debug(logTitle, `VAT line exists? ${vatLineExists}`);

      // Only append VAT line once, and only after last line
      if (vatLineExists === -1) {
        const insertIndex = lineCount;
        const vatAmount = ((VAT_PERCENT * total) / 100).toFixed(2);

        log.debug(logTitle, `Inserting VAT line at line ${insertIndex}`);
        log.debug(logTitle, `VAT Amount = ${vatAmount}`);

        // Insert new line
        csRecord.insertLine({
          sublistId: 'item',
          line: insertIndex,
        });

        // Set VAT item
        csRecord.setSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: VAT_ITEM_ID,
          line: insertIndex,
        });

        // Set rate + amount
        csRecord.setSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          value: vatAmount,
          line: insertIndex,
        });

        csRecord.setSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          value: vatAmount,
          line: insertIndex,
        });

        log.audit(logTitle, `VAT line added: £${vatAmount}`);
      }

      // Save record
      csRecord.save();
      log.debug(logTitle, 'Cash Sale updated successfully.');
    } catch (error) {
      log.error(loggerTitle, `Error in ${loggerTitle} - ${error.message}`);
    }
    //
    log.debug(loggerTitle, `|>-----------${loggerTitle} End-----------<|`);
  };
  /* ------------------------ Generate VAT Line - End ----------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = generateVATLine;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
