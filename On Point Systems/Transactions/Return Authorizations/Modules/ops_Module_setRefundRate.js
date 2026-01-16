/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: ops_Module_setRefundRate.js
 * Author           Date       Version               Remarks
 * nagendrababu 10.27.2025      1.00       Initial creation of the script
 *
 */

/* global define,log */

define(['N/record'], (record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const AMAZON_CUSTOMERS = ['220554', '1187553'];
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Set Refund Rate - Begin ------------------------ */
  /**
   * AfterSubmit function to update the Refund Rate on RMA lines
   *
   * @param {Object} context - User Event Script Context
   */
  const setRefundRate = (context) => {
    const loggerTitle = 'Set Refund Rate';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    //
    try {
      // Trigger only on CREATE
      if (context.type !== context.UserEventType.CREATE) {
        log.debug(loggerTitle, 'Skipped — Not CREATE context');
        log.debug(
          loggerTitle,
          `|>--------------------${loggerTitle}-Exit--------------------<|`
        );
        return;
      }

      // Load latest editable RMA record
      const raRec = record.load({
        type: record.Type.RETURN_AUTHORIZATION,
        id: context.newRecord.id,
        isDynamic: false,
      });

      const customerId = raRec.getValue('entity');
      if (!AMAZON_CUSTOMERS.includes(customerId)) {
        log.debug(loggerTitle, `Skipping — Customer ${customerId} not Amazon`);
        log.debug(
          loggerTitle,
          `|>--------------------${loggerTitle}-Exit--------------------<|`
        );
        return;
      }

      const createdFromId = raRec.getValue('createdfrom');
      const createdFromText = raRec.getText('createdfrom') || '';

      if (!createdFromId) {
        log.debug(loggerTitle, '⛔ No Created From linked');
        log.debug(
          loggerTitle,
          `|>--------------------${loggerTitle}-Exit--------------------<|`
        );
        return;
      }

      // ✅ Must be created from Invoice only
      if (!createdFromText.toLowerCase().includes('invoice')) {
        log.debug(
          loggerTitle,
          `⛔ Skipped — Created From is not Invoice (${createdFromText})`
        );
        log.debug(
          loggerTitle,
          `|>--------------------${loggerTitle}-Exit--------------------<|`
        );
        return;
      }

      log.debug(
        loggerTitle,
        `✅ Processing RA: ${raRec.id} created from Invoice: ${createdFromId}`
      );

      // ✅ Load Invoice
      const invoiceRec = record.load({
        type: record.Type.INVOICE,
        id: createdFromId,
        isDynamic: false,
      });

      // ✅ Cache invoice lines
      const invoiceItems = [];
      const invLineCount = invoiceRec.getLineCount({ sublistId: 'item' });

      for (let i = 0; i < invLineCount; i++) {
        invoiceItems.push({
          item: invoiceRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i,
          }),
          rate: invoiceRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate', // ✅ Correct Rate
            line: i,
          }),
        });
      }

      log.debug(loggerTitle, `📦 Loaded ${invLineCount} Invoice lines`);

      // ✅ Match and update RMA lines
      const raLineCount = raRec.getLineCount({ sublistId: 'item' });

      for (let j = 0; j < raLineCount; j++) {
        const raItem = raRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: j,
        });

        const match = invoiceItems.find((l) => l.item === raItem);

        if (match?.rate) {
          raRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_ops_refund_rate',
            line: j,
            value: match.rate,
          });

          log.audit(
            loggerTitle,
            `✅ Line ${j + 1}: Item ${raItem} — Refund Rate set to ${
              match.rate
            }`
          );
        } else {
          log.debug(
            LOG_TITLE,
            `ℹ Line ${j + 1}: No rate match found for Item ${raItem}`
          );
        }
      }

      raRec.save();
      log.audit(
        loggerTitle,
        `✅ Refund Rate Updated Successfully for RA ${raRec.id}`
      );
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
  };
  /* -------------------------- Set Refund Rate - End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = setRefundRate;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
