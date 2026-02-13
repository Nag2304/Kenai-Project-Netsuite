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

define(['N/record', 'N/runtime'], (record, runtime) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
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

    try {
      if (scriptContext.type === scriptContext.UserEventType.DELETE) return;

      const CUSTOMER_ID = runtime.getCurrentScript().getParameter({
        name: 'custscript_rrb_customer_id',
      });

      if (!CUSTOMER_ID) return;

      const csId = scriptContext.newRecord.id;

      const csRecord = record.load({
        type: 'cashsale',
        id: csId,
        isDynamic: false,
      });

      const customerId = csRecord.getValue('entity');
      const location = csRecord.getValue('location');
      const shipAddress = csRecord.getValue('shipaddress');

      if (String(customerId) !== CUSTOMER_ID) return;

      if (
        !(
          location === '6' &&
          shipAddress &&
          shipAddress.includes('United Kingdom')
        )
      )
        return;

      const lineCount = csRecord.getLineCount({ sublistId: 'item' });

      let netTotal = 0;

      for (let i = 0; i < lineCount; i++) {
        const amount =
          parseFloat(
            csRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'amount',
              line: i,
            })
          ) || 0;

        const itemType = csRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: i,
        });

        // ---- FIX: Remove VAT from discount lines ----
        if (amount < 0 || itemType === 'Discount') {
          const netDiscount = +(amount / (1 + VAT_PERCENT / 100)).toFixed(2);

          csRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: netDiscount,
            line: i,
          });

          csRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: netDiscount,
            line: i,
          });

          netTotal += netDiscount;
        } else {
          netTotal += amount;
        }
      }

      const vatLineExists = csRecord.findSublistLineWithValue({
        sublistId: 'item',
        fieldId: 'item',
        value: VAT_ITEM_ID,
      });

      if (vatLineExists === -1) {
        const vatAmount = +((VAT_PERCENT * netTotal) / 100).toFixed(2);
        const insertIndex = csRecord.getLineCount({ sublistId: 'item' });

        csRecord.insertLine({
          sublistId: 'item',
          line: insertIndex,
        });

        csRecord.setSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: VAT_ITEM_ID,
          line: insertIndex,
        });

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

        log.audit(loggerTitle, `VAT line added: £${vatAmount}`);
      }

      csRecord.save();
    } catch (error) {
      log.error(loggerTitle, error);
    }

    log.debug(loggerTitle, `|>-----------${loggerTitle} End-----------<|`);
  };

  /* ------------------------ Generate VAT Line - End ----------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = generateVATLine;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
